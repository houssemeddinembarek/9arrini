import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  resume: "Résumé de cours",
  exercices: "Série d'exercices",
  devoir_controle: "Devoir de contrôle",
  devoir_synthese: "Devoir de synthèse",
  fiche_revision: "Fiche de révision",
};

const STRUCTURED_TYPES = new Set(["exercices", "devoir_controle", "devoir_synthese"]);

// ── Teaching language (Tunisian curriculum) ─────────────────────────────────
// Scientific subjects are taught in Arabic through primary + collège, then in
// French from lycée onward. Language subjects keep their own language.

type Lang = "arabe" | "francais" | "anglais" | "allemand";

const SCIENTIFIC_SUBJECTS = new Set([
  "Mathématiques", "Physique-Chimie", "Physique", "Chimie",
  "Sciences de la vie et de la terre (SVT)", "Technologie",
]);

const SUBJECT_LANGUAGE: Record<string, Lang> = {
  "Français": "francais",
  "Anglais": "anglais",
  "Allemand": "allemand",
  "Arabe": "arabe",
};

// Primary + collège ("années de base") are taught in Arabic for sciences.
function isBaseLevel(level: string): boolean {
  return /primaire|base/i.test(level);
}

function resolveLanguage(subject: string, level: string): Lang {
  if (SUBJECT_LANGUAGE[subject]) return SUBJECT_LANGUAGE[subject];
  if (SCIENTIFIC_SUBJECTS.has(subject)) return isBaseLevel(level) ? "arabe" : "francais";
  return "francais";
}

// The "write in language X" directive injected into every prompt.
function langDirective(lang: Lang): string {
  if (lang === "arabe") {
    return `Rédige TOUT le contenu textuel en **arabe** (arabe standard moderne), avec la terminologie scientifique scolaire tunisienne. Les formules et symboles mathématiques restent en notation LaTeX universelle entre $...$ ou $$...$$.`;
  }
  const name = lang === "anglais" ? "anglais" : lang === "allemand" ? "allemand" : "français";
  return `Langue: ${name}. Terminologie conforme aux manuels scolaires tunisiens officiels.`;
}

// ── Prompt builders ─────────────────────────────────────────────────────────

function buildMarkdownPrompt(subject: string, level: string, contentType: string, title: string, notes: string, lang: Lang): string {
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;

  let typeInstructions = "";
  if (contentType === "resume") {
    typeInstructions = `Rédige un résumé de cours complet incluant:
- Les objectifs du cours
- Les définitions clés (numérotées)
- Les théorèmes et propriétés importants (avec démonstrations si approprié)
- Les formules et règles essentielles
- Des exemples résolus pas à pas (au moins 2-3)
- Un résumé synthétique en fin de document`;
  } else {
    typeInstructions = `Crée une fiche de révision synthétique incluant:
- Les points clés à retenir (format bullet points)
- Les formules et théorèmes essentiels dans des encadrés
- Un tableau récapitulatif si pertinent
- Des astuces et méthodes pour les examens
- Les erreurs courantes à éviter
- Des QCM de vérification (10 questions avec réponses)`;
  }

  return `Tu es un professeur expert du système éducatif tunisien (Ministère de l'Éducation Nationale).
Crée un document pédagogique de haute qualité, conforme aux programmes officiels tunisiens.

**Document:**
- Matière: ${subject}
- Niveau: ${level}
- Type: ${typeLabel}
- Titre/Chapitre: ${title}
${notes ? `- Instructions: ${notes}` : ""}

**Contenu requis:**
${typeInstructions}

**Format OBLIGATOIRE:**
- ${langDirective(lang)}
- Structure claire avec ## pour les parties, ### pour les sous-parties
- **Formules: notation LaTeX entre $...$ inline et $$...$$ display**
- Commence directement par le titre, sans introduction méta

Génère maintenant le document complet:`;
}

