"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgoraRoom } from "@/components/meetings/agora-room";
import { isMeetingEnded } from "@/lib/utils";

interface Meeting {
  _id: string;
  title: string;
  status: "scheduled" | "cancelled" | "completed";
  date: string;
  startTime: string;
  endTime?: string;
  recordingUrl?: string;
}

interface MeetingResponse {
  meeting: Meeting;
  isTeacher: boolean;
}

// The live meeting room / recording replay. Shared by the teacher's dashboard
// route and the student's profile route — `backHref` points each one back to
// its own section so the surrounding chrome stays consistent.
export function MeetingRoomView({ backHref }: { backHref: string }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/meetings/${id}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.success) {
          const data = j.data as MeetingResponse;
          setMeeting(data.meeting);
          setIsTeacher(!!data.isTeacher);
        } else setError(j.error || "Meeting not available");
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
          <Link href={backHref}>
            <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Past its end time → no more live join; everyone sees the recording.
  const ended = meeting.status === "completed" || isMeetingEnded(meeting.date, meeting.startTime, meeting.endTime);

  return (
    <div className="h-full flex flex-col min-h-0">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-2 shrink-0"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {ended ? (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <div className="shrink-0">
            <h1 className="text-xl font-bold">{meeting.title}</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {meeting.recordingUrl ? "Réunion terminée — enregistrement" : "Réunion terminée"}
            </p>
          </div>
          {meeting.recordingUrl ? (
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video src={meeting.recordingUrl} controls autoPlay className="max-h-full max-w-full" />
            </div>
          ) : (
            <div className="flex-1 min-h-0 rounded-2xl border border-[hsl(var(--border))] flex items-center justify-center">
              <div className="text-center px-6">
                <CalendarClock className="h-10 w-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
                <h2 className="font-semibold mb-1">Cette réunion est terminée</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Aucun enregistrement n&apos;est disponible pour cette réunion.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <AgoraRoom
            tokenUrl={`/api/meetings/${meeting._id}/token`}
            meetingId={meeting._id}
            title={meeting.title}
            isTeacher={isTeacher}
            backHref={backHref}
          />
        </div>
      )}
    </div>
  );
}
