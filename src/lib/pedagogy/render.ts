// ─── Du devoir typé au document ──────────────────────────────────────────────
// La génération produit des questions typées; l'application, elle, affiche et
// imprime depuis `statement` / `correction`. On synthétise donc ici le markdown
// du sujet et celui du corrigé, pour que l'interface et la couche PDF
// existantes continuent de fonctionner sans rien changer.

import { Lang } from "@/lib/teaching-language";
import { GeneratedExercise, GeneratedQuestion } from "./types";

const LABELS = {
  francais: { question: "Question", bareme: "Barème", points: (n: number) => `${fmt(n)} pts` },
  arabe: { question: "السؤال", bareme: "سلّم التقييم", points: (n: number) => `${fmt(n)} ن` },
};

function labels(lang: Lang) {
  return lang === "arabe" ? LABELS.arabe : LABELS.francais;
}

/** 2 → "2", 2.5 → "2,5" en français comme sur un sujet tunisien. */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

/** Barème d'un exercice, tel qu'il s'imprime à côté de son titre. */
export function pointsLabel(points: number, lang: Lang): string {
  return labels(lang).points(points);
}

/** Le marqueur d'espace de réponse, sorti du texte pour tenir sa propre ligne. */
function splitAnswerMarker(text: string): { body: string; marker: string } {
  const match = text.match(/\[\[\s*lignes\s*:\s*(\d+)\s*\]\]/i);
  if (!match) return { body: text.trim(), marker: "" };
  return {
    body: text.replace(match[0], "").trim(),
    marker: `[[lignes:${Math.min(Math.max(parseInt(match[1], 10) || 1, 1), 4)}]]`,
  };
}

/** L'énoncé d'un exercice: ses questions numérotées, prêtes à l'impression. */
export function renderStatement(exercise: GeneratedExercise): string {
  return exercise.questions
    .map((q, i) => {
      const { body, marker } = splitAnswerMarker(q.text ?? "");
      return `${i + 1}. ${body}${marker ? `\n${marker}` : ""}`;
    })
    .join("\n");
}

/**
 * Le corrigé d'un exercice: pour chaque question, sa solution rédigée puis son
 * barème détaillé — c'est ce détail qui permet au correcteur d'accorder des
 * points partiels quand la démarche est juste malgré une erreur de calcul.
 */
export function renderCorrection(exercise: GeneratedExercise, lang: Lang): string {
  const L = labels(lang);
  return exercise.questions
    .map((q, i) => {
      const head = `**${L.question} ${i + 1}** (${L.points(q.points)})`;
      const bareme = (q.bareme ?? []).length
        ? `\n\n*${L.bareme}:* ${q.bareme.map((b) => `${fmt(b.points)} — ${b.critere}`).join(" ; ")}`
        : "";
      return `${head}\n\n${(q.solution ?? "").trim()}${bareme}`;
    })
    .join("\n\n");
}

/** Force le barème du plan sur les questions produites, quand les comptes collent. */
export function alignPoints(questions: GeneratedQuestion[], slots: { points: number }[]): GeneratedQuestion[] {
  if (questions.length !== slots.length) return questions;
  return questions.map((q, i) => (q.points === slots[i].points ? q : { ...q, points: slots[i].points }));
}
