import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Descargo de responsabilidad — Arcade Signal",
};

export default function DescargoPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-4">
        Página legal
      </p>
      <h1 className="font-serif font-extrabold tracking-tightest text-4xl sm:text-5xl mb-8 text-ink">
        Descargo de responsabilidad
      </h1>

      <div className="hairline-signal mb-8" />

      <div className="space-y-6 font-sans text-[15px] leading-relaxed text-ink/70">
        <p>
          Arcade Signal es un proyecto hecho por fans, sin fines de lucro. No
          está afiliado, patrocinado ni respaldado por ninguna compañía de
          videojuegos, editorial o desarrolladora cuyas franquicias, nombres o
          logotipos se mencionan o utilizan aquí con fines identificativos.
        </p>
        <p>
          Todas las marcas, logotipos y nombres de franquicias son propiedad
          de sus respectivos dueños. El audio reproducido en esta web se sirve
          mediante la reproducción embebida y oculta de videos alojados en
          YouTube, a través de la YouTube IFrame Player API — no se aloja, ni
          se distribuye, ni se descarga ningún archivo de audio en nuestros
          servidores.
        </p>
        <p>
          Si eres titular de derechos sobre algún contenido enlazado desde
          esta web y deseas solicitar su retiro, contáctanos y lo
          resolveremos a la brevedad.
        </p>

        <div className="hairline-signal my-8" />

        <div>
          <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-2">
            Contacto para retiro de contenido
          </p>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
