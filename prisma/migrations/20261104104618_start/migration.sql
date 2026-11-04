-- CreateEnum
CREATE TYPE "Rolle" AS ENUM ('ADMIN', 'LEITUNG', 'FACHKRAFT', 'VERWALTUNG');

-- CreateEnum
CREATE TYPE "KlientStatus" AS ENUM ('ANFRAGE', 'AKTIV', 'RUHEND', 'ABGESCHLOSSEN');

-- CreateEnum
CREATE TYPE "KontaktKategorie" AS ENUM ('FAMILIE', 'HILFE', 'ARZT', 'THERAPIE', 'SOZIALAMT', 'SCHULE', 'SONSTIGE');

-- CreateEnum
CREATE TYPE "Bereich" AS ENUM ('KONTAKTE', 'MEDIZIN', 'EINGANG', 'SOZIALAMT', 'STUNDEN', 'THERAPIE', 'SONSTIGES', 'ZUR_ZUORDNUNG');

-- CreateEnum
CREATE TYPE "DokumentStatus" AS ENUM ('ENTWURF', 'ZUR_FREIGABE', 'FREIGEGEBEN');

-- CreateTable
CREATE TABLE "Standort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Standort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutzer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "rolle" "Rolle" NOT NULL DEFAULT 'FACHKRAFT',
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nutzer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutzerStandort" (
    "nutzerId" TEXT NOT NULL,
    "standortId" TEXT NOT NULL,

    CONSTRAINT "NutzerStandort_pkey" PRIMARY KEY ("nutzerId","standortId")
);

