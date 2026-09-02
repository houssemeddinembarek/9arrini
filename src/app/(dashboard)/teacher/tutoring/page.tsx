"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Video, Loader2, Check, X, UserPlus, Inbox, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface TutoringRequest {
  _id: string;
  status: "pending" | "accepted" | "rejected";
  student?: { _id: string; name: string; email: string; avatar?: string };
  // The group the student asked to join, when they picked one on your page.
  group?: { _id: string; name: string; subject?: string; level?: string };
}

export default function TeacherTutoringPage() {
  const [requests, setRequests] = useState<TutoringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tutoring/requests");
        const json = await res.json();
        if (json.success) setRequests(json.data.requests);
      } catch {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const respond = async (id: string, action: "accept" | "reject") => {
    setActingId(id);
    try {
      const res = await fetch(`/api/tutoring/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        setRequests((p) => p.map((r) => (r._id === id ? { ...r, status: json.data.status } : r)));
        toast.success(action === "accept" ? "Élève accepté" : "Demande refusée");
      } else {
        toast.error(json.error || "Échec");
      }
    } catch {
      toast.error("Échec");
    } finally {
      setActingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6 text-[hsl(var(--primary))]" /> Tutorat
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Accepte les demandes des élèves. Chaque demande indique le groupe choisi : en acceptant, l&apos;élève y est ajouté et voit tes réunions.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          {/* Pending requests */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" /> Demandes en attente ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Aucune demande pour le moment.
              </div>
            ) : (
              pending.map((r) => (
                <div key={r._id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-wrap items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0"><AvatarImage src={r.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(r.student?.name || "?")}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-[8rem]">
                    <p className="text-sm font-medium truncate">{r.student?.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{r.student?.email}</p>
                    {r.group && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <Badge variant="purple" className="text-[10px] gap-1">
                          <UsersRound className="h-3 w-3" /> {r.group.name}
                        </Badge>
                        {r.group.level && <Badge variant="secondary" className="text-[10px]">{r.group.level}</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <Button size="sm" variant="gradient" className="h-8" disabled={actingId === r._id} onClick={() => respond(r._id, "accept")}>
                      <Check className="h-4 w-4" /> Accepter
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-red-500" disabled={actingId === r._id} onClick={() => respond(r._id, "reject")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Accepted students */}
          {accepted.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                Mes élèves ({accepted.length})
              </h2>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
                {accepted.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 p-3">
                    <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={r.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(r.student?.name || "?")}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.student?.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        {r.group ? r.group.name : r.student?.email}
                      </p>
                    </div>
                    <Badge variant="success" className="shrink-0">Accepté</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
