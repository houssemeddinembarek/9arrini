// ─── Validation d'un devoir produit ──────────────────────────────────────────
// Le devoir n'est pas retourné parce que l'IA l'a écrit: il l'est parce qu'il
// passe ces contrôles. Chaque défaut porte un message rédigé en français, prêt
// à être renvoyé au modèle pour réparation — c'est l'étape 5 de l'architecture.

import {
  Blueprint, GeneratedExercise, PaperStats, TASK_TYPES, TaskType,
} from "./types";

export type Severity = "error" | "warning";

export type Defect = {
  code: string;
  severity: Severity;
  /** Numéro d'exercice (1-based) quand le défaut est localisé */
  exercise?: number;
  question?: number;
  /** Consigne de correction, telle qu'elle sera envoyée au modèle */
  message: string;
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const round = (n: number) => Math.round(n * 100) / 100;

/** Statistiques exigées au §5, calculées sur le devoir réellement produit. */
export function computeStats(exercises: GeneratedExercise[]): PaperStats {
  const questions = exercises.flatMap((e) => e.questions);
  const byType = Object.fromEntries(
    TASK_TYPES.map((t) => {
      const qs = questions.filter((q) => q.taskType === t);
      return [t, { questions: qs.length, points: round(sum(qs.map((q) => q.points))) }];
    }),
  ) as PaperStats["byType"];

  const notions = [...new Set(questions.flatMap((q) => q.notions ?? []).map((n) => n.trim()).filter(Boolean))];

  return {
    totalPoints: round(sum(questions.map((q) => q.points))),
    questionCount: questions.length,
    byType,
    notions,
    notionCount: notions.length,
  };
}

/**
 * Sac de traits d'une question: ses mots ET ses formules.
 *
 * En mathématiques, deux questions ne se distinguent souvent que par leur
 * LaTeX — « résoudre $x^2-5x+6=0$ » et « résoudre $2x^2+3x-5=0$ » ont
 * exactement les mêmes mots. Écarter les formules ferait voir des doublons
 * partout; on les normalise et on les compte comme des traits à part entière.
 */
function tokens(text: string): Set<string> {
  const formulas = (text.match(/\$+[^$]*\$+/g) ?? []).map(
    (f) => "math:" + f.replace(/[$\s{}\\]/g, "").toLowerCase(),
  );
  const words = text
    .replace(/\$+[^$]*\$+/g, " ")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 3);
  return new Set([...words, ...formulas]);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / (a.size + b.size - shared);
}

/** Nombre d'étapes distinctes d'une solution rédigée. */
function stepCount(solution: string): number {
  return solution
    .split(/\n+|(?<=\.)\s+(?=[A-ZÀ-Ý\p{Script=Arabic}])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 8).length;
}

export type ValidateOptions = {
  /** Le devoir doit-il porter les lignes de réponse de l'élève */
  answerLines: boolean;
  /** Le corrigé est-il demandé */
  withCorrection: boolean;
  /** Notions autorisées, extraites du programme officiel (vide = pas de contrôle) */
  allowedNotions?: string[];
};

