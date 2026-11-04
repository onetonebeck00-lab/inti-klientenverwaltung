"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PUNKTE = [
  { href: "/", text: "Übersicht", icon: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></> },
  { href: "/klienten", text: "Klienten", icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.8c1.9.7 3.1 2.4 3.5 5.2" /></> },
  { href: "/kalender", text: "Kalender", icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></> },
  { href: "/dokumente", text: "Dokumente", icon: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></> },
];

export function Navigation() {
  const pfad = usePathname();
  return (
    <nav className="nav" aria-label="Hauptmenü">
      {PUNKTE.map((p) => {
        const aktiv = p.href === "/" ? pfad === "/" : pfad.startsWith(p.href);
        return (
          <Link key={p.href} href={p.href} aria-current={aktiv ? "page" : undefined}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p.icon}</svg>
            {p.text}
          </Link>
        );
      })}
    </nav>
  );
}
