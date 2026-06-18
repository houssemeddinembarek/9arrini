import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import TutoringRequest from "@/models/TutoringRequest";
import "@/models/User";

// Every student confirmed in any of the signed-in teacher's classes, de-duplicated
// across classes. Each row carries the list of classes that student is enrolled in.
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

    await connectDB();

    const classes = await ClassSession.find({ teacher: session.userId })
      .select("_id")
      .lean();
    const classIds = classes.map((c) => c._id);

    const enrollments = await ClassEnrollment.find({
      classSession: { $in: classIds },
      status: "confirmed",
    })
      .populate<{ student: { _id: unknown; name: string; email: string; avatar?: string } }>(
        "student",
        "name email avatar"
      )
      .populate<{ classSession: { _id: unknown; title: string; subject: string } }>(
        "classSession",
        "title subject"
      )
      .sort({ confirmedAt: -1 })
      .lean();

    // Collapse to one row per student, collecting the classes they belong to.
    const byStudent = new Map<
      string,
      {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        tutoring: boolean;
        classes: { _id: string; title: string; subject: string }[];
      }
    >();

    for (const e of enrollments) {
      const stu = e.student as unknown as { _id: unknown; name: string; email: string; avatar?: string } | null;
      const cls = e.classSession as unknown as { _id: unknown; title: string; subject: string } | null;
      if (!stu) continue;
      const key = String(stu._id);
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          _id: key,
          name: stu.name,
          email: stu.email,
          avatar: stu.avatar,
          tutoring: false,
          classes: [],
        });
      }
      if (cls) {
        byStudent.get(key)!.classes.push({ _id: String(cls._id), title: cls.title, subject: cls.subject });
      }
    }

    // Also include students this teacher accepted for tutoring (no class needed).
    const tutoring = await TutoringRequest.find({ teacher: session.userId, status: "accepted" })
      .populate<{ student: { _id: unknown; name: string; email: string; avatar?: string } }>(
        "student",
        "name email avatar"
      )
      .sort({ respondedAt: -1 })
      .lean();

    for (const r of tutoring) {
      const stu = r.student as unknown as { _id: unknown; name: string; email: string; avatar?: string } | null;
      if (!stu) continue;
      const key = String(stu._id);
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          _id: key,
          name: stu.name,
          email: stu.email,
          avatar: stu.avatar,
          tutoring: true,
          classes: [],
        });
      } else {
        byStudent.get(key)!.tutoring = true;
      }
    }

    return NextResponse.json({ success: true, data: { students: Array.from(byStudent.values()) } });
  } catch (error) {
    console.error("Teacher students GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
