import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// POST /api/ai/quiz-from-image
// Body: { image: "data:image/...;base64,XXXX", subject?, classe? }
// Uses Claude vision to read the image and return one or more quiz drafts the
// teacher can review and edit before saving.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !["teacher", "admin"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { image, subject, classe } = await request.json();
    if (typeof image !== "string" || !image.startsWith("data:")) {
      return NextResponse.json({ success: false, error: "Image manquante ou invalide" }, { status: 400 });
    }

    const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ success: false, error: "Format d'image non supporté" }, { status: 400 });
    }
    const mediaType = match[1];
    const base64 = match[2];
    if (!ALLOWED_MEDIA.includes(mediaType)) {
      return NextResponse.json({ success: false, error: "Type d'image non supporté" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-placeholder") {
      return NextResponse.json(
        { success: false, error: "Service IA non configuré (ANTHROPIC_API_KEY manquante)" },
        { status: 503 }
      );
    }

    const instructions = `Tu analyses l'image d'un ou plusieurs quiz / QCM scolaires (système éducatif tunisien, collège ou lycée).

Extrait fidèlement le contenu et renvoie UNIQUEMENT un JSON valide (aucun texte avant ou après, pas de balises markdown) au format :
{
  "quizzes": [
    {
      "title": "titre court du quiz",
      "subject": "matière (ex: Mathématiques, Physique, Français...)",
      "classe": "niveau si visible, sinon \\"\\"",
      "difficulty": "facile | moyen | difficile",
      "questions": [
        {
          "text": "énoncé de la question",
          "options": ["choix A", "choix B", "choix C", "choix D"],
          "correctIndex": 0,
          "explanation": "courte justification de la bonne réponse"
        }
      ]
    }
  ]
}

Règles :
- Sépare les quiz/exercices DISTINCTS présents dans l'image : chaque quiz devient un objet séparé dans "quizzes".
- Chaque question doit avoir au moins 2 options.
- "correctIndex" est l'index (commençant à 0) de la bonne réponse dans "options".
- Si la bonne réponse est cochée/indiquée dans l'image, utilise-la. Sinon, détermine la réponse correcte académiquement.
- Réponds en français. Recopie les énoncés fidèlement.${subject ? `\n- Matière imposée par l'enseignant : ${subject}.` : ""}${classe ? `\n- Classe imposée par l'enseignant : ${classe}.` : ""}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: instructions },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Claude vision error:", response.status, detail);
      return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 502 });
    }

    const data = await response.json();
    const raw: string =
      data.content?.find((b: { type: string }) => b.type === "text")?.text || "";

    // Be tolerant of accidental code fences around the JSON.
    const jsonText = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    let parsed: { quizzes?: unknown };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error("Quiz vision: unparseable response:", raw.slice(0, 500));
      return NextResponse.json(
        { success: false, error: "Impossible de lire le contenu de l'image. Réessaie avec une image plus nette." },
        { status: 422 }
      );
    }

    // Normalize/clamp so the client always gets well-formed drafts.
    const quizzesIn = Array.isArray(parsed.quizzes) ? parsed.quizzes : [];
    const quizzes = quizzesIn
      .map((q) => {
        const quiz = q as Record<string, unknown>;
        const questionsIn = Array.isArray(quiz.questions) ? quiz.questions : [];
        const questions = questionsIn
          .map((qq) => {
            const question = qq as Record<string, unknown>;
            const options = Array.isArray(question.options)
              ? question.options.map((o) => String(o)).filter((o) => o.trim()).slice(0, 6)
              : [];
            let correctIndex = Number(question.correctIndex);
            if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
              correctIndex = 0;
            }
            return {
              text: String(question.text || "").trim(),
              options,
              correctIndex,
              explanation: String(question.explanation || "").trim(),
            };
          })
          .filter((qq) => qq.text && qq.options.length >= 2);

        const difficulty = ["facile", "moyen", "difficile"].includes(String(quiz.difficulty))
          ? String(quiz.difficulty)
          : "moyen";

        return {
          title: String(quiz.title || "Quiz importé").trim(),
          subject: subject || String(quiz.subject || "").trim(),
          classe: classe || String(quiz.classe || "").trim(),
          difficulty,
          questions,
        };
      })
      .filter((q) => q.questions.length > 0);

    if (quizzes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun quiz détecté dans l'image." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: { quizzes } });
  } catch (error) {
    console.error("Quiz from image error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
