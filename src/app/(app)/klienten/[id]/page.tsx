import Link from "next/link";
import { notFound } from "next/navigation";
import type { Bereich, KontaktKategorie } from "@prisma/client";
import { db } from "@/lib/db";
import { nutzerOderLogin } from "@/lib/auth";
import { darfBereich, darfStandort } from "@/lib/zugriff";
import { protokolliere } from "@/lib/protokoll";
import { fDatum, fTag, fZahl, fZeit, kuerzel } from "@/lib/format";

const REITER: { id: string; text: string; bereich?: Bereich | "VERLAUF" }[] = [
  { id: "uebersicht", text: "Übersicht" },
  { id: "kontakte", text: "Kontakte", bereich: "KONTAKTE" },
  { id: "medizin", text: "Arztberichte und Diagnosen", bereich: "MEDIZIN" },
  { id: "eingang", text: "Eingangsphase", bereich: "EINGANG" },
  { id: "sozialamt", text: "Sozialamt", bereich: "SOZIALAMT" },
  { id: "stunden", text: "Stunden", bereich: "STUNDEN" },
  { id: "therapie", text: "Therapie", bereich: "THERAPIE" },
  { id: "verlauf", text: "Verlauf", bereich: "VERLAUF" },
  { id: "dokumente", text: "Dokumente" },
];
const ALLE_BEREICHE: Bereich[] = ["KONTAKTE", "MEDIZIN", "EINGANG", "SOZIALAMT", "STUNDEN", "THERAPIE", "SONSTIGES", "ZUR_ZUORDNUNG"];
const BEREICH_TEXT: Record<Bereich, string> = {
  KONTAKTE: "Kontakte", MEDIZIN: "Arztberichte", EINGANG: "Eingangsphase", SOZIALAMT: "Sozialamt",
  STUNDEN: "Stunden", THERAPIE: "Therapie", SONSTIGES: "Sonstiges", ZUR_ZUORDNUNG: "Zur Zuordnung",
};
const FAMILIE: KontaktKategorie[] = ["FAMILIE"];

