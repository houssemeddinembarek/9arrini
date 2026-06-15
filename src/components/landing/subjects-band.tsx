"use client";

import { useI18n } from "@/lib/i18n/context";

// Full-width, infinitely scrolling band of subjects/levels — adds motion and
// signals "there's something here for me" to collège/lycée students.
export function SubjectsBand() {
  const { dict } = useI18n();
  const ITEMS = dict.subjectsBand.items;

  return (
    <section className="relative py-6 border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 overflow-hidden">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[hsl(var(--background))] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[hsl(var(--background))] to-transparent" />

      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex items-center gap-3 pr-3" aria-hidden={copy === 1}>
            {ITEMS.map((item) => (
              <li
                key={`${copy}-${item}`}
                className="whitespace-nowrap rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2 text-sm font-medium shadow-sm"
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
