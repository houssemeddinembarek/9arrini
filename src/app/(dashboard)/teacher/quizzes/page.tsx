"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  PlusCircle, Sparkles, Trash2, GraduationCap, Loader2, X, Plus, Check,
  ImagePlus, Save, FileQuestion, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SUBJECTS, CLASS_LEVELS } from "@/lib/tunisia-education";
import { QUIZ_DIFFICULTIES, XP_BY_DIFFICULTY } from "@/lib/leveling";

const ALL_CLASSES = CLASS_LEVELS.flatMap((s) => s.classes);

interface QuizListItem {
  id: string;
  title: string;
  subject: string;
  classe: string;
  difficulty: string;
  xpReward: number;
  questionCount: number;
  status: string;
}

interface QDraft {
  title: string;
  subject: string;
  classe: string;
  difficulty: "facile" | "moyen" | "difficile";
  passingScore: number;
  questions: { text: string; options: string[]; correctIndex: number; explanation: string }[];
}

const blankQuestion = () => ({ text: "", options: ["", ""], correctIndex: 0, explanation: "" });
const blankDraft = (): QDraft => ({
  title: "",
  subject: "",
  classe: "",
  difficulty: "moyen",
  passingScore: 50,
  questions: [blankQuestion()],
});

const DIFF_LABEL: Record<string, string> = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };

function difficultyBadge(d: string) {
  const variant = d === "facile" ? "success" : d === "difficile" ? "destructive" : "warning";
  return <Badge variant={variant as "success" | "destructive" | "warning"}>{DIFF_LABEL[d] || d}</Badge>;
}

