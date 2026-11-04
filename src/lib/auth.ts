import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { AktuellerNutzer } from "./zugriff";

const COOKIE = "inti_session";
const STUNDEN = Number(process.env.SESSION_STUNDEN ?? 10);

// Gültiger Hash für den Vergleich bei unbekannter E-Mail (gleiche Rechenzeit).
const DUMMY_HASH = bcrypt.hashSync("kein-passwort", 12);

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Prüft E-Mail und Passwort und legt bei Erfolg eine Session an. */
export async function anmelden(email: string, passwort: string): Promise<boolean> {
  const nutzer = await db.nutzer.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Auch bei unbekannter E-Mail einen Vergleich rechnen, damit die Antwortzeit nichts verrät.
  const ok = await bcrypt.compare(passwort, nutzer?.passwortHash ?? DUMMY_HASH);
  if (!nutzer || !nutzer.aktiv || !ok) return false;

  const token = randomBytes(32).toString("base64url");
  const laeuftAb = new Date(Date.now() + STUNDEN * 3600 * 1000);
  await db.session.create({ data: { tokenHash: hash(token), nutzerId: nutzer.id, laeuftAb } });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: laeuftAb,
  });
  await db.zugriffsprotokoll.create({ data: { nutzerId: nutzer.id, aktion: "anmeldung" } });
  return true;
}

export async function abmelden(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(COOKIE);
}

/** Liefert den angemeldeten Nutzer oder null. */
export async function aktuellerNutzer(): Promise<AktuellerNutzer | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { nutzer: { include: { standorte: true } } },
  });
  if (!session || session.laeuftAb < new Date() || !session.nutzer.aktiv) return null;
  const n = session.nutzer;
  return { id: n.id, name: n.name, rolle: n.rolle, standortIds: n.standorte.map((s) => s.standortId) };
}

/** Für geschützte Seiten: ohne Anmeldung zur Login-Seite. */
export async function nutzerOderLogin(): Promise<AktuellerNutzer> {
  const nutzer = await aktuellerNutzer();
  if (!nutzer) redirect("/login");
  return nutzer;
}
