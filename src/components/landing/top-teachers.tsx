"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, BookOpen, Star, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

interface Teacher {
  _id: string;
  name: string;
  avatar?: string;
  specialty: string;
  level: string;
  bio: string;
  rating: number;
  students: number;
  groups: number;
}

export function TopTeachers() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.topTeachers;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teachers")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setTeachers(j.data.teachers.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Nothing to show yet (no approved teachers) — hide the section.
  if (!loading && teachers.length === 0) return null;

  return (
    <section className="section border-y border-border bg-surface">
      <div className="container-page">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{t.badge}</p>
            <h2 className="headline mt-4">
              {t.titleBefore} <span className="accent-word">{t.titleHighlight}</span>
            </h2>
            <p className="lead mt-4">{t.subtitle}</p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 self-start sm:self-auto"
            onClick={() => router.push("/tutoring")}
          >
            {t.viewAll}
            <ArrowRight className="rtl:rotate-180" />
          </Button>
        </header>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
            : teachers.map((teacher) => (
                <article
                  key={teacher._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/tutoring/${teacher._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push(`/tutoring/${teacher._id}`);
                  }}
                  className="surface-card is-interactive flex cursor-pointer flex-col p-5 text-start"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar className="h-14 w-14 shrink-0 ring-1 ring-border">
                      <AvatarImage src={teacher.avatar} alt={teacher.name} />
                      <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                        {getInitials(teacher.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold leading-snug">
                        <span className="truncate">{teacher.name}</span>
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                      </h3>
                      {teacher.specialty && (
                        <p className="mt-1 truncate text-xs font-medium text-primary">
                          {teacher.specialty}
                        </p>
                      )}
                      {teacher.level && (
                        <p className="truncate text-xs text-muted-foreground">{teacher.level}</p>
                      )}
                    </div>
                  </div>

                  {teacher.bio && (
                    <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {teacher.bio}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-4 border-t border-border pt-4 text-xs">
                    <span className="flex items-center gap-1.5" title={t.labels.rating}>
                      <Star className="h-3.5 w-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                      <span className="font-semibold">
                        {teacher.rating > 0 ? teacher.rating.toFixed(1) : "—"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground" title={t.labels.students}>
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-semibold text-foreground">{teacher.students}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground" title={t.labels.groups}>
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="font-semibold text-foreground">{teacher.groups}</span>
                    </span>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
}
