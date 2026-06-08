"use client";

import { Star, Users, BookOpen, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

const TEACHERS = [
  {
    id: "1",
    name: "Sami Ben Salah",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    specialty: "Mathématiques",
    level: "Bac Math",
    rating: 4.9,
    students: 240,
    groups: 8,
    bio: "Professeur agrégé de mathématiques. 15 ans d'expérience préparant les élèves au Bac scientifique.",
  },
  {
    id: "2",
    name: "Leila Trabelsi",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    specialty: "Physique-Chimie",
    level: "Lycée",
    rating: 4.8,
    students: 180,
    groups: 6,
    bio: "Ingénieure et enseignante. Ses élèves obtiennent en moyenne +4 points au Bac sciences.",
  },
  {
    id: "3",
    name: "Karim Mzali",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    specialty: "Français & Philosophie",
    level: "Bac Lettres",
    rating: 4.9,
    students: 210,
    groups: 7,
    bio: "Agrégé de Lettres modernes. Spécialiste de la dissertation et de l'explication de texte.",
  },
  {
    id: "4",
    name: "Ines Bouaziz",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
    specialty: "Anglais",
    level: "Tous niveaux",
    rating: 4.7,
    students: 320,
    groups: 12,
    bio: "Diplômée de Cambridge. Méthode immersive pour passer du niveau A2 au C1 en un an.",
  },
];

export function TopTeachers() {
  const router = useRouter();

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            Professeurs vérifiés
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Apprenez avec les <span className="gradient-text">meilleurs profs tunisiens</span>
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            Tous nos professeurs sont vérifiés et notés par leurs élèves. Choisissez celui qui vous correspond.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {TEACHERS.map((teacher) => (
            <div
              key={teacher.id}
              className="group p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center hover:shadow-xl hover:border-[hsl(var(--primary))]/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => router.push(`/tutoring`)}
            >
              <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-[hsl(var(--border))] group-hover:ring-[hsl(var(--primary))]/30 transition-all">
                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                <AvatarFallback className="gradient-bg text-white text-xl font-bold">
                  {getInitials(teacher.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg mb-1">{teacher.name}</h3>
              <Badge variant="purple" className="mb-1">{teacher.specialty}</Badge>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{teacher.level}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-3 mb-4">
                {teacher.bio}
              </p>
              <div className="flex items-center justify-around text-sm border-t border-[hsl(var(--border))] pt-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="font-semibold">{teacher.rating}</span>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Note</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-semibold">{teacher.students}</span>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Élèves</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-green-500" />
                    <span className="font-semibold">{teacher.groups}</span>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Groupes</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/tutoring")}>
            Voir tous les profs <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
