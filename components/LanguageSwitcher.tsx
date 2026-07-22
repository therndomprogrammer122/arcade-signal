"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const KNOWN_LOCALES = ["es", "en"];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname(); // ruta cruda, incluye el prefijo /en si existe
  const nextLocale = locale === "es" ? "en" : "es";

  // Quita el prefijo de idioma actual (si lo hay) para reconstruirlo con el nuevo
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && KNOWN_LOCALES.includes(segments[0])) segments.shift();
  const rest = segments.join("/");

  const targetPath = nextLocale === "es" ? `/${rest}` : `/en/${rest}`;

  return (
    <Link
      href={targetPath || "/"}
      className="font-mono text-[10px] tracking-widemono uppercase border border-wire px-2 py-1 text-ink/60 hover:text-ink hover:border-ink transition-colors duration-instant ease-enter"
      aria-label={`Cambiar a ${nextLocale === "en" ? "inglés" : "español"}`}
    >
        
      {nextLocale.toUpperCase()}
    </Link>
  );
}