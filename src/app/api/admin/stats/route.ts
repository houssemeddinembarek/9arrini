import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      Course.countDocuments(),
      Course.countDocuments({ status: "published" }),
      Enrollment.countDocuments(),
      Booking.countDocuments(),
    ]);

    const recentUsers = await User.find()
      .select("name email role createdAt avatar")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const topCourses = await Course.find({ status: "published" })
      .sort({ enrollmentCount: -1 })
      .limit(5)
      .populate("teacher", "name")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          totalBookings,
        },
        recentUsers,
        topCourses,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
