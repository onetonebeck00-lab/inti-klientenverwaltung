import Link from "next/link";
import type { KlientStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { nutzerOderLogin } from "@/lib/auth";
import { gewaehlteStandorte } from "@/lib/zugriff";
import { fDatum, kuerzel } from "@/lib/format";
import { StandortSchalter } from "@/components/StandortSchalter";

const STATUS: Record<KlientStatus, { text: string; klasse: string }> = {
  AKTIV: { text: "Aktiv", klasse: "marker-akzent" },
  ANFRAGE: { text: "Anfrage", klasse: "marker-info" },
  RUHEND: { text: "Ruhend", klasse: "marker-neutral" },
  ABGESCHLOSSEN: { text: "Abgeschlossen", klasse: "marker-neutral" },
};
const FILTER = [
  { wert: "AKTIV", text: "Aktiv" },
  { wert: "ANFRAGE", text: "Anfragen" },
  { wert: "alle", text: "Alle" },
] as const;

type Suche = { q?: string; standort?: string; status?: string };

export default async function Klientenliste({ searchParams }: { searchParams: Promise<Suche> }) {
  const nutzer = await nutzerOderLogin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = FILTER.some((f) => f.wert === sp.status) ? sp.status! : "AKTIV";
  const ids = gewaehlteStandorte(nutzer, sp.standort);

  const where: Prisma.KlientWhereInput = {
    standortId: { in: ids },
    ...(status !== "alle" && { status: status as KlientStatus }),
    ...(q && {
      OR: [
        { nachname: { contains: q, mode: "insensitive" } },
        { vorname: { contains: q, mode: "insensitive" } },
        { nummer: { contains: q, mode: "insensitive" } },
        { bezugsbetreuer: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const jetzt = new Date();
  const [standorte, klienten] = await Promise.all([
    db.standort.findMany({ where: { id: { in: nutzer.standortIds } }, orderBy: { name: "asc" } }),
    db.klient.findMany({
      where,
      include: {
        standort: true,
        bezugsbetreuer: true,
        termine: { where: { beginn: { gte: jetzt } }, orderBy: { beginn: "asc" }, take: 1 },
        einwilligungen: { where: { widerrufenAm: null }, orderBy: { gueltigBis: "desc" }, take: 1 },
      },
      orderBy: [{ nachname: "asc" }, { vorname: "asc" }],
      take: 200,
    }),
  ]);

  const statusLink = (wert: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (sp.standort) p.set("standort", sp.standort);
    if (wert !== "AKTIV") p.set("status", wert);
    const s = p.toString();
    return s ? `/klienten?${s}` : "/klienten";
  };

  return (
    <>
      <header className="zeile zwischen" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Klienten</h1>
          <p className="leise" style={{ margin: "4px 0 0" }}>{klienten.length === 1 ? "1 Klient" : `${klienten.length} Klienten`}</p>
        </div>
      </header>

      <div className="zeile">
        <form className="suche" role="search">
          <label className="nur-lesbar" htmlFor="q">Klienten durchsuchen</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Name, Nummer oder Bezugsbetreuer" />
          {sp.standort && <input type="hidden" name="standort" value={sp.standort} />}
          {status !== "AKTIV" && <input type="hidden" name="status" value={status} />}
        </form>
        <StandortSchalter pfad="/klienten" standorte={standorte} aktiv={sp.standort} weitere={{ q: q || undefined, status: status !== "AKTIV" ? status : undefined }} />
        <div className="schalter" role="group" aria-label="Status">
          {FILTER.map((f) => (
            <Link key={f.wert} href={statusLink(f.wert)} aria-current={status === f.wert ? "true" : undefined}>{f.text}</Link>
          ))}
        </div>
      </div>

      <div className="karte-tabelle">
        <table className="tabelle">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Standort</th>
              <th scope="col">Bezugsbetreuer</th>
              <th scope="col">Nächster Termin</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {klienten.map((k) => {
              const ew = k.einwilligungen[0];
              const ewAbgelaufen = !ew || (ew.gueltigBis && ew.gueltigBis < jetzt);
              return (
                <tr key={k.id}>
                  <td>
                    <Link href={`/klienten/${k.id}`} style={{ display: "flex", alignItems: "center", gap: 12, color: "inherit", textDecoration: "none" }}>
                      <span className="avatar" style={{ width: 40, height: 40 }}>{kuerzel(k.vorname, k.nachname)}</span>
                      <span>
                        <span className="fett" style={{ display: "block", textDecoration: "underline", textUnderlineOffset: 3 }}>{k.nachname}, {k.vorname}</span>
                        <span className="klein leise">{k.nummer} · geb. {fDatum(k.geburtsdatum)}</span>
                      </span>
                    </Link>
                  </td>
                  <td>{k.standort.name}</td>
                  <td>{k.bezugsbetreuer?.name ?? "–"}</td>
                  <td>{k.termine[0] ? fDatum(k.termine[0].beginn) : "–"}</td>
                  <td>
                    <span className={`marker ${STATUS[k.status].klasse}`}>{STATUS[k.status].text}</span>
                    {k.status === "AKTIV" && ewAbgelaufen && <div className="klein text-warnung" style={{ marginTop: 4 }}>Einwilligung fehlt oder abgelaufen</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {klienten.length === 0 && <p className="leise" style={{ padding: "32px 20px", margin: 0, textAlign: "center" }}>Keine Klienten gefunden. Suche oder Filter anpassen.</p>}
      </div>
    </>
  );
}
