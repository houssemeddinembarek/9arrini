"use client";

import { Search, UsersRound, Video, Brain } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

// Presentational config only — every string comes from the dictionary by index.
const STEPS = [Search, UsersRound, Video, Brain];

export function HowItWorks() {
  const { dict } = useI18n();
  const t = dict.howItWorks;

  return (
    <section className="section">
      <div className="container-page">
        <header className="max-w-2xl">
          <p className="eyebrow">{t.badge}</p>
          <h2 className="headline mt-4">
            {t.titleBefore} <span className="accent-word">{t.titleHighlight}</span>
          </h2>
          <p className="lead mt-4">{t.subtitle}</p>
        </header>

        {/* A single hairline runs behind the row so the four steps read as one
            journey rather than four unrelated cards. */}
        <ol className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span
            className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
            aria-hidden
          />
          {STEPS.map((Icon, idx) => {
            const step = t.steps[idx];
            return (
              <li key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-[var(--shadow-xs)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
