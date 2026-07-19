import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyCsrfToken, CSRF_HEADER } from "@/lib/csrf";
import { writeAuditLog } from "@/lib/audit";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function detectImageType(buf: Buffer): "png" | "jpg" | "gif" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.toString("ascii", 0, 3) === "GIF") return "gif";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!verifyCsrfToken(req.headers.get(CSRF_HEADER))) {
    return NextResponse.json({ error: "Token CSRF inválido" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-upload:${ip}`, 15, 60);
  if (!rl.success) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "La imagen no puede superar 5MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageType(buffer);
  if (!ext) {
    return NextResponse.json(
      { error: "Formato no reconocido. Usa PNG, JPG, GIF o WEBP." },
      { status: 400 }
    );
  }

  const filename = `logos/${randomBytes(16).toString("hex")}.${ext}`;

  const blob = await put(filename, buffer, {
    access: "public",
    contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
  });

  await writeAuditLog({
    adminId: (session.user as { id: string }).id,
    action: "LOGO_UPLOAD",
    entity: filename,
    detail: { originalName: file.name, size: file.size, type: ext, url: blob.url },
    ip,
  });

  return NextResponse.json({ url: blob.url });
}