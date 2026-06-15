// Supported locales for the platform. French is the default (Tunisian market),
// with Arabic (RTL) and English.
export const LOCALES = ["fr", "ar", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

// Cookie that stores the visitor's chosen language. Read on the server (to
// render the correct dictionary + <html dir>) and written by the switcher.
export const LOCALE_COOKIE = "9arrini-locale";

// Display metadata for the language switcher. `label` uses each language's own
// endonym (never translated), and `dir` drives the document text direction.
export const LOCALE_META: Record<Locale, { label: string; flag: string; dir: "ltr" | "rtl" }> = {
  fr: { label: "Français", flag: "🇫🇷", dir: "ltr" },
  ar: { label: "العربية", flag: "🇹🇳", dir: "rtl" },
  en: { label: "English", flag: "🇬🇧", dir: "ltr" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return LOCALE_META[locale].dir;
}
