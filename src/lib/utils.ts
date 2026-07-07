import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The moment a meeting is over. Uses endTime when set; otherwise assumes the
// session runs two hours from its start.
//
// The date is stored as UTC midnight of the intended calendar day, so we read
// the day with the UTC getters (otherwise a viewer behind/ahead of UTC would see
// it shift to the day before/after) and then apply the wall-clock time locally.
export function getMeetingEnd(date: Date | string, startTime: string, endTime?: string): Date {
  const d = new Date(date);
  const y = d.getUTCFullYear(), mo = d.getUTCMonth(), day = d.getUTCDate();

  const validTime = (t?: string) => !!t && /^\d{1,2}:\d{2}$/.test(t);
  const [sh, sm] = (validTime(startTime) ? startTime : "00:00").split(":").map(Number);

  if (validTime(endTime)) {
    const [eh, em] = endTime!.split(":").map(Number);
    const end = new Date(y, mo, day, eh, em, 0, 0);
    // An end time at/before the start means the session runs past midnight.
    if (eh * 60 + em <= sh * 60 + sm) end.setDate(end.getDate() + 1);
    return end;
  }

  const end = new Date(y, mo, day, sh, sm, 0, 0);
  end.setHours(end.getHours() + 2);
  return end;
}

// A meeting is "past" once its end time has gone by — past this point nobody
// joins live; everyone watches the recording instead.
export function isMeetingEnded(date: Date | string, startTime: string, endTime?: string): boolean {
  return Date.now() > getMeetingEnd(date, startTime, endTime).getTime();
}

// Format a Date as the local "YYYY-MM-DD" a <input type="date"> expects. Using
// toISOString() here is a bug: it converts to UTC, so a local midnight east of
// UTC rolls back to the previous day and the meeting gets scheduled a day early.
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatPrice(price: number, currency = "USD"): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}

export function calcProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
