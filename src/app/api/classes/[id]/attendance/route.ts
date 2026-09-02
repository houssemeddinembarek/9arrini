import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import Attendance from "@/models/Attendance";
import { ensureAttendanceIndexes } from "@/lib/attendance-indexes";
import { isAdmin } from "@/lib/roles";
import "@/models/User";

const VALID = new Set(["present", "absent", "late"]);

type ClassLite = {
  _id: unknown;
  title: string;
  subject: string;
  date: Date;
  startTime: string;
  endTime: string;
  teacher: unknown;
} | null;

// The séance with the caller's access level, or null when they may not see it.
async function loadClass(id: string, userId: string, role: string) {
  const cls = await ClassSession.findById(id)
    .select("title subject date startTime endTime teacher")
    .lean<ClassLite>();
  if (!cls) return null;

  const isOwnerTeacher = String((cls.teacher as { _id?: unknown })?._id ?? cls.teacher) === userId;
  if (isAdmin(role)) return { cls, canMark: false };
  if (isOwnerTeacher) return { cls, canMark: true };
  return null;
}

// Roster of confirmed students with each one's mark for this séance.
// The assigned teacher and any admin can read it.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const access = await loadClass(id, session.userId, session.role);
    if (!access) return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });
    const { cls, canMark } = access;

    // Only students whose enrolment is confirmed sit in the séance.
    const enrollments = await ClassEnrollment.find({ classSession: id, status: "confirmed" })
      .populate("student", "name avatar")
      .sort({ createdAt: 1 })
      .lean<{ student: { _id: unknown; name: string; avatar?: string } | null }[]>();

    const marks = await Attendance.find({ classSession: id }).select("student status").lean();
    const byStudent = new Map(marks.map((m) => [String(m.student), m.status]));

    const roster = enrollments
      .filter((e) => e.student)
      .map((e) => ({
        _id: e.student!._id,
        name: e.student!.name,
        avatar: e.student!.avatar || "",
        status: byStudent.get(String(e.student!._id)) || null,
      }));

    return NextResponse.json({
      success: true,
      data: {
        title: cls.title,
        subject: cls.subject,
        date: cls.date,
        startTime: cls.startTime,
        endTime: cls.endTime,
        canMark,
        roster,
      },
    });
  } catch (error) {
    console.error("class attendance GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Save marks for this séance. Only the assigned teacher may write.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const access = await loadClass(id, session.userId, session.role);
    if (!access) return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });
    if (!access.canMark) {
      return NextResponse.json({ error: "Seul le professeur de la séance peut noter les présences" }, { status: 403 });
    }

    const body = await request.json();
    const marks: { student: string; status: string }[] = Array.isArray(body.marks) ? body.marks : [];

    const confirmed = await ClassEnrollment.find({ classSession: id, status: "confirmed" })
      .select("student")
      .lean<{ student: unknown }[]>();
    const roster = new Set(confirmed.map((e) => String(e.student)));

    // Only accept marks for students actually confirmed on this séance.
    const ops = marks
      .filter((m) => m && roster.has(String(m.student)) && VALID.has(m.status))
      .map((m) => ({
        updateOne: {
          filter: { classSession: id, student: m.student },
          update: { $set: { status: m.status as "present" | "absent" | "late", recordedBy: session.userId } },
          upsert: true,
        },
      }));

    if (ops.length) {
      await ensureAttendanceIndexes();
      // Cast: Mongoose casts the string ids to ObjectId at runtime.
      await Attendance.bulkWrite(ops as Parameters<typeof Attendance.bulkWrite>[0]);
    }
    return NextResponse.json({ success: true, data: { saved: ops.length } });
  } catch (error) {
    console.error("class attendance POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
