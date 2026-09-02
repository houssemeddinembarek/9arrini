"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star, Calendar, DollarSign, Search, Clock,
  Video, CheckCircle2, Users, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuthStore } from "@/stores/useAuthStore";

interface Teacher {
  _id: string;
  name: string;
  avatar?: string;
  specialty: string;
  subjects: string[];
  level: string;
  bio: string;
  rating: number;
  students: number;
  price: number;
  availableDays: string[];
}

export default function TutoringPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqStatus, setReqStatus] = useState<Record<string, string>>({});
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.tutoring;
  const { user } = useAuthStore();

  useEffect(() => {
    fetch("/api/teachers")
      .then((r) => r.json())
      .then((j) => { if (j.success) setTeachers(j.data.teachers); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // For a signed-in student, know which teachers they've already reserved.
  useEffect(() => {
    if (user?.role !== "student") return;
    fetch("/api/tutoring/requests")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        const map: Record<string, string> = {};
        for (const req of j.data.requests) {
          const tid = req.teacher?._id ?? req.teacher;
          if (tid) map[String(tid)] = req.status;
        }
        setReqStatus(map);
      })
      .catch(() => {});
  }, [user?.role]);

  const filtered = teachers.filter((tutor) => {
    const q = search.toLowerCase();
    const matchSearch =
      tutor.name.toLowerCase().includes(q) ||
      tutor.specialty.toLowerCase().includes(q) ||
      tutor.subjects.some((s) => s.toLowerCase().includes(q));
    const matchSpec = specialty === "all" || tutor.specialty === specialty || tutor.subjects.includes(specialty);
    const matchPrice =
      priceRange === "all" ||
      (priceRange === "low" && tutor.price <= 30) ||
      (priceRange === "mid" && tutor.price > 30 && tutor.price <= 40) ||
      (priceRange === "high" && tutor.price > 40);
    return matchSearch && matchSpec && matchPrice;
  });

  return (
    <main className="pt-16">
        {/* Header */}
        <div className="bg-gradient-to-b from-[hsl(var(--muted))]/50 to-transparent py-8 sm:py-12 border-b border-[hsl(var(--border))]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="purple" className="mb-4">{t.badge}</Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {t.titleBefore} <span className="gradient-text">{t.titleHighlight}</span>
            </h1>
            <p className="text-base sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-8">
              {t.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-6 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              {[
                { icon: Video, text: t.features.video },
                { icon: CheckCircle2, text: t.features.verified },
                { icon: Calendar, text: t.features.flexible },
                { icon: DollarSign, text: t.features.pricing },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                placeholder={t.searchPlaceholder}
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder={t.subjectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allSubjects}</SelectItem>
                <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                <SelectItem value="Physique-Chimie">Physique-Chimie</SelectItem>
                <SelectItem value="Sciences de la vie et de la terre (SVT)">SVT</SelectItem>
                <SelectItem value="Français & Philosophie">Français & Philosophie</SelectItem>
                <SelectItem value="Anglais">Anglais</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t.pricePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allPrices}</SelectItem>
                <SelectItem value="low">{t.priceLow}</SelectItem>
                <SelectItem value="mid">{t.priceMid}</SelectItem>
                <SelectItem value="high">{t.priceHigh}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-16">{t.noResults}</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((tutor) => (
              <div
                key={tutor._id}
                onClick={() => router.push(`/tutoring/${tutor._id}`)}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-6 hover:shadow-xl hover:border-[hsl(var(--primary))]/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 sm:gap-4 mb-5">
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                    <AvatarImage src={tutor.avatar} alt={tutor.name} />
                    <AvatarFallback className="gradient-bg text-white text-lg sm:text-xl font-bold">
                      {getInitials(tutor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base sm:text-lg truncate">{tutor.name}</h3>
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {tutor.specialty && <Badge variant="purple">{tutor.specialty}</Badge>}
                      {tutor.level && <span className="text-xs text-[hsl(var(--muted-foreground))]">{tutor.level}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{tutor.rating > 0 ? tutor.rating.toFixed(1) : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                        <Users className="h-3.5 w-3.5" />
                        {tutor.students} {t.students}
                      </div>
                    </div>
                  </div>
                </div>

                {tutor.bio && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                    {tutor.bio}
                  </p>
                )}

                {tutor.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tutor.subjects.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="flex items-start gap-1.5 text-xs text-[hsl(var(--muted-foreground))] min-w-0">
                    <Calendar className="h-3.5 w-3.5 shrink-0 mt-px" />
                    <span className="line-clamp-2">
                      {tutor.availableDays.length > 0 ? `${t.available} ${tutor.availableDays.join(", ")}` : ""}
                    </span>
                  </div>
                  {/* Picking a group happens on the teacher's own page. */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    {reqStatus[tutor._id] === "accepted" && (
                      <Badge variant="success" className="gap-1 shrink-0">
                        <CheckCircle2 className="h-3 w-3" /> {t.requestAccepted}
                      </Badge>
                    )}
                    {reqStatus[tutor._id] === "pending" && (
                      <Badge variant="warning" className="gap-1 shrink-0">
                        <Clock className="h-3 w-3" /> {t.requestPending}
                      </Badge>
                    )}
                    <Button variant="gradient" size="sm" className="w-full sm:w-auto shrink-0">
                      Voir les groupes <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
    </main>
  );
}
