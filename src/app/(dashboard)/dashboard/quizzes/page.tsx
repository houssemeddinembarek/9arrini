"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileQuestion, Zap, ArrowRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBJECTS } from "@/lib/tunisia-education";

interface QuizItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  classe: string;
  difficulty: string;
  xpReward: number;
  questionCount: number;
}

const DIFF_LABEL: Record<string, string> = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };

function difficultyBadge(d: string) {
  const variant = d === "facile" ? "success" : d === "difficile" ? "destructive" : "warning";
  return <Badge variant={variant as "success" | "destructive" | "warning"}>{DIFF_LABEL[d] || d}</Badge>;
}

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (subject !== "all") params.set("subject", subject);
        const res = await fetch(`/api/quizzes?${params.toString()}`);
        const json = await res.json();
        if (!active) return;
        if (json.success) setQuizzes(json.data.quizzes);
        else toast.error(json.error || "Échec du chargement");
      } catch {
        if (active) toast.error("Échec du chargement");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [subject]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quiz</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Teste tes connaissances et gagne de l&apos;XP pour monter de niveau.
          </p>
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les matières</SelectItem>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
            <FileQuestion className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="font-medium">Aucun quiz disponible</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Reviens bientôt, tes professeurs en ajoutent régulièrement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div key={q.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
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
                  <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500"><Zap className="h-3 w-3" /> {q.xpReward} XP</span>
                </div>
              </div>
              <Link href={`/dashboard/quizzes/${q.id}`} className="shrink-0">
                <Button variant="gradient" size="sm">Commencer <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
