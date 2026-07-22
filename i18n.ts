import { getRequestConfig } from "next-intl/server";
import { createSharedPathnamesNavigation } from "next-intl/navigation";

export const locales = ["es", "en"] as const;
export const defaultLocale = "es" as const;

export default getRequestConfig(async ({ locale }) => {
  // Si por algun motivo llega un locale que no reconocemos, usamos el
  // default para elegir QUE diccionario cargar - pero ya no lo "devolvemos"
  // explicitamente en el objeto de salida. Eso es lo que generaba el
  // warning: next-intl ya sabe que locale se pidio (lo leimos arriba, en el
  // parametro), asi que devolverlo de nuevo es informacion redundante que
  // puede pisar la que ya tenia, y ahi es donde se desincroniza.
  const safeLocale = locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale;

  return {
    messages: (await import(`./messages/${safeLocale}.json`)).default,
  };
});

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({ locales });