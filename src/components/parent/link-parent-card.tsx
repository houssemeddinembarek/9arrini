"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Shown on the student profile: the share code a parent redeems to follow this
// student's progress. Talks to /api/student/link-code (GET reads, POST rotates).
export function LinkParentCard() {
  const [code, setCode] = useState("");
  const [linkedParents, setLinkedParents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = (method: "GET" | "POST") => {
    fetch("/api/student/link-code", { method })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) { setCode(j.data.code); setLinkedParents(j.data.linkedParents); }
      })
      .finally(() => { setLoading(false); setRotating(false); });
  };

  useEffect(() => load("GET"), []);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copié");
  };

  const rotate = () => {
    if (!confirm("Générer un nouveau code ? L'ancien ne fonctionnera plus.")) return;
    setRotating(true);
    load("POST");
  };

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-1">
        <Users className="h-4 w-4 text-[hsl(var(--primary))]" /> Inviter un parent
      </h3>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
        Communique ce code à ton parent : il pourra suivre ta progression depuis son compte.
      </p>

      {loading ? (
        <div className="py-4 flex justify-center text-[hsl(var(--muted-foreground))]"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-center text-lg font-mono font-bold tracking-[0.3em] bg-[hsl(var(--muted))] rounded-xl py-2.5 select-all">
              {code}
            </code>
            <Button variant="outline" size="icon" onClick={copy} title="Copier">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={rotate} disabled={rotating} title="Nouveau code">
              <RefreshCw className={`h-4 w-4 ${rotating ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
            {linkedParents > 0 ? `${linkedParents} parent(s) lié(s) à ton compte.` : "Aucun parent lié pour le moment."}
          </p>
        </>
      )}
    </div>
  );
}
