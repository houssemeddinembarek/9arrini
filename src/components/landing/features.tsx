"use client";

import {
  UsersRound, Video, Brain, FileText, Calendar, Bell,
  Sparkles, MapPin, BookOpenCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

// Icon only — the palette is the brand hue at three opacities, so nine cards
// read as one family instead of nine competing gradients.
const FEATURES = [
  UsersRound, Video, Brain, FileText, Calendar, Bell, BookOpenCheck, Sparkles, MapPin,
];

export function Features() {
  const { dict } = useI18n();
  const t = dict.features;

  return (
    <section className="section border-y border-border bg-surface">
      <div className="container-page">
        <header className="max-w-2xl">
          <p className="eyebrow">{t.badge}</p>
          <h2 className="headline mt-4">
            {t.titleBefore} <span className="accent-word">{t.titleHighlight}</span>
          </h2>
          <p className="lead mt-4">{t.subtitle}</p>
        </header>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((Icon, idx) => {
            const f = t.items[idx];
            return (
              <article
                key={f.title}
                className="group bg-card p-6 transition-colors duration-200 hover:bg-primary-soft/60 sm:p-7"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
