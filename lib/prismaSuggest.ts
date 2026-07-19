import { PrismaClient } from "@prisma/client";

/**
 * Cliente exclusivo para el formulario público de sugerencias.
 * Rol de Postgres con GRANT INSERT únicamente sobre "Suggestion" — no puede
 * leer ni tocar ninguna otra tabla, ni siquiera la propia tabla de sugerencias.
 */

const globalForPrisma = globalThis as unknown as { prismaSuggest?: PrismaClient };

export const prismaSuggest =
  globalForPrisma.prismaSuggest ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_SUGGEST } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaSuggest = prismaSuggest;