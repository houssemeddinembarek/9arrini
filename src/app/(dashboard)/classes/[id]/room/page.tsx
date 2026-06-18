"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgoraRoom } from "@/components/meetings/agora-room";
import { useAuthStore } from "@/stores/useAuthStore";

interface ClassInfo {
  _id: string;
  title: string;
  subject: string;
  level: string;
}

export default function ClassRoomPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuthStore();
  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/classes/${id}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.success) setCls(j.data.class);
        else setError(j.error || "Class not available");
      })
      .catch(() => setError("Class not available"))
      .finally(() => setLoading(false));
  }, [id]);

  // Teachers go back to their classes list, students to theirs.
  const backHref = user?.role === "teacher" ? "/teacher/classes" : "/dashboard/classes";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="font-semibold mb-1">Class unavailable</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{error}</p>
          <Link href={backHref}>
            <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to classes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to classes
      </Link>
      <AgoraRoom
        tokenUrl={`/api/classes/${cls._id}/token`}
        title={`${cls.subject} · ${cls.level}`}
        backHref={backHref}
      />
    </div>
  );
}
