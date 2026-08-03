import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Quiz from "@/models/Quiz";
import { xpForDifficulty } from "@/lib/leveling";
import { isAdmin } from "@/lib/roles";
import { z } from "zod";

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional().default(""),
  points: z.number().int().min(1).max(10).optional().default(1),
});

const quizSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(""),
  subject: z.string().min(1),
  classe: z.string().min(1),
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  questions: z.array(questionSchema).min(1),
  passingScore: z.number().int().min(0).max(100).optional().default(50),
  timeLimit: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published"]).optional().default("published"),
});

// GET /api/quizzes
//  - teacher/admin with ?mine=1 → their own quizzes (all statuses)
//  - otherwise → published quizzes, optionally filtered by subject/classe
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "1";
    const subject = searchParams.get("subject");
    const classe = searchParams.get("classe");

    const query: Record<string, unknown> = {};
    if (mine && (session.role === "teacher" || isAdmin(session.role))) {
      query.createdBy = session.userId;
    } else {
      query.status = "published";
      if (subject && subject !== "all") query.subject = subject;
      if (classe && classe !== "all") query.classe = classe;
    }

    const quizzes = await Quiz.find(query)
      .select("title description subject classe difficulty questions xpReward passingScore timeLimit status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // For listing we only need counts, not the answer key.
    const shaped = quizzes.map((q) => ({
      id: String(q._id),
      title: q.title,
      description: q.description,
      subject: q.subject,
      classe: q.classe,
      difficulty: q.difficulty,
      xpReward: q.xpReward,
      passingScore: q.passingScore,
      timeLimit: q.timeLimit,
      status: q.status,
      questionCount: q.questions?.length || 0,
      createdAt: q.createdAt,
    }));

    return NextResponse.json({ success: true, data: { quizzes: shaped } });
  } catch (error) {
    console.error("List quizzes error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/quizzes — teacher/admin creates a quiz.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !(session.role === "teacher" || isAdmin(session.role))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid quiz" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Each correctIndex must point at an existing option.
    for (const [i, q] of data.questions.entries()) {
      if (q.correctIndex >= q.options.length) {
        return NextResponse.json(
          { success: false, error: `Question ${i + 1}: correct answer is out of range` },
          { status: 400 }
        );
      }
    }

    await connectDB();
    const quiz = await Quiz.create({
      ...data,
      xpReward: xpForDifficulty(data.difficulty),
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, data: { id: String(quiz._id) } }, { status: 201 });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
