"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, GraduationCap, MapPin, Layers, CalendarDays,
  BookOpen, Award, Zap, Clock, Loader2, UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { STAGES } from "@/lib/tunisia-education";

interface ClassRow {
  _id: string;
  title: string;
  subject: string;
  level: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  confirmedAt: string | null;
}

interface StudentDetail {
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    xp: number;
    level: number;
    badges: string[];
    studentProfile: { stage?: string; year?: string; section?: string; governorate?: string };
    createdAt: string | null;
  };
  classes: ClassRow[];
  tutoring: boolean;
  tutoringSince: string | null;
  enrolledSince: string | null;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const stageLabel = (key?: string) => STAGES.find((s) => s.key === key)?.label || key || "—";

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teacher/students/${id}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Impossible de charger l'élève");
        }
      } catch {
        setError("Impossible de charger l'élève");
        toast.error("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href="/teacher/students" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour aux élèves
        </Link>
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-50">
            <UserX className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{error || "Élève introuvable"}</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Vous ne pouvez voir que les élèves inscrits à vos classes ou en tutorat avec vous.
          </p>
        </div>
      </div>
    );
  }

  const { student, classes, tutoring } = data;
  const sp = student.studentProfile || {};
  const infoRows = [
    { icon: GraduationCap, label: "Niveau", value: stageLabel(sp.stage) },
    { icon: Layers, label: "Année scolaire", value: sp.year || "—" },
    { icon: BookOpen, label: "Branche / option", value: sp.section || "—" },
    { icon: MapPin, label: "Gouvernorat", value: sp.governorate || "—" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/teacher/students" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
        <ArrowLeft className="h-4 w-4" /> Retour aux élèves
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={student.avatar} />
            <AvatarFallback className="gradient-bg text-white text-2xl font-bold">{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5" /> {student.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="success" className="gap-1">🎓 Niveau {student.level}</Badge>
              <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3 text-amber-500" /> {student.xp} XP</Badge>
              {tutoring && <Badge variant="purple">Tutorat</Badge>}
            </div>
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] sm:text-right">
            <p className="flex items-center gap-1.5 sm:justify-end"><Clock className="h-3.5 w-3.5" /> Élève depuis</p>
            <p className="font-medium text-[hsl(var(--foreground))]">{fmtDate(data.enrolledSince)}</p>
          </div>
        </div>

        {student.bio && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-4 pt-4 border-t border-[hsl(var(--border))]">{student.bio}</p>
        )}
      </div>

      {/* Schooling info */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[hsl(var(--primary))]" /> Scolarité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoRows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                <p className="text-sm font-medium truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {student.badges.length > 0 && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-purple-500" /> Badges</h2>
          <div className="flex flex-wrap gap-2">
            {student.badges.map((b) => (
              <div key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500">
                <Award className="h-3.5 w-3.5" /> {b}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes with this teacher */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[hsl(var(--primary))]" /> Mes classes avec cet élève
          <Badge variant="secondary" className="ml-1">{classes.length}</Badge>
        </h2>
        {classes.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {tutoring ? "Cet élève est en tutorat avec vous, sans classe spécifique." : "Aucune classe partagée."}
          </p>
        ) : (
          <div className="space-y-3">
            {classes.map((c) => (
              <div key={c._id} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span>{c.subject} · {c.level}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {fmtDate(c.date)} · {c.startTime}–{c.endTime}</span>
                  </p>
                </div>
                <Badge
                  variant={c.status === "completed" ? "secondary" : c.status === "cancelled" ? "destructive" : "success"}
                  className="shrink-0 capitalize"
                >
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
