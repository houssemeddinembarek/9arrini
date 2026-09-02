"use client";

import { ArrowRight, Check, GraduationCap, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function ForTeachersAndStudents() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.forTeachers;

  const panels = [
    {
      key: "student" as const,
      icon: GraduationCap,
      copy: t.student,
      href: "/register?role=student",
      variant: "primary" as const,
    },
    {
      key: "teacher" as const,
      icon: Users,
      copy: t.teacher,
      href: "/register?role=teacher",
      variant: "neutral" as const,
    },
  ];

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

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {panels.map(({ key, icon: Icon, copy, href, variant }) => {
            const isPrimary = variant === "primary";
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col rounded-2xl border p-7 sm:p-9",
                  isPrimary
                    ? "border-primary/25 bg-primary-soft"
                    : "border-border bg-card shadow-[var(--shadow-xs)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      isPrimary
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {copy.label}
                  </p>
                </div>

                <h3 className="mt-6 text-2xl font-bold tracking-tight">{copy.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {copy.intro}
                </p>

                <ul className="mt-7 space-y-3">
                  {copy.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          isPrimary
                            ? "bg-primary text-primary-foreground"
                            : "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]"
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/85">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {"newLabel" in copy && (
                  <p className="mt-7 flex items-start gap-2.5 rounded-xl border border-border bg-warm-soft p-3.5 text-xs leading-relaxed">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--brand-warm))]" />
                    <span>
                      <strong className="font-semibold">{copy.newLabel}</strong> {copy.newText}
                    </span>
                  </p>
                )}

                <Button
                  size="lg"
                  variant={isPrimary ? "default" : "outline"}
                  className="mt-8 w-full sm:w-fit"
                  onClick={() => router.push(href)}
                >
                  {copy.cta}
                  <ArrowRight className="rtl:rotate-180" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
