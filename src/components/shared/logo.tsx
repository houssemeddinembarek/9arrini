import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The wordmark. One solid brand tile with a geometric glyph plus the name in
 * plain foreground — no gradient text, so it stays legible at 16px, in dark
 * mode, and on top of the dark CTA panel (`tone="inverted"`).
 */
export function Logo({
  className,
  href = "/",
  tone = "default",
}: {
  className?: string;
  href?: string | null;
  tone?: "default" | "inverted";
}) {
  const inverted = tone === "inverted";

  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[0.625rem] shadow-[var(--shadow-xs)]",
          inverted ? "bg-white" : "bg-primary"
        )}
      >
        {/* Open book / two pages — drawn rather than imported so the stroke
            weight matches the wordmark. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn("h-4 w-4", inverted ? "text-primary" : "text-primary-foreground")}
          aria-hidden
        >
          <path
            d="M12 6.5C10.6 5.2 8.8 4.5 6.5 4.5H4a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h2.5c2.3 0 4.1.7 5.5 2 1.4-1.3 3.2-2 5.5-2H20a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5h-2.5c-2.3 0-4.1.7-5.5 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 6.5v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span
        className={cn(
          "text-[1.0625rem] font-bold tracking-tight",
          inverted ? "text-white" : "text-foreground"
        )}
      >
        Telmidhi
      </span>
    </>
  );

  if (href === null) {
    return <span className={cn("inline-flex items-center gap-2.5", className)}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 transition-opacity hover:opacity-85", className)}
    >
      {content}
    </Link>
  );
}
