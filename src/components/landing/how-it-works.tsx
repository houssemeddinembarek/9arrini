"use client";

import { Search, UsersRound, Video, Brain, ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Choisissez votre prof",
    description: "Parcourez les profs vérifiés par matière (Maths, Sciences, Langues...) et niveau (Primaire → Bac).",
    color: "from-purple-500 to-violet-600",
  },
  {
    number: "02",
    icon: UsersRound,
    title: "Rejoignez un groupe privé",
    description: "Intégrez un petit groupe d'étudiants avec votre prof. Cours particuliers en groupe = prix plus accessible.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "03",
    icon: Video,
    title: "Participez aux réunions",
    description: "Sessions vidéo planifiées dans votre calendrier, avec rappels automatiques avant chaque séance.",
    color: "from-green-500 to-emerald-500",
  },
  {
    number: "04",
    icon: Brain,
    title: "Révisez avec Aria, l'IA",
    description: "Posez vos questions 24h/24 à notre assistant IA. Exercices, résumés et fiches générés à la demande.",
    color: "from-orange-500 to-amber-500",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.06)_0%,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <ArrowRight className="h-4 w-4" />
            Comment ça marche
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Apprendre n&apos;a jamais été{" "}
            <span className="gradient-text">aussi simple</span>
          </h2>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            En 4 étapes, vous rejoignez une vraie classe — sans quitter votre maison.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ number, icon: Icon, title, description, color }, idx) => (
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
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
