import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const groups = await Group.find({ teacher: session.userId })
      .populate("students", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: { groups } });
  } catch (error) {
    console.error("Groups GET error:", error);
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
    const { name, description, subject, level, color } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const group = await Group.create({
      name,
      description: description || "",
      subject: subject || "",
      level: level || "",
      color: color || "purple",
      teacher: session.userId,
      students: [],
    });

    return NextResponse.json({ success: true, data: { group } }, { status: 201 });
  } catch (error) {
    console.error("Groups POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
