"use client";

import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

// People data (names, avatars, type); role/content/subject are translated and
// resolved from the dictionary by index.
const TESTIMONIALS = [
  { id: "1", name: "Ahmed Gharbi", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80", rating: 5, type: "student" as const },
  { id: "2", name: "Mme Leila Trabelsi", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80", rating: 5, type: "teacher" as const },
  { id: "3", name: "Sara Bouaziz", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80", rating: 5, type: "student" as const },
  { id: "4", name: "Youssef Mansouri", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", rating: 5, type: "student" as const },
  { id: "5", name: "Mr. Karim Mzali", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80", rating: 5, type: "teacher" as const },
  { id: "6", name: "Mariem Chaabane", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80", rating: 5, type: "student" as const },
];

export function Testimonials() {
  const { dict } = useI18n();
  const tr = dict.testimonials;

  return (
    <section className="section">
      <div className="container-page">
        <header className="max-w-2xl">
          <p className="eyebrow">{tr.badge}</p>
          <h2 className="headline mt-4">
            {tr.titleBefore} <span className="accent-word">{tr.titleHighlight}</span>
          </h2>
          <p className="lead mt-4">{tr.subtitle}</p>
        </header>

        {/* Masonry columns keep quotes at their natural length — no padding a
            short quote out to match a long one. */}
        <div className="mt-12 gap-5 sm:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t, idx) => {
            const copy = tr.list[idx];
            const isTeacher = t.type === "teacher";
            return (
              <figure
                key={t.id}
                className="mb-5 break-inside-avoid rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                      />
                    ))}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {copy.subject}
                  </span>
                </div>

                <blockquote className="mt-4 text-[15px] leading-relaxed text-foreground/90">
                  {copy.content}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={t.avatar} alt={t.name} />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(t.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{copy.role}</p>
                  </div>
                  <span
                    className={
                      "ms-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                      (isTeacher
                        ? "bg-warm-soft text-[hsl(26_92%_40%)] dark:text-[hsl(var(--brand-warm))]"
                        : "bg-primary-soft text-primary")
                    }
                  >
                    {isTeacher ? tr.teacherTag : tr.studentTag}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
