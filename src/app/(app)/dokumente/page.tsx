import Link from "next/link";
import type { Bereich, DokumentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { nutzerOderLogin } from "@/lib/auth";
import { darfBereich } from "@/lib/zugriff";
import { fDatum } from "@/lib/format";

const BEREICHE: Bereich[] = ["KONTAKTE", "MEDIZIN", "EINGANG", "SOZIALAMT", "STUNDEN", "THERAPIE", "SONSTIGES", "ZUR_ZUORDNUNG"];
const BEREICH_TEXT: Record<Bereich, string> = {
  KONTAKTE: "Kontakte", MEDIZIN: "Arztberichte", EINGANG: "Eingangsphase", SOZIALAMT: "Sozialamt",
  STUNDEN: "Stunden", THERAPIE: "Therapie", SONSTIGES: "Sonstiges", ZUR_ZUORDNUNG: "Zur Zuordnung",
};
const STATUS: Record<DokumentStatus, { text: string; klasse: string }> = {
  ENTWURF: { text: "Entwurf", klasse: "marker-neutral" },
  ZUR_FREIGABE: { text: "Zur Freigabe", klasse: "marker-warnung" },
  FREIGEGEBEN: { text: "Freigegeben", klasse: "marker-akzent" },
};

export default async function Dokumente({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const nutzer = await nutzerOderLogin();
  const { status } = await searchParams;
  const nurFreigabe = status === "ZUR_FREIGABE";
  const dokumente = await db.dokument.findMany({
    where: {
      klient: { standortId: { in: nutzer.standortIds } },
      bereich: { in: BEREICHE.filter((b) => darfBereich(nutzer, b)) },
      ...(nurFreigabe && { status: "ZUR_FREIGABE" as const }),
    },
    include: { klient: true, hochgeladenVon: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <header>
        <h1 style={{ margin: 0, fontSize: 32 }}>Dokumente</h1>
        <p className="leise" style={{ margin: "4px 0 0" }}>{dokumente.length} Dokumente</p>
      </header>
      <div className="schalter" role="group" aria-label="Filter">
        <Link href="/dokumente" aria-current={!nurFreigabe ? "true" : undefined}>Alle</Link>
        <Link href="/dokumente?status=ZUR_FREIGABE" aria-current={nurFreigabe ? "true" : undefined}>Zur Freigabe</Link>
      </div>
      <div className="karte-tabelle">
        <table className="tabelle">
          <thead><tr><th scope="col">Dokument</th><th scope="col">Klient</th><th scope="col">Bereich</th><th scope="col">Geändert</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {dokumente.map((d) => (
              <tr key={d.id}>
                <td className="fett">{d.titel}</td>
                <td><Link href={`/klienten/${d.klientId}?bereich=dokumente`}>{d.klient.vorname} {d.klient.nachname}</Link></td>
                <td>{BEREICH_TEXT[d.bereich]}</td>
                <td>{fDatum(d.createdAt)}<div className="klein leise">{d.hochgeladenVon.name}</div></td>
                <td><span className={`marker ${STATUS[d.status].klasse}`}>{STATUS[d.status].text}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {dokumente.length === 0 && <p className="leise" style={{ padding: "32px 20px", margin: 0, textAlign: "center" }}>Keine Dokumente gefunden.</p>}
      </div>
      <p className="klein leise" style={{ margin: 0 }}>Hochladen, Herunterladen und der Ordner-Import folgen im nächsten Schritt.</p>
    </>
  );
}
