import DOMPurify from "isomorphic-dompurify";

/** Sanitiza cualquier texto dinámico (títulos de tracks, nombres de canal, etc.)
 * antes de guardarlo o renderizarlo. Elimina cualquier tag HTML — estos campos
 * son texto plano por diseño (metadata de YouTube), nunca deberían llevar markup. */
export function sanitizeText(input: string, maxLength = 500): string {
  const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return clean.trim().slice(0, maxLength);
}
