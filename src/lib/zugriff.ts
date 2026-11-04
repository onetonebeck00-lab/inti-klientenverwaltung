import type { Bereich, Rolle } from "@prisma/client";

// Reine Regeln ohne Datenbank, damit sie einzeln getestet werden können.

export type AktuellerNutzer = {
  id: string;
  name: string;
  rolle: Rolle;
  standortIds: string[];
};

/** Darf der Nutzer eine Akte an diesem Standort überhaupt sehen? */
export function darfStandort(nutzer: AktuellerNutzer, standortId: string): boolean {
  return nutzer.standortIds.includes(standortId);
}

// Die Verwaltung sieht Stammdaten, Termine, Sozialamt und Stunden,
// aber keine Gesundheitsdaten, Therapien oder den Verlauf.
const VERWALTUNG_BEREICHE: ReadonlySet<Bereich | "VERLAUF"> = new Set([
  "KONTAKTE",
  "EINGANG",
  "SOZIALAMT",
  "STUNDEN",
  "SONSTIGES",
  "ZUR_ZUORDNUNG",
]);

/** Darf der Nutzer diesen Bereich einer (für ihn sichtbaren) Akte sehen? */
export function darfBereich(nutzer: AktuellerNutzer, bereich: Bereich | "VERLAUF"): boolean {
  if (nutzer.rolle === "VERWALTUNG") return VERWALTUNG_BEREICHE.has(bereich);
  return true;
}

/** Darf der Nutzer Daten anlegen oder ändern? */
export function darfBearbeiten(nutzer: AktuellerNutzer): boolean {
  return nutzer.rolle !== "VERWALTUNG";
}

/**
 * Welche Standorte zeigt eine Liste an? "alle" oder ein ungültiger Wert ergibt
 * alle Standorte des Nutzers; ein fremder Standort wird nie durchgelassen.
 */
export function gewaehlteStandorte(nutzer: AktuellerNutzer, auswahl?: string): string[] {
  if (auswahl && nutzer.standortIds.includes(auswahl)) return [auswahl];
  return nutzer.standortIds;
}
