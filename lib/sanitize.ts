/**
 * Sanitiza cualquier texto dinámico (títulos de tracks, nombres de canal,
 * sugerencias del formulario público, etc.) antes de guardarlo. Estos campos
 * son texto plano por diseño — nunca deberían llevar markup HTML.
 *
 * Nota: antes usábamos isomorphic-dompurify (basada en jsdom), pero una
 * dependencia suya se publicó como paquete ESM-only y rompía en el runtime
 * serverless de Vercel con ERR_REQUIRE_ESM. Como ninguno de estos campos se
 * renderiza con dangerouslySetInnerHTML en ningún lado de la app (React ya
 * escapa el texto automáticamente al mostrarlo con {variable}), no hace
 * falta un parser de DOM completo — alcanza con quitar cualquier secuencia
 * que parezca una etiqueta.
 */
export function sanitizeText(input: string, maxLength = 500): string {
  const withoutTags = input.replace(/<[^>]*>/g, "");
  const withoutControlChars = withoutTags.replace(/[\u0000-\u001F\u007F]/g, "");
  return withoutControlChars.trim().slice(0, maxLength);
}