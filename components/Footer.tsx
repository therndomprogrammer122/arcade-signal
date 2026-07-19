"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // El footer es parte de la identidad de la radio pública; el panel /admin
  // tiene su propio tema claro y no lo necesita.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-wire mt-16 pb-24">
  <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/45">
      Arcade Signal — Proyecto de fans, sin fines de lucro
    </p>
    <div className="flex items-center gap-4">
      <Link
        href="/sugerencias"
        className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 decoration-ink/30 hover:decoration-led hover:text-led transition-colors duration-instant ease-enter"
      >
        Sugiere una estación
      </Link>
      <Link
        href="/descargo"
        className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 decoration-ink/30 hover:decoration-led hover:text-led transition-colors duration-instant ease-enter"
      >
        Descargo de responsabilidad
      </Link>
    </div>
  </div>
</footer>
  );
}
