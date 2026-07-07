"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Calendar, Clock, Users, Loader2, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface PastMeeting {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: "online" | "in-person" | "hybrid";
  status: "scheduled" | "cancelled" | "completed";
  group?: { name: string; color: string };
  teacher?: { name: string };
  recordingUrl?: string;
}

/**
 * History of meetings that have already ended. The API scopes the result by the
 * caller's role: students/teachers see their own past meetings, admins see all.
 */
export function MeetingHistory({
  title = "Past meetings",
  showTeacher = true,
}: {
  title?: string;
  showTeacher?: boolean;
}) {
  const [items, setItems] = useState<PastMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meetings?past=true")
      .then((r) => r.json())
      .then((j) => { if (j.success) setItems(j.data.meetings); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <History className="h-5 w-5 text-[hsl(var(--primary))]" /> {title}
        {!loading && items.length > 0 && (
          <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">({items.length})</span>
        )}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-8 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No past meetings yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((m) => (
            <div
              key={m._id}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{m.title}</h3>
                  {m.group?.name && <Badge variant="purple">{m.group.name}</Badge>}
                  <Badge variant="secondary" className="text-[10px]">Ended</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(m.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {m.startTime}{m.endTime ? `–${m.endTime}` : ""}</span>
                  {showTeacher && m.teacher?.name && (
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {m.teacher.name}</span>
                  )}
                </div>
              </div>
              {m.recordingUrl && (
                <Link href={`/meetings/${m._id}`} className="shrink-0">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <PlayCircle className="h-4 w-4" /> Watch recording
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
