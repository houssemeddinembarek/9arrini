"use client";

import { useRouter } from "next/navigation";
import {
  GraduationCap, Users, Calendar, FileText, Sparkles,
  TrendingUp, BookOpen, Brain, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STUDENT_BENEFITS = [
  { icon: Users, text: "Cours en petits groupes (3–8 élèves)" },
  { icon: Brain, text: "Assistant IA Aria 24h/24" },
  { icon: Calendar, text: "Calendrier et rappels automatiques" },
  { icon: BookOpen, text: "Accès aux résumés et exercices du prof" },
  { icon: TrendingUp, text: "Suivi de progression personnalisé" },
];

const TEACHER_BENEFITS = [
  { icon: Users, text: "Créez et gérez vos groupes d'élèves" },
  { icon: Calendar, text: "Planifiez vos réunions facilement" },
  { icon: Sparkles, text: "Générez du contenu en LaTeX avec l'IA" },
  { icon: FileText, text: "Bibliothèque de contenu illimitée" },
  { icon: GraduationCap, text: "Demandez vos propres formations" },
];

export function ForTeachersAndStudents() {
  const router = useRouter();

  return (
    <section className="py-24 bg-[hsl(var(--muted))]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Pour tous
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Étudiants et profs : <span className="gradient-text">tout le monde gagne</span>
          </h2>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Que vous appreniez ou enseigniez, 9arrini Academy s&apos;adapte à vous.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* For Students */}
          <div className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Pour les étudiants</p>
                  <h3 className="text-2xl font-bold">Apprenez plus vite</h3>
                </div>
              </div>

              <p className="text-[hsl(var(--muted-foreground))] mb-6">
                Rejoignez un groupe avec un prof expert et progressez à votre rythme grâce à l&apos;IA et au support de votre groupe.
              </p>

              <ul className="space-y-3 mb-8">
                {STUDENT_BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="gradient"
                className="w-full"
                onClick={() => router.push("/register?role=student")}
              >
                Commencer à apprendre <ArrowRight className="h-4 w-4" />
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
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Pour les professeurs</p>
                  <h3 className="text-2xl font-bold">Enseignez plus efficacement</h3>
                </div>
              </div>

              <p className="text-[hsl(var(--muted-foreground))] mb-6">
                Créez vos groupes d&apos;élèves, planifiez vos séances et générez votre contenu pédagogique en quelques clics.
              </p>

              <ul className="space-y-3 mb-6">
                {TEACHER_BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 mb-6">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    <strong className="text-blue-600 dark:text-blue-400">Nouveau :</strong> Vous pouvez maintenant demander vos propres formations directement depuis votre tableau de bord prof.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/register?role=teacher")}
              >
                Devenir professeur <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
