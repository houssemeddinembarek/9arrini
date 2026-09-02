"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  GraduationCap, Clock, CalendarDays, Wallet, Loader2, Video, BookX, Hourglass, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate, cn } from "@/lib/utils";

type JoinStatus = "pending" | "confirmed" | "rejected" | "cancelled" | null;

interface ClassRow {
  _id: string;
  title: string;
  subject: string;
  level: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  teacher?: { name: string; avatar?: string };
  myStatus: JoinStatus;
  myEnrollmentIsFree?: boolean;
}

interface FreeSeances { allowance: number; used: number; remaining: number }

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [freeSeances, setFreeSeances] = useState<FreeSeances | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/classes");
        const json = await res.json();
        if (json.success) {
          setClasses(json.data.classes);
          setFreeSeances(json.data.freeSeances ?? null);
        }
      } catch {
        toast.error("Failed to load classes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const join = async (id: string) => {
    setJoining(id);
    try {
      const res = await fetch(`/api/classes/${id}/join`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        // A free séance enrols on the spot; otherwise it waits for payment.
        const usedFree = !!json.data?.isFree;
        const status: JoinStatus = json.data?.status === "confirmed" ? "confirmed" : "pending";
        setClasses((p) => p.map((c) => (c._id === id ? { ...c, myStatus: status, myEnrollmentIsFree: usedFree } : c)));
        if (usedFree) {
          setFreeSeances((f) => (f ? { ...f, used: f.used + 1, remaining: Math.max(0, f.remaining - 1) } : f));
        }
        toast.success(json.message || "Request sent");
      } else {
        toast.error(json.error || "Could not join");
      }
    } catch {
      toast.error("Could not join");
    } finally {
      setJoining(null);
    }
  };

  // Mirrors the server rule: a free séance is spent only on a class that costs
  // something, and only while the student still has one left.
  const coveredByFreeSeance = (c: ClassRow) =>
    !c.myStatus && c.price > 0 && (freeSeances?.remaining ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-[hsl(var(--primary))]" /> Classes
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Browse available classes and join. You&apos;re enrolled once the admin confirms your payment.</p>
      </div>

      {/* Free-séance balance: what the next join will cost. */}
      {freeSeances && freeSeances.allowance > 0 && (
        <div
          className={cn(
            "rounded-2xl border p-4 flex items-start gap-3",
            freeSeances.remaining > 0
              ? "border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5"
              : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40"
          )}
        >
          <Gift className={cn("h-5 w-5 shrink-0 mt-0.5", freeSeances.remaining > 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]")} />
          <div className="min-w-0">
            {freeSeances.remaining > 0 ? (
              <>
                <p className="text-sm font-medium">
                  Il te reste {freeSeances.remaining} séance{freeSeances.remaining > 1 ? "s" : ""} gratuite{freeSeances.remaining > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Tu es inscrit immédiatement, sans paiement. Ensuite, les séances sont payantes.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Séances gratuites épuisées</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Tu as utilisé tes {freeSeances.allowance} séance{freeSeances.allowance > 1 ? "s" : ""} offerte{freeSeances.allowance > 1 ? "s" : ""}. Les prochaines inscriptions sont payantes.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-12 text-center">
          <BookX className="h-10 w-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No classes available right now. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c._id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{c.title}</h3>
                    <Badge variant="purple">{c.subject}</Badge>
                    <Badge variant="secondary">{c.level}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                    {c.teacher && (
                      <span className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5"><AvatarImage src={c.teacher.avatar} /><AvatarFallback className="text-[8px]">{getInitials(c.teacher.name)}</AvatarFallback></Avatar>
                        {c.teacher.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(c.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.startTime}–{c.endTime}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* A free séance covers this class only while the balance lasts. */}
                  {c.myEnrollmentIsFree ? (
                    <Badge variant="success" className="gap-1"><Gift className="h-3 w-3" /> Séance gratuite</Badge>
                  ) : coveredByFreeSeance(c) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm line-through text-[hsl(var(--muted-foreground))]">{c.price} DT</span>
                      <Badge variant="success" className="gap-1"><Gift className="h-3 w-3" /> Gratuite</Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 font-bold text-lg"><Wallet className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> {c.price} DT</div>
                  )}
                  {c.myStatus === "confirmed" ? (
                    <Link href={`/classes/${c._id}/room`}>
                      <Button size="sm" variant="gradient"><Video className="h-4 w-4" /> Enter class</Button>
                    </Link>
                  ) : c.myStatus === "pending" ? (
                    <Badge variant="warning" className="gap-1"><Hourglass className="h-3 w-3" /> Awaiting payment confirmation</Badge>
                  ) : c.myStatus === "rejected" ? (
                    <Badge variant="destructive">Request declined</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={coveredByFreeSeance(c) ? "gradient" : "outline"}
                      disabled={joining === c._id}
                      onClick={() => join(c._id)}
                    >
                      {joining === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : coveredByFreeSeance(c) ? "Rejoindre gratuitement" : "Join class"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
