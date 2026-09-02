"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function FinalCTA() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.finalCta;

  return (
    <section className="section">
      <div className="container-page">
        {/* One dark panel closes the page: maximum contrast against everything
            above it, so the last thing on screen is the decision. */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[hsl(233_30%_11%)] px-6 py-16 text-center sm:px-12 sm:py-20 dark:bg-[hsl(233_24%_9%)]">
          <div
            className="absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage:
                "radial-gradient(48rem 24rem at 50% 0%, hsl(var(--primary) / 0.45), transparent 65%)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(to bottom, #000, transparent 70%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 70%)",
            }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.09em] text-white/60">
              {t.badge}
            </p>
            <h2 className="headline mt-4 text-white">
              {t.titleBefore} Telmidhi {t.titleAfter}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
              {t.subtitle}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="xl"
                className="w-full bg-white text-[hsl(233_30%_11%)] shadow-none hover:bg-white/90 sm:w-auto"
                onClick={() => router.push("/register?role=student")}
              >
                {t.ctaStudent}
                <ArrowRight className="rtl:rotate-180" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="w-full border-white/25 bg-white/5 text-white shadow-none hover:border-white/40 hover:bg-white/10 hover:text-white sm:w-auto"
                onClick={() => router.push("/register?role=teacher")}
              >
                {t.ctaTeacher}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
