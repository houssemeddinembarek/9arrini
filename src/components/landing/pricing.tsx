"use client";

import { Check, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Découverte",
    price: 0,
    period: "gratuit",
    description: "Pour découvrir la plateforme et essayer un premier cours.",
    features: [
      "1 séance d'essai gratuite",
      "Accès à Aria (IA) — 10 questions/jour",
      "Bibliothèque de contenus publics",
      "Calendrier personnel",
    ],
    cta: "Commencer gratuitement",
    variant: "outline" as const,
    highlight: false,
    forWho: "Étudiants",
  },
  {
    name: "Étudiant",
    price: 30,
    period: "DT / mois",
    description: "Tout ce qu'il faut pour réussir, groupes inclus.",
    features: [
      "2 groupes simultanés",
      "8 séances en groupe / mois",
      "Aria IA illimitée",
      "Tous les contenus du prof",
      "Rappels et calendrier complets",
      "Suivi de progression personnalisé",
      "Support prioritaire",
    ],
    cta: "Choisir Étudiant",
    variant: "gradient" as const,
    highlight: true,
    badge: "Le plus populaire",
    forWho: "Étudiants",
  },
  {
    name: "Professeur",
    price: 50,
    period: "DT / mois",
    description: "Pour les profs qui veulent gérer leurs groupes et créer leur contenu.",
    features: [
      "Groupes illimités",
      "Génération IA de contenu (LaTeX)",
      "Bibliothèque de contenu illimitée",
      "Calendrier multi-groupes",
      "Demande de formations continue",
      "Statistiques détaillées",
      "Réceptionnez vos paiements",
    ],
    cta: "Devenir professeur",
    variant: "outline" as const,
    highlight: false,
    badge: "Pour profs",
    forWho: "Professeurs",
  },
];

export function Pricing() {
  const router = useRouter();

  return (
    <section className="py-24" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Tarifs simples
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Un prix par groupe, <span className="gradient-text">pas par cours</span>
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            Commencez gratuitement. Annulez à tout moment. Pas d&apos;engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-8 rounded-2xl border transition-all duration-300",
                plan.highlight
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-2xl shadow-[hsl(var(--primary))]/20 scale-105"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/30 hover:shadow-lg"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="gradient-bg text-white px-4 py-1 shadow-lg">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] font-medium">
                    {plan.forWho}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? "Gratuit" : `${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[hsl(var(--muted-foreground))] text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{plan.description}</p>
              </div>

              <Button
                variant={plan.variant}
                className={cn("w-full mb-8", plan.highlight && "shadow-lg shadow-[hsl(var(--primary))]/30")}
                onClick={() =>
                  router.push(plan.forWho === "Professeurs" ? "/register?role=teacher" : "/register?role=student")
                }
              >
                {plan.cta}
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-[hsl(var(--muted-foreground))]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
