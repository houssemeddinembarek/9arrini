"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, GraduationCap, Sparkles, Star, Users, Video } from "lucide-react";
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

// Shown inside the floating "pick a subject" card on the hero visual.
const SUBJECTS: { emoji: string; key: SubjectKey }[] = [
  { emoji: "🧮", key: "maths" },
  { emoji: "⚛️", key: "physics" },
  { emoji: "🧪", key: "chemistry" },
  { emoji: "🧬", key: "biology" },
  { emoji: "💻", key: "cs" },
  { emoji: "🇬🇧", key: "english" },
];

const STATS: { value: string; key: StatKey }[] = [
  { value: "500+", key: "students" },
  { value: "80+", key: "teachers" },
  { value: "120+", key: "groups" },
  { value: "4.9", key: "rating" },
];

const GROUP = [
  { letter: "A", hue: 243 },
  { letter: "M", hue: 268 },
  { letter: "S", hue: 200 },
  { letter: "Y", hue: 162 },
  { letter: "I", hue: 26 },
];

export function Hero() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.hero;

  return (
    <section className="relative overflow-hidden pt-28 pb-4 sm:pt-32">
      {/* Backdrop: one soft brand wash + a faint dot grid that fades out.
          No blobs, no glass — the copy carries the page. */}
      <div className="absolute inset-0 -z-10 mesh-gradient" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-dotted bg-fade-b opacity-60" aria-hidden />

      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ── Copy ───────────────────────────────────────────────────── */}
          <div className="reveal text-center lg:col-span-6 lg:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-xs)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t.badge}
            </span>

            <h1 className="display mt-6">
              {t.titleBefore}{" "}
              <span className="underline-sketch accent-word">{t.titleHighlight}</span>
            </h1>

            <p className="lead mx-auto mt-5 max-w-xl lg:mx-0">
              {t.subtitlePre}{" "}
              <strong className="font-semibold text-foreground">{t.subtitleGroup}</strong>{" "}
              {t.subtitleMid}
              <strong className="font-semibold text-foreground"> {t.subtitleAI}</strong>
              {t.subtitlePost}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                size="xl"
                className="w-full sm:w-auto"
                onClick={() => router.push("/register?role=student")}
              >
                <GraduationCap />
                {t.ctaStudent}
                <ArrowRight className="rtl:rotate-180" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.push("/register?role=teacher")}
              >
                <Users />
                {t.ctaTeacher}
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:justify-start">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {GROUP.map((g, i) => (
                  <span
                    key={g.letter}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-background"
                    style={{ background: `hsl(${g.hue} 62% 52%)`, zIndex: GROUP.length - i }}
                  >
                    {g.letter}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                ))}
              </span>
              <span className="text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">{t.socialProofStrong}</strong>{" "}
                {t.socialProofRest}
              </span>
            </div>
          </div>

          {/* ── Visual: a product glimpse, not a floating mascot ────────── */}
          <div className="reveal relative lg:col-span-6" style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            <div className="relative mx-auto aspect-[4/3.4] w-full max-w-lg">
              {/* Panel */}
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-border bg-gradient-to-b from-primary-soft to-card shadow-[var(--shadow-lg)]">
                <Image
                  src="/decoration/student.png"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 32rem"
                  className="object-contain object-bottom p-4"
                />
              </div>

              {/* Live-session proof card */}
              <div className="absolute -start-3 top-8 hidden w-[13.5rem] sm:block rounded-2xl border border-border bg-card/95 p-3.5 shadow-[var(--shadow-lg)] backdrop-blur sm:-start-8">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Video className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{t.subjects.maths}</p>
                    <p className="text-[11px] text-muted-foreground">3–8 {t.stats.students.toLowerCase()}</p>
                  </div>
                  <span className="ms-auto flex items-center gap-1 rounded-full bg-[hsl(var(--success)/0.12)] px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--success))]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
                    Live
                  </span>
                </div>
                <div className="mt-3 flex -space-x-1.5 rtl:space-x-reverse">
                  {GROUP.slice(0, 4).map((g) => (
                    <span
                      key={g.letter}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-card"
                      style={{ background: `hsl(${g.hue} 62% 52%)` }}
                    >
                      {g.letter}
                    </span>
                  ))}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-card">
                    +2
                  </span>
                </div>
              </div>

              {/* Subject picker card */}
              <div className="absolute -end-2 bottom-16 hidden w-[12rem] sm:block rounded-2xl border border-border bg-card/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur sm:-end-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {dict.nav.cours}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECTS.map((s) => (
                    <span
                      key={s.key}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-medium"
                    >
                      <span>{s.emoji}</span>
                      {t.subjects[s.key]}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI chip */}
              <div className="absolute -bottom-2 start-6 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-[var(--shadow-md)] sm:start-10">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--brand-warm))]" />
                <span className="text-xs font-semibold">Aria&nbsp;IA</span>
                <span className="text-[11px] text-muted-foreground">24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat strip: hairline dividers instead of four floating tiles ── */}
        <dl className="mt-16 grid grid-cols-2 divide-border rounded-2xl border border-border bg-card/60 sm:mt-20 sm:grid-cols-4 sm:divide-x sm:rtl:divide-x-reverse">
          {STATS.map(({ value, key }) => (
            <div key={key} className="px-5 py-5 text-center">
              <dt className="sr-only">{t.stats[key]}</dt>
              <dd className="text-2xl font-bold tracking-tight sm:text-3xl">
                {value}
                {key === "rating" && (
                  <Star className="mb-1 ms-1 inline h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                )}
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">{t.stats[key]}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
