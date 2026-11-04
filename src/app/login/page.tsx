import { anmeldenAktion } from "./actions";

export default async function LoginSeite({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  const { fehler } = await searchParams;
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form action={anmeldenAktion} className="karte" style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="marke" style={{ padding: 0 }}>
          <div className="marke-zeichen">i</div>
          <div>
            <div className="fett" style={{ fontSize: 18 }}>Inti</div>
            <div className="klein leise">Klientenverwaltung</div>
          </div>
        </div>
        <h1 style={{ margin: 0, fontSize: 24 }}>Anmelden</h1>
        {fehler && <p className="fehler" role="alert" style={{ margin: 0 }}>E-Mail oder Passwort ist falsch.</p>}
        <label className="feld">
          <span className="fett">E-Mail</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="feld">
          <span className="fett">Passwort</span>
          <input name="passwort" type="password" autoComplete="current-password" required />
        </label>
        <button className="knopf" type="submit" style={{ justifyContent: "center" }}>Anmelden</button>
      </form>
    </main>
  );
}
