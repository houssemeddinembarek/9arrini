import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

type RefineAction =
  | "refine_summary"
  | "refine_exercise"
  | "refine_correction"
  | "add_exercise"
  | "refine_markdown";

interface RefinePayload {
  action: RefineAction;
  instructions: string;
  subject?: string;
  level?: string;
  title?: string;
  summary?: string;
  statement?: string;
  correction?: string;
  existingStatements?: string[];
  markdown?: string;
}

function buildPrompt(p: RefinePayload): { prompt: string; jsonShape: "text" | "exercise" } {
  const ctx = [
    p.subject ? `Matière: ${p.subject}` : "",
    p.level ? `Niveau: ${p.level}` : "",
    p.title ? `Chapitre: ${p.title}` : "",
  ].filter(Boolean).join(" • ");

  const header = `Tu es un professeur expert du système éducatif tunisien.
Contexte: ${ctx || "Document pédagogique"}.
Instructions du professeur: ${p.instructions || "(améliorer)"}.

Règles:
- Réponds en français.
- Conserve la notation LaTeX entre $...$ et $$...$$.
- Markdown léger (## ### ** listes).
`;

  switch (p.action) {
    case "refine_summary":
      return {
        jsonShape: "text",
        prompt: `${header}
**Tâche:** Mettre à jour le résumé de cours ci-dessous selon les instructions.
Renvoie UNIQUEMENT le nouveau résumé en markdown, sans préambule.

--- RÉSUMÉ ACTUEL ---
${p.summary || "(vide — créer un résumé)"}
--- FIN ---

Nouveau résumé:`,
      };

    case "refine_exercise":
      return {
        jsonShape: "exercise",
        prompt: `${header}
**Tâche:** Modifier l'exercice ci-dessous (énoncé + correction) selon les instructions.
Réponds UNIQUEMENT avec un JSON valide au format:
{"statement": "...", "correction": "...", "points": "X pts"}

--- ÉNONCÉ ACTUEL ---
${p.statement || ""}
--- CORRECTION ACTUELLE ---
${p.correction || ""}
--- FIN ---`,
      };

    case "refine_correction":
      return {
        jsonShape: "text",
        prompt: `${header}
**Tâche:** Améliorer/réécrire UNIQUEMENT la correction ci-dessous selon les instructions. L'énoncé reste inchangé.
Renvoie UNIQUEMENT la nouvelle correction en markdown, sans préambule.

--- ÉNONCÉ (inchangé) ---
${p.statement || ""}
--- CORRECTION ACTUELLE ---
${p.correction || ""}
--- FIN ---

Nouvelle correction:`,
      };

    case "add_exercise": {
      const existing = (p.existingStatements || []).slice(0, 12)
        .map((s, i) => `  ${i + 1}. ${s.slice(0, 200).replace(/\n+/g, " ")}`)
        .join("\n");
      return {
        jsonShape: "exercise",
        prompt: `${header}
**Tâche:** Créer un NOUVEL exercice qui complète la série existante (sans dupliquer les exercices ci-dessous).
Le nouvel exercice doit s'adapter au niveau et au chapitre. Inclure énoncé détaillé + correction complète rédigée.

--- EXERCICES EXISTANTS (à ne pas répéter) ---
${existing || "(aucun)"}
--- FIN ---

Réponds UNIQUEMENT avec un JSON valide au format:
{"statement": "...", "correction": "...", "points": "X pts"}`,
      };
    }

    case "refine_markdown":
      return {
        jsonShape: "text",
        prompt: `${header}
**Tâche:** Mettre à jour le document markdown ci-dessous selon les instructions. Conserve la structure générale (titres ##, ###, listes), améliore le contenu.
Renvoie UNIQUEMENT le document complet mis à jour en markdown, sans préambule.

--- DOCUMENT ACTUEL ---
${p.markdown || ""}
--- FIN ---

Document mis à jour:`,
      };
  }
}

async function callAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) {
    console.warn("Anthropic refine failed:", await r.text());
    return null;
  }
  const data = await r.json();
  return data?.content?.[0]?.text || null;
}

async function callGemini(prompt: string, jsonMode: boolean): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );
  if (!r.ok) {
    console.error("Gemini refine error:", await r.text());
    return null;
  }
  const data = await r.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function extractJson(text: string): unknown | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch { return null; }
  }
  return null;
}

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Teachers only" }, { status: 403 });
    }

    const payload = (await request.json()) as RefinePayload;
    if (!payload.action || !payload.instructions?.trim()) {
      return NextResponse.json({ success: false, error: "Action et instructions requises" }, { status: 400 });
    }

    const hasKey = !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
    if (!hasKey) {
      // Mock: append a marker so the UX is testable without keys
      if (payload.action === "refine_exercise" || payload.action === "add_exercise") {
        return NextResponse.json({
          success: true,
          data: {
            exercise: {
              statement: `**[Mock — ${payload.instructions.slice(0, 60)}]**\n\n${payload.statement || "Nouvel exercice: résoudre $x^2 + 2x - 3 = 0$."}`,
              correction: `**[Mock]** ${payload.correction || "On factorise $(x+3)(x-1) = 0$."}`,
              points: "4 pts",
            },
          },
        });
      }
      return NextResponse.json({
        success: true,
        data: { text: `${payload.summary || payload.correction || ""}\n\n_[Mock — ${payload.instructions.slice(0, 80)}]_` },
      });
    }

    const { prompt, jsonShape } = buildPrompt(payload);
    const raw = (await callAnthropic(prompt)) || (await callGemini(prompt, jsonShape === "exercise"));
    if (!raw) {
      return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 502 });
    }

    if (jsonShape === "exercise") {
      const parsed = extractJson(raw) as { statement?: unknown; correction?: unknown; points?: unknown } | null;
      if (!parsed || typeof parsed.statement !== "string" || typeof parsed.correction !== "string") {
        console.error("Invalid refine JSON:", raw.slice(0, 400));
        return NextResponse.json({ success: false, error: "L'IA n'a pas renvoyé un JSON valide" }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        data: {
          exercise: {
            statement: parsed.statement,
            correction: parsed.correction,
            points: typeof parsed.points === "string" ? parsed.points : "",
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: { text: stripFences(raw) } });
  } catch (error) {
    console.error("Refine content error:", error);
    return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 500 });
  }
}
