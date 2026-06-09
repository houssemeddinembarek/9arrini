import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Course from "@/models/Course";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Admins see every course regardless of status (draft / published / archived).
    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.status = status;
    if (category && category !== "all") query.category = category;
    if (search) query.title = new RegExp(search, "i");

    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .populate("teacher", "name email avatar")
      .lean();

    const data = courses.map((c) => ({
      ...c,
      lessonCount: Array.isArray(c.lessons) ? c.lessons.length : 0,
    }));

    return NextResponse.json({ success: true, data: { courses: data, total: data.length } });
  } catch (error) {
    console.error("Admin get courses error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
