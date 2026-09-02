import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import Attendance from "@/models/Attendance";
import { ensureAttendanceIndexes } from "@/lib/attendance-indexes";
import "@/models/User";

const VALID = new Set(["present", "absent", "late"]);

// The meeting's roster with each student's current attendance mark. Teacher-only.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const meeting = await Meeting.findOne({ _id: id, teacher: session.userId })
      .select("title date students")
      .populate("students", "name avatar")
      .lean<{ title: string; date: Date; students: { _id: unknown; name: string; avatar?: string }[] } | null>();
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    const marks = await Attendance.find({ meeting: id }).select("student status").lean();
    const byStudent = new Map(marks.map((m) => [String(m.student), m.status]));

    const roster = (meeting.students || []).map((s) => ({
      _id: s._id,
      name: s.name,
      avatar: s.avatar || "",
      status: byStudent.get(String(s._id)) || null,
    }));

    return NextResponse.json({ success: true, data: { title: meeting.title, date: meeting.date, roster } });
  } catch (error) {
    console.error("attendance GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Save attendance marks for the meeting. Teacher-only.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const meeting = await Meeting.findOne({ _id: id, teacher: session.userId }).select("students").lean<{ students: unknown[] } | null>();
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    const body = await request.json();
    const marks: { student: string; status: string }[] = Array.isArray(body.marks) ? body.marks : [];
    const roster = new Set((meeting.students || []).map(String));

    // Only accept marks for students actually on this meeting's roster.
    const ops = marks
      .filter((m) => m && roster.has(String(m.student)) && VALID.has(m.status))
      .map((m) => ({
        updateOne: {
          filter: { meeting: id, student: m.student },
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
    console.error("attendance POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