function buildStructuredPrompt(subject: string, level: string, contentType: string, title: string, notes: string, withCorrection: boolean, lang: Lang): string {
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;
  const duration =
    contentType === "devoir_controle" ? "1 heure (20 points)" :
    contentType === "devoir_synthese" ? "2 heures (20 points)" :
    "Série d'application";
  const exerciseCount = contentType === "exercices" ? 10 : contentType === "devoir_controle" ? 3 : 4;

  // The exercise object and the correction rule change when the teacher wants
  // the énoncés only (no solutions) — e.g. a blank exam paper to hand out.
  const exerciseShape = withCorrection
    ? `{
      "statement": "Énoncé complet de l'exercice 1 en markdown. Inclure parties a), b), c) si nécessaire. LaTeX entre $...$ ou $$...$$.",
      "correction": "Correction détaillée et rédigée pas-à-pas pour l'exercice 1, en markdown avec LaTeX.",
      "points": "4 pts"
    }`
    : `{
      "statement": "Énoncé complet de l'exercice 1 en markdown. Inclure parties a), b), c) si nécessaire. LaTeX entre $...$ ou $$...$$.",
      "points": "4 pts"
    }`;
  const correctionRule = withCorrection
    ? `- Chaque exercice doit avoir une correction COMPLÈTE et rédigée, pas juste la réponse finale.`
    : `- NE génère AUCUNE correction ni solution. Fournis UNIQUEMENT les énoncés — n'inclus pas de champ "correction".`;

  return `Tu es un professeur expert du système éducatif tunisien (Ministère de l'Éducation Nationale).
Produis un document de type **${typeLabel}** (${duration}) sur "${title}" pour ${subject} — ${level}.
${notes ? `Contraintes supplémentaires: ${notes}\n` : ""}
**Réponds UNIQUEMENT avec un objet JSON valide** (pas de texte avant/après, pas de \`\`\`json fence), au format exact:

{
  "summary": "Markdown du résumé de cours préparatoire: objectifs, définitions clés, théorèmes, formules, méthodes. Utilise ##, ###, **, listes et LaTeX entre $...$ ou $$...$$.",
  "exercises": [
    ${exerciseShape}
  ]
}

**Règles strictes:**
- Génère exactement ${exerciseCount} exercices progressifs (du plus simple au plus complexe).
${correctionRule}
- Le champ "summary" est un cours condensé conforme au programme tunisien sur "${title}".
- ${langDirective(lang)}
- LaTeX OBLIGATOIRE pour toute formule mathématique.
- Échappe correctement les caractères dans les chaînes JSON (\\n pour les sauts de ligne, \\" pour les guillemets, \\\\ pour les backslash LaTeX → écris $\\\\frac{a}{b}$ dans le JSON).
- AUCUN texte hors JSON. La réponse DOIT être parsable par JSON.parse().`;
}

// ── Mock fallback ───────────────────────────────────────────────────────────

function buildMockMarkdown(subject: string, level: string, contentType: string, title: string): string {
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;
  return `## ${typeLabel} — ${subject}

**Niveau:** ${level} | **Chapitre:** ${title}

---

> ⚠️ Mode démonstration — Configurez \`ANTHROPIC_API_KEY\` ou \`GEMINI_API_KEY\` dans \`.env.local\`.

## I. Points clés

- Concept fondamental de **${title}**
- Formule générale: $f(x) = ax^2 + bx + c$, $\\Delta = b^2 - 4ac$

## II. Astuces

- Mémoriser les identités remarquables
- Vérifier le signe du discriminant
`;
}

function buildMockStructured(subject: string, level: string, title: string, withCorrection: boolean) {
  return {
    summary: `## Résumé — ${title}\n\n**Matière:** ${subject} • **Niveau:** ${level}\n\n> ⚠️ Mode démonstration — configurez une clé API.\n\n### Définitions\n- **Définition 1:** énoncé...\n- **Définition 2:** énoncé...\n\n### Formules essentielles\n$$\\Delta = b^2 - 4ac$$`,
    exercises: Array.from({ length: 10 }, (_, i) => ({
      statement: `**Exercice ${i + 1}:** Résoudre l'équation $x^2 - ${i + 2}x + ${i + 1} = 0$.`,
      correction: withCorrection
        ? `**Correction Ex.${i + 1}:**\n\nOn calcule $\\Delta = (${i + 2})^2 - 4 \\times ${i + 1} = ${(i + 2) ** 2 - 4 * (i + 1)}$.\n\n$$x_{1,2} = \\frac{${i + 2} \\pm \\sqrt{\\Delta}}{2}$$`
        : "",
      points: contentTypePoints(i),
    })),
  };
}

