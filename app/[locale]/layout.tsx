import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";
import Footer from "@/components/Footer";
import PlayerProvider from "@/components/PlayerProvider";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* PlayerProvider (y el MiniPlayer que contiene) ahora vive DENTRO
          del proveedor de idioma, para poder usar useTranslations sin
          romper — antes estaba en el layout raiz, fuera de este contexto. */}
      <PlayerProvider>
        <div className="flex-1">{children}</div>
        <Footer />
      </PlayerProvider>
    </NextIntlClientProvider>
  );
}