export function validatePaper(
  exercises: GeneratedExercise[],
  bp: Blueprint,
  options: ValidateOptions,
): Defect[] {
  const defects: Defect[] = [];
  const add = (d: Defect) => defects.push(d);

  // ── 1. Le sujet a-t-il la forme prévue ────────────────────────────────────
  if (exercises.length !== bp.exercises.length) {
    add({
      code: "exercise_count", severity: "error",
      message: `Le devoir doit compter exactement ${bp.exercises.length} exercices, il en compte ${exercises.length}.`,
    });
  }

  const total = round(sum(exercises.flatMap((e) => e.questions).map((q) => q.points)));
  if (Math.abs(total - bp.total) > 0.01) {
    add({
      code: "total_points", severity: "error",
      message: `Le total des points de toutes les questions doit valoir exactement ${bp.total}; il vaut ${total}. Réajuste les barèmes des questions, pas leur nombre.`,
    });
  }

  // ── 2. Chaque exercice, question par question ─────────────────────────────
  exercises.forEach((ex, i) => {
    const plan = bp.exercises[i];
    if (!plan) return;

    const exTotal = round(sum(ex.questions.map((q) => q.points)));
    if (Math.abs(exTotal - plan.points) > 0.01) {
      add({
        code: "exercise_points", severity: "error", exercise: i + 1,
        message: `Exercice ${i + 1}: la somme des points de ses questions doit valoir ${plan.points}, elle vaut ${exTotal}.`,
      });
    }

    // La nature des tâches prévue par le plan, comparée à celle produite.
    const wanted = plan.slots.reduce((m, s) => m.set(s.taskType, (m.get(s.taskType) ?? 0) + s.points), new Map<TaskType, number>());
    const got = ex.questions.reduce((m, q) => m.set(q.taskType, (m.get(q.taskType) ?? 0) + q.points), new Map<TaskType, number>());
    for (const t of TASK_TYPES) {
      const w = wanted.get(t) ?? 0;
      const g = got.get(t) ?? 0;
      if (Math.abs(w - g) > bp.tolerance) {
        add({
          code: "exercise_mix", severity: "error", exercise: i + 1,
          message: `Exercice ${i + 1}: il doit porter ${w} point(s) de type « ${t} », il en porte ${g}.`,
        });
      }
    }

    if (plan.role === "qcm") {
      ex.questions.forEach((q, j) => {
        const choices = (q.text.match(/[☐□]/g) ?? []).length;
        if (choices !== 3) {
          add({
            code: "qcm_choices", severity: "error", exercise: i + 1, question: j + 1,
            message: `Exercice ${i + 1}, question ${j + 1}: un QCM propose exactement 3 propositions précédées de ☐; celle-ci en propose ${choices}.`,
          });
        }
        if (/\[\[\s*lignes/i.test(q.text)) {
          add({
            code: "qcm_answer_lines", severity: "error", exercise: i + 1, question: j + 1,
            message: `Exercice ${i + 1}, question ${j + 1}: pas de marqueur [[lignes:n]] dans un QCM, l'élève y coche.`,
          });
        }
      });
    } else if (options.answerLines) {
      ex.questions.forEach((q, j) => {
        if (!/\[\[\s*lignes\s*:\s*\d+\s*\]\]/i.test(q.text)) {
          add({
            code: "answer_lines_missing", severity: "error", exercise: i + 1, question: j + 1,
            message: `Exercice ${i + 1}, question ${j + 1}: ajoute le marqueur [[lignes:1]] ou [[lignes:2]] à la fin de la question.`,
          });
        }
      });
    }

    // Progression interne: on ne demande pas de construire une démarche avant
    // d'avoir fait appliquer une technique.
    const rank: Record<TaskType, number> = { application: 0, raisonnement: 1, situation: 2 };
    const ranks = ex.questions.map((q) => rank[q.taskType] ?? 0);
    if (ranks.some((r, k) => k > 0 && r < ranks[k - 1])) {
      add({
        code: "progression", severity: "warning", exercise: i + 1,
        message: `Exercice ${i + 1}: ordonne les questions de la plus directe à la plus ouverte (application, puis raisonnement, puis situation-problème).`,
      });
    }

    // ── 3. Corrigé et barème ────────────────────────────────────────────────
    if (options.withCorrection) {
      ex.questions.forEach((q, j) => {
        const where = `Exercice ${i + 1}, question ${j + 1}`;
        if (!q.solution?.trim()) {
          add({ code: "missing_solution", severity: "error", exercise: i + 1, question: j + 1,
                message: `${where}: la solution rédigée est vide.` });
          return;
        }
        const parts = q.bareme ?? [];
        if (parts.length === 0) {
          add({ code: "missing_bareme", severity: "error", exercise: i + 1, question: j + 1,
                message: `${where}: donne le barème détaillé (à quoi sert chaque point), pour permettre des points partiels.` });
        } else {
          const b = round(sum(parts.map((p) => p.points)));
          if (Math.abs(b - q.points) > 0.01) {
            add({ code: "bareme_sum", severity: "error", exercise: i + 1, question: j + 1,
                  message: `${where}: le barème détaillé totalise ${b} au lieu de ${q.points}.` });
          }
          if (q.taskType !== "application" && parts.length < 2) {
            add({ code: "bareme_grain", severity: "warning", exercise: i + 1, question: j + 1,
                  message: `${where}: une question de raisonnement ou de situation-problème doit distribuer ses points sur la démarche (identification des données, choix de la méthode, étapes, conclusion), pas sur le seul résultat.` });
          }
        }

        // Faux problème: une situation qui se résout en une ligne n'en est pas une.
        if (q.taskType === "situation" && stepCount(q.solution) < 3) {
          add({ code: "fake_problem", severity: "warning", exercise: i + 1, question: j + 1,
                message: `${where}: cette situation-problème se résout en une ou deux étapes — c'est une application directe habillée d'un contexte. Demande à l'élève de construire sa démarche (donnée à identifier, méthode à choisir, résultat à interpréter).` });
        }
      });
    }
  });

  // ── 4. Répartition d'ensemble ─────────────────────────────────────────────
  const stats = computeStats(exercises);
  for (const t of TASK_TYPES) {
    const got = stats.byType[t].points;
    const want = bp.target[t];
    if (Math.abs(got - want) > bp.tolerance) {
      add({
        code: "distribution", severity: "error",
        message: `Répartition: le devoir doit porter ${want} points de type « ${t} », il en porte ${got}.`,
      });
    }
  }

  // ── 5. Doublons ───────────────────────────────────────────────────────────
  const all = exercises.flatMap((e, i) => e.questions.map((q, j) => ({ q, i, j })));
  const bags = all.map((x) => tokens(x.q.text));
  for (let a = 0; a < all.length; a++) {
    for (let b = a + 1; b < all.length; b++) {
      // Deux questions trop courtes pour être comparées ne sont pas signalées:
      // mieux vaut laisser passer un doublon que casser un devoir correct.
      if (bags[a].size < 5 || bags[b].size < 5) continue;
      if (jaccard(bags[a], bags[b]) > 0.85) {
        add({
          code: "duplicate", severity: "error",
          exercise: all[b].i + 1, question: all[b].j + 1,
          message: `Exercice ${all[b].i + 1}, question ${all[b].j + 1}: elle reprend la question ${all[a].j + 1} de l'exercice ${all[a].i + 1}. Remplace-la par une tâche différente.`,
        });
        break;
      }
    }
  }

  // ── 6. Hors programme ─────────────────────────────────────────────────────
  const allowed = (options.allowedNotions ?? []).map((n) => n.toLowerCase());
  if (allowed.length) {
    const known = new Set(allowed.flatMap((n) => [...tokens(n)]));
    for (const { q, i, j } of all) {
      for (const notion of q.notions ?? []) {
        const words = [...tokens(notion)];
        if (words.length && !words.some((w) => known.has(w))) {
          add({
            code: "off_syllabus", severity: "warning", exercise: i + 1, question: j + 1,
            message: `Exercice ${i + 1}, question ${j + 1}: la notion « ${notion} » n'apparaît pas dans le programme officiel fourni. Remplace-la par une notion du chapitre.`,
          });
        }
      }
    }
  }

  return defects;
}

export function hasBlockingDefect(defects: Defect[]): boolean {
  return defects.some((d) => d.severity === "error");
}

/** Les défauts, tels qu'ils sont posés au modèle lors de la réparation. */
export function defectList(defects: Defect[]): string {
  return defects.map((d, i) => `${i + 1}. ${d.message}`).join("\n");
}

/** Résumé court, pour les traces serveur et la réponse de l'API. */
export function summarizeDefects(defects: Defect[]): string {
  const errors = defects.filter((d) => d.severity === "error").length;
  const warnings = defects.length - errors;
  return `${errors} erreur(s), ${warnings} avertissement(s)`;
}
