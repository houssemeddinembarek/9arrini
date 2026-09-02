"use client";

import { useI18n } from "@/lib/i18n/context";

// A single, slow marquee of subjects and levels. Deliberately quiet: hairline
// pills, muted text, generous edge fades — it reads as a caption strip under
// the hero, not as a second headline.
export function SubjectsBand() {
  const { dict } = useI18n();
  const ITEMS = dict.subjectsBand.items;

  return (
    <section className="relative overflow-hidden border-y border-border bg-surface py-5">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-20 bg-gradient-to-r from-surface to-transparent rtl:bg-gradient-to-l sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-20 bg-gradient-to-l from-surface to-transparent rtl:bg-gradient-to-r sm:w-32" />

      <div className="flex w-max animate-marquee" dir="ltr">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex items-center gap-2.5 pe-2.5" aria-hidden={copy === 1}>
            {ITEMS.map((item) => (
              <li
                key={`${copy}-${item}`}
                className="whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
