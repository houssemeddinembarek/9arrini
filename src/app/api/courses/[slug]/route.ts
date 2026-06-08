import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const session = await getServerSession();

    const course = await Course.findOne({ slug })
      .populate("teacher", "name avatar bio expertise socialLinks")
      .populate("lessons")
      .lean();

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    let isEnrolled = false;
    let enrollment = null;

    if (session) {
      enrollment = await Enrollment.findOne({
        student: session.userId,
        course: (course as any)._id,
      }).lean();
      isEnrolled = !!enrollment;
    }

    return NextResponse.json({
      success: true,
      data: { course, isEnrolled, enrollment },
    });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;
    const body = await request.json();

    const course = await Course.findOne({ slug });
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (
      course.teacher.toString() !== session.userId &&
      session.role !== "admin"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updated = await Course.findByIdAndUpdate(course._id, body, { new: true });
    return NextResponse.json({ success: true, data: { course: updated } });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;

    const course = await Course.findOne({ slug });
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (
      course.teacher.toString() !== session.userId &&
      session.role !== "admin"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await Course.findByIdAndDelete(course._id);
    return NextResponse.json({ success: true, message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
