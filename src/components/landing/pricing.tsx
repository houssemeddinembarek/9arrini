"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

// Presentational + routing config (price, emphasis, audience role); name,
// period, description, features, cta and badge are translated by index.
const PLANS = [
  { price: 0, highlight: false, role: "student" as const },
  { price: 30, highlight: true, role: "student" as const },
  { price: 50, highlight: false, role: "teacher" as const },
];

export function Pricing() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.pricing;

  return (
    <section className="section border-y border-border bg-surface" id="pricing">
      <div className="container-page">
        <header className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center before:hidden">{t.badge}</p>
          <h2 className="headline mt-3">
            {t.titleBefore} <span className="accent-word">{t.titleHighlight}</span>
          </h2>
          <p className="lead mt-4">{t.subtitle}</p>
        </header>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
          {PLANS.map((plan, idx) => {
            const p = t.plans[idx];
            return (
              <div
                key={p.name}
                className={cn(
                  "flex flex-col rounded-2xl border p-7",
                  plan.highlight
                    ? "border-primary bg-card shadow-[var(--shadow-lg)] ring-1 ring-primary"
                    : "border-border bg-card shadow-[var(--shadow-xs)]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{p.name}</h3>
                  {p.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        plan.highlight
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {p.badge}
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {plan.role === "teacher" ? t.audiences.teachers : t.audiences.students}
                    </span>
                  )}
                </div>

                <p className="mt-2 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight tabular-nums">
                    {plan.price === 0 ? t.freeLabel : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  )}
                </p>

                <Button
                  size="lg"
                  variant={plan.highlight ? "default" : "outline"}
                  className="mt-6 w-full"
                  onClick={() => router.push(`/register?role=${plan.role}`)}
                >
                  {p.cta}
                </Button>

                <ul className="mt-7 space-y-3 border-t border-border pt-6">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        strokeWidth={2.5}
                      />
                      <span className="text-foreground/85">{feature}</span>
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
