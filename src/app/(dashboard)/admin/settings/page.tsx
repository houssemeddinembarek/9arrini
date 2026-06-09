"use client";

import { Settings, ShieldCheck, Bell, Globe } from "lucide-react";

const SECTIONS = [
  { icon: ShieldCheck, title: "Platform & security", desc: "Approval rules, roles and access policies." },
  { icon: Bell, title: "Notifications", desc: "System and email notification preferences." },
  { icon: Globe, title: "Localization", desc: "Default language and curriculum (Tunisian education)." },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-[hsl(var(--primary))]" />
          Settings
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage platform configuration.</p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{s.desc}</p>
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Coming soon</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
