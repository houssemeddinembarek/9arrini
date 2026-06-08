import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const group = await Group.findOneAndUpdate(
      { _id: id, teacher: session.userId },
      { $set: body },
      { new: true }
    ).populate("students", "name email avatar");

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: { group } });
  } catch (error) {
    console.error("Group PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const group = await Group.findOneAndDelete({ _id: id, teacher: session.userId });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Group DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
