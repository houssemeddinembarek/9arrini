"use client";

import { useEffect, useState } from "react";
import { Star, Users, BookOpen, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            {t.badge}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.titleBefore} <span className="gradient-text">{t.titleHighlight}</span>
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
            : teachers.map((teacher) => (
                <div
                  key={teacher._id}
                  className="group p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center hover:shadow-xl hover:border-[hsl(var(--primary))]/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(`/tutoring`)}
                >
                  <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-[hsl(var(--border))] group-hover:ring-[hsl(var(--primary))]/30 transition-all">
                    <AvatarImage src={teacher.avatar} alt={teacher.name} />
                    <AvatarFallback className="gradient-bg text-white text-xl font-bold">
                      {getInitials(teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg mb-1">{teacher.name}</h3>
                  {teacher.specialty && <Badge variant="purple" className="mb-1">{teacher.specialty}</Badge>}
                  {teacher.level && <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{teacher.level}</p>}
                  {teacher.bio && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-3 mb-4">
                      {teacher.bio}
                    </p>
                  )}
                  <div className="flex items-center justify-around text-sm border-t border-[hsl(var(--border))] pt-4 mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-semibold">{teacher.rating > 0 ? teacher.rating.toFixed(1) : "—"}</span>
                      </div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.labels.rating}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-semibold">{teacher.students}</span>
                      </div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.labels.students}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-green-500" />
                        <span className="font-semibold">{teacher.groups}</span>
                      </div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.labels.groups}</span>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/tutoring")}>
            {t.viewAll} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
