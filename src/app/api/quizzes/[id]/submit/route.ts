import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { levelFromXp } from "@/lib/leveling";

// POST /api/quizzes/[id]/submit
// Body: { answers: number[] }  (index chosen per question, -1 if skipped)
// Grades the quiz, and on the student's FIRST pass awards the quiz XP and
// recomputes their level.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const answers: number[] = Array.isArray(body.answers) ? body.answers : [];

    await connectDB();
    const quiz = await Quiz.findById(id).lean();
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    // Grade.
    const totalPoints = quiz.questions.reduce((s, q) => s + (q.points || 1), 0) || 1;
    let earnedPoints = 0;
    const corrections = quiz.questions.map((q, i) => {
      const chosen = typeof answers[i] === "number" ? answers[i] : -1;
      const correct = chosen === q.correctIndex;
      if (correct) earnedPoints += q.points || 1;
      return {
        index: i,
        correctIndex: q.correctIndex,
        chosen,
        correct,
        explanation: q.explanation || "",
      };
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= (quiz.passingScore ?? 50);

    // Record the attempt; award XP only the first time the student passes.
    const attempt =
      (await QuizAttempt.findOne({ user: session.userId, quiz: id })) ||
      new QuizAttempt({ user: session.userId, quiz: id });

    const firstPass = passed && !attempt.passed;
    attempt.attempts += 1;
    attempt.bestScore = Math.max(attempt.bestScore, score);
    if (passed) attempt.passed = true;

    let awardedXp = 0;
    let newLevel: number | undefined;
    let leveledUp = false;

    if (firstPass) {
      awardedXp = quiz.xpReward || 0;
      attempt.xpAwarded = awardedXp;

      const user = await User.findById(session.userId).select("xp level");
      if (user) {
        const prevLevel = user.level || levelFromXp(user.xp || 0);
        user.xp = (user.xp || 0) + awardedXp;
        newLevel = levelFromXp(user.xp);
        leveledUp = newLevel > prevLevel;
        user.level = newLevel;
        await user.save();

        if (leveledUp) {
          await Notification.create({
            user: user._id,
            title: `Niveau ${newLevel} atteint ! 🎉`,
            message: `Bravo ! Tu as gagné ${awardedXp} XP en réussissant « ${quiz.title} ».`,
            type: "success",
            link: "/profile",
          });
        }
      }
    }

    await attempt.save();

    return NextResponse.json({
      success: true,
      data: {
        score,
        passed,
        earnedPoints,
        totalPoints,
        awardedXp,
        firstPass,
        leveledUp,
        newLevel,
        corrections,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
