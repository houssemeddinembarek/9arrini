"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldCheck, Bell, Globe, Gift, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const SECTIONS = [
  { icon: ShieldCheck, title: "Platform & security", desc: "Approval rules, roles and access policies." },
  { icon: Bell, title: "Notifications", desc: "System and email notification preferences." },
  { icon: Globe, title: "Localization", desc: "Default language and curriculum (Tunisian education)." },
];

export default function AdminSettingsPage() {
  const [freeSeances, setFreeSeances] = useState("0");
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setFreeSeances(String(j.data.settings.freeSeancesForNewStudents ?? 0));
      })
      .catch(() => toast.error("Impossible de charger les paramètres"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const value = Number(freeSeances);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast.error("Entrez un nombre entre 0 et 100");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeSeancesForNewStudents: Math.floor(value), applyToExisting }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setFreeSeances(String(json.data.settings.freeSeancesForNewStudents));
      toast.success(
        applyToExisting
          ? `Paramètres enregistrés — ${json.data.studentsUpdated} élève(s) mis à jour`
          : "Paramètres enregistrés"
      );
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-[hsl(var(--primary))]" />
          Settings
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage platform configuration.</p>
      </div>

      {/* Free séances granted to each new student at sign-up. */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-[hsl(var(--primary))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Séances gratuites</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
              Nombre de séances offertes à chaque nouvel élève. Au-delà, l&apos;élève doit payer.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mt-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="freeSeances">Séances offertes par élève</Label>
              <Input
                id="freeSeances"
                type="number"
                min={0}
                max={100}
                value={freeSeances}
                onChange={(e) => setFreeSeances(e.target.value)}
                className="sm:max-w-[10rem]"
              />
            </div>
            <Button variant="gradient" onClick={save} loading={saving} className="shrink-0">
              <Save className="h-4 w-4" /> Enregistrer
            </Button>
          </div>
        )}

        {!loading && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Appliquer aussi aux élèves déjà inscrits</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Remet le compteur de chaque élève existant à ce nombre. Sans cette option, seuls les
                nouveaux inscrits sont concernés.
              </p>
            </div>
            <Switch checked={applyToExisting} onCheckedChange={setApplyToExisting} />
          </div>
        )}

        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
          Les séances déjà utilisées restent décomptées : un élève ayant utilisé 1 séance sur 2 gardera
          1 séance restante.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{s.desc}</p>
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">Coming soon</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
