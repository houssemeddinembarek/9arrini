"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, Users, Sparkles, Star, Trophy, Zap, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";

type SubjectKey = "maths" | "physics" | "chemistry" | "biology" | "cs" | "english" | "french";
type StatKey = "students" | "teachers" | "groups" | "rating";

const SUBJECTS: { emoji: string; key: SubjectKey }[] = [
  { emoji: "🧮", key: "maths" },
  { emoji: "⚛️", key: "physics" },
  { emoji: "🧪", key: "chemistry" },
  { emoji: "🧬", key: "biology" },
  { emoji: "💻", key: "cs" },
  { emoji: "🇬🇧", key: "english" },
  { emoji: "✍️", key: "french" },
];

const STATS: { value: string; key: StatKey }[] = [
  { value: "500+", key: "students" },
  { value: "80+", key: "teachers" },
  { value: "120+", key: "groups" },
  { value: "4.9★", key: "rating" },
];

// Avatars for the mock live-class card.
const GROUP = [
  { letter: "A", hue: 270 },
  { letter: "M", hue: 320 },
  { letter: "S", hue: 200 },
  { letter: "Y", hue: 160 },
  { letter: "I", hue: 30 },
];

export function Hero() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.hero;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Real-classroom photo, kept soft so the copy stays readable */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Image
          src="/decoration/hero-classroom.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-25 dark:opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background))]/70 via-[hsl(var(--background))]/85 to-[hsl(var(--background))]" />
      </div>

      <div className="absolute top-10 -left-10 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-blue-500/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: "6s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* ── Left: copy ── */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6">
              <Badge
                variant="purple"
                className="px-4 py-2 text-sm font-semibold rounded-full border border-purple-200 dark:border-purple-800 cursor-pointer hover:scale-105 transition-transform"
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                {t.badge}
              </Badge>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.2rem] font-extrabold tracking-tight mb-6 leading-[1.05]">
              {t.titleBefore}{" "}
              <span className="gradient-text animate-gradient-x bg-[linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4,#ec4899)]">
                {t.titleHighlight}
              </span>{" "}
              🚀
            </h1>

            <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              {t.subtitlePre} <span className="font-semibold text-[hsl(var(--foreground))]">{t.subtitleGroup}</span> {t.subtitleMid}
              <span className="font-semibold text-[hsl(var(--foreground))]"> {t.subtitleAI}</span>{t.subtitlePost}
            </p>

            {/* Subject chips */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
              {SUBJECTS.map((s) => (
                <span
                  key={s.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:scale-105 hover:border-purple-300 transition-all cursor-default"
                >
                  <span className="text-base">{s.emoji}</span>
                  {t.subjects[s.key]}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
              <Button
                size="xl"
                variant="gradient"
                className="w-full sm:w-auto shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all"
                onClick={() => router.push("/register?role=student")}
              >
                <GraduationCap className="h-5 w-5" />
                {t.ctaStudent}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="w-full sm:w-auto hover:-translate-y-0.5 transition-all"
                onClick={() => router.push("/register?role=teacher")}
              >
                <Users className="h-5 w-5" />
                {t.ctaTeacher}
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <div className="flex -space-x-2">
                {GROUP.map((g, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[hsl(var(--background))] flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `hsl(${g.hue}, 70%, 55%)`, zIndex: 5 - i }}
                  >
                    {g.letter}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">{t.socialProofStrong}</strong> {t.socialProofRest}
              </span>
            </div>
          </div>

          {/* ── Right: live class visual ── */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Floating reward cards */}
            <div className="absolute -top-5 -left-3 sm:-left-6 z-20 animate-float-slow">
              <div className="flex items-center gap-2 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl px-3 py-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold">+50 XP</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Quiz réussi</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-2 sm:-right-6 z-20 animate-float-slow" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center gap-2 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl px-3 py-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-purple-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold">Badge débloqué</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Série de 7 jours 🔥</p>
                </div>
              </div>
            </div>

            {/* Main live-class card */}
            <div className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl p-5 sm:p-6 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-24 gradient-bg opacity-90" />
              <div className="relative">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-500 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> EN DIRECT
                      </span>
                      <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">Bac · Maths</span>
                    </div>
                    <h3 className="text-lg font-bold mt-2">Fonctions & limites</h3>
                  </div>
                </div>

                {/* Participant grid */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {/* Teacher tile */}
                  <div className="col-span-1 row-span-2 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex flex-col items-center justify-center p-3 text-white aspect-[3/4]">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold mb-1">PR</div>
                    <p className="text-xs font-semibold">Prof Karim</p>
                    <span className="text-[9px] bg-white/25 px-1.5 py-0.5 rounded-full mt-1">🎙️ Prof</span>
                  </div>
                  {GROUP.slice(0, 4).map((g, i) => (
                    <div
                      key={i}
                      className="rounded-2xl flex items-center justify-center aspect-square text-white text-lg font-bold"
                      style={{ background: `hsl(${g.hue}, 65%, 55%)` }}
                    >
                      {g.letter}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Users className="h-3.5 w-3.5" /> Groupe de 6 · 18:00–20:00
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
                    <Flame className="h-3.5 w-3.5" /> Série 7j
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mt-16">
          {STATS.map(({ value, key }) => (
            <div
              key={key}
              className="glass rounded-2xl p-4 text-center hover:scale-105 transition-transform cursor-default"
            >
              <div className="text-2xl sm:text-3xl font-extrabold gradient-text">{value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{t.stats[key]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
