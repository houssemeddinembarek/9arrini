import type { Locale } from "../config";
import { DEFAULT_LOCALE } from "../config";
import fr from "./fr";

// The French dictionary defines the canonical shape every locale must match.
export type Dictionary = typeof fr;

// Dictionaries are small and shared between server and client (the active one is
// serialized into the I18n context), so we import them statically rather than
// lazily — this keeps `getDictionary` synchronous and usable in any environment.
import en from "./en";
import ar from "./ar";

const dictionaries: Record<Locale, Dictionary> = { fr, en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
