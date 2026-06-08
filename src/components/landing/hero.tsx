"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, Users, Sparkles, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { value: "500+", label: "Étudiants", icon: Users },
  { value: "80+", label: "Profs experts", icon: GraduationCap },
  { value: "120+", label: "Groupes actifs", icon: BookOpen },
  { value: "4.9", label: "Note moyenne", icon: Star },
];

export function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1)_0%,transparent_70%)]" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Announcement badge */}
        <div className="flex justify-center mb-6">
          <Badge
            variant="purple"
            className="px-4 py-2 text-sm font-medium rounded-full border border-purple-200 dark:border-purple-800 cursor-pointer hover:scale-105 transition-transform"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            🇹🇳 Plateforme tunisienne — Tous niveaux, du primaire au Bac
          </Badge>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          Apprenez en{" "}
          <span className="gradient-text">petit groupe</span>
          <br />
          avec un prof et l&apos;IA
        </h1>

        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-4 leading-relaxed">
          <span className="font-semibold gradient-text">9arrini Academy</span> — la plateforme éducative qui réunit profs experts et IA dans des cours particuliers en groupe via des réunions en ligne.
        </p>

        <p className="text-base text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10">
          Étudiants : trouvez votre groupe et progressez plus vite. Profs : créez vos groupes et demandez vos propres formations.
        </p>

        {/* CTA Buttons - two clear paths */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="xl"
            variant="gradient"
            className="w-full sm:w-auto shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50"
            onClick={() => router.push("/register?role=student")}
          >
            <GraduationCap className="h-5 w-5" />
            Je suis étudiant
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="xl"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/register?role=teacher")}
          >
            <Users className="h-5 w-5" />
            Je suis professeur
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 mb-16 flex-wrap">
          <div className="flex -space-x-2">
            {["A", "M", "S", "Y", "I"].map((letter, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[hsl(var(--background))] flex items-center justify-center text-white text-xs font-bold"
                style={{
                  background: `hsl(${(i * 50 + 260) % 360}, 70%, 55%)`,
                  zIndex: 5 - i,
                }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Plus de <strong className="text-[hsl(var(--foreground))]">500 étudiants</strong> apprennent déjà
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform cursor-default"
            >
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold gradient-text">{value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
