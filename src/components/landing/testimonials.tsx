"use client";

import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

const TESTIMONIALS = [
  {
    id: "1",
    name: "Ahmed Gharbi",
    role: "Élève 4ème année — Bac Math",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    content:
      "J'ai rejoint un groupe de maths à 5 élèves avec Mr. Sami. En 3 mois, je suis passé de 09 à 15 de moyenne. L'IA Aria m'aide aussi à 22h quand je bloque sur un exo.",
    rating: 5,
    type: "student" as const,
    subject: "Mathématiques — Bac",
  },
  {
    id: "2",
    name: "Mme Leila Trabelsi",
    role: "Professeure de Physique-Chimie",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    content:
      "9arrini m'a permis de gérer 6 groupes en parallèle. Le calendrier intégré et les rappels automatiques m'ont sauvée. Et la génération IA de devoirs me fait gagner 5h par semaine.",
    rating: 5,
    type: "teacher" as const,
    subject: "Enseignante",
  },
  {
    id: "3",
    name: "Sara Bouaziz",
    role: "Élève 3ème année secondaire",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    content:
      "Cours particuliers en groupe = beaucoup moins cher qu'un prof à domicile, et on s'entraide entre élèves. C'est mieux que d'être seule devant son cahier.",
    rating: 5,
    type: "student" as const,
    subject: "Sciences expérimentales",
  },
  {
    id: "4",
    name: "Youssef Mansouri",
    role: "Élève 9ème année de base",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    content:
      "La fiche de révision générée par l'IA avant le devoir de synthèse m'a fait gagner des heures de prise de notes. Et le prof corrige les exos avec nous en réunion.",
    rating: 5,
    type: "student" as const,
    subject: "Mathématiques",
  },
  {
    id: "5",
    name: "Mr. Karim Mzali",
    role: "Professeur de Français & Philo",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    content:
      "J'ai demandé une formation sur la pédagogie active directement depuis mon tableau de bord. Reçue en 2 semaines. C'est un vrai écosystème éducatif, pas juste une plateforme de cours.",
    rating: 5,
    type: "teacher" as const,
    subject: "Enseignant",
  },
  {
    id: "6",
    name: "Mariem Chaabane",
    role: "Élève 6ème année primaire",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80",
    content:
      "Maman a trouvé une maîtresse super pour le concours de la 6ème. On est 6 enfants dans le groupe et on s'amuse en apprenant. Les rappels avant les séances aident ma maman.",
    rating: 5,
    type: "student" as const,
    subject: "Concours 6ème",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-[hsl(var(--muted))]/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Quote className="h-4 w-4" />
            Témoignages
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Adopté par <span className="gradient-text">élèves et profs</span>
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            Découvrez ce que pensent les étudiants et professeurs qui utilisent 9arrini Academy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Badge variant={t.type === "teacher" ? "success" : "purple"} className="text-[10px]">
                  {t.type === "teacher" ? "Prof" : "Élève"}
                </Badge>
              </div>

              <Quote className="h-6 w-6 text-[hsl(var(--primary))]/30 mb-3" />

              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed flex-1 mb-4">
                &ldquo;{t.content}&rdquo;
              </p>

              <div className="text-xs text-[hsl(var(--primary))] font-medium mb-4 flex items-center gap-1">
                📚 {t.subject}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.avatar} alt={t.name} />
                  <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                    {getInitials(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
