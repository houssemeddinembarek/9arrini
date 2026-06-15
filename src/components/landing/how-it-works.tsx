"use client";

import Image from "next/image";
import { Search, UsersRound, Video, Brain, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

// Presentational config (number, icon, color) — text comes from the dictionary
// by index.
const STEPS = [
  { number: "01", icon: Search, color: "from-purple-500 to-violet-600" },
  { number: "02", icon: UsersRound, color: "from-blue-500 to-cyan-500" },
  { number: "03", icon: Video, color: "from-green-500 to-emerald-500" },
  { number: "04", icon: Brain, color: "from-orange-500 to-amber-500" },
];

export function HowItWorks() {
  const { dict } = useI18n();
  const t = dict.howItWorks;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.06)_0%,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <ArrowRight className="h-4 w-4" />
            {t.badge}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.titleBefore}{" "}
            <span className="gradient-text">{t.titleHighlight}</span>
          </h2>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ number, icon: Icon, color }, idx) => (
            <div key={number} className="relative">
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-3 z-0">
                  <ArrowRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]/30" />
                </div>
              )}
              <div className="relative h-full p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-[hsl(var(--muted-foreground))]/20">
                    {number}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{t.steps[idx].title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {t.steps[idx].description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Real classroom — students taking part */}
        <div className="relative mt-14 rounded-3xl overflow-hidden border border-[hsl(var(--border))] shadow-xl">
          <Image
            src="/decoration/classroom-hands.jpeg"
            alt="Des élèves lèvent la main pendant un cours"
            width={1680}
            height={520}
            className="w-full h-48 sm:h-64 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <p className="absolute bottom-4 left-6 right-6 text-white text-lg sm:text-xl font-semibold drop-shadow">
            {t.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
