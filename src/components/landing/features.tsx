"use client";

import {
  UsersRound, Video, Brain, FileText, Calendar, Bell,
  Sparkles, MapPin, BookOpenCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: UsersRound,
    title: "Groupes privés",
    description: "Cours particuliers en petits groupes (3–8 étudiants). L'attention personnalisée d'un cours privé, le prix d'un cours collectif.",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: Video,
    title: "Réunions en ligne",
    description: "Sessions vidéo planifiées avec votre groupe. Connexion en un clic depuis votre calendrier 9arrini.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Aria, votre assistante IA",
    description: "Expliquez un concept, générez un quiz, résumez une leçon. Aria est disponible 24h/24 même quand votre prof dort.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: FileText,
    title: "Bibliothèque de contenu",
    description: "Résumés, exercices, devoirs de contrôle et de synthèse, fiches de révision — générés par IA ou créés par votre prof.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Calendar,
    title: "Calendrier intégré",
    description: "Vue mensuelle de toutes vos séances avec vos groupes. Reprogrammation et annulation simplifiées.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Bell,
    title: "Rappels automatiques",
    description: "Notifications avant chaque séance (10 min, 30 min, 1h ou 2h avant). Vous ne raterez plus jamais un cours.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: BookOpenCheck,
    title: "Programme tunisien",
    description: "Contenu calibré sur le programme officiel : du Primaire au Bac (Math, Sciences, Tech, Lettres, Éco, Info, Sport).",
    color: "from-teal-500 to-cyan-600",
  },
  {
    icon: Sparkles,
    title: "Génération IA pour profs",
    description: "Les profs créent leur contenu en LaTeX en quelques secondes — ou adaptent un PDF existant pour leur classe.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: MapPin,
    title: "Formation continue",
    description: "Les profs peuvent demander leurs propres formations sur la plateforme et améliorer leurs compétences pédagogiques.",
    color: "from-red-500 to-pink-600",
  },
];

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.08)_0%,transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Tout ce qu&apos;il vous faut
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Une plateforme pensée pour
            <br />
            <span className="gradient-text">apprendre ensemble</span>
          </h2>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Les outils du prof + l&apos;intelligence de l&apos;IA + l&apos;émulation d&apos;un groupe = vos meilleures notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/30 hover:shadow-lg hover:shadow-[hsl(var(--primary))]/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
