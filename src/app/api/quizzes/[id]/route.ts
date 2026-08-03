import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Quiz from "@/models/Quiz";
import { isAdmin } from "@/lib/roles";

// GET /api/quizzes/[id]
//  - owner/admin → full quiz (with answers) for editing
//  - others → quiz without the answer key, for taking it
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const quiz = await Quiz.findById(id).lean();
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    const isOwner =
      String(quiz.createdBy) === session.userId || isAdmin(session.role);

    const base = {
      id: String(quiz._id),
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      classe: quiz.classe,
      difficulty: quiz.difficulty,
      xpReward: quiz.xpReward,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      status: quiz.status,
    };

    const questions = quiz.questions.map((q, i) => ({
      index: i,
      text: q.text,
      options: q.options,
      points: q.points,
      // Only expose the answer key to the owner.
      ...(isOwner ? { correctIndex: q.correctIndex, explanation: q.explanation } : {}),
    }));

    return NextResponse.json({ success: true, data: { quiz: { ...base, questions } } });
  } catch (error) {
    console.error("Get quiz error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/quizzes/[id] — owner/admin only.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }
    if (String(quiz.createdBy) !== session.userId && !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await Quiz.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
