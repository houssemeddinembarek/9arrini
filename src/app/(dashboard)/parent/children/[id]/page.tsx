"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertTriangle, BookOpen, ClipboardList, Trophy,
  Video, PlayCircle, CalendarDays, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";

interface Report {
  child: { _id: string; name: string; avatar?: string; xp?: number; level?: number; studentProfile?: { stage?: string; year?: string } };
  summary: {
    quizzes: { attempted: number; passed: number; avgBest: number };
    assignments: { total: number; corrected: number; pending: number };
    courses: number;
  };
  courses: { title: string; slug: string; progress: number; completedAt: string | null }[];
  quizzes: { title: string; subject: string; bestScore: number; passed: boolean; attempts: number }[];
  assignments: { title: string; dueDate: string; status: string }[];
  upcomingMeetings: { _id: string; title: string; date: string; startTime: string }[];
  replays: { _id: string; title: string; date: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  corrected: "Corrigé", submitted: "Rendu", pending: "En attente", "à faire": "À faire",
};

function Tile({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs">{icon}{label}</div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">{icon}{title}</h2>
      {children}
    </div>
  );
}

export default function ChildReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/parent/children/${id}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.success) setReport(j.data);
        else setError(j.error || "Rapport indisponible");
      })
      .catch(() => setError("Rapport indisponible"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (error || !report) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{error}</p>
        <Link href="/parent"><Button variant="outline"><ArrowLeft className="h-4 w-4" /> Retour</Button></Link>
      </div>
    );
  }

  const { child, summary } = report;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
        <ArrowLeft className="h-4 w-4" /> Mes enfants
      </Link>

      {/* Child header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={child.avatar} alt="" />
          <AvatarFallback className="text-xl font-semibold">{getInitials(child.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{child.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="success">Niveau {child.level ?? 1}</Badge>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{child.xp ?? 0} XP</span>
            {child.studentProfile?.year && <Badge variant="secondary" className="text-[10px]">{child.studentProfile.year}</Badge>}
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile icon={<BookOpen className="h-3.5 w-3.5" />} value={summary.courses} label="Cours" />
        <Tile icon={<Trophy className="h-3.5 w-3.5" />} value={`${summary.quizzes.passed}/${summary.quizzes.attempted}`} label="Quiz réussis" />
        <Tile icon={<GraduationCap className="h-3.5 w-3.5" />} value={`${summary.quizzes.avgBest}%`} label="Score moyen" />
        <Tile icon={<ClipboardList className="h-3.5 w-3.5" />} value={summary.assignments.pending} label="À faire" />
      </div>

      {/* Courses */}
      <Section title="Cours & progression" icon={<BookOpen className="h-5 w-5 text-[hsl(var(--primary))]" />}>
        {report.courses.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucun cours suivi.</p>
        ) : (
          <div className="space-y-2">
            {report.courses.map((c, i) => (
              <div key={i} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">{c.progress}%</span>
                </div>
                <Progress value={c.progress} className="h-1.5 mt-2" />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Quizzes */}
      <Section title="Quiz" icon={<Trophy className="h-5 w-5 text-[hsl(var(--primary))]" />}>
        {report.quizzes.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucun quiz tenté.</p>
        ) : (
          <div className="space-y-2">
            {report.quizzes.map((q, i) => (
              <div key={i} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{q.title}</p>
                  {q.subject && <p className="text-xs text-[hsl(var(--muted-foreground))]">{q.subject}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold">{q.bestScore}%</span>
                  <Badge variant={q.passed ? "success" : "secondary"} className="text-[10px]">{q.passed ? "Réussi" : "À revoir"}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Assignments */}
      <Section title="Travail à faire" icon={<ClipboardList className="h-5 w-5 text-[hsl(var(--primary))]" />}>
        {report.assignments.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucun devoir assigné.</p>
        ) : (
          <div className="space-y-2">
            {report.assignments.map((a, i) => (
              <div key={i} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(a.dueDate)}</p>
                </div>
                <Badge variant={a.status === "corrected" ? "success" : a.status === "submitted" ? "blue" : "secondary"} className="text-[10px] shrink-0">
                  {STATUS_LABEL[a.status] || a.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Meetings */}
      <Section title="Réunions" icon={<Video className="h-5 w-5 text-[hsl(var(--primary))]" />}>
        {report.upcomingMeetings.length === 0 && report.replays.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucune réunion.</p>
        ) : (
          <div className="space-y-2">
            {report.upcomingMeetings.map((m) => (
              <div key={m._id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(m.date)} · {m.startTime}</p>
                </div>
                <Badge variant="blue" className="text-[10px] shrink-0">À venir</Badge>
              </div>
            ))}
            {report.replays.map((m) => (
              <div key={`r-${m._id}`} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(m.date)}</p>
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 shrink-0"><PlayCircle className="h-3.5 w-3.5" /> Enregistrement</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
