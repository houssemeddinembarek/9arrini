"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, getDir, type Locale } from "./config";
import type { Dictionary } from "./dictionaries";

interface I18nValue {
  locale: Locale;
  dict: Dictionary;
  /** Persist a new locale (cookie) and re-render server components. */
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      // One-year cookie, readable by the server on the next render.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      // Update direction immediately so the swap feels instant…
      document.documentElement.lang = next;
      document.documentElement.dir = getDir(next);
      // …then refresh so server components re-render with the new dictionary.
      router.refresh();
    },
    [locale, router],
  );

  return <I18nContext.Provider value={{ locale, dict, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/** Convenience hook returning just the active dictionary. */
export function useDict(): Dictionary {
  return useI18n().dict;
}
