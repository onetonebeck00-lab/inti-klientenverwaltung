import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

// Die Schrift wird beim Build eingebunden und vom eigenen Server ausgeliefert (keine Anfragen an Google).
const schrift = Atkinson_Hyperlegible({ weight: ["400", "700"], subsets: ["latin"], variable: "--schrift" });

export const metadata: Metadata = {
  title: "Inti Klientenverwaltung",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={schrift.variable}>{children}</body>
    </html>
  );
}
