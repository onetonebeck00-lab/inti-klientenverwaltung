import Link from "next/link";

type Props = { pfad: string; standorte: { id: string; name: string }[]; aktiv?: string; weitere?: Record<string, string | undefined> };

/** Umschalter zwischen allen Standorten des Nutzers und einem einzelnen. */
export function StandortSchalter({ pfad, standorte, aktiv, weitere = {} }: Props) {
  if (standorte.length < 2) return null;
  const link = (standort?: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(weitere)) if (v) p.set(k, v);
    if (standort) p.set("standort", standort);
    const q = p.toString();
    return q ? `${pfad}?${q}` : pfad;
  };
  const gueltig = standorte.some((s) => s.id === aktiv) ? aktiv : undefined;
  return (
    <div className="schalter" role="group" aria-label="Standort wählen">
      <Link href={link()} aria-current={!gueltig ? "true" : undefined}>Alle Standorte</Link>
      {standorte.map((s) => (
        <Link key={s.id} href={link(s.id)} aria-current={gueltig === s.id ? "true" : undefined}>{s.name}</Link>
      ))}
    </div>
  );
}
