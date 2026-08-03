import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import Group from "@/models/Group";
import Content from "@/models/Content";
import { isAdmin } from "@/lib/roles";
import "@/models/User";

// List "travaux à faire" — teachers see what they created, students see what's
// assigned to them (with their own submission status).
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    if (session.role === "teacher" || isAdmin(session.role)) {
      const assignments = await Assignment.find({ teacher: session.userId })
        .populate("content", "title contentType pdfUrl")
        .populate("group", "name")
        .sort({ createdAt: -1 })
        .lean();

      const ids = assignments.map((a) => a._id);
      const counts = await Submission.aggregate([
        { $match: { assignment: { $in: ids } } },
        { $group: { _id: { a: "$assignment", s: "$status" }, n: { $sum: 1 } } },
      ]);
      const by: Record<string, { pending: number; submitted: number; corrected: number; total: number }> = {};
      for (const c of counts) {
        const key = String(c._id.a);
        by[key] ??= { pending: 0, submitted: 0, corrected: 0, total: 0 };
        by[key][c._id.s as "pending" | "submitted" | "corrected"] = c.n;
        by[key].total += c.n;
      }
      const withCounts = assignments.map((a) => ({
        ...a,
        counts: by[String(a._id)] ?? { pending: 0, submitted: 0, corrected: 0, total: 0 },
      }));
      return NextResponse.json({ success: true, data: { assignments: withCounts } });
    }

    // Student: join their submissions with the assignment + content.
    const subs = await Submission.find({ student: session.userId })
      .populate({
        path: "assignment",
        populate: [
          { path: "content", select: "title contentType pdfUrl body subject level" },
          { path: "teacher", select: "name avatar" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const assignments = subs
      .filter((s) => s.assignment)
      .map((s) => ({
        submissionId: String(s._id),
        status: s.status,
        workImages: s.workImages,
        correctionImages: s.correctionImages,
        aiCorrection: s.aiCorrection,
        assignment: s.assignment,
      }));
    return NextResponse.json({ success: true, data: { assignments } });
  } catch (error) {
    console.error("Assignments GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Teacher creates a "travail à faire" for individual students and/or a group.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { title, instructions, contentId, studentIds, groupId, dueDate } = body;

    if (!title || !contentId || !dueDate) {
      return NextResponse.json({ error: "Title, content and due date are required" }, { status: 400 });
    }

    // The exercice content must belong to this teacher.
    const content = await Content.findOne({ _id: contentId, teacher: session.userId }).select("_id title").lean<{ _id: unknown; title: string } | null>();
    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    // Resolve recipients: a chosen group's students ∪ explicitly picked students.
    const recipients = new Set<string>();
    if (groupId) {
      const grp = await Group.findOne({ _id: groupId, teacher: session.userId }).select("students").lean<{ students: unknown[] } | null>();
      if (grp) (grp.students || []).forEach((s) => recipients.add(String(s)));
    }
    if (Array.isArray(studentIds)) studentIds.forEach((s: string) => recipients.add(String(s)));

    const studentList = [...recipients];
    if (studentList.length === 0) {
      return NextResponse.json({ error: "Pick at least one student or a group" }, { status: 400 });
    }

    const assignment = await Assignment.create({
      title,
      instructions: instructions || "",
      teacher: session.userId,
      content: contentId,
      students: studentList,
      group: groupId || undefined,
      dueDate: new Date(dueDate),
    });

    // One submission per recipient so we can track who has/hasn't done it.
    await Submission.insertMany(
      studentList.map((student) => ({
        assignment: assignment._id,
        student,
        teacher: session.userId,
        status: "pending",
      })),
      { ordered: false }
    );

    const due = new Date(dueDate).toLocaleDateString();
    await notifyUsers(studentList, {
      title: "Nouveau travail à faire",
      message: `"${title}" — à rendre avant le ${due}.`,
      type: "info",
      link: "/dashboard/assignments",
    });

    return NextResponse.json({ success: true, data: { assignment } }, { status: 201 });
  } catch (error) {
    console.error("Assignments POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
