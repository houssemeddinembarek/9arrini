import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import TutoringRequest from "@/models/TutoringRequest";

// Full detail for ONE of the signed-in teacher's students. A teacher may only
// open a student they are actually connected to (a confirmed class enrollment
// or an accepted tutoring request) — otherwise 403.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
    }

    await connectDB();

    const student = await User.findById(id)
      .select("name email avatar bio role xp level badges studentProfile createdAt")
      .lean<{
        _id: unknown;
        name: string;
        email: string;
        avatar?: string;
        bio?: string;
        role: string;
        xp?: number;
        level?: number;
        badges?: string[];
        studentProfile?: { stage?: string; year?: string; section?: string; governorate?: string };
        createdAt?: Date;
      }>();

    if (!student || student.role !== "student") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // This teacher's classes, so we only ever expose the shared relationship.
    const classes = await ClassSession.find({ teacher: session.userId }).select("_id").lean();
    const classIds = classes.map((c) => c._id);

    const enrollments = await ClassEnrollment.find({
      student: id,
      classSession: { $in: classIds },
      status: "confirmed",
    })
      .populate<{
        classSession: { _id: unknown; title: string; subject: string; level: string; date: Date; startTime: string; endTime: string; status: string };
      }>("classSession", "title subject level date startTime endTime status")
      .sort({ confirmedAt: 1 })
      .lean();

    const tutoring = await TutoringRequest.findOne({
      teacher: session.userId,
      student: id,
      status: "accepted",
    }).lean<{ respondedAt?: Date }>();

    // Guard: not connected to this teacher → not allowed to view.
    if (enrollments.length === 0 && !tutoring) {
      return NextResponse.json({ error: "This student is not in your classes" }, { status: 403 });
    }

    const classList = enrollments
      .map((e) => {
        const c = e.classSession as unknown as
          | { _id: unknown; title: string; subject: string; level: string; date: Date; startTime: string; endTime: string; status: string }
          | null;
        if (!c) return null;
        return {
          _id: String(c._id),
          title: c.title,
          subject: c.subject,
          level: c.level,
          date: c.date,
          startTime: c.startTime,
          endTime: c.endTime,
          status: c.status,
          confirmedAt: (e as { confirmedAt?: Date }).confirmedAt ?? null,
        };
      })
      .filter(Boolean);

    const enrolledSince =
      (enrollments[0] as { confirmedAt?: Date } | undefined)?.confirmedAt ??
      tutoring?.respondedAt ??
      null;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          _id: String(student._id),
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          bio: student.bio,
          xp: student.xp ?? 0,
          level: student.level ?? 1,
          badges: student.badges ?? [],
          studentProfile: student.studentProfile ?? {},
          createdAt: student.createdAt ?? null,
        },
        classes: classList,
        tutoring: !!tutoring,
        tutoringSince: tutoring?.respondedAt ?? null,
        enrolledSince,
      },
    });
  } catch (error) {
    console.error("Teacher student detail GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
