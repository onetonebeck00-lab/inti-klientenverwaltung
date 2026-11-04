import { nutzerOderLogin } from "@/lib/auth";
import { abmeldenAktion } from "../login/actions";
import { Navigation } from "./navigation";

const ROLLEN = { ADMIN: "Administration", LEITUNG: "Leitung", FACHKRAFT: "Fachkraft", VERWALTUNG: "Verwaltung" } as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const nutzer = await nutzerOderLogin();
  return (
    <div className="rahmen">
      <aside className="seite">
        <div className="marke">
          <div className="marke-zeichen" aria-hidden="true">i</div>
          <div>
            <div className="fett" style={{ fontSize: 18 }}>Inti</div>
            <div className="klein leise">Klientenverwaltung</div>
          </div>
        </div>
        <Navigation />
        <div className="seite-fuss">
          <div style={{ flex: 1 }}>
            <div className="fett">{nutzer.name}</div>
            <div className="klein leise">{ROLLEN[nutzer.rolle]}</div>
          </div>
          <form action={abmeldenAktion}>
            <button type="submit" className="knopf knopf-zweit" style={{ padding: "0 12px" }}>Abmelden</button>
          </form>
        </div>
      </aside>
      <main className="inhalt">
        <div>{children}</div>
      </main>
    </div>
  );
}
