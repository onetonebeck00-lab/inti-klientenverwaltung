import { describe, expect, it } from "vitest";
import { darfBearbeiten, darfBereich, darfStandort, gewaehlteStandorte, type AktuellerNutzer } from "./zugriff";

const nutzer = (rolle: AktuellerNutzer["rolle"], standortIds = ["hagen"]): AktuellerNutzer => ({ id: "n1", name: "Test", rolle, standortIds });

describe("darfStandort", () => {
  it("erlaubt nur zugeordnete Standorte", () => {
    expect(darfStandort(nutzer("FACHKRAFT"), "hagen")).toBe(true);
    expect(darfStandort(nutzer("FACHKRAFT"), "dortmund")).toBe(false);
  });
  it("gibt auch Leitung und Admin keine fremden Standorte", () => {
    expect(darfStandort(nutzer("ADMIN"), "dortmund")).toBe(false);
    expect(darfStandort(nutzer("LEITUNG"), "dortmund")).toBe(false);
  });
});

describe("darfBereich", () => {
  it("verbirgt Gesundheitsdaten, Therapie und Verlauf vor der Verwaltung", () => {
    const v = nutzer("VERWALTUNG");
    expect(darfBereich(v, "MEDIZIN")).toBe(false);
    expect(darfBereich(v, "THERAPIE")).toBe(false);
    expect(darfBereich(v, "VERLAUF")).toBe(false);
    expect(darfBereich(v, "SOZIALAMT")).toBe(true);
    expect(darfBereich(v, "STUNDEN")).toBe(true);
  });
  it("zeigt Fachkräften alle Bereiche", () => {
    expect(darfBereich(nutzer("FACHKRAFT"), "MEDIZIN")).toBe(true);
    expect(darfBereich(nutzer("FACHKRAFT"), "VERLAUF")).toBe(true);
  });
});

describe("darfBearbeiten", () => {
  it("lässt die Verwaltung nur lesen", () => {
    expect(darfBearbeiten(nutzer("VERWALTUNG"))).toBe(false);
    expect(darfBearbeiten(nutzer("FACHKRAFT"))).toBe(true);
  });
});

describe("gewaehlteStandorte", () => {
  const beide = nutzer("LEITUNG", ["hagen", "dortmund"]);
  it("liefert ohne Auswahl alle eigenen Standorte", () => {
    expect(gewaehlteStandorte(beide)).toEqual(["hagen", "dortmund"]);
  });
  it("grenzt auf einen eigenen Standort ein", () => {
    expect(gewaehlteStandorte(beide, "dortmund")).toEqual(["dortmund"]);
  });
  it("ignoriert fremde Standorte in der Adresse", () => {
    expect(gewaehlteStandorte(nutzer("FACHKRAFT", ["hagen"]), "dortmund")).toEqual(["hagen"]);
  });
});
