import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";

// Replace a group's members with the given list of students. Used to assign a
// student (or several) to one of the teacher's groups.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const { studentIds } = await request.json();

    if (!Array.isArray(studentIds)) {
      return NextResponse.json({ error: "studentIds must be an array" }, { status: 400 });
    }

    // Keep only real student accounts (drops anything invalid).
    const valid = studentIds.length
      ? await User.find({ _id: { $in: studentIds }, role: "student" }).select("_id").lean<{ _id: unknown }[]>()
      : [];
    const validIds = valid.map((u) => u._id);

    const group = await Group.findOneAndUpdate(
      { _id: id, teacher: session.userId },
      { $set: { students: validIds } },
      { new: true }
    ).populate("students", "name email avatar");

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: { group } });
  } catch (error) {
    console.error("Group members PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
