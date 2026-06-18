import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import Meeting from "@/models/Meeting";
import Group from "@/models/Group";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import TutoringRequest from "@/models/TutoringRequest";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const upcoming = searchParams.get("upcoming");
    const recorded = searchParams.get("recorded");

    // Teachers the student has been accepted by — they see those teachers' meetings.
    const acceptedTeachers = await TutoringRequest.find({
      student: session.userId,
      status: "accepted",
    })
      .select("teacher")
      .lean<{ teacher: unknown }[]>();
    const teacherIds = acceptedTeachers.map((r) => r.teacher);

    // A user sees meetings they teach, are invited to, or whose teacher accepted them.
    const filter: Record<string, unknown> = {
      $or: [
        { teacher: session.userId },
        { students: session.userId },
        ...(teacherIds.length ? [{ teacher: { $in: teacherIds } }] : []),
      ],
    };

    if (recorded) {
      // Meetings that have a saved recording — newest replay first.
      filter.recordingUrl = { $nin: [null, ""] };
    } else if (upcoming) {
      // Future / today's meetings, soonest first — used by the alert poller.
      filter.date = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
      filter.status = "scheduled";
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const meetings = await Meeting.find(filter)
      .populate("group", "name color")
      .populate("teacher", "name avatar")
      .sort(recorded ? { recordedAt: -1 } : { date: 1, startTime: 1 })
      .limit(upcoming ? 20 : 200)
      .lean();

    return NextResponse.json({ success: true, data: { meetings } });
  } catch (error) {
    console.error("Meetings GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const {
      title, description, group, classId, studentIds,
      date, startTime, endTime, type, meetingUrl, location, reminder,
    } = body;

    if (!title || !date || !startTime) {
      return NextResponse.json({ error: "Title, date, and start time are required" }, { status: 400 });
    }

    // Recipients come from any combination of: a group, a class's confirmed
    // students, and individually picked students — de-duplicated.
    const recipients = new Set<string>();

    if (group) {
      const grp = await Group.findOne({ _id: group, teacher: session.userId })
        .select("students")
        .lean<{ students: unknown[] } | null>();
      if (!grp) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }
      (grp.students || []).forEach((s) => recipients.add(String(s)));
    }

    if (classId) {
      const cls = await ClassSession.findOne({ _id: classId, teacher: session.userId })
        .select("_id")
        .lean<{ _id: unknown } | null>();
      if (!cls) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      const enrolled = await ClassEnrollment.find({ classSession: classId, status: "confirmed" })
        .select("student")
        .lean<{ student: unknown }[]>();
      enrolled.forEach((e) => recipients.add(String(e.student)));
    }

    if (Array.isArray(studentIds)) {
      studentIds.forEach((s: string) => recipients.add(String(s)));
    }

    const students = [...recipients];

    const meeting = await Meeting.create({
      title,
      description: description || "",
      group: group || undefined,
      classSession: classId || undefined,
      students,
      date: new Date(date),
      startTime,
      endTime: endTime || "",
      type: type || "online",
      channelName: `meeting_${randomUUID().replace(/-/g, "")}`,
      meetingUrl: meetingUrl || "",
      location: location || "",
      reminder: reminder || { enabled: true, minutesBefore: 30 },
      teacher: session.userId,
      status: "scheduled",
    });

    // Notify every invited student about the new meeting.
    if (students.length > 0) {
      const when = new Date(date).toLocaleDateString(undefined, {
        weekday: "short", day: "numeric", month: "short",
      });
      await notifyUsers(students, {
        title: "New meeting scheduled",
        message: `"${title}" on ${when} at ${startTime}`,
        type: "info",
        link: `/meetings/${meeting._id}`,
      });
    }

    const populated = await meeting.populate("group", "name color");

    return NextResponse.json({ success: true, data: { meeting: populated } }, { status: 201 });
  } catch (error) {
    console.error("Meetings POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
