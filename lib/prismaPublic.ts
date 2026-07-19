import { PrismaClient } from "@prisma/client";

/**
 * Cliente exclusivo para endpoints PÚBLICOS (/api/stations/**).
 * Se conecta con DATABASE_URL_PUBLIC, cuyo rol en Postgres solo tiene
 * GRANT SELECT (ver prisma/README-roles.sql). Aunque un endpoint público
 * tuviera un bug, no podría escribir en la base de datos porque el rol
 * de DB se lo impide a nivel de motor — no solo a nivel de código.
 */

const globalForPrisma = globalThis as unknown as { prismaPublic?: PrismaClient };

export const prismaPublic =
  globalForPrisma.prismaPublic ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_PUBLIC } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaPublic = prismaPublic;
