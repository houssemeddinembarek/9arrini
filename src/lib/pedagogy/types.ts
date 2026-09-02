// ─── Vocabulaire pédagogique du générateur ───────────────────────────────────
// Un devoir n'est pas une liste d'exercices: c'est une répartition de
// compétences. Ces types portent cette répartition depuis les tables de
// référence (distribution.ts) jusqu'à la validation du devoir produit.

/**
 * Nature cognitive d'une question, au sens de la didactique des mathématiques
 * au collège tunisien.
 *
 * - `application`  — l'élève connaît directement la règle à appliquer;
 * - `raisonnement` — la méthode n'est pas donnée, l'élève doit la choisir et
 *                    enchaîner plusieurs connaissances;
 * - `situation`    — petite situation-problème: comprendre une situation et
 *                    construire une démarche.
 *
 * Une suite de calculs mécaniques reste une `application`, quelle que soit sa
 * longueur; une application habillée d'une histoire reste une `application`.
 */
export type TaskType = "application" | "raisonnement" | "situation";

export const TASK_TYPES: TaskType[] = ["application", "raisonnement", "situation"];

export const TASK_LABELS: Record<TaskType, { fr: string; ar: string }> = {
  application: { fr: "Application directe", ar: "تطبيق مباشر" },
  raisonnement: { fr: "Application avec raisonnement", ar: "تطبيق مع استدلال" },
  situation: { fr: "Situation-problème", ar: "وضعية مسألة" },
};

/** Points par catégorie, sur le total du devoir. */
export type Distribution = Record<TaskType, number>;

/** Rôle d'un exercice dans le sujet — dicte le domaine et le type de tâches. */
export type ExerciseRole = "qcm" | "algebre" | "geometrie" | "mixte" | "final";

/** Une question à produire: sa nature et son barème sont décidés avant l'IA. */
export type QuestionSlot = {
  /** Numéro dans l'exercice, à partir de 1 */
  index: number;
  taskType: TaskType;
  points: number;
};

export type ExerciseBlueprint = {
  /** Numéro dans le devoir, à partir de 1 */
  index: number;
  role: ExerciseRole;
  points: number;
  slots: QuestionSlot[];
};

/** Le plan du devoir, calculé sans IA, que la génération doit remplir. */
export type Blueprint = {
  contentType: string;
  total: number;
  /** Répartition visée, en points */
  target: Distribution;
  /** Écart toléré par catégorie, en points, à la validation */
  tolerance: number;
  exercises: ExerciseBlueprint[];
};

/** Une question telle que l'IA la renvoie. */
export type GeneratedQuestion = {
  text: string;
  taskType: TaskType;
  points: number;
  /** Solution rédigée */
  solution: string;
  /** Barème détaillé: à quoi sert chaque point, points partiels compris */
  bareme: { points: number; critere: string }[];
  /** Notions du programme mobilisées */
  notions: string[];
};

export type GeneratedExercise = {
  index: number;
  role: ExerciseRole;
  points: number;
  questions: GeneratedQuestion[];
};

/** Ce que le système calcule sur un devoir produit (exigence §5). */
export type PaperStats = {
  totalPoints: number;
  questionCount: number;
  byType: Record<TaskType, { questions: number; points: number }>;
  notions: string[];
  notionCount: number;
};
