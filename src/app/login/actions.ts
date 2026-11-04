"use server";
import { redirect } from "next/navigation";
import { anmelden, abmelden } from "@/lib/auth";

export async function anmeldenAktion(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const passwort = String(formData.get("passwort") ?? "");
  if (!(await anmelden(email, passwort))) redirect("/login?fehler=1");
  redirect("/");
}

export async function abmeldenAktion() {
  await abmelden();
  redirect("/login");
}
