import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const filter: Record<string, unknown> = { teacher: session.userId };

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const meetings = await Meeting.find(filter)
      .populate("group", "name color")
      .sort({ date: 1, startTime: 1 })
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
    const { title, description, group, date, startTime, endTime, type, meetingUrl, location, reminder } = body;

    if (!title || !date || !startTime) {
      return NextResponse.json({ error: "Title, date, and start time are required" }, { status: 400 });
    }

    const meeting = await Meeting.create({
      title,
      description: description || "",
      group: group || undefined,
      date: new Date(date),
      startTime,
      endTime: endTime || "",
      type: type || "online",
      meetingUrl: meetingUrl || "",
      location: location || "",
      reminder: reminder || { enabled: true, minutesBefore: 30 },
      teacher: session.userId,
      status: "scheduled",
    });

    const populated = await meeting.populate("group", "name color");

    return NextResponse.json({ success: true, data: { meeting: populated } }, { status: 201 });
  } catch (error) {
    console.error("Meetings POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
