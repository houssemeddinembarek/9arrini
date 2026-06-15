"use client";

import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    <section className="py-24 bg-[hsl(var(--muted))]/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Quote className="h-4 w-4" />
            {tr.badge}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {tr.titleBefore} <span className="gradient-text">{tr.titleHighlight}</span>
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            {tr.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Badge variant={t.type === "teacher" ? "success" : "purple"} className="text-[10px]">
                  {t.type === "teacher" ? tr.teacherTag : tr.studentTag}
                </Badge>
              </div>

              <Quote className="h-6 w-6 text-[hsl(var(--primary))]/30 mb-3" />

              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed flex-1 mb-4">
                &ldquo;{tr.list[idx].content}&rdquo;
              </p>

              <div className="text-xs text-[hsl(var(--primary))] font-medium mb-4 flex items-center gap-1">
                📚 {tr.list[idx].subject}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.avatar} alt={t.name} />
                  <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                    {getInitials(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{tr.list[idx].role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