export default async function Akte({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ bereich?: string }> }) {
  const nutzer = await nutzerOderLogin();
  const { id } = await params;
  const { bereich } = await searchParams;

  const klient = await db.klient.findUnique({ where: { id }, include: { standort: true, bezugsbetreuer: true } });
  // Fremde Akten verhalten sich wie nicht vorhandene, damit nichts über ihre Existenz verraten wird.
  if (!klient || !darfStandort(nutzer, klient.standortId)) notFound();

  const reiter = REITER.filter((r) => !r.bereich || darfBereich(nutzer, r.bereich));
  const aktiv = reiter.find((r) => r.id === bereich) ?? reiter[0];
  await protokolliere(nutzer, "akte.ansehen", klient.id, aktiv.id);

  const name = `${klient.vorname} ${klient.nachname}`;
  return (
    <>
      <Link href="/klienten" className="fett" style={{ alignSelf: "flex-start", minHeight: 44, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>← Alle Klienten</Link>

      <section className="karte zeile zwischen" aria-label="Kopfdaten" style={{ gap: 20 }}>
        <div className="zeile" style={{ gap: 16 }}>
          <span className="avatar avatar-gross">{kuerzel(klient.vorname, klient.nachname)}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>{name}</h1>
            <p className="leise" style={{ margin: "4px 0 0" }}>
              {klient.nummer} · geb. {fDatum(klient.geburtsdatum)} · Standort {klient.standort.name}
              {klient.bezugsbetreuer && ` · Bezugsbetreuer ${klient.bezugsbetreuer.name}`}
            </p>
          </div>
        </div>
      </section>

      <nav className="reiter" aria-label="Bereiche der Akte">
        {reiter.map((r) => (
          <Link key={r.id} href={r.id === "uebersicht" ? `/klienten/${id}` : `/klienten/${id}?bereich=${r.id}`} aria-current={r.id === aktiv.id ? "page" : undefined}>{r.text}</Link>
        ))}
      </nav>

      {aktiv.id === "uebersicht" && <Uebersicht klientId={id} zeigeVerlauf={darfBereich(nutzer, "VERLAUF")} klient={klient} />}
      {aktiv.id === "kontakte" && <Kontakte klientId={id} />}
      {aktiv.id === "medizin" && <Medizin klientId={id} />}
      {aktiv.id === "eingang" && <Eingang klientId={id} />}
      {aktiv.id === "sozialamt" && <Sozialamt klientId={id} />}
      {aktiv.id === "stunden" && <Stunden klientId={id} />}
      {aktiv.id === "therapie" && <Therapien klientId={id} />}
      {aktiv.id === "verlauf" && <Verlauf klientId={id} />}
      {aktiv.id === "dokumente" && <Dokumente klientId={id} bereiche={ALLE_BEREICHE.filter((b) => darfBereich(nutzer, b))} />}
    </>
  );
}

function Leer({ text }: { text: string }) {
  return <p className="karte leise" style={{ margin: 0 }}>{text}</p>;
}

async function Uebersicht({ klientId, zeigeVerlauf, klient }: { klientId: string; zeigeVerlauf: boolean; klient: { strasse: string | null; plz: string | null; ort: string | null; telefon: string | null; leistung: string | null; aufnahme: Date | null } }) {
  const jetzt = new Date();
  const [termine, eintraege, bewilligung, einwilligung] = await Promise.all([
    db.termin.findMany({ where: { klientId, beginn: { gte: jetzt } }, orderBy: { beginn: "asc" }, take: 3, include: { mitarbeiter: true } }),
    zeigeVerlauf ? db.verlaufseintrag.findMany({ where: { klientId }, orderBy: { datum: "desc" }, take: 3, include: { autor: true } }) : Promise.resolve([]),
    db.bewilligung.findFirst({ where: { klientId, von: { lte: jetzt }, bis: { gte: jetzt } }, orderBy: { bis: "desc" } }),
    db.einwilligung.findFirst({ where: { klientId, widerrufenAm: null }, orderBy: { gueltigBis: "desc" } }),
  ]);
  const adresse = [klient.strasse, [klient.plz, klient.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return (
    <div className="spalten">
      <div className="spalte-breit">
        <section className="karte" aria-labelledby="h-termine">
          <h2 id="h-termine">Nächste Termine</h2>
          <ul className="liste">
            {termine.length === 0 && <li className="leise">Keine Termine geplant.</li>}
            {termine.map((t) => (
              <li key={t.id} style={{ display: "flex", gap: 16 }}>
                <span className="fett" style={{ width: 150, flex: "none" }}>{fTag(t.beginn)}, {fZeit(t.beginn)}</span>
                <span>{t.titel}{t.mitarbeiter && ` mit ${t.mitarbeiter.name}`}{t.ort && `, ${t.ort}`}</span>
              </li>
            ))}
          </ul>
        </section>
        {zeigeVerlauf && (
          <section className="karte" aria-labelledby="h-verlauf">
            <h2 id="h-verlauf">Letzte Einträge</h2>
            {eintraege.length === 0 && <p className="leise">Noch keine Einträge.</p>}
            {eintraege.map((e) => (
              <article key={e.id} style={{ padding: "12px 0", borderTop: "1px solid var(--linie-hell)" }}>
                <div className="klein leise">{fDatum(e.datum)} · {e.autor.name} · {e.art}</div>
                <p style={{ margin: "4px 0 0" }}>{e.text}</p>
              </article>
            ))}
          </section>
        )}
      </div>
      <div className="spalte-schmal">
        <section className="karte" aria-labelledby="h-stamm">
          <h2 id="h-stamm">Stammdaten</h2>
          <dl className="daten">
            <dt>Adresse</dt><dd>{adresse || "–"}</dd>
            <dt>Telefon</dt><dd>{klient.telefon ?? "–"}</dd>
            <dt>Leistung</dt><dd>{klient.leistung ?? "–"}</dd>
            <dt>Seit</dt><dd>{fDatum(klient.aufnahme)}</dd>
          </dl>
        </section>
        <section className="karte" aria-labelledby="h-bew">
          <h2 id="h-bew">Bewilligung</h2>
          {bewilligung ? (
            <p style={{ margin: 0 }}>
              <span className="fett">{bewilligung.stundenProWoche ? `${fZahl(bewilligung.stundenProWoche)} Std. pro Woche` : bewilligung.leistung}</span><br />
              <span className="leise">{bewilligung.kostentraeger}, bis {fDatum(bewilligung.bis)}</span>
            </p>
          ) : <p className="text-warnung" style={{ margin: 0 }}>Keine gültige Bewilligung</p>}
        </section>
        <section className="karte" aria-labelledby="h-ds">
          <h2 id="h-ds">Datenschutz</h2>
          {einwilligung && (!einwilligung.gueltigBis || einwilligung.gueltigBis >= jetzt)
            ? <p style={{ margin: 0 }}>Einwilligung gültig{einwilligung.gueltigBis ? ` bis ${fDatum(einwilligung.gueltigBis)}` : ""}</p>
            : <p className="text-warnung" style={{ margin: 0 }}>Einwilligung fehlt oder ist abgelaufen</p>}
        </section>
      </div>
    </div>
  );
}

async function Kontakte({ klientId }: { klientId: string }) {
  const kontakte = await db.kontakt.findMany({ where: { klientId }, orderBy: [{ kategorie: "asc" }, { rolle: "asc" }] });
  if (kontakte.length === 0) return <Leer text="Noch keine Kontakte erfasst." />;
  const gruppen = [
    { titel: "Familie", liste: kontakte.filter((k) => FAMILIE.includes(k.kategorie)) },
    { titel: "Hilfesystem", liste: kontakte.filter((k) => !FAMILIE.includes(k.kategorie)) },
  ];
  return (
    <>
      {gruppen.filter((g) => g.liste.length).map((g) => (
        <section key={g.titel} aria-label={g.titel}>
          <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>{g.titel}</h2>
          <div className="kacheln">
            {g.liste.map((k) => (
              <div key={k.id} className="karte" style={{ padding: 20 }}>
                <div className="klein leise">{k.rolle}</div>
                <div className="fett">{k.name}</div>
                {k.telefon && <div style={{ marginTop: 6 }}>{k.telefon}</div>}
                {k.schweigepflichtEntbunden && <div className="klein leise" style={{ marginTop: 6 }}>Schweigepflichtentbindung{k.entbundenBis ? ` bis ${fDatum(k.entbundenBis)}` : ""}</div>}
                {k.notiz && <div className="klein leise" style={{ marginTop: 6 }}>{k.notiz}</div>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

async function Medizin({ klientId }: { klientId: string }) {
  const [diagnosen, berichte] = await Promise.all([
    db.diagnose.findMany({ where: { klientId }, orderBy: { diagnostiziertAm: "desc" } }),
    db.dokument.findMany({ where: { klientId, bereich: "MEDIZIN" }, orderBy: { datum: "desc" } }),
  ]);
  return (
    <>
      <section className="karte-tabelle" aria-labelledby="h-diag">
        <h2 id="h-diag" style={{ margin: 0, padding: "20px 20px 8px", fontSize: 20 }}>Diagnosen</h2>
        <table className="tabelle">
          <thead><tr><th scope="col">ICD-10</th><th scope="col">Diagnose</th><th scope="col">Gestellt</th><th scope="col">Quelle</th></tr></thead>
          <tbody>
            {diagnosen.map((d) => (
              <tr key={d.id}><td className="fett">{d.icd10 ?? "–"}</td><td>{d.bezeichnung}{!d.gesichert && " (Verdacht)"}</td><td>{fDatum(d.diagnostiziertAm)}</td><td className="leise">{d.diagnostiziertVon ?? "–"}</td></tr>
            ))}
          </tbody>
        </table>
        {diagnosen.length === 0 && <p className="leise" style={{ padding: 20, margin: 0 }}>Keine Diagnosen erfasst.</p>}
      </section>
      <section className="karte" aria-labelledby="h-berichte">
        <h2 id="h-berichte">Arztberichte</h2>
        <ul className="liste">
          {berichte.length === 0 && <li className="leise">Keine Arztberichte.</li>}
          {berichte.map((b) => <li key={b.id} className="zeile zwischen"><span className="fett">{b.titel}</span><span className="leise">{fDatum(b.datum)}</span></li>)}
        </ul>
      </section>
    </>
  );
}

async function Eingang({ klientId }: { klientId: string }) {
  const e = await db.eingangsphase.findUnique({ where: { klientId } });
  if (!e) return <Leer text="Keine Angaben zur Eingangsphase." />;
  const schritte = [
    { text: "Anfrage", datum: e.anfrageDatum, notiz: e.anfrageVon ? `durch ${e.anfrageVon}` : "" },
    { text: "Erstgespräch", datum: e.erstgespraechDatum, notiz: "" },
    { text: "Hospitation / Kennenlernen", datum: e.hospitationDatum, notiz: "" },
    { text: "Entscheidung", datum: e.entscheidungDatum, notiz: e.entscheidung ?? "" },
    { text: "Start", datum: e.startdatum, notiz: "" },
  ];
  return (
    <section className="karte" aria-label="Eingangsphase">
      <ol className="liste">
        {schritte.map((s, i) => (
          <li key={s.text} style={{ display: "flex", gap: 16 }}>
            <span className="avatar" style={{ width: 32, height: 32 }}>{i + 1}</span>
            <span><span className="fett" style={{ display: "block" }}>{s.text}</span><span className="leise">{fDatum(s.datum)}{s.notiz && ` · ${s.notiz}`}</span></span>
          </li>
        ))}
      </ol>
      {e.notiz && <p className="leise">{e.notiz}</p>}
    </section>
  );
}

async function Sozialamt({ klientId }: { klientId: string }) {
  const bewilligungen = await db.bewilligung.findMany({ where: { klientId }, orderBy: { bis: "desc" } });
  if (bewilligungen.length === 0) return <Leer text="Keine Bewilligungen erfasst." />;
  const jetzt = new Date();
  return (
    <section className="karte-tabelle" aria-label="Bewilligungen">
      <table className="tabelle">
        <thead><tr><th scope="col">Kostenträger</th><th scope="col">Aktenzeichen</th><th scope="col">Zeitraum</th><th scope="col">Umfang</th><th scope="col">Status</th></tr></thead>
        <tbody>
          {bewilligungen.map((b) => {
            const gueltig = b.von <= jetzt && b.bis >= jetzt;
            return (
              <tr key={b.id}>
                <td className="fett">{b.kostentraeger}</td>
                <td>{b.aktenzeichen ?? "–"}</td>
                <td>{fDatum(b.von)} bis {fDatum(b.bis)}</td>
                <td>{b.stundenProWoche ? `${fZahl(b.stundenProWoche)} Std./Woche` : (b.leistung ?? "–")}</td>
                <td><span className={`marker ${gueltig ? "marker-akzent" : b.bis < jetzt ? "marker-neutral" : "marker-info"}`}>{gueltig ? "Gültig" : b.bis < jetzt ? "Abgelaufen" : "Künftig"}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

async function Stunden({ klientId }: { klientId: string }) {
  const nachweise = await db.stundennachweis.findMany({ where: { klientId }, orderBy: { datum: "desc" }, take: 100 });
  if (nachweise.length === 0) return <Leer text="Keine Stunden erfasst." />;
  const summe = nachweise.reduce((s, n) => s + Number(n.stunden), 0);
  return (
    <section className="karte-tabelle" aria-label="Stundennachweise">
      <p className="leise" style={{ margin: 0, padding: "20px 20px 8px" }}>{nachweise.length} Einträge · {fZahl(summe)} Stunden</p>
      <table className="tabelle">
        <thead><tr><th scope="col">Datum</th><th scope="col">Zeit</th><th scope="col">Stunden</th><th scope="col">Mitarbeiter</th><th scope="col">Bestätigt</th></tr></thead>
        <tbody>
          {nachweise.map((n) => (
            <tr key={n.id}><td className="fett">{fDatum(n.datum)}</td><td>{n.beginn} bis {n.ende}</td><td>{fZahl(n.stunden)}</td><td>{n.mitarbeiter}</td><td className="leise">{n.bestaetigtVon ?? "offen"}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

async function Therapien({ klientId }: { klientId: string }) {
  const therapien = await db.therapie.findMany({ where: { klientId }, orderBy: { beginn: "desc" } });
  if (therapien.length === 0) return <Leer text="Keine Therapien erfasst." />;
  const bald = new Date();
  bald.setDate(bald.getDate() + 60);
  return (
    <section className="kacheln" aria-label="Therapien">
      {therapien.map((t) => (
        <div key={t.id} className="karte" style={{ padding: 20 }}>
          <div className="fett" style={{ fontSize: 18 }}>{t.art}</div>
          {t.praxis && <div>{t.praxis}</div>}
          <div className="leise" style={{ marginTop: 8 }}>{[t.frequenz, t.beginn && `seit ${fDatum(t.beginn)}`].filter(Boolean).join(" · ")}</div>
          {t.verordnungBis && <div className={t.verordnungBis < bald ? "text-warnung" : "leise"} style={{ marginTop: 8 }}>Verordnung bis {fDatum(t.verordnungBis)}</div>}
        </div>
      ))}
    </section>
  );
}

async function Verlauf({ klientId }: { klientId: string }) {
  const eintraege = await db.verlaufseintrag.findMany({ where: { klientId }, orderBy: { datum: "desc" }, include: { autor: true }, take: 200 });
  if (eintraege.length === 0) return <Leer text="Noch keine Einträge." />;
  return (
    <section className="karte" aria-label="Verlauf">
      {eintraege.map((e) => (
        <article key={e.id} style={{ padding: "16px 0", borderTop: "1px solid var(--linie-hell)" }}>
          <div className="klein leise">{fDatum(e.datum)} · {e.autor.name} · {e.art}</div>
          <p style={{ margin: "4px 0 0" }}>{e.text}</p>
        </article>
      ))}
    </section>
  );
}

async function Dokumente({ klientId, bereiche }: { klientId: string; bereiche: Bereich[] }) {
  const dokumente = await db.dokument.findMany({ where: { klientId, bereich: { in: bereiche } }, orderBy: { datum: "desc" } });
  if (dokumente.length === 0) return <Leer text="Keine Dokumente." />;
  return (
    <section className="karte-tabelle" aria-label="Dokumente">
      <table className="tabelle">
        <thead><tr><th scope="col">Dokument</th><th scope="col">Bereich</th><th scope="col">Datum</th></tr></thead>
        <tbody>
          {dokumente.map((d) => <tr key={d.id}><td className="fett">{d.titel}</td><td>{BEREICH_TEXT[d.bereich]}</td><td className="leise">{fDatum(d.datum)}</td></tr>)}
        </tbody>
      </table>
    </section>
  );
}
