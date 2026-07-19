import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { CSRF_COOKIE_NAME } from "./csrf-constants";

/**
 * CSRF de tipo "double-submit cookie": el cookie NO es httpOnly (el JS del
 * panel necesita leerlo para reenviarlo como header), pero sí es
 * SameSite=strict y Secure. Un sitio de terceros no puede leer el cookie
 * de arcadesignal.example ni forzar el header custom en una request cross-site,
 * así que esto bloquea CSRF clásico contra los POST/PUT/DELETE del admin.
 */
export function issueCsrfToken(): string {
  const token = randomBytes(32).toString("hex");
  cookies().set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return token;
}

export function verifyCsrfToken(headerToken: string | null): boolean {
  const cookieToken = cookies().get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

// Re-exportadas por compatibilidad para código server-side que ya
// importaba estos nombres desde este archivo.
export { CSRF_HEADER, CSRF_COOKIE_NAME } from "./csrf-constants";
