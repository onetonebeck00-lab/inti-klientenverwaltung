import { db } from "./db";
import type { AktuellerNutzer } from "./zugriff";

/** Schreibt einen Eintrag ins Zugriffsprotokoll (nur anfügen, nie ändern). */
export async function protokolliere(
  nutzer: AktuellerNutzer,
  aktion: string,
  klientId?: string,
  objekt?: string,
): Promise<void> {
  await db.zugriffsprotokoll.create({
    data: { nutzerId: nutzer.id, aktion, klientId, objekt },
  });
}
