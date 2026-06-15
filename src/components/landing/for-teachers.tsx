"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Users, Calendar, FileText, Sparkles,
  TrendingUp, BookOpen, Brain, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

// Icons for each benefit; the labels come from the dictionary by index.
const STUDENT_ICONS = [Users, Brain, Calendar, BookOpen, TrendingUp];
const TEACHER_ICONS = [Users, Calendar, Sparkles, FileText, GraduationCap];

export function ForTeachersAndStudents() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.forTeachers;

  return (
    <section className="py-24 bg-[hsl(var(--muted))]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            {t.badge}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.titleBefore} <span className="gradient-text">{t.titleHighlight}</span>
          </h2>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* For Students */}
          <div className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl" />

            <div className="relative">
              {/* Happy students photo */}
              <div className="relative -mt-8 -mx-8 mb-6 h-40 overflow-hidden">
                <Image
                  src="/decoration/students-celebrate.jpeg"
                  alt="Des élèves heureux en classe"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--card))] via-[hsl(var(--card))]/20 to-transparent" />
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.student.label}</p>
                  <h3 className="text-2xl font-bold">{t.student.title}</h3>
                </div>
              </div>

              <p className="text-[hsl(var(--muted-foreground))] mb-6">
                {t.student.intro}
              </p>

              <ul className="space-y-3 mb-8">
                {STUDENT_ICONS.map((Icon, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    </div>
                    <span>{t.student.benefits[idx]}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="gradient"
                className="w-full"
                onClick={() => router.push("/register?role=student")}
              >
                {t.student.cta} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* For Teachers */}
          <div className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.teacher.label}</p>
                  <h3 className="text-2xl font-bold">{t.teacher.title}</h3>
                </div>
              </div>

              <p className="text-[hsl(var(--muted-foreground))] mb-6">
                {t.teacher.intro}
              </p>

              <ul className="space-y-3 mb-6">
                {TEACHER_ICONS.map((Icon, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <span>{t.teacher.benefits[idx]}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 mb-6">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    <strong className="text-blue-600 dark:text-blue-400">{t.teacher.newLabel}</strong> {t.teacher.newText}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/register?role=teacher")}
              >
                {t.teacher.cta} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
