import Link from "next/link";
import { db } from "@/lib/db";
import { nutzerOderLogin } from "@/lib/auth";
import { gewaehlteStandorte } from "@/lib/zugriff";
import { fDatum, fLang, fZeit, kuerzel } from "@/lib/format";
import { StandortSchalter } from "@/components/StandortSchalter";

const tagesbeginn = (offset = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ standort?: string }> }) {
  const nutzer = await nutzerOderLogin();
  const { standort } = await searchParams;
  const ids = gewaehlteStandorte(nutzer, standort);
  const heute = tagesbeginn();
  const morgen = tagesbeginn(1);
  const in30 = tagesbeginn(30);

  const [standorte, termine, aufgaben, freigaben, klientenJeStandort, einwilligungen, zuletzt] = await Promise.all([
    db.standort.findMany({ where: { id: { in: nutzer.standortIds } }, orderBy: { name: "asc" } }),
    db.termin.findMany({
      where: { standortId: { in: ids }, beginn: { gte: heute, lt: morgen } },
      include: { klient: true, mitarbeiter: true, standort: true },
      orderBy: { beginn: "asc" },
    }),
    db.aufgabe.findMany({ where: { standortId: { in: ids }, erledigt: false }, orderBy: [{ faellig: "asc" }] }),
    db.dokument.count({ where: { status: "ZUR_FREIGABE", klient: { standortId: { in: ids } } } }),
    db.klient.groupBy({ by: ["standortId"], where: { standortId: { in: ids }, status: "AKTIV" }, _count: true }),
    db.einwilligung.count({ where: { widerrufenAm: null, gueltigBis: { lte: in30 }, klient: { standortId: { in: ids }, status: "AKTIV" } } }),
    db.zugriffsprotokoll.findMany({
      where: { nutzerId: nutzer.id, aktion: "akte.ansehen", klientId: { not: null } },
      orderBy: { zeitpunkt: "desc" },
      take: 30,
      select: { klientId: true },
    }),
  ]);

  const zuletztIds = [...new Set(zuletzt.map((z) => z.klientId!))].slice(0, 4);
  const zuletztKlienten = (await db.klient.findMany({ where: { id: { in: zuletztIds }, standortId: { in: nutzer.standortIds } }, include: { standort: true } }))
    .sort((a, b) => zuletztIds.indexOf(a.id) - zuletztIds.indexOf(b.id));

  const aktiveKlienten = klientenJeStandort.reduce((s, g) => s + g._count, 0);
  const ueberfaellig = aufgaben.filter((a) => a.faellig && a.faellig < heute).length;
  const name = (id: string) => standorte.find((s) => s.id === id)?.name ?? "";
  const stunde = new Date().getHours();
  const gruss = stunde < 11 ? "Guten Morgen" : stunde < 18 ? "Guten Tag" : "Guten Abend";

  return (
    <>
      <header className="zeile zwischen" style={{ alignItems: "flex-end" }}>
        <div>
          <p className="leise" style={{ margin: 0 }}>{fLang(new Date())}</p>
          <h1 style={{ margin: "4px 0 0", fontSize: 32 }}>{gruss}, {nutzer.name}</h1>
        </div>
        <div className="zeile">
          <form action="/klienten" className="suche" role="search">
            <label className="nur-lesbar" htmlFor="suche">Klienten suchen</label>
            <input id="suche" name="q" type="search" placeholder="Klient suchen" />
          </form>
          <Link className="knopf" href="/klienten">Klienten</Link>
        </div>
      </header>

      <StandortSchalter pfad="/" standorte={standorte} aktiv={standort} />

      <section className="kacheln" aria-label="Kennzahlen">
        <Link className="kachel" href="/kalender">
          <span className="leise">Termine heute</span>
          <span className="kachel-zahl">{termine.length}</span>
          <span className="klein leise">{termine[0] ? `nächster um ${fZeit(termine[0].beginn)}` : "keine weiteren"}</span>
        </Link>
        <a className="kachel" href="#aufgaben">
          <span className="leise">Offene Aufgaben</span>
          <span className="kachel-zahl">{aufgaben.length}</span>
          <span className="klein text-kritisch">{ueberfaellig ? `${ueberfaellig} überfällig` : ""}</span>
        </a>
        <Link className="kachel" href="/dokumente?status=ZUR_FREIGABE">
          <span className="leise">Dokumente zur Freigabe</span>
          <span className="kachel-zahl">{freigaben}</span>
          <span className="klein leise">warten auf Prüfung</span>
        </Link>
        <Link className="kachel" href="/klienten">
          <span className="leise">Aktive Klienten</span>
          <span className="kachel-zahl">{aktiveKlienten}</span>
          <span className="klein leise">{klientenJeStandort.map((g) => `${g._count} in ${name(g.standortId)}`).join(", ")}</span>
        </Link>
      </section>

      <div className="spalten">
        <section className="karte spalte-breit" aria-labelledby="h-heute" style={{ gap: 0 }}>
          <div className="zeile zwischen">
            <h2 id="h-heute" style={{ margin: 0, fontSize: 22 }}>Heute</h2>
            <Link href="/kalender" className="fett">Zum Kalender</Link>
          </div>
          <ul className="liste">
            {termine.length === 0 && <li className="leise">Keine Termine heute.</li>}
            {termine.map((t) => (
              <li key={t.id} style={{ display: "flex", gap: 16 }}>
                <div style={{ width: 64, flex: "none" }} className="fett">{fZeit(t.beginn)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fett">{t.titel}</div>
                  {t.klient && <Link href={`/klienten/${t.klient.id}`}>{t.klient.vorname} {t.klient.nachname}</Link>}
                  <div className="klein leise">{[t.ort, t.mitarbeiter?.name].filter(Boolean).join(" · ")}</div>
                </div>
                <span className={`marker ${t.standort.name === "Hagen" ? "marker-akzent" : "marker-info"}`} style={{ alignSelf: "flex-start" }}>{t.standort.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="spalte-schmal">
          <section id="aufgaben" className="karte" aria-labelledby="h-aufgaben">
            <h2 id="h-aufgaben" style={{ fontSize: 22 }}>Aufgaben und Fristen</h2>
            <ul className="liste">
              {aufgaben.length === 0 && <li className="leise">Alles erledigt.</li>}
              {aufgaben.map((a) => {
                const status = !a.faellig ? "" : a.faellig < heute ? "text-kritisch" : a.faellig < morgen ? "text-warnung" : "leise";
                const text = !a.faellig ? "" : a.faellig < heute ? `Überfällig seit ${fDatum(a.faellig)}` : a.faellig < morgen ? "Heute fällig" : `Fällig ${fDatum(a.faellig)}`;
                return (
                  <li key={a.id}>
                    <div>{a.text}</div>
                    {text && <div className={`klein ${status}`}>{text}</div>}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="karte" aria-labelledby="h-datenschutz">
            <h2 id="h-datenschutz" style={{ fontSize: 22 }}>Datenschutz</h2>
            {einwilligungen > 0 ? (
              <p className="hinweis hinweis-warnung" style={{ margin: 0 }}>
                {einwilligungen === 1 ? "1 Einwilligung ist abgelaufen oder läuft" : `${einwilligungen} Einwilligungen sind abgelaufen oder laufen`} in den nächsten 30 Tagen ab.
              </p>
            ) : (
              <p className="leise" style={{ margin: 0 }}>Alle Einwilligungen sind gültig.</p>
            )}
          </section>
        </div>
      </div>

      {zuletztKlienten.length > 0 && (
        <section className="karte" aria-labelledby="h-zuletzt">
          <h2 id="h-zuletzt" style={{ fontSize: 22, marginBottom: 16 }}>Zuletzt geöffnet</h2>
          <div className="kacheln">
            {zuletztKlienten.map((k) => (
              <Link key={k.id} href={`/klienten/${k.id}`} className="kachel" style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
                <span className="avatar">{kuerzel(k.vorname, k.nachname)}</span>
                <span>
                  <span className="fett" style={{ display: "block" }}>{k.vorname} {k.nachname}</span>
                  <span className="klein leise">{k.standort.name}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
