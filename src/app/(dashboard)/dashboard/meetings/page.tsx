"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Calendar, Clock, Users, Loader2, CalendarX2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeetingHistory } from "@/components/meetings/meeting-history";
import { formatDate, isMeetingEnded } from "@/lib/utils";

interface Meeting {
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

export default function MyMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [replays, setReplays] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/meetings?upcoming=true").then((r) => r.json()),
      fetch("/api/meetings?recorded=true").then((r) => r.json()),
    ])
      .then(([up, rec]) => {
        if (up.success) setMeetings(up.data.meetings);
        if (rec.success) setReplays(rec.data.meetings);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6 text-[hsl(var(--primary))]" /> My Meetings
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Upcoming live sessions you&apos;re invited to</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-12 text-center">
          <CalendarX2 className="h-10 w-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No upcoming meetings scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div
              key={m._id}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{m.title}</h3>
                  {m.group?.name && <Badge variant="purple">{m.group.name}</Badge>}
                </div>
                {m.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">{m.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(m.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {m.startTime}{m.endTime ? `–${m.endTime}` : ""}</span>
                  {m.teacher?.name && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {m.teacher.name}</span>}
                </div>
              </div>
              {m.type !== "in-person" && (
                isMeetingEnded(m.date, m.startTime, m.endTime) ? (
                  m.recordingUrl ? (
                    <Link href={`/meetings/${m._id}`} className="shrink-0">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <PlayCircle className="h-4 w-4" /> Watch recording
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full sm:w-auto shrink-0" disabled>
                      Ended
                    </Button>
                  )
                ) : (
                  <Link href={`/meetings/${m._id}`} className="shrink-0">
                    <Button variant="gradient" className="w-full sm:w-auto">
                      <Video className="h-4 w-4" /> Join
                    </Button>
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recorded sessions a student can watch again */}
      {!loading && replays.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 pt-2">
            <PlayCircle className="h-5 w-5 text-[hsl(var(--primary))]" /> Replays
          </h2>
          {replays.map((m) => (
            <div
              key={m._id}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{m.title}</h3>
                  {m.group?.name && <Badge variant="purple">{m.group.name}</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(m.date)}</span>
                  {m.teacher?.name && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {m.teacher.name}</span>}
                </div>
              </div>
              <Link href={`/meetings/${m._id}`} className="shrink-0">
                <Button variant="outline" className="w-full sm:w-auto">
                  <PlayCircle className="h-4 w-4" /> Watch recording
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* History of meetings that already happened */}
      {!loading && <MeetingHistory />}
    </div>
  );
}
