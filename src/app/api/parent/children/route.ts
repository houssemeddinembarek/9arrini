import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import QuizAttempt from "@/models/QuizAttempt";
import Submission from "@/models/Submission";

// The parent's linked children, each with a small progress summary.
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "parent") {
      return NextResponse.json({ error: "Parents only" }, { status: 403 });
    }

    await connectDB();
    const parent = await User.findById(session.userId).select("children").lean<{ children: unknown[] } | null>();
    const ids = (parent?.children || []).map(String);
    if (ids.length === 0) return NextResponse.json({ success: true, data: { children: [] } });

    const kids = await User.find({ _id: { $in: ids }, role: "student" })
      .select("name avatar xp level studentProfile")
      .lean();

    const children = await Promise.all(
      kids.map(async (k) => {
        const [courses, quizzesPassed, pendingWork] = await Promise.all([
          Enrollment.countDocuments({ student: k._id }),
          QuizAttempt.countDocuments({ user: k._id, passed: true }),
          Submission.countDocuments({ student: k._id, status: { $ne: "corrected" } }),
        ]);
        return { ...k, stats: { courses, quizzesPassed, pendingWork } };
      }),
    );

    return NextResponse.json({ success: true, data: { children } });
  } catch (error) {
    console.error("parent children error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
