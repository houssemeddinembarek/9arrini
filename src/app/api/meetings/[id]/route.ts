import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";

// Fetch a single meeting. Accessible to the teacher who owns it or any invited student.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const meeting = await Meeting.findById(id)
      .populate("group", "name color")
      .populate("teacher", "name avatar")
      .lean<{ teacher: { _id: unknown }; students: unknown[] } & Record<string, unknown> | null>();

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    const isTeacher = String(meeting.teacher?._id ?? meeting.teacher) === session.userId;
    const isStudent = (meeting.students || []).some((s) => String(s) === session.userId);
    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: { meeting, isTeacher } });
  } catch (error) {
    console.error("Meeting GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (body.date) body.date = new Date(body.date);

    const meeting = await Meeting.findOneAndUpdate(
      { _id: id, teacher: session.userId },
      { $set: body },
      { new: true }
    ).populate("group", "name color");

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: { meeting } });
  } catch (error) {
    console.error("Meeting PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const meeting = await Meeting.findOneAndDelete({ _id: id, teacher: session.userId });
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meeting DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
