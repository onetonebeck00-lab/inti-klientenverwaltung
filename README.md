# Inti Klientenverwaltung

Webanwendung für die Klientenverwaltung der Inti Inklusiv GmbH (Standorte Hagen und Dortmund): Klientenakten, Termine, Dokumente und Stundennachweise.

> Entwicklungsstand: Grundgerüst. Es enthält nur erfundene Testdaten. Echte Klientendaten erst nach Abschluss von Hosting, Auftragsverarbeitungsvertrag und Datenschutz-Folgenabschätzung einspielen.

## Funktionen in diesem Stand

- Anmeldung mit E-Mail und Passwort, Sitzungen serverseitig gespeichert (nur Hash des Tokens in der Datenbank)
- Rollen: Administration, Leitung, Fachkraft, Verwaltung
- Zugriff nur auf Akten der eigenen Standorte; fremde Akten verhalten sich wie nicht vorhanden
- Die Verwaltung sieht keine Gesundheitsdaten, Therapien und Verlaufseinträge
- Jeder Aufruf einer Akte wird im Zugriffsprotokoll gespeichert; das Protokoll kann per Datenbank-Trigger weder geändert noch gelöscht werden
- Übersicht mit Terminen des Tages, Aufgaben und Fristen, Dokumenten zur Freigabe und Datenschutz-Hinweisen, umschaltbar nach Standort
- Klientenliste mit Suche und Filtern
- Klientenakte mit den Bereichen Kontakte, Arztberichte und Diagnosen, Eingangsphase, Sozialamt, Stunden, Therapie, Verlauf und Dokumente
- Wochenkalender und Dokumentenliste (nur Anzeige)

Noch offen: Zwei-Faktor-Anmeldung, Anlegen und Bearbeiten von Daten, Datei-Upload mit Verschlüsselung, Ordner-Import, Nutzerverwaltung.

## Technik

Next.js 16 (App Router, TypeScript), PostgreSQL 16, Prisma 6, Vitest.

## Lokal starten

Voraussetzungen: Node.js 22 und eine PostgreSQL-Datenbank (z. B. per `docker compose up -d db`).

```bash
cp .env.example .env
npm install
npm run db:migrate     # Tabellen anlegen
npm run db:seed        # Testdaten laden (löscht vorhandene Testdaten)
npm run dev            # http://localhost:3000
```

Testzugänge (Passwort `Inti-Test-2026!`, änderbar über `SEED_PASSWORT`):

| E-Mail | Rolle | Standorte |
| --- | --- | --- |
| frank@inti.test | Leitung | Hagen, Dortmund |
| s.yilmaz@inti.test | Fachkraft | Hagen |
| m.wagner@inti.test | Fachkraft | Dortmund |
| verwaltung@inti.test | Verwaltung | Hagen, Dortmund |
| admin@inti.test | Administration | Hagen, Dortmund |

## Prüfen

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Hinweise für den Betrieb

- Der Server muss mit `TZ=Europe/Berlin` laufen (in den npm-Skripten gesetzt), sonst stimmen Uhrzeiten und Fälligkeiten nicht.
- Die Schrift wird beim Build eingebunden und vom eigenen Server ausgeliefert, es gehen keine Anfragen an Google.
- Datenmodell und Datenschutzkonzept: siehe Architekturdokument im Projekt.
