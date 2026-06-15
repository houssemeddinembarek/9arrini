import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Course from "@/models/Course";

// Teacher dashboard overview: the teacher's own courses plus aggregate stats.
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !["teacher", "admin"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const courses = await Course.find({ teacher: session.userId })
      .select("title slug thumbnail category classe level status enrollmentCount rating reviewCount lessons createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
    const totalReviews = courses.reduce((sum, c) => sum + (c.reviewCount || 0), 0);
    const totalLessons = courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
    const publishedCount = courses.filter((c) => c.status === "published").length;
    const draftCount = courses.filter((c) => c.status === "draft").length;

    // Rating averaged across rated courses, weighted by their review counts.
    const ratedCourses = courses.filter((c) => (c.reviewCount || 0) > 0);
    const avgRating = totalReviews
      ? ratedCourses.reduce((sum, c) => sum + (c.rating || 0) * (c.reviewCount || 0), 0) / totalReviews
      : 0;

    const shaped = courses.map((c) => ({
      id: String(c._id),
      title: c.title,
      slug: c.slug,
      thumbnail: c.thumbnail,
      category: c.category,
      classe: c.classe || "",
      level: c.level,
      status: c.status,
      students: c.enrollmentCount || 0,
      rating: c.rating || 0,
      reviewCount: c.reviewCount || 0,
      lessons: c.lessons?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalReviews,
          totalLessons,
          publishedCount,
          draftCount,
          courseCount: courses.length,
          avgRating: Math.round(avgRating * 100) / 100,
        },
        courses: shaped,
      },
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
