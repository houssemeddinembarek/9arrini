"use client";

import { Check, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

// Presentational + routing config (price, style, audience role); name, period,
// description, features, cta and badge are translated and resolved by index.
const PLANS = [
  { price: 0, variant: "outline" as const, highlight: false, role: "student" as const },
  { price: 30, variant: "gradient" as const, highlight: true, role: "student" as const },
  { price: 50, variant: "outline" as const, highlight: false, role: "teacher" as const },
];

export function Pricing() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.pricing;

  return (
    <section className="py-24" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            {t.badge}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.titleBefore} <span className="gradient-text">{t.titleHighlight}</span>
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan, idx) => {
            const p = t.plans[idx];
            return (
            <div
              key={idx}
              className={cn(
                "relative p-8 rounded-2xl border transition-all duration-300",
                plan.highlight
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-2xl shadow-[hsl(var(--primary))]/20 scale-105"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/30 hover:shadow-lg"
              )}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="gradient-bg text-white px-4 py-1 shadow-lg">
                    {p.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] font-medium">
                    {plan.role === "teacher" ? t.audiences.teachers : t.audiences.students}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? t.freeLabel : `${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[hsl(var(--muted-foreground))] text-sm">{p.period}</span>
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{p.description}</p>
              </div>

              <Button
                variant={plan.variant}
                className={cn("w-full mb-8", plan.highlight && "shadow-lg shadow-[hsl(var(--primary))]/30")}
                onClick={() =>
                  router.push(plan.role === "teacher" ? "/register?role=teacher" : "/register?role=student")
                }
              >
                {p.cta}
              </Button>

              <ul className="space-y-3">
                {p.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-[hsl(var(--muted-foreground))]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
