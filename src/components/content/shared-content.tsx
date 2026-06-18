"use client";

import { FileText, X } from "lucide-react";
import { ContentBody } from "@/components/content/content-body";
import { cn } from "@/lib/utils";

export interface SharedContentItem {
  _id: string;
  title: string;
  contentType: string;
  source: string;
  body?: string;
  pdfUrl?: string;
}

const TYPE_LABEL: Record<string, string> = {
  resume: "Résumé",
  exercices: "Exercices",
  devoir_controle: "Devoir de contrôle",
  devoir_synthese: "Devoir de synthèse",
  fiche_revision: "Fiche de révision",
};

/**
 * The side-panel that shows the content a teacher shared in the meeting. When
 * several items are shared they appear as tabs; everyone can read any of them,
 * and the teacher can close the panel for the whole room.
 */
export function SharedContent({
  items, activeId, onSelect, onClose, canControl,
}: {
  items: SharedContentItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose?: () => void;
  canControl: boolean;
}) {
  const active = items.find((i) => i._id === activeId) || items[0] || null;

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden flex flex-col h-full">
      {/* Header + tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--border))]">
        <FileText className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
        <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {items.map((it) => (
            <button
              key={it._id}
              onClick={() => onSelect(it._id)}
              title={it.title}
              className={cn(
                "shrink-0 max-w-[12rem] truncate text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
                active?._id === it._id
                  ? "bg-[hsl(var(--primary))] text-white border-transparent"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]",
              )}
            >
              {it.title}
            </button>
          ))}
        </div>
        {canControl && onClose && (
          <button onClick={onClose} title="Fermer le contenu" className="shrink-0 h-8 w-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--accent))]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[hsl(var(--background))]">
        {!active ? (
          <div className="h-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
            Aucun contenu partagé.
          </div>
        ) : active.pdfUrl ? (
          <iframe src={active.pdfUrl} title={active.title} className="w-full h-full min-h-[360px]" />
        ) : (
          <div className="p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold">{active.title}</h3>
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                {TYPE_LABEL[active.contentType] || active.contentType}
              </span>
            </div>
            <ContentBody body={active.body || ""} />
          </div>
        )}
      </div>
    </div>
  );
}
