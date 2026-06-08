import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && session.role !== "admin") {
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

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "Clé Gemini API non configurée (GEMINI_API_KEY)" }, { status: 503 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `Tu es un professeur expert du système éducatif tunisien.

On t'a fourni un document pédagogique (PDF) d'un autre auteur.
Ta mission: créer un nouveau document **similaire mais original** — même structure, même niveau de difficulté, mais avec des exercices, exemples et formulations **entièrement différents et reformulés**. Ne copie aucun extrait du document original.

**Paramètres du nouveau document:**
- Matière: ${subject || "déduire du document"}
- Niveau: ${level || "déduire du document"}
- Type: ${contentType}
${notes ? `- Instructions: ${notes}` : ""}

**Format OBLIGATOIRE:**
- Langue: français
- Formules mathématiques en LaTeX: $...$ pour inline, $$...$$ pour display
- Structure: ## pour les parties, ### pour les sous-parties, **gras** pour les termes importants
- Commence directement par le titre du document

Analyse le document fourni, puis génère le nouveau document complet:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: "application/pdf", data: base64 } },
              { text: prompt },
            ],
          }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.8 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini adapt error:", err);
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Impossible de générer le contenu.";

    return NextResponse.json({ success: true, data: { content } });
  } catch (error) {
    console.error("Adapt PDF error:", error);
    return NextResponse.json({ error: "Service IA indisponible" }, { status: 500 });
  }
}
