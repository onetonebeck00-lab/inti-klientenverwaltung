import Link from "next/link";
import { db } from "@/lib/db";
import { nutzerOderLogin } from "@/lib/auth";
import { gewaehlteStandorte } from "@/lib/zugriff";
import { fTag, fZeit } from "@/lib/format";
import { StandortSchalter } from "@/components/StandortSchalter";

/** Montag 00:00 der Woche, in der `d` liegt. */
function wochenbeginn(d: Date) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export default async function Kalender({ searchParams }: { searchParams: Promise<{ standort?: string; woche?: string }> }) {
  const nutzer = await nutzerOderLogin();
  const sp = await searchParams;
  const ids = gewaehlteStandorte(nutzer, sp.standort);
  const versatz = Number.parseInt(sp.woche ?? "0", 10) || 0;
  const start = wochenbeginn(new Date());
  start.setDate(start.getDate() + versatz * 7);
  const tage = Array.from({ length: 5 }, (_, i) => { const t = new Date(start); t.setDate(t.getDate() + i); return t; });
  const ende = new Date(start); ende.setDate(ende.getDate() + 7);

  const [standorte, termine] = await Promise.all([
    db.standort.findMany({ where: { id: { in: nutzer.standortIds } }, orderBy: { name: "asc" } }),
    db.termin.findMany({ where: { standortId: { in: ids }, beginn: { gte: start, lt: ende } }, include: { klient: true, mitarbeiter: true, standort: true }, orderBy: { beginn: "asc" } }),
  ]);
  const heute = new Date().toDateString();
  const wochenLink = (w: number) => {
    const p = new URLSearchParams();
    if (sp.standort) p.set("standort", sp.standort);
    if (w) p.set("woche", String(w));
    const s = p.toString();
    return s ? `/kalender?${s}` : "/kalender";
  };

  return (
    <>
      <header className="zeile zwischen" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Kalender</h1>
          <p className="leise" style={{ margin: "4px 0 0" }}>{fTag(tage[0])} bis {fTag(tage[4])}</p>
        </div>
        <div className="zeile">
          <Link className="knopf knopf-zweit" href={wochenLink(versatz - 1)} aria-label="Vorige Woche">←</Link>
          <Link className="knopf knopf-zweit" href={wochenLink(0)}>Heute</Link>
          <Link className="knopf knopf-zweit" href={wochenLink(versatz + 1)} aria-label="Nächste Woche">→</Link>
        </div>
      </header>
      <StandortSchalter pfad="/kalender" standorte={standorte} aktiv={sp.standort} weitere={{ woche: versatz ? String(versatz) : undefined }} />
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, minWidth: 900 }}>
          {tage.map((t) => {
            const liste = termine.filter((x) => x.beginn.toDateString() === t.toDateString());
            const istHeute = t.toDateString() === heute;
            return (
              <section key={t.toISOString()} className="karte" style={{ padding: 16, minHeight: 380, borderWidth: istHeute ? 2 : 1, borderColor: istHeute ? "var(--akzent)" : undefined }}>
                <h2 style={{ fontSize: 16, color: istHeute ? "var(--akzent)" : undefined }}>{fTag(t)}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {liste.length === 0 && <p className="klein leise" style={{ margin: 0 }}>Keine Termine</p>}
                  {liste.map((x) => {
                    const inhalt = (
                      <>
                        <span className="klein fett">{fZeit(x.beginn)}</span>
                        <span className="fett">{x.titel}</span>
                        {x.klient && <span className="klein">{x.klient.vorname} {x.klient.nachname}</span>}
                        {x.mitarbeiter && <span className="klein leise">{x.mitarbeiter.name}</span>}
                      </>
                    );
                    const stil = { display: "flex", flexDirection: "column" as const, gap: 2, padding: "10px 12px", borderRadius: 10, color: "var(--text)", textDecoration: "none", background: x.standort.name === "Hagen" ? "var(--akzent-hell)" : "var(--info-hell)", borderLeft: `4px solid ${x.standort.name === "Hagen" ? "var(--akzent)" : "var(--info)"}` };
                    return x.klient
                      ? <Link key={x.id} href={`/klienten/${x.klient.id}`} style={stil}>{inhalt}</Link>
                      : <div key={x.id} style={stil}>{inhalt}</div>;
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
