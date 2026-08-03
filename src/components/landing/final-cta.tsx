"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function FinalCTA() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.finalCta;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          {t.badge}
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          {t.titleBefore}{" "}
          <span className="gradient-text">Telmidhi</span>
          <br />
          {t.titleAfter}
        </h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10">
          {t.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="xl"
            variant="gradient"
            className="w-full sm:w-auto shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50"
            onClick={() => router.push("/register")}
          >
            {t.ctaStudent}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="xl"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/register?role=teacher")}
          >
            {t.ctaTeacher}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
