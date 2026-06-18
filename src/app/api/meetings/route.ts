import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import Meeting from "@/models/Meeting";
import Group from "@/models/Group";
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

    if (upcoming) {
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
      .sort({ date: 1, startTime: 1 })
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
    const { title, description, group, date, startTime, endTime, type, location, reminder } = body;

    if (!title || !date || !startTime) {
      return NextResponse.json({ error: "Title, date, and start time are required" }, { status: 400 });
    }

    // Resolve the invited students from the chosen group (teacher-owned).
    let students: string[] = [];
    if (group) {
      const grp = await Group.findOne({ _id: group, teacher: session.userId })
        .select("students")
        .lean<{ students: unknown[] } | null>();
      if (!grp) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }
      students = (grp.students || []).map((s) => String(s));
    }

    const meeting = await Meeting.create({
      title,
      description: description || "",
      group: group || undefined,
      students,
      date: new Date(date),
      startTime,
      endTime: endTime || "",
      type: type || "online",
      channelName: `meeting_${randomUUID().replace(/-/g, "")}`,
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
