"use client";

import {
  UsersRound, Video, Brain, FileText, Calendar, Bell,
  Sparkles, MapPin, BookOpenCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

// Presentational config (icon, color) — title/description come from the
// dictionary by index.
const FEATURES = [
  { icon: UsersRound, color: "from-purple-500 to-violet-600" },
  { icon: Video, color: "from-blue-500 to-cyan-500" },
  { icon: Brain, color: "from-pink-500 to-rose-500" },
  { icon: FileText, color: "from-orange-500 to-amber-500" },
  { icon: Calendar, color: "from-green-500 to-emerald-500" },
  { icon: Bell, color: "from-yellow-500 to-orange-500" },
  { icon: BookOpenCheck, color: "from-teal-500 to-cyan-600" },
  { icon: Sparkles, color: "from-indigo-500 to-purple-600" },
  { icon: MapPin, color: "from-red-500 to-pink-600" },
];

export function Features() {
  const { dict } = useI18n();
  const t = dict.features;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.08)_0%,transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            {t.badge}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.titleBefore}
            <br />
            <span className="gradient-text">{t.titleHighlight}</span>
          </h2>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, color }, idx) => (
            <div
              key={idx}
              className="group p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/30 hover:shadow-lg hover:shadow-[hsl(var(--primary))]/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.items[idx].title}</h3>
              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">{t.items[idx].description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
