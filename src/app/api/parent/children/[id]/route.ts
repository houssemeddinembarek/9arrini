import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { isMeetingEnded } from "@/lib/utils";
import { getFreeSeanceStatus } from "@/lib/free-seances";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import QuizAttempt from "@/models/QuizAttempt";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";
import Meeting from "@/models/Meeting";
import Attendance from "@/models/Attendance";
// Imported so their schemas are registered for populate().
import "@/models/Course";
import "@/models/Quiz";
import "@/models/Content";
import "@/models/ClassSession";

// Confirm the caller is a parent linked to this child. Returns the child doc or null.
async function ownedChild(parentId: string, childId: string) {
  const parent = await User.findById(parentId).select("children").lean<{ children: unknown[] } | null>();
  const owns = (parent?.children || []).some((c) => String(c) === String(childId));
  if (!owns) return null;
  return User.findOne({ _id: childId, role: "student" }).select("name avatar xp level studentProfile").lean();
}

// Full read-only report for one linked child.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "parent") return NextResponse.json({ error: "Parents only" }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const child = await ownedChild(session.userId, id);
    if (!child) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [enrollments, attempts, submissions, assignments, meetings, attendance] = await Promise.all([
      Enrollment.find({ student: id }).populate("course", "title slug").sort({ lastAccessedAt: -1 }).lean(),
      QuizAttempt.find({ user: id }).populate("quiz", "title subject").sort({ updatedAt: -1 }).lean(),
      Submission.find({ student: id }).populate("assignment", "title dueDate").sort({ updatedAt: -1 }).lean(),
      Assignment.find({ students: id }).select("title dueDate").sort({ dueDate: 1 }).lean(),
      Meeting.find({ students: id, status: { $ne: "cancelled" } })
        .select("title date startTime endTime recordingUrl")
        .sort({ date: 1 })
        .lean(),
      // A mark belongs either to a meeting or to a class séance.
      Attendance.find({ student: id })
        .populate("meeting", "title date")
        .populate("classSession", "title date")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Courses
    const courses = enrollments.map((e) => ({
      title: (e.course as { title?: string } | null)?.title || "Cours",
      slug: (e.course as { slug?: string } | null)?.slug || "",
      progress: (e.progress as number) ?? 0,
      completedAt: e.completedAt ?? null,
    }));

    // Quizzes
    const quizzes = attempts
      .filter((a) => a.quiz)
      .map((a) => ({
        title: (a.quiz as { title?: string }).title || "Quiz",
        subject: (a.quiz as { subject?: string }).subject || "",
        bestScore: (a.bestScore as number) ?? 0,
        passed: !!a.passed,
        attempts: (a.attempts as number) ?? 0,
      }));

    // Assignments: merge the assignment list with the child's submission status.
    const subByAssignment = new Map(
      submissions
        .filter((s) => s.assignment)
        .map((s) => [String((s.assignment as { _id: unknown })._id), s.status as string]),
    );
    const assignmentList = assignments.map((a) => ({
      title: (a.title as string) || "Travail",
      dueDate: a.dueDate,
      status: subByAssignment.get(String(a._id)) || "à faire",
    }));

    // Meetings: split into upcoming (still joinable) and available replays.
    const upcomingMeetings = meetings
      .filter((m) => !isMeetingEnded(m.date as Date, m.startTime as string, (m.endTime as string) || undefined))
      .map((m) => ({ _id: m._id, title: m.title, date: m.date, startTime: m.startTime }));
    const replays = meetings
      .filter((m) => !!m.recordingUrl)
      .map((m) => ({ _id: m._id, title: m.title, date: m.date }));

    // Attendance records — marks the teacher recorded on a meeting or a séance.
    const attendanceList = attendance
      .filter((a) => a.meeting || a.classSession)
      .map((a) => {
        const seance = (a.meeting || a.classSession) as { title?: string; date?: Date };
        return {
          title: seance.title || (a.meeting ? "Réunion" : "Séance"),
          date: seance.date,
          status: a.status as string,
        };
      });
    const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;

    // Summary tiles
    const summary = {
      attendance: { present: presentCount, total: attendance.length },
      quizzes: {
        attempted: attempts.length,
        passed: attempts.filter((a) => a.passed).length,
        avgBest: attempts.length
          ? Math.round(attempts.reduce((s, a) => s + ((a.bestScore as number) || 0), 0) / attempts.length)
          : 0,
      },
      assignments: {
        total: assignments.length,
        corrected: submissions.filter((s) => s.status === "corrected").length,
        pending: assignmentList.filter((a) => a.status === "à faire" || a.status === "pending").length,
      },
      courses: courses.length,
      // Free class séances the school granted the child, and what is left.
      freeSeances: await getFreeSeanceStatus(id),
    };

    return NextResponse.json({
      success: true,
      data: { child, summary, courses, quizzes, assignments: assignmentList, upcomingMeetings, replays, attendance: attendanceList },
    });
  } catch (error) {
    console.error("parent child report error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Unlink a child from the parent's account.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "parent") return NextResponse.json({ error: "Parents only" }, { status: 403 });

    await connectDB();
    const { id } = await params;
    await User.updateOne({ _id: session.userId }, { $pull: { children: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("parent unlink error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
