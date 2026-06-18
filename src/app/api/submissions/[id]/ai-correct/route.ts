import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import "@/models/Assignment";
import "@/models/Content";

export const runtime = "nodejs";

const MAX_IMAGES = 4;
const VISION_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type WorkImage = { media_type: string; data: string };

// Fetch a Cloudinary work image and return it as base64 for Claude vision.
async function fetchAsBase64(url: string): Promise<WorkImage | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    let mediaType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!VISION_TYPES.includes(mediaType)) mediaType = "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return { media_type: mediaType, data: buf.toString("base64") };
  } catch {
    return null;
  }
}

// Generate an AI correction by showing Claude the exercice and the student's
// handwritten work. Returns the draft text — the teacher reviews it, then sends
// it to the student via /correct. Nothing is persisted here.
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-placeholder") {
      return NextResponse.json({ error: "Service IA non configuré (ANTHROPIC_API_KEY manquante)" }, { status: 503 });
    }

    await connectDB();
    const { id } = await params;

    const submission = await Submission.findById(id)
      .populate({ path: "assignment", populate: { path: "content", select: "title body" } })
      .lean<{
        teacher: unknown;
        workImages: string[];
        assignment: { title?: string; instructions?: string; content?: { title?: string; body?: string } } | null;
      } | null>();

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (String(submission.teacher) !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Not your student" }, { status: 403 });
    }
    if (!submission.workImages?.length) {
      return NextResponse.json({ error: "Aucune image de travail à corriger" }, { status: 400 });
    }

    const images = (await Promise.all(submission.workImages.slice(0, MAX_IMAGES).map(fetchAsBase64))).filter(
      (x): x is WorkImage => x !== null
    );
    if (images.length === 0) {
      return NextResponse.json({ error: "Impossible de charger les images du travail" }, { status: 422 });
    }

    const content = submission.assignment?.content;
    const exercice = [
      content?.title ? `Titre de l'exercice : ${content.title}` : "",
      content?.body ? `Énoncé de l'exercice :\n${content.body}` : "",
      submission.assignment?.instructions ? `Consignes du professeur : ${submission.assignment.instructions}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const instructions = `Tu es un professeur tunisien (collège/lycée) qui corrige le travail manuscrit d'un élève.

${exercice || "L'énoncé n'est pas fourni en texte — déduis-le du travail de l'élève."}

Les images ci-jointes sont les photos du travail manuscrit de l'élève.

Produis une CORRECTION pédagogique en français, en markdown, structurée ainsi :
1. **Note / appréciation globale** (sur 20 si possible) et un mot d'encouragement.
2. **Erreurs relevées** : pour chaque erreur, cite l'endroit (numéro de question/étape), explique POURQUOI c'est faux.
3. **Correction détaillée** : la bonne démarche étape par étape (mets les formules mathématiques en LaTeX entre $...$ ou $$...$$).
4. **Conseils** pour progresser.

Sois bienveillant, précis et clair. Réponds UNIQUEMENT avec la correction (pas de préambule).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              ...images.map((img) => ({
                type: "image",
                source: { type: "base64", media_type: img.media_type, data: img.data },
              })),
              { type: "text", text: instructions },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Claude correction error:", response.status, detail);
      return NextResponse.json({ error: "Service IA indisponible" }, { status: 502 });
    }

    const data = await response.json();
    const correction: string =
      data.content?.find((b: { type: string }) => b.type === "text")?.text || "";
    if (!correction.trim()) {
      return NextResponse.json({ error: "Aucune correction générée" }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: { correction } });
  } catch (error) {
    console.error("AI correct error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
