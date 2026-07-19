// Constantes CSRF sin dependencias de "next/headers", seguras para
// importar tanto desde componentes de cliente como de servidor.
export const CSRF_HEADER = "x-csrf-token";
export const CSRF_COOKIE_NAME = "arcade-signal-csrf";