// ── One editable quiz form (used for manual create and AI-extracted drafts) ──
function QuizDraftCard({
  draft, index, onChange, onRemove,
}: {
  draft: QDraft;
  index: number;
  onChange: (d: QDraft) => void;
  onRemove: () => void;
}) {
  const set = (partial: Partial<QDraft>) => onChange({ ...draft, ...partial });
  const setQuestion = (qi: number, partial: Partial<QDraft["questions"][number]>) =>
    set({ questions: draft.questions.map((q, i) => (i === qi ? { ...q, ...partial } : q)) });

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <div className="flex items-center gap-2 font-medium text-sm">
          <FileQuestion className="h-4 w-4 text-[hsl(var(--primary))]" />
          Quiz {index + 1}
          <Badge variant="secondary" className="text-[10px]">
            {draft.questions.length} question{draft.questions.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Meta */}
        <div className="space-y-1.5">
          <Label>Titre du quiz</Label>
          <Input placeholder="ex : Les équations du premier degré" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Matière</Label>
            <Select value={draft.subject} onValueChange={(v) => set({ subject: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Classe</Label>
            <Select value={draft.classe} onValueChange={(v) => set({ classe: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{ALL_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Difficulté</Label>
            <Select value={draft.difficulty} onValueChange={(v) => set({ difficulty: v as QDraft["difficulty"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUIZ_DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>{DIFF_LABEL[d]} · {XP_BY_DIFFICULTY[d]} XP</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {draft.questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Label className="pt-2">Question {qi + 1}</Label>
                {draft.questions.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => set({ questions: draft.questions.filter((_, i) => i !== qi) })}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Textarea placeholder="Énoncé de la question" value={q.text} onChange={(e) => setQuestion(qi, { text: e.target.value })} className="min-h-[60px]" />

              <div className="space-y-2">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Coche la bonne réponse :</p>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestion(qi, { correctIndex: oi })}
                      title="Marquer comme bonne réponse"
                      className={cn(
                        "h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                        q.correctIndex === oi ? "gradient-bg border-transparent" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
                      )}
                    >
                      {q.correctIndex === oi && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <Input
                      placeholder={`Choix ${oi + 1}`}
                      value={opt}
                      onChange={(e) => setQuestion(qi, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })}
                    />
                    {q.options.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(var(--muted-foreground))]"
                        onClick={() => {
                          const options = q.options.filter((_, i) => i !== oi);
                          const correctIndex = q.correctIndex >= options.length ? 0 : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex;
                          setQuestion(qi, { options, correctIndex });
                        }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <Button variant="outline" size="sm" onClick={() => setQuestion(qi, { options: [...q.options, ""] })}>
                    <Plus className="h-3.5 w-3.5" /> Ajouter un choix
                  </Button>
                )}
              </div>

              <Input placeholder="Explication de la réponse (optionnel)" value={q.explanation} onChange={(e) => setQuestion(qi, { explanation: e.target.value })} />
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={() => set({ questions: [...draft.questions, blankQuestion()] })}>
            <Plus className="h-4 w-4" /> Ajouter une question
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<QDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await fetch("/api/quizzes?mine=1");
      const json = await res.json();
      if (json.success) setQuizzes(json.data.quizzes);
      else toast.error(json.error || "Échec du chargement");
    } catch {
      toast.error("Échec du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void fetchQuizzes(); }, 0);
    return () => clearTimeout(t);
  }, [fetchQuizzes]);

  const deleteQuiz = async (id: string) => {
    const prev = quizzes;
    setQuizzes((q) => q.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) toast.success("Quiz supprimé");
      else { setQuizzes(prev); toast.error(json.error || "Échec de la suppression"); }
    } catch { setQuizzes(prev); toast.error("Échec de la suppression"); }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAiLoading(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/ai/quiz-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Échec de l'analyse de l'image");
        return;
      }
      const extracted: QDraft[] = json.data.quizzes.map((q: Partial<QDraft>) => ({
        title: q.title || "Quiz importé",
        subject: q.subject || "",
        classe: q.classe || "",
        difficulty: (q.difficulty as QDraft["difficulty"]) || "moyen",
        passingScore: 50,
        questions: (q.questions?.length ? q.questions : [blankQuestion()]),
      }));
      setDrafts((d) => [...d, ...extracted]);
      toast.success(`${extracted.length} quiz extrait${extracted.length > 1 ? "s" : ""} de l'image — vérifie puis enregistre`);
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setAiLoading(false);
    }
  };

  const validateDraft = (d: QDraft): string | null => {
    if (d.title.trim().length < 3) return "Chaque quiz doit avoir un titre (3 caractères min).";
    if (!d.subject) return `« ${d.title || "Quiz"} » : choisis une matière.`;
    if (!d.classe) return `« ${d.title || "Quiz"} » : choisis une classe.`;
    if (d.questions.length === 0) return `« ${d.title} » : ajoute au moins une question.`;
    for (const [i, q] of d.questions.entries()) {
      if (!q.text.trim()) return `« ${d.title} » : énoncé manquant à la question ${i + 1}.`;
      const opts = q.options.map((o) => o.trim());
      if (opts.filter(Boolean).length < 2) return `« ${d.title} » : question ${i + 1} a besoin de 2 choix.`;
      if (opts.some((o) => !o)) return `« ${d.title} » : un choix est vide à la question ${i + 1}.`;
      if (q.correctIndex < 0 || q.correctIndex >= q.options.length) return `« ${d.title} » : indique la bonne réponse à la question ${i + 1}.`;
    }
    return null;
  };

  const saveAll = async () => {
    for (const d of drafts) {
      const err = validateDraft(d);
      if (err) { toast.error(err); return; }
    }
    setSaving(true);
    try {
      let created = 0;
      for (const d of drafts) {
        const res = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: d.title.trim(),
            subject: d.subject,
            classe: d.classe,
            difficulty: d.difficulty,
            passingScore: d.passingScore,
            questions: d.questions.map((q) => ({
              text: q.text.trim(),
              options: q.options.map((o) => o.trim()),
              correctIndex: q.correctIndex,
              explanation: q.explanation.trim(),
              points: 1,
            })),
          }),
        });
        const json = await res.json();
        if (json.success) created += 1;
        else toast.error(`« ${d.title} » : ${json.error || "échec"}`);
      }
      if (created > 0) {
        toast.success(`${created} quiz enregistré${created > 1 ? "s" : ""}`);
        setDrafts([]);
        await fetchQuizzes();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quiz</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Crée des quiz pour tes élèves. Chaque réussite leur fait gagner de l&apos;XP.
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleImage} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Importer depuis une image (IA)
          </Button>
          <Button variant="gradient" onClick={() => setDrafts((d) => [...d, blankDraft()])}>
            <PlusCircle className="h-4 w-4" /> Créer un quiz
          </Button>
        </div>
      </div>

      {/* AI extraction hint */}
      <div className="rounded-xl border border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5 p-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          <span className="font-medium text-[hsl(var(--foreground))]">Astuce IA :</span> prends en photo une feuille de QCM
          (un ou plusieurs quiz). L&apos;IA remplit automatiquement les formulaires — tu n&apos;as plus qu&apos;à vérifier et enregistrer.
        </p>
      </div>

      {/* Drafts being edited */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          {drafts.map((d, i) => (
            <QuizDraftCard
              key={i}
              draft={d}
              index={i}
              onChange={(nd) => setDrafts((arr) => arr.map((x, idx) => (idx === i ? nd : x)))}
              onRemove={() => setDrafts((arr) => arr.filter((_, idx) => idx !== i))}
            />
          ))}
          <div className="flex items-center justify-end gap-2 sticky bottom-4">
            <Button variant="outline" onClick={() => setDrafts([])} disabled={saving}>Annuler</Button>
            <Button variant="gradient" onClick={saveAll} loading={saving}>
              <Save className="h-4 w-4" /> Enregistrer {drafts.length > 1 ? `les ${drafts.length} quiz` : "le quiz"}
            </Button>
          </div>
        </div>
      )}

      {/* Existing quizzes */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : quizzes.length === 0 && drafts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-60">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Aucun quiz pour l&apos;instant</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm">
            Crée ton premier quiz manuellement, ou importe-le depuis une image avec l&apos;IA.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div key={q.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                <FileQuestion className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{q.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <Badge variant="purple" className="text-[10px]">{q.subject}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{q.classe}</Badge>
                  {difficultyBadge(q.difficulty)}
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{q.questionCount} question{q.questionCount === 1 ? "" : "s"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-500 shrink-0">
                <Zap className="h-4 w-4" /> {q.xpReward} XP
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 shrink-0" onClick={() => deleteQuiz(q.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
