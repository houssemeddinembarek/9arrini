"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, Users, CheckCircle2, Clock, Loader2, GraduationCap,
  Building2, BookOpen, CalendarDays, UsersRound, ArrowRight, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

interface Teacher {
  _id: string;
  name: string;
  avatar?: string;
  headline: string;
  institution: string;
  subjects: string[];
  levels: string[];
  experienceYears: number;
  price: number;
  availability: { day: string; from?: string; to?: string }[];
  rating: number;
  courses: number;
  students: number;
}

interface GroupRow {
  _id: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  color: string;
  studentCount: number;
  myStatus: "pending" | "accepted" | "rejected" | null;
}

// Ring colour per group, matching the palette used in the teacher's own tools.
const COLOR_RING: Record<string, string> = {
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
};

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reserving, setReserving] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/teachers/${id}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.success) {
          setTeacher(j.data.teacher);
          setGroups(j.data.groups);
        } else {
          setError(j.error || "Professeur introuvable");
        }
      })
      .catch(() => setError("Professeur introuvable"))
      .finally(() => setLoading(false));
  }, [id]);

  // Reserve a place in one group. Visitors are sent to sign in first and come
  // back to this page.
  const reserve = async (groupId: string) => {
    if (!user) { router.push(`/login?from=/tutoring/${id}`); return; }
    if (user.role !== "student") { toast.error("Seuls les élèves peuvent réserver."); return; }

    setReserving(groupId);
    try {
      const res = await fetch("/api/tutoring/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: id, groupId }),
      });
      const json = await res.json();
      if (res.status === 401) { router.push(`/login?from=/tutoring/${id}`); return; }
      if (!res.ok || !json.success) throw new Error(json.error);
      setGroups((gs) => gs.map((g) => (g._id === groupId ? { ...g, myStatus: json.data?.status || "pending" } : g)));
      toast.success("Demande envoyée au professeur");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Échec de la réservation");
    } finally {
      setReserving(null);
    }
  };

  if (loading) {
    return (
      <main className="pt-16">
        <div className="flex items-center justify-center py-32 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  if (error || !teacher) {
    return (
      <main className="pt-16">
        <div className="max-w-md mx-auto my-20 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 sm:p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{error}</p>
          <Link href="/tutoring"><Button variant="outline"><ArrowLeft className="h-4 w-4" /> Tous les professeurs</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16">
      {/* Teacher header */}
      <div className="bg-gradient-to-b from-[hsl(var(--muted))]/50 to-transparent border-b border-[hsl(var(--border))]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link
            href="/tutoring"
            className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Tous les professeurs
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 ring-4 ring-[hsl(var(--background))] shadow-lg">
              <AvatarImage src={teacher.avatar} alt={teacher.name} />
              <AvatarFallback className="gradient-bg text-white text-2xl font-bold">
                {getInitials(teacher.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{teacher.name}</h1>
                <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
              </div>
              {teacher.headline && (
                <p className="text-[hsl(var(--muted-foreground))] mt-1">{teacher.headline}</p>
              )}
              {teacher.institution && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mt-1">
                  <Building2 className="h-3.5 w-3.5" /> {teacher.institution}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{teacher.rating > 0 ? teacher.rating.toFixed(1) : "—"}</span>
                </span>
                <span className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                  <Users className="h-4 w-4" /> {teacher.students} élèves
                </span>
                <span className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                  <UsersRound className="h-4 w-4" /> {groups.length} groupe{groups.length === 1 ? "" : "s"}
                </span>
                {teacher.experienceYears > 0 && (
                  <span className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                    <GraduationCap className="h-4 w-4" /> {teacher.experienceYears} ans d&apos;expérience
                  </span>
                )}
                {teacher.price > 0 && (
                  <span className="font-semibold">{teacher.price} DT<span className="text-[hsl(var(--muted-foreground))] font-normal text-xs"> / séance</span></span>
                )}
              </div>

              {teacher.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {teacher.subjects.map((s) => (
                    <Badge key={s} variant="purple">{s}</Badge>
                  ))}
                  {teacher.levels.map((l) => (
                    <Badge key={l} variant="secondary">{l}</Badge>
                  ))}
                </div>
              )}

              {teacher.availability.length > 0 && (
                <p className="flex items-start gap-1.5 text-xs text-[hsl(var(--muted-foreground))] mt-3">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 mt-px" />
                  <span>
                    Disponible : {teacher.availability.map((a) => a.day).join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-[hsl(var(--primary))]" /> Groupes disponibles
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Choisis le groupe qui correspond à ta classe, puis réserve ta place. Le professeur
            confirme ton inscription.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--border))] p-12 text-center">
            <UsersRound className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/40" />
            <p className="font-medium">Aucun groupe pour le moment</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Ce professeur n&apos;a pas encore ouvert de groupe. Reviens bientôt.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => (
              <div
                key={g._id}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 flex flex-col hover:shadow-lg hover:border-[hsl(var(--primary))]/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0",
                    COLOR_RING[g.color] || COLOR_RING.purple,
                  )}>
                    <UsersRound className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{g.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {g.level && <Badge variant="purple" className="text-[10px]">{g.level}</Badge>}
                      {g.subject && <Badge variant="secondary" className="text-[10px]">{g.subject}</Badge>}
                    </div>
                  </div>
                </div>

                {g.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-3 line-clamp-2">{g.description}</p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-[hsl(var(--border))]">
                  <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Users className="h-3.5 w-3.5" />
                    {g.studentCount} élève{g.studentCount === 1 ? "" : "s"} inscrit{g.studentCount === 1 ? "" : "s"}
                  </span>

                  {g.myStatus === "accepted" ? (
                    <Link href="/dashboard/tutoring" className="shrink-0">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Inscrit
                      </Button>
                    </Link>
                  ) : g.myStatus === "pending" ? (
                    <Button variant="outline" size="sm" disabled className="w-full sm:w-auto shrink-0">
                      <Clock className="h-3.5 w-3.5" /> En attente
                    </Button>
                  ) : (
                    <Button
                      variant="gradient"
                      size="sm"
                      className="w-full sm:w-auto shrink-0"
                      disabled={reserving === g._id}
                      onClick={() => reserve(g._id)}
                    >
                      {reserving === g._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>Réserver ma place <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                      )}
                    </Button>
                  )}
                </div>

                {g.myStatus === "rejected" && (
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
                    Demande précédente refusée — tu peux redemander.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {teacher.courses > 0 && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-8 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Ce professeur publie aussi {teacher.courses} cours —{" "}
            <Link href="/courses" className="text-[hsl(var(--primary))] hover:underline">voir le catalogue</Link>
          </p>
        )}
      </div>
    </main>
  );
}
