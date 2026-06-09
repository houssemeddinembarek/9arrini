"use client";

import { FileText, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const REPORTS = [
  { title: "User growth report", desc: "New registrations by role over time." },
  { title: "Course performance report", desc: "Enrollments, ratings and completion per course." },
  { title: "Tutoring activity report", desc: "Bookings and session outcomes." },
  { title: "Content library report", desc: "Lessons and PDF resources by subject." },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-[hsl(var(--primary))]" />
          Reports
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Generate and download platform reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div key={r.title} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{r.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[hsl(var(--border))]">
              <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Coming soon
              </span>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
