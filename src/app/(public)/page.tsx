import { Hero } from "@/components/landing/hero";
import { SubjectsBand } from "@/components/landing/subjects-band";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { ForTeachersAndStudents } from "@/components/landing/for-teachers";
import { TopTeachers } from "@/components/landing/top-teachers";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FinalCTA } from "@/components/landing/final-cta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telmidhi — Apprenez en petit groupe avec un prof et l'IA",
  description:
    "La plateforme tunisienne qui réunit profs experts et IA pour des cours particuliers en groupe via réunions en ligne. Du primaire au Bac.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <SubjectsBand />
      <HowItWorks />
      <Features />
      <ForTeachersAndStudents />
      <TopTeachers />
      <Testimonials />
      <Pricing />
      <FinalCTA />
    </>
  );
}
