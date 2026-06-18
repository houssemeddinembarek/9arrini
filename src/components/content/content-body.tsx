"use client";

import { useEffect, useRef } from "react";

type RenderMathFn = (el: HTMLElement, opts: unknown) => void;
declare global {
  interface Window {
    renderMathInElement?: RenderMathFn;
  }
}

// ─── KaTeX loader ─────────────────────────────────────────────────────────────

function useKaTeX() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function render() {
      const fn = window.renderMathInElement;
      if (!fn || !ref.current) return;
      fn(ref.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
      });
    }

    if (window.renderMathInElement) { render(); return; }

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    document.head.appendChild(css);
    const s1 = document.createElement("script");
    s1.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
    s1.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
      s2.onload = render;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }, []);

  return ref;
}

// ─── Markdown → HTML ──────────────────────────────────────────────────────────

function mdToHtml(text: string): string {
  return text
    .replace(/&(?![a-z#0-9]+;)/gi, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^---$/gm, "<hr>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/gm, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

// ─── Rendered content body ──────────────────────────────────────────────────────

// Renders an exercice/cours markdown body with KaTeX math, using the same look
// as the teacher's content viewer so the énoncé is clear for the student too.
export function ContentBody({ body }: { body: string }) {
  const ref = useKaTeX();
  return (
    <div
      ref={ref}
      className="prose prose-sm max-w-none
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:underline [&_h1]:text-[hsl(var(--foreground))]
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[hsl(var(--primary))] [&_h2]:border-b [&_h2]:border-[hsl(var(--border))] [&_h2]:pb-1
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5
        [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1
        [&_p]:my-2 [&_p]:leading-relaxed [&_p]:text-[hsl(var(--foreground))]
        [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc
        [&_li]:my-1 [&_li]:leading-relaxed
        [&_blockquote]:border-l-4 [&_blockquote]:border-[hsl(var(--primary))]/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-[hsl(var(--muted-foreground))] [&_blockquote]:bg-[hsl(var(--primary))]/5 [&_blockquote]:rounded-r-lg
        [&_code]:bg-[hsl(var(--muted))] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
        [&_strong]:font-semibold
        [&_hr]:border-[hsl(var(--border))] [&_hr]:my-5"
      dangerouslySetInnerHTML={{ __html: mdToHtml(body) }}
    />
  );
}
