"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Zap, Trophy, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

interface TakeQuestion {
  index: number;
  text: string;
  options: string[];
  points: number;
}
interface TakeQuiz {
  id: string;
  title: string;
  subject: string;
  classe: string;
  difficulty: string;
  xpReward: number;
  passingScore: number;
  questions: TakeQuestion[];
}
interface Correction {
  index: number;
  correctIndex: number;
  chosen: number;
  correct: boolean;
  explanation: string;
}
interface Result {
  score: number;
  passed: boolean;
  awardedXp: number;
  firstPass: boolean;
  leveledUp: boolean;
  newLevel?: number;
  corrections: Correction[];
}

const DIFF_LABEL: Record<string, string> = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [quiz, setQuiz] = useState<TakeQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/quizzes/${id}`);
        const json = await res.json();
        if (!active) return;
        if (json.success) setQuiz(json.data.quiz);
        else toast.error(json.error || "Quiz introuvable");
      } catch {
        if (active) toast.error("Échec du chargement");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const submit = async () => {
    if (!quiz) return;
    if (Object.keys(answers).length < quiz.questions.length) {
      toast.error("Réponds à toutes les questions avant de valider.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => (answers[q.index] ?? -1));
      const res = await fetch(`/api/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error || "Échec de l'envoi"); return; }
      setResult(json.data);
      // Reflect XP/level gains in the header immediately.
      if (json.data.awardedXp && user) {
        setUser({ ...user, xp: (user.xp || 0) + json.data.awardedXp, level: json.data.newLevel ?? user.level });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => { setResult(null); setAnswers({}); };

  if (loading) {
    return <div className="max-w-2xl space-y-4"><Skeleton className="h-10 w-1/2 rounded-xl" />{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
  }
  if (!quiz) {
    return <div className="max-w-2xl text-center py-16 text-[hsl(var(--muted-foreground))]">Quiz introuvable.</div>;
  }

  const correctionFor = (index: number) => result?.corrections.find((c) => c.index === index);

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/quizzes")} className="-ml-2">
        <ArrowLeft className="h-4 w-4" /> Tous les quiz
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge variant="purple" className="text-[10px]">{quiz.subject}</Badge>
          <Badge variant="secondary" className="text-[10px]">{quiz.classe}</Badge>
          <Badge variant="warning" className="text-[10px]">{DIFF_LABEL[quiz.difficulty] || quiz.difficulty}</Badge>
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500"><Zap className="h-3 w-3" /> {quiz.xpReward} XP</span>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={cn(
          "rounded-2xl border p-5",
          result.passed ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10" : "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", result.passed ? "bg-emerald-500" : "bg-amber-500")}>
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">{result.score}% — {result.passed ? "Réussi !" : "À retravailler"}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {result.awardedXp > 0
                  ? `+${result.awardedXp} XP gagnés 🎉${result.leveledUp ? ` · Niveau ${result.newLevel} atteint !` : ""}`
                  : result.passed ? "Quiz déjà réussi — pas d'XP supplémentaire." : `Il te faut ${quiz.passingScore}% pour réussir.`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={retry}><RotateCcw className="h-3.5 w-3.5" /> Recommencer</Button>
            <Button variant="gradient" size="sm" onClick={() => router.push("/dashboard/quizzes")}>Autres quiz</Button>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((q, qi) => {
          const corr = correctionFor(q.index);
          return (
            <div key={q.index} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <p className="font-medium mb-3"><span className="text-[hsl(var(--muted-foreground))]">{qi + 1}.</span> {q.text}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.index] === oi;
                  const isCorrect = corr && oi === corr.correctIndex;
                  const isWrongChoice = corr && selected && !corr.correct;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={!!result}
                      onClick={() => setAnswers((a) => ({ ...a, [q.index]: oi }))}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                        !result && selected && "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5",
                        !result && !selected && "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]",
                        isCorrect && "border-emerald-500 bg-emerald-500/10",
                        isWrongChoice && "border-red-500 bg-red-500/10",
                        result && !isCorrect && !isWrongChoice && "border-[hsl(var(--border))] opacity-70"
                      )}
                    >
                      <span className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-[10px]",
                        selected && !result && "gradient-bg border-transparent text-white",
                        isCorrect && "bg-emerald-500 border-transparent text-white",
                        isWrongChoice && "bg-red-500 border-transparent text-white"
                      )}>
                        {isCorrect ? <Check className="h-3 w-3" /> : isWrongChoice ? <X className="h-3 w-3" /> : String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {corr && corr.explanation && (
                <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/40 rounded-lg px-3 py-2">
                  💡 {corr.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!result && (
        <div className="flex justify-end sticky bottom-4">
          <Button variant="gradient" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Valider mes réponses
          </Button>
        </div>
      )}
    </div>
  );
}
