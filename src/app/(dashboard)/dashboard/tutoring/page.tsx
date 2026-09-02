"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Video, Loader2, CalendarDays, Clock, Users, Hourglass, CheckCircle2, XCircle, Search, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";

interface ReqItem {
  _id: string;
  status: "pending" | "accepted" | "rejected";
  teacher?: { _id: string; name: string; avatar?: string };
  // Which of the teacher's groups this reservation is for.
  group?: { _id: string; name: string; subject?: string; level?: string };
}
interface Meeting {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: "online" | "in-person" | "hybrid";
  teacher?: { name: string };
}

export default function DashboardTutoringPage() {
  const [requests, setRequests] = useState<ReqItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [rRes, mRes] = await Promise.all([
          fetch("/api/tutoring/requests"),
          fetch("/api/meetings?upcoming=true"),
        ]);
        const rJson = await rRes.json();
        const mJson = await mRes.json();
        if (rJson.success) setRequests(rJson.data.requests);
        if (mJson.success) setMeetings(mJson.data.meetings);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const accepted = requests.filter((r) => r.status === "accepted");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-[hsl(var(--primary))]" /> Tutorat
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Tes groupes réservés et les réunions à venir</p>
        </div>
        <Link href="/tutoring">
          <Button variant="outline"><Search className="h-4 w-4" /> Trouver un prof</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          {/* My teachers / reservation statuses */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Mes professeurs</h2>
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                Tu n&apos;as encore réservé aucun professeur.{" "}
                <Link href="/tutoring" className="text-[hsl(var(--primary))] hover:underline">Trouve un prof</Link>.
              </div>
            ) : (
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
                {requests.map((r) => (
                  <div key={r._id} className="flex flex-wrap items-center gap-3 p-3">
                    <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={r.teacher?.avatar} /><AvatarFallback className="text-xs">{getInitials(r.teacher?.name || "?")}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-[8rem]">
                      <Link
                        href={r.teacher?._id ? `/tutoring/${r.teacher._id}` : "/tutoring"}
                        className="text-sm font-medium truncate hover:text-[hsl(var(--primary))] transition-colors"
                      >
                        {r.teacher?.name}
                      </Link>
                      {r.group && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5 truncate">
                          <UsersRound className="h-3 w-3 shrink-0" />
                          {r.group.name}{r.group.level ? ` · ${r.group.level}` : ""}
                        </p>
                      )}
                    </div>
                    {r.status === "accepted" ? (
                      <Badge variant="success" className="gap-1 shrink-0 ml-auto"><CheckCircle2 className="h-3 w-3" /> Accepté</Badge>
                    ) : r.status === "pending" ? (
                      <Badge variant="warning" className="gap-1 shrink-0 ml-auto"><Hourglass className="h-3 w-3" /> En attente</Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 shrink-0 ml-auto"><XCircle className="h-3 w-3" /> Refusé</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming meetings from accepted teachers */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Prochaines réunions</h2>
            {accepted.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Une fois accepté par un professeur, tu verras ici ses réunions.</p>
            ) : meetings.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucune réunion à venir pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {meetings.map((m) => (
                  <div key={m._id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{m.title}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(m.date)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {m.startTime}{m.endTime ? `–${m.endTime}` : ""}</span>
                        {m.teacher?.name && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {m.teacher.name}</span>}
                      </div>
                    </div>
                    {m.type !== "in-person" && (
                      <Link href={`/meetings/${m._id}`} className="shrink-0">
                        <Button variant="gradient" size="sm"><Video className="h-4 w-4" /> Rejoindre</Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
