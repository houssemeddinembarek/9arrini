import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

// ── Prompt ──────────────────────────────────────────────────────────────────

function buildPrompt(subject: string, level: string, contentType: string, notes: string): string {
  return `Tu es un professeur expert du système éducatif tunisien.

On t'a fourni un document pédagogique (PDF).
Ta mission: reproduire un document **très proche de l'original**, en gardant la MÊME structure, les MÊMES exercices et le MÊME niveau de difficulté, mais en y apportant seulement de **petites modifications** (changer les valeurs numériques, renommer les variables ou le contexte, reformuler légèrement quelques phrases). Garde l'ordre, le nombre et le type d'exercices identiques à l'original. Ne réécris pas le document entièrement — il doit rester reconnaissable comme une variante du document fourni.

**Paramètres:**
- Matière: ${subject || "déduire du document"}
- Niveau: ${level || "déduire du document"}
- Type: ${contentType}
${notes ? `- Instructions: ${notes}` : ""}

**Format OBLIGATOIRE:**
- Langue: français
- Formules mathématiques en LaTeX: $...$ pour inline, $$...$$ pour display
- Structure: ## pour les parties, ### pour les sous-parties, **gras** pour les termes importants
- Commence directement par le titre du document

Analyse le document fourni, puis génère la version légèrement modifiée:`;
}

// ── AI callers (PDF in, markdown out) ───────────────────────────────────────

// Claude reads the PDF directly via a base64 "document" content block (no beta
// header needed). Same approach as the other content-generation routes.
async function callAnthropicWithPdf(prompt: string, pdfBase64: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0.8,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!response.ok) {
    console.warn("Anthropic adapt failed:", await response.text());
    return null;
  }
  const data = await response.json();
  return data?.content?.[0]?.text || null;
}

async function callGeminiWithPdf(prompt: string, pdfBase64: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.8 },
      }),
    },
  );
  if (!response.ok) {
    console.error("Gemini adapt error:", await response.text());
    return null;
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subject = formData.get("subject") as string;
    const level = formData.get("level") as string;
    const contentType = (formData.get("contentType") as string) || "exercices";
    const notes = (formData.get("notes") as string) || "";

    if (!file) return NextResponse.json({ error: "Fichier PDF requis" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux pour l'adaptation IA (max 20 MB)" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Service IA non configuré (ANTHROPIC_API_KEY ou GEMINI_API_KEY)" },
        { status: 503 },
      );
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const prompt = buildPrompt(subject, level, contentType, notes);

    // Prefer Claude; fall back to Gemini if Claude isn't configured or fails.
    const content =
      (await callAnthropicWithPdf(prompt, base64)) ||
      (await callGeminiWithPdf(prompt, base64));

    if (!content) {
      return NextResponse.json({ error: "Service IA indisponible" }, { status: 502 });
    }

    return NextResponse.json({ success: true, data: { content } });
  } catch (error) {
    console.error("Adapt PDF error:", error);
    return NextResponse.json({ error: "Service IA indisponible" }, { status: 500 });
  }
}