function contentTypePoints(idx: number) {
  return `${Math.max(2, Math.min(6, 2 + (idx % 4)))} pts`;
}

// ── AI callers ──────────────────────────────────────────────────────────────

async function callAnthropic(prompt: string, json: boolean): Promise<string | null> {
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
      max_tokens: json ? 8192 : 4096,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    console.warn("Anthropic failed:", await response.text());
    return null;
  }
  const data = await response.json();
  return data?.content?.[0]?.text || null;
}

async function callGemini(prompt: string, json: boolean): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: json ? 8192 : 4096,
          temperature: 0.7,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );
  if (!response.ok) {
    console.error("Gemini error:", await response.text());
    return null;
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function extractJson(text: string): unknown | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Teachers only" }, { status: 403 });
    }

    const { subject, level, contentType, title, notes, withCorrection } = await request.json();
    if (!subject || !level || !contentType || !title?.trim()) {
      return NextResponse.json({ success: false, error: "Champs requis manquants" }, { status: 400 });
    }
    // Énoncés + corrections by default; the teacher can ask for énoncés only.
    const includeCorrection = withCorrection !== false;
    // Tunisian curriculum: Arabic for sciences up to collège, French from lycée.
    const lang = resolveLanguage(subject, level);

    const useStructured = STRUCTURED_TYPES.has(contentType);
    const hasKey = !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);

    // No keys → mock
    if (!hasKey) {
      return NextResponse.json({
        success: true,
        data: useStructured
          ? { format: "structured", structured: buildMockStructured(subject, level, title, includeCorrection), withCorrection: includeCorrection, language: lang }
          : { format: "markdown", content: buildMockMarkdown(subject, level, contentType, title), language: lang },
      });
    }

    const prompt = useStructured
      ? buildStructuredPrompt(subject, level, contentType, title, notes || "", includeCorrection, lang)
      : buildMarkdownPrompt(subject, level, contentType, title, notes || "", lang);

    const raw = (await callAnthropic(prompt, useStructured)) || (await callGemini(prompt, useStructured));
    if (!raw) {
      return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 502 });
    }

    if (useStructured) {
      const parsed = extractJson(raw) as { summary?: string; exercises?: unknown[] } | null;
      if (!parsed || !Array.isArray(parsed.exercises) || typeof parsed.summary !== "string") {
        console.error("Invalid JSON shape from AI:", raw.slice(0, 500));
        return NextResponse.json({ success: false, error: "L'IA n'a pas renvoyé un JSON valide" }, { status: 502 });
      }
      const exercises = parsed.exercises
        .filter((e): e is { statement?: unknown; correction?: unknown; points?: unknown } => !!e && typeof e === "object")
        .map((e) => ({
          statement: typeof e.statement === "string" ? e.statement : "",
          correction: typeof e.correction === "string" ? e.correction : "",
          points: typeof e.points === "string" ? e.points : "",
        }))
        // Without correction we only require a statement.
        .filter((e) => e.statement && (includeCorrection ? e.correction : true));

      if (exercises.length === 0) {
        return NextResponse.json({ success: false, error: "Aucun exercice généré" }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        data: { format: "structured", structured: { summary: parsed.summary, exercises }, withCorrection: includeCorrection, language: lang },
      });
    }

    return NextResponse.json({ success: true, data: { format: "markdown", content: raw, language: lang } });
  } catch (error) {
    console.error("Generate content error:", error);
    return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 500 });
  }
}
