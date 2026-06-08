"use client";

import Link from "next/link";
import { GraduationCap, PlusCircle, Sparkles, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherQuizzesPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Build quizzes to assess your students&apos; understanding.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/teacher/generate-content">
            <Button variant="outline">
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
          </Link>
          <Button variant="gradient" disabled>
            <PlusCircle className="h-4 w-4" /> Create Quiz
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-50">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Quiz Builder</h3>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm">
          Create multiple-choice, true/false, and open-ended quizzes. Track results and export grades.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          <Construction className="h-3.5 w-3.5" />
          Under development
        </div>
      </div>
    </div>
  );
}
