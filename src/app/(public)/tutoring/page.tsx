"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star, Clock, Calendar, DollarSign, Search, Filter,
  Video, CheckCircle2, Users, ArrowRight, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

const TUTORS = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    specialty: "Web Development",
    bio: "10+ years experience. Specialized in React, Node.js, and full-stack architecture.",
    rating: 4.9,
    reviews: 234,
    students: 892,
    price: 45,
    duration: 60,
    available: ["Mon", "Tue", "Thu", "Fri"],
    tags: ["React", "Node.js", "TypeScript", "MongoDB"],
    isVerified: true,
  },
  {
    id: "2",
    name: "Dr. Marcus Chen",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    specialty: "AI & Machine Learning",
    bio: "PhD from MIT. Bridging the gap between academic AI research and practical applications.",
    rating: 4.8,
    reviews: 178,
    students: 456,
    price: 75,
    duration: 60,
    available: ["Wed", "Thu", "Sat"],
    tags: ["Python", "TensorFlow", "Deep Learning", "NLP"],
    isVerified: true,
  },
  {
    id: "3",
    name: "Emily Park",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
    specialty: "UI/UX Design",
    bio: "Award-winning designer. Helping students build stunning portfolios and land design jobs.",
    rating: 4.7,
    reviews: 312,
    students: 1200,
    price: 35,
    duration: 60,
    available: ["Mon", "Tue", "Wed", "Fri"],
    tags: ["Figma", "Design Systems", "User Research", "Prototyping"],
    isVerified: true,
  },
  {
    id: "4",
    name: "Dr. Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",
    specialty: "Data Science",
    bio: "Published data scientist. Kaggle Grandmaster. Making data science accessible to all.",
    rating: 4.9,
    reviews: 156,
    students: 523,
    price: 60,
    duration: 60,
    available: ["Tue", "Thu", "Sat", "Sun"],
    tags: ["Python", "Pandas", "SQL", "Machine Learning"],
    isVerified: true,
  },
];

export default function TutoringPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const router = useRouter();

  const filtered = TUTORS.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.specialty.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchSpec = specialty === "all" || t.specialty === specialty;
    const matchPrice = priceRange === "all" ||
      (priceRange === "low" && t.price <= 40) ||
      (priceRange === "mid" && t.price > 40 && t.price <= 60) ||
      (priceRange === "high" && t.price > 60);
    return matchSearch && matchSpec && matchPrice;
  });

  return (
    <main className="pt-16">
        {/* Header */}
        <div className="bg-gradient-to-b from-[hsl(var(--muted))]/50 to-transparent py-12 border-b border-[hsl(var(--border))]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="purple" className="mb-4">1-on-1 Tutoring</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Learn with <span className="gradient-text">expert tutors</span>
            </h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-8">
              Book personalized sessions with verified experts. Learn at your pace with focused, individual attention.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              {[
                { icon: Video, text: "Video sessions via Zoom" },
                { icon: CheckCircle2, text: "Verified expert tutors" },
                { icon: Calendar, text: "Flexible scheduling" },
                { icon: DollarSign, text: "Transparent pricing" },
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
                placeholder="Search by name, subject, or skill..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="Web Development">Web Development</SelectItem>
                <SelectItem value="AI & Machine Learning">AI & Machine Learning</SelectItem>
                <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                <SelectItem value="Data Science">Data Science</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="low">Under $40/hr</SelectItem>
                <SelectItem value="mid">$40–$60/hr</SelectItem>
                <SelectItem value="high">$60+/hr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((tutor) => (
              <div
                key={tutor.id}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 hover:shadow-xl hover:border-[hsl(var(--primary))]/30 transition-all"
              >
                <div className="flex items-start gap-4 mb-5">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={tutor.avatar} alt={tutor.name} />
                    <AvatarFallback className="gradient-bg text-white text-xl font-bold">
                      {getInitials(tutor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{tutor.name}</h3>
                      {tutor.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <Badge variant="purple" className="mb-2">{tutor.specialty}</Badge>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{tutor.rating}</span>
                        <span className="text-[hsl(var(--muted-foreground))]">({tutor.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                        <Users className="h-3.5 w-3.5" />
                        {tutor.students} students
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">${tutor.price}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">per hour</p>
                  </div>
                </div>

                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                  {tutor.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tutor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Calendar className="h-3.5 w-3.5" />
                    Available: {tutor.available.join(", ")}
                  </div>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => {
                      toast.success(`Booking session with ${tutor.name}...`);
                      router.push(`/dashboard/tutoring`);
                    }}
                  >
                    Book Session <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
    </main>
  );
}
