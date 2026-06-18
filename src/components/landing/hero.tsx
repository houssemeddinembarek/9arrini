"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, GraduationCap, Star, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type SubjectKey =
  | "maths"
  | "physics"
  | "chemistry"
  | "biology"
  | "cs"
  | "english"
  | "french";
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
        {/* <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background))]/70 via-[hsl(var(--background))]/85 to-[hsl(var(--background))]" /> */}
      </div>

      <div className="absolute top-10 -left-10 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl animate-blob" />
      <div
        className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-blue-500/20 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: "6s" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* ── Left: copy ── */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6">
              <Badge
                variant="purple"
                className="px-4 py-2 text-sm font-semibold rounded-full border border-purple-200 dark:border-purple-800 cursor-pointer hover:scale-105 transition-transform"
              >
                {/* <Sparkles className="h-3.5 w-3.5 mr-2" /> */}
                {t.badge}
              </Badge>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.2rem] font-extrabold tracking-tight mb-6 leading-[1.05] text-right">
              {t.titleBefore}{" "}
              <span className="gradient-text animate-gradient-x bg-[linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4,#ec4899)]">
                {t.titleHighlight}
              </span>{" "}
              
            </h1>

            <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              {t.subtitlePre}{" "}
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {t.subtitleGroup}
              </span>{" "}
              {t.subtitleMid}
              <span className="font-semibold text-[hsl(var(--foreground))]">
                {" "}
                {t.subtitleAI}
              </span>
              {t.subtitlePost}
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
                    style={{
                      background: `hsl(${g.hue}, 70%, 55%)`,
                      zIndex: 5 - i,
                    }}
                  >
                    {g.letter}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                <strong className="text-[hsl(var(--foreground))]">
                  {t.socialProofStrong}
                </strong>{" "}
                {t.socialProofRest}
              </span>
            </div>
          </div>

          {/* ── Right: hero illustration ── */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-xl aspect-square">
            <Image
              src="/decoration/student.png"
              alt="Élèves Telmidhi"
              fill
              priority
              sizes="(max-width: 1024px) 28rem, 36rem"
              className="object-contain"
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mt-16">
          {STATS.map(({ value, key }) => (
            <div
              key={key}
              className="glass rounded-2xl p-4 text-center hover:scale-105 transition-transform cursor-default"
            >
              <div className="text-2xl sm:text-3xl font-extrabold gradient-text">
                {value}
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {t.stats[key]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
