import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Enrollment from "@/models/Enrollment";
import "@/models/Course";

// The signed-in student's enrolled courses with real progress.
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const enrollments = await Enrollment.find({ student: session.userId })
      .populate("course", "title slug thumbnail category level lessons")
      .sort({ lastAccessedAt: -1 })
      .lean<
        {
          _id: unknown;
          progress: number;
          completedLessons: unknown[];
          certificateIssued: boolean;
          course: {
            _id: unknown;
            title: string;
            slug: string;
            thumbnail: string;
            category?: string;
            level?: string;
            lessons?: unknown[];
          } | null;
        }[]
      >();

    // Drop enrollments whose course was deleted, and flatten for the client.
    const courses = enrollments
      .filter((e) => e.course)
      .map((e) => ({
        enrollmentId: String(e._id),
        progress: e.progress,
        completedLessons: e.completedLessons?.length ?? 0,
        totalLessons: e.course!.lessons?.length ?? 0,
        certificateIssued: e.certificateIssued,
        title: e.course!.title,
        slug: e.course!.slug,
        thumbnail: e.course!.thumbnail,
        category: e.course!.category ?? "",
        level: e.course!.level ?? "",
      }));

    const certificates = courses.filter((c) => c.certificateIssued).length;

    return NextResponse.json({ success: true, data: { courses, certificates } });
  } catch (error) {
    console.error("Student courses error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
