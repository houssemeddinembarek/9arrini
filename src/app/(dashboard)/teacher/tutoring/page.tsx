"use client";

import { Video, Calendar, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherTutoringPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tutoring Sessions</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Manage your 1-on-1 tutoring bookings and availability.
          </p>
        </div>
        <Button variant="gradient" disabled>
          <Calendar className="h-4 w-4" /> Set Availability
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-50">
          <Video className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Tutoring Management</h3>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm">
          Set your available time slots, manage booking requests, and track completed sessions.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          <Construction className="h-3.5 w-3.5" />
          Under development
        </div>
      </div>
    </div>
  );
}
