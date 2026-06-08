import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Please login to enroll" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;

    const course = await Course.findOne({ slug, status: "published" });
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const existing = await Enrollment.findOne({
      student: session.userId,
      course: course._id,
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "Already enrolled" }, { status: 409 });
    }

    await Enrollment.create({ student: session.userId, course: course._id });
    await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });
    await User.findByIdAndUpdate(session.userId, {
      $addToSet: { enrolledCourses: course._id },
    });

    return NextResponse.json({ success: true, message: "Enrolled successfully" }, { status: 201 });
  } catch (error) {
    console.error("Enroll error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
