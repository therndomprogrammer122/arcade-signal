import { prisma } from "@/lib/prisma";

interface AuditParams {
  adminId: string;
  action: string; // ej. "TRACK_CREATE", "STATION_UPDATE", "TRACK_DELETE"
  entity?: string;
  detail?: unknown;
  ip?: string;
}

/** Escribe un registro inmutable de auditoría. Nunca debe lanzar hacia arriba. */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entity: params.entity,
        detail: params.detail ? JSON.stringify(params.detail) : undefined,
        ip: params.ip,
      },
    });
  } catch (err) {
    // La auditoría no debe tumbar la request principal, pero sí queda en logs del server.
    console.error("[audit] fallo al escribir log", err);
  }
}
