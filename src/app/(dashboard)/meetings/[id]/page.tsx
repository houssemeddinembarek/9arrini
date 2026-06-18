"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgoraRoom } from "@/components/meetings/agora-room";

interface Meeting {
  _id: string;
  title: string;
  status: "scheduled" | "cancelled" | "completed";
}

export default function MeetingRoomPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/meetings/${id}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.success) setMeeting(j.data.meeting);
        else setError(j.error || "Meeting not available");
      })
      .catch(() => setError("Meeting not available"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="font-semibold mb-1">Meeting unavailable</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{error}</p>
          <Link href="/dashboard/meetings">
            <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to meetings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/dashboard/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to meetings
      </Link>
      <AgoraRoom
        tokenUrl={`/api/meetings/${meeting._id}/token`}
        title={meeting.title}
        backHref="/dashboard/meetings"
      />
    </div>
  );
}
