import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";

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
