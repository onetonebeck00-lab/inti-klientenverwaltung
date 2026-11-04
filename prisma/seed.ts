// Testdaten für die Entwicklung. Alle Personen sind erfunden.
// Aufruf: npm run db:seed  (löscht vorher alle Daten außer dem Zugriffsprotokoll).
// Läuft mit TZ=Europe/Berlin, damit Termine zur richtigen Uhrzeit liegen.
import { PrismaClient, type Bereich, type KontaktKategorie } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const PASSWORT = process.env.SEED_PASSWORT ?? "Inti-Test-2026!";

const tag = (offset: number, h = 0, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};
// Reine Datumsfelder (@db.Date) werden als UTC-Mitternacht des Kalendertags gespeichert.
const datum = (offset: number) => {
  const d = tag(offset);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};
const iso = (s: string) => new Date(`${s}T00:00:00Z`);

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Testdaten nie in Produktion laden.");

  // Reihenfolge wegen Fremdschlüsseln
  await db.$transaction([
    db.diagnose.deleteMany(), db.einwilligung.deleteMany(), db.dokument.deleteMany(),
    db.kontakt.deleteMany(), db.eingangsphase.deleteMany(), db.bewilligung.deleteMany(),
    db.stundennachweis.deleteMany(), db.therapie.deleteMany(), db.verlaufseintrag.deleteMany(),
    db.termin.deleteMany(), db.aufgabe.deleteMany(), db.klient.deleteMany(), db.session.deleteMany(),
  ]);

  const hagen = await db.standort.upsert({ where: { name: "Hagen" }, update: {}, create: { name: "Hagen" } });
  const dortmund = await db.standort.upsert({ where: { name: "Dortmund" }, update: {}, create: { name: "Dortmund" } });
  const hash = await bcrypt.hash(PASSWORT, 12);

  const nutzer = async (email: string, name: string, rolle: "ADMIN" | "LEITUNG" | "FACHKRAFT" | "VERWALTUNG", standorte: string[]) =>
    db.nutzer.upsert({
      where: { email },
      update: { name, rolle, passwortHash: hash, standorte: { deleteMany: {}, create: standorte.map((standortId) => ({ standortId })) } },
      create: { email, name, rolle, passwortHash: hash, standorte: { create: standorte.map((standortId) => ({ standortId })) } },
    });

  await nutzer("admin@inti.test", "Admin", "ADMIN", [hagen.id, dortmund.id]);
  const frank = await nutzer("frank@inti.test", "Frank", "LEITUNG", [hagen.id, dortmund.id]);
  const yilmaz = await nutzer("s.yilmaz@inti.test", "S. Yilmaz", "FACHKRAFT", [hagen.id]);
  const krueger = await nutzer("t.krueger@inti.test", "T. Krüger", "FACHKRAFT", [hagen.id]);
  const wagner = await nutzer("m.wagner@inti.test", "M. Wagner", "FACHKRAFT", [dortmund.id]);
  await nutzer("verwaltung@inti.test", "Verwaltung", "VERWALTUNG", [hagen.id, dortmund.id]);

  const klienten = [
    { nummer: "K-0001", vorname: "Ali", nachname: "Demir", geb: "1994-03-12", standort: hagen, betreuer: krueger },
    { nummer: "K-0002", vorname: "Jonas", nachname: "Becker", geb: "2001-07-08", standort: hagen, betreuer: yilmaz },
    { nummer: "K-0003", vorname: "Lena", nachname: "Hoffmann", geb: "1988-11-21", standort: dortmund, betreuer: wagner },
    { nummer: "K-0004", vorname: "Marie", nachname: "Schulte", geb: "1997-01-30", standort: dortmund, betreuer: frank },
    { nummer: "K-0005", vorname: "Paul", nachname: "Richter", geb: "1979-05-17", standort: dortmund, betreuer: frank, status: "ANFRAGE" as const },
    { nummer: "K-0006", vorname: "Sofia", nachname: "Nowak", geb: "1990-09-03", standort: hagen, betreuer: yilmaz },
    { nummer: "K-0007", vorname: "Tim", nachname: "Wolff", geb: "2003-12-25", standort: dortmund, betreuer: wagner },
    { nummer: "K-0008", vorname: "Emine", nachname: "Kaya", geb: "1985-04-14", standort: hagen, betreuer: krueger },
    { nummer: "K-0009", vorname: "Lukas", nachname: "Brandt", geb: "1992-06-06", standort: dortmund, betreuer: frank, status: "RUHEND" as const },
  ];
  const k: Record<string, string> = {};
  for (const x of klienten) {
    const c = await db.klient.create({
      data: {
        nummer: x.nummer, vorname: x.vorname, nachname: x.nachname, geburtsdatum: iso(x.geb),
        status: x.status ?? "AKTIV", standortId: x.standort.id, bezugsbetreuerId: x.betreuer.id,
        leistung: "Teilhabeassistenz", aufnahme: iso("2024-04-01"),
        ort: x.standort.name, plz: x.standort.name === "Hagen" ? "58095" : "44135", strasse: "Musterstraße 12",
      },
    });
    k[x.nachname] = c.id;
  }

  // Ausführliche Beispielakte: Marie Schulte
  const marie = k.Schulte;
  const kontakte: { kategorie: KontaktKategorie; rolle: string; name: string; telefon: string; entbunden?: boolean; notiz?: string }[] = [
    { kategorie: "FAMILIE", rolle: "Mutter", name: "Sabine Schulte", telefon: "0231 111111", notiz: "Hauptansprechpartnerin" },
    { kategorie: "FAMILIE", rolle: "Bruder", name: "Jan Schulte", telefon: "0170 0000000", notiz: "Nur in Absprache mit Marie" },
    { kategorie: "ARZT", rolle: "Hausarzt", name: "Praxis Dr. Beispiel", telefon: "0231 222222", entbunden: true },
    { kategorie: "THERAPIE", rolle: "Ergotherapie", name: "Ergopraxis Beispiel", telefon: "0231 444444", entbunden: true },
    { kategorie: "SOZIALAMT", rolle: "Sachbearbeitung", name: "Frau Beispiel, Sozialamt Dortmund", telefon: "0231 333333" },
    { kategorie: "HILFE", rolle: "Agentur für Arbeit", name: "Reha-Beratung", telefon: "0231 555555" },
  ];
  await db.kontakt.createMany({
    data: kontakte.map((c) => ({
      klientId: marie, kategorie: c.kategorie, rolle: c.rolle, name: c.name, telefon: c.telefon, notiz: c.notiz,
      schweigepflichtEntbunden: c.entbunden ?? false, entbundenBis: c.entbunden ? iso("2027-04-15") : null,
    })),
  });
  await db.diagnose.createMany({
    data: [
      { klientId: marie, icd10: "F84.5", bezeichnung: "Asperger-Syndrom", diagnostiziertAm: iso("2015-03-10"), diagnostiziertVon: "SPZ Beispiel" },
      { klientId: marie, icd10: "F41.1", bezeichnung: "Generalisierte Angststörung", diagnostiziertAm: iso("2023-06-22"), diagnostiziertVon: "Psychiatrische Ambulanz" },
    ],
  });
  await db.eingangsphase.create({
    data: {
      klientId: marie, anfrageDatum: iso("2024-02-05"), anfrageVon: "Mutter", erstgespraechDatum: iso("2024-02-14"),
      hospitationDatum: iso("2024-03-01"), entscheidung: "aufgenommen", entscheidungDatum: iso("2024-03-05"), startdatum: iso("2024-04-01"),
    },
  });
  await db.bewilligung.createMany({
    data: [
      { klientId: marie, kostentraeger: "Sozialamt Dortmund", aktenzeichen: "AZ-0000", leistung: "Teilhabeassistenz", von: iso("2025-08-01"), bis: iso("2027-07-31"), stundenProWoche: 20, bescheidDatum: iso("2025-07-20") },
      { klientId: marie, kostentraeger: "Sozialamt Dortmund", aktenzeichen: "AZ-0000", leistung: "Teilhabeassistenz", von: iso("2024-04-01"), bis: iso("2025-07-31"), stundenProWoche: 15, bescheidDatum: iso("2024-03-25") },
    ],
  });
  await db.stundennachweis.createMany({
    data: [
      { klientId: marie, datum: datum(-2), beginn: "08:00", ende: "12:00", stunden: 4, mitarbeiter: "Frank", bestaetigtVon: "Marie Schulte" },
      { klientId: marie, datum: datum(-1), beginn: "09:00", ende: "13:30", stunden: 4.5, mitarbeiter: "M. Wagner", bestaetigtVon: "Marie Schulte" },
      { klientId: marie, datum: datum(0), beginn: "09:30", ende: "12:30", stunden: 3, mitarbeiter: "Frank" },
    ],
  });
  await db.therapie.createMany({
    data: [
      { klientId: marie, art: "Ergotherapie", praxis: "Ergopraxis Beispiel, Dortmund", frequenz: "1x pro Woche", beginn: iso("2025-01-10"), verordnungBis: iso("2026-12-31") },
      { klientId: marie, art: "Psychotherapie", praxis: "Praxis Beispiel, Dortmund", frequenz: "alle 2 Wochen", beginn: iso("2023-09-01"), verordnungBis: iso("2027-06-30") },
    ],
  });
  await db.verlaufseintrag.createMany({
    data: [
      { klientId: marie, autorId: frank.id, datum: tag(-2, 10), art: "Gespräch", text: "Wohnungssuche besprochen. Marie hat zwei Besichtigungen vereinbart." },
      { klientId: marie, autorId: wagner.id, datum: tag(-7, 14), art: "Begleitung", text: "Termin bei der Agentur für Arbeit, Beratung zu Ausbildungsberufen." },
      { klientId: marie, autorId: frank.id, datum: tag(-14, 9), art: "Telefonat", text: "Rückruf Sozialamt: Weiterbewilligung wird bearbeitet." },
    ],
  });
  await db.einwilligung.create({ data: { klientId: marie, zweck: "Datenverarbeitung", erteiltAm: iso("2025-04-15"), gueltigBis: iso("2027-04-15") } });
  await db.einwilligung.create({ data: { klientId: k.Becker, zweck: "Datenverarbeitung", erteiltAm: iso("2024-11-01"), gueltigBis: datum(-2) } });
  await db.einwilligung.create({ data: { klientId: k.Nowak, zweck: "Datenverarbeitung", erteiltAm: iso("2023-11-20"), gueltigBis: datum(16) } });

  const dok = (klientId: string, bereich: Bereich, titel: string, status: "ENTWURF" | "ZUR_FREIGABE" | "FREIGEGEBEN", von: string) =>
    db.dokument.create({
      data: {
        klientId, bereich, titel, dateiname: `${titel}.pdf`, mimeType: "application/pdf", groesse: 120000,
        speicherPfad: `seed/${klientId}/${titel}.pdf`, sha256: "0".repeat(64), datum: datum(-3), status, hochgeladenVonId: von,
      },
    });
  await dok(marie, "SOZIALAMT", "Bewilligungsbescheid 2025–2027", "FREIGEGEBEN", frank.id);
  await dok(marie, "MEDIZIN", "Befundbericht Psychiatrische Ambulanz", "FREIGEGEBEN", frank.id);
  await dok(marie, "SONSTIGES", "Entwicklungsbericht Entwurf", "ZUR_FREIGABE", frank.id);
  await dok(k.Demir, "SOZIALAMT", "Hilfeplan Fortschreibung", "ZUR_FREIGABE", krueger.id);
  await dok(k.Hoffmann, "SONSTIGES", "Verlaufsbericht Oktober", "ZUR_FREIGABE", wagner.id);

  const termin = (titel: string, h: number, m: number, dauerMin: number, standortId: string, klientId: string | null, mitarbeiterId: string, ort: string) =>
    db.termin.create({ data: { titel, beginn: tag(0, h, m), ende: new Date(tag(0, h, m).getTime() + dauerMin * 60000), standortId, klientId, mitarbeiterId, ort } });
  await termin("Einzelgespräch", 8, 30, 45, hagen.id, k.Becker, yilmaz.id, "Raum 2");
  await termin("Hilfeplangespräch", 9, 30, 60, dortmund.id, marie, frank.id, "Besprechungsraum");
  await termin("Hausbesuch", 11, 0, 90, hagen.id, k.Demir, krueger.id, "Wohnung des Klienten");
  await termin("Begleitung zum Amt", 14, 0, 120, dortmund.id, k.Hoffmann, wagner.id, "Jobcenter Dortmund");
  await termin("Gruppenangebot Kochen", 15, 30, 90, hagen.id, null, yilmaz.id, "Küche");
  await termin("Erstgespräch", 16, 30, 60, dortmund.id, k.Richter, frank.id, "Raum 1");

  await db.aufgabe.createMany({
    data: [
      { text: "Einwilligung von Jonas Becker erneuern", faellig: datum(-2), standortId: hagen.id, klientId: k.Becker, zugewiesenId: yilmaz.id },
      { text: "Entwicklungsbericht für Marie Schulte schreiben", faellig: datum(0), standortId: dortmund.id, klientId: marie, zugewiesenId: frank.id },
      { text: "Erstgespräch mit Paul Richter vorbereiten", faellig: datum(0), standortId: dortmund.id, klientId: k.Richter, zugewiesenId: frank.id },
      { text: "Hilfeplan von Ali Demir an den Kostenträger senden", faellig: datum(2), standortId: hagen.id, klientId: k.Demir, zugewiesenId: krueger.id },
      { text: "Stunden für den Vormonat abschließen", faellig: datum(2), standortId: dortmund.id, zugewiesenId: wagner.id },
    ],
  });

  console.log(`Testdaten geladen. Anmeldung z. B. mit frank@inti.test / ${process.env.SEED_PASSWORT ? "(SEED_PASSWORT)" : PASSWORT}`);
}

main().finally(() => db.$disconnect());