-- CreateTable
CREATE TABLE "Session" (
    "tokenHash" TEXT NOT NULL,
    "nutzerId" TEXT NOT NULL,
    "laeuftAb" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "Klient" (
    "id" TEXT NOT NULL,
    "nummer" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "vorname" TEXT NOT NULL,
    "geburtsdatum" DATE,
    "geschlecht" TEXT,
    "strasse" TEXT,
    "plz" TEXT,
    "ort" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "status" "KlientStatus" NOT NULL DEFAULT 'AKTIV',
    "aufnahme" DATE,
    "ende" DATE,
    "leistung" TEXT,
    "schuleEinrichtung" TEXT,
    "standortId" TEXT NOT NULL,
    "bezugsbetreuerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Klient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kontakt" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "kategorie" "KontaktKategorie" NOT NULL,
    "rolle" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organisation" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "schweigepflichtEntbunden" BOOLEAN NOT NULL DEFAULT false,
    "entbundenBis" DATE,
    "notiz" TEXT,

    CONSTRAINT "Kontakt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnose" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "icd10" TEXT,
    "bezeichnung" TEXT NOT NULL,
    "gesichert" BOOLEAN NOT NULL DEFAULT true,
    "diagnostiziertAm" DATE,
    "diagnostiziertVon" TEXT,
    "dokumentId" TEXT,

    CONSTRAINT "Diagnose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eingangsphase" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "anfrageDatum" DATE,
    "anfrageVon" TEXT,
    "erstgespraechDatum" DATE,
    "hospitationDatum" DATE,
    "entscheidung" TEXT,
    "entscheidungDatum" DATE,
    "startdatum" DATE,
    "notiz" TEXT,

    CONSTRAINT "Eingangsphase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bewilligung" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "kostentraeger" TEXT NOT NULL,
    "aktenzeichen" TEXT,
    "sachbearbeitung" TEXT,
    "telefon" TEXT,
    "leistung" TEXT,
    "bescheidDatum" DATE,
    "von" DATE NOT NULL,
    "bis" DATE NOT NULL,
    "stundenProWoche" DECIMAL(5,2),
    "stundensatzEur" DECIMAL(8,2),

    CONSTRAINT "Bewilligung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stundennachweis" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "beginn" TEXT NOT NULL,
    "ende" TEXT NOT NULL,
    "stunden" DECIMAL(5,2) NOT NULL,
    "mitarbeiter" TEXT NOT NULL,
    "leistungsart" TEXT,
    "bemerkung" TEXT,
    "bestaetigtVon" TEXT,

    CONSTRAINT "Stundennachweis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Therapie" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "art" TEXT NOT NULL,
    "therapeut" TEXT,
    "praxis" TEXT,
    "telefon" TEXT,
    "beginn" DATE,
    "ende" DATE,
    "frequenz" TEXT,
    "verordnungBis" DATE,
    "notiz" TEXT,

    CONSTRAINT "Therapie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verlaufseintrag" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "art" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Verlaufseintrag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dokument" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "bereich" "Bereich" NOT NULL,
    "titel" TEXT NOT NULL,
    "dateiname" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "groesse" INTEGER NOT NULL,
    "speicherPfad" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "datum" DATE,
    "status" "DokumentStatus" NOT NULL DEFAULT 'FREIGEGEBEN',
    "aufbewahrenBis" DATE,
    "hochgeladenVonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dokument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Termin" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beginn" TIMESTAMP(3) NOT NULL,
    "ende" TIMESTAMP(3) NOT NULL,
    "ort" TEXT,
    "standortId" TEXT NOT NULL,
    "klientId" TEXT,
    "mitarbeiterId" TEXT,

    CONSTRAINT "Termin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aufgabe" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "faellig" DATE,
    "erledigt" BOOLEAN NOT NULL DEFAULT false,
    "standortId" TEXT NOT NULL,
    "klientId" TEXT,
    "zugewiesenId" TEXT,

    CONSTRAINT "Aufgabe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Einwilligung" (
    "id" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "zweck" TEXT NOT NULL,
    "erteiltAm" DATE NOT NULL,
    "gueltigBis" DATE,
    "widerrufenAm" DATE,
    "dokumentId" TEXT,

    CONSTRAINT "Einwilligung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zugriffsprotokoll" (
    "id" BIGSERIAL NOT NULL,
    "zeitpunkt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nutzerId" TEXT NOT NULL,
    "aktion" TEXT NOT NULL,
    "klientId" TEXT,
    "objekt" TEXT,

    CONSTRAINT "Zugriffsprotokoll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Standort_name_key" ON "Standort"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Nutzer_email_key" ON "Nutzer"("email");

-- CreateIndex
CREATE INDEX "Session_nutzerId_idx" ON "Session"("nutzerId");

-- CreateIndex
CREATE UNIQUE INDEX "Klient_nummer_key" ON "Klient"("nummer");

-- CreateIndex
CREATE INDEX "Klient_standortId_status_idx" ON "Klient"("standortId", "status");

-- CreateIndex
CREATE INDEX "Klient_nachname_vorname_idx" ON "Klient"("nachname", "vorname");

-- CreateIndex
CREATE INDEX "Kontakt_klientId_idx" ON "Kontakt"("klientId");

-- CreateIndex
CREATE INDEX "Diagnose_klientId_idx" ON "Diagnose"("klientId");

-- CreateIndex
CREATE UNIQUE INDEX "Eingangsphase_klientId_key" ON "Eingangsphase"("klientId");

-- CreateIndex
CREATE INDEX "Bewilligung_klientId_bis_idx" ON "Bewilligung"("klientId", "bis");

-- CreateIndex
CREATE INDEX "Stundennachweis_klientId_datum_idx" ON "Stundennachweis"("klientId", "datum");

-- CreateIndex
CREATE INDEX "Therapie_klientId_idx" ON "Therapie"("klientId");

-- CreateIndex
CREATE INDEX "Verlaufseintrag_klientId_datum_idx" ON "Verlaufseintrag"("klientId", "datum");

-- CreateIndex
CREATE INDEX "Dokument_klientId_bereich_idx" ON "Dokument"("klientId", "bereich");

-- CreateIndex
CREATE INDEX "Dokument_status_idx" ON "Dokument"("status");

-- CreateIndex
CREATE INDEX "Termin_standortId_beginn_idx" ON "Termin"("standortId", "beginn");

-- CreateIndex
CREATE INDEX "Aufgabe_standortId_erledigt_faellig_idx" ON "Aufgabe"("standortId", "erledigt", "faellig");

-- CreateIndex
CREATE INDEX "Einwilligung_klientId_idx" ON "Einwilligung"("klientId");

-- CreateIndex
CREATE INDEX "Zugriffsprotokoll_klientId_zeitpunkt_idx" ON "Zugriffsprotokoll"("klientId", "zeitpunkt");

-- CreateIndex
CREATE INDEX "Zugriffsprotokoll_nutzerId_zeitpunkt_idx" ON "Zugriffsprotokoll"("nutzerId", "zeitpunkt");

-- AddForeignKey
ALTER TABLE "NutzerStandort" ADD CONSTRAINT "NutzerStandort_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutzerStandort" ADD CONSTRAINT "NutzerStandort_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Klient" ADD CONSTRAINT "Klient_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Klient" ADD CONSTRAINT "Klient_bezugsbetreuerId_fkey" FOREIGN KEY ("bezugsbetreuerId") REFERENCES "Nutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kontakt" ADD CONSTRAINT "Kontakt_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnose" ADD CONSTRAINT "Diagnose_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnose" ADD CONSTRAINT "Diagnose_dokumentId_fkey" FOREIGN KEY ("dokumentId") REFERENCES "Dokument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eingangsphase" ADD CONSTRAINT "Eingangsphase_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bewilligung" ADD CONSTRAINT "Bewilligung_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stundennachweis" ADD CONSTRAINT "Stundennachweis_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Therapie" ADD CONSTRAINT "Therapie_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verlaufseintrag" ADD CONSTRAINT "Verlaufseintrag_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verlaufseintrag" ADD CONSTRAINT "Verlaufseintrag_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Nutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_hochgeladenVonId_fkey" FOREIGN KEY ("hochgeladenVonId") REFERENCES "Nutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termin" ADD CONSTRAINT "Termin_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termin" ADD CONSTRAINT "Termin_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termin" ADD CONSTRAINT "Termin_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Nutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aufgabe" ADD CONSTRAINT "Aufgabe_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aufgabe" ADD CONSTRAINT "Aufgabe_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aufgabe" ADD CONSTRAINT "Aufgabe_zugewiesenId_fkey" FOREIGN KEY ("zugewiesenId") REFERENCES "Nutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Einwilligung" ADD CONSTRAINT "Einwilligung_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "Klient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Einwilligung" ADD CONSTRAINT "Einwilligung_dokumentId_fkey" FOREIGN KEY ("dokumentId") REFERENCES "Dokument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zugriffsprotokoll" ADD CONSTRAINT "Zugriffsprotokoll_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Zugriffsprotokoll darf nur ergänzt werden: Ändern und Löschen sind gesperrt.
CREATE FUNCTION zugriffsprotokoll_unveraenderlich() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Zugriffsprotokoll darf nicht geändert oder gelöscht werden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER zugriffsprotokoll_schutz
  BEFORE UPDATE OR DELETE ON "Zugriffsprotokoll"
  FOR EACH ROW EXECUTE FUNCTION zugriffsprotokoll_unveraenderlich();
