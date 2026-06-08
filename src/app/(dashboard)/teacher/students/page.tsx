"use client";

import Link from "next/link";
import { Users, Search, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherStudentsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            View and manage students enrolled in your courses.
          </p>
        </div>
        <Link href="/teacher/groups">
          <Button variant="gradient">
            <Users className="h-4 w-4" /> Manage Groups
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-50">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Student Roster</h3>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm">
          Browse all enrolled students, track progress, and send messages. Groups are already available above.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          <Construction className="h-3.5 w-3.5" />
          Under development
        </div>
      </div>
    </div>
  );
}
