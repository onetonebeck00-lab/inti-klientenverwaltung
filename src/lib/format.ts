// Deutsche Darstellung von Datum und Zahlen, unabhängig von der Server-Sprache.
const datum = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });
const tagKurz = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Berlin" });
const uhrzeit = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const langesDatum = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });

export const fDatum = (d?: Date | null) => (d ? datum.format(d) : "–");
export const fTag = (d: Date) => tagKurz.format(d);
export const fZeit = (d: Date) => uhrzeit.format(d);
export const fLang = (d: Date) => langesDatum.format(d);
export const fZahl = (n: number | { toString(): string }) =>
  Number(n.toString()).toLocaleString("de-DE", { maximumFractionDigits: 2 });

export const kuerzel = (vorname: string, nachname: string) => `${vorname[0] ?? ""}${nachname[0] ?? ""}`.toUpperCase();
