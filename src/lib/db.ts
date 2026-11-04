import { PrismaClient } from "@prisma/client";

// Eine Instanz pro Prozess; im Entwicklungsmodus über Hot-Reloads hinweg wiederverwenden.
const globalFuerPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalFuerPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalFuerPrisma.prisma = db;
