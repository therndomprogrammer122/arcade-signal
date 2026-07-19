import { PrismaClient } from "@prisma/client";

// Singleton — evita crear una nueva conexión en cada hot-reload de Next.js dev.
// IMPORTANTE: este cliente usa DATABASE_URL (rol lectura/escritura) y por diseño
// SOLO debe importarse desde código bajo app/api/admin/** o app/admin/**.
// El resto de la app (público) usa lib/prismaPublic.ts (rol solo-lectura).

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
