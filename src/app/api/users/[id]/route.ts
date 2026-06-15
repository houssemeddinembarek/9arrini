import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import User from "@/models/User";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (session.userId !== id && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const allowedFields = ["name", "bio", "avatar", "socialLinks", "expertise", "teachingProfile"];
    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
