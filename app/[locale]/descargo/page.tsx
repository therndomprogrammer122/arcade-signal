import { useTranslations } from "next-intl";
import ContactForm from "@/components/ContactForm";

export default function DescargoPage() {
  const t = useTranslations("disclaimer");

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-4">
        {t("eyebrow")}
      </p>
      <h1 className="font-serif font-extrabold tracking-tightest text-4xl sm:text-5xl mb-8 text-ink">
        {t("title")}
      </h1>

      <div className="hairline-signal mb-8" />

      <div className="space-y-6 font-sans text-[15px] leading-relaxed text-ink/70">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>

        <div className="hairline-signal my-8" />

        <div>
          <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-2">
            {t("contactLabel")}
          </p>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}