import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale as setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";
import Footer from "@/components/Footer";
import PlayerProvider from "@/components/PlayerProvider";

export const dynamic = "force-dynamic";

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

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PlayerProvider>
        {children}
        <Footer />
      </PlayerProvider>
    </NextIntlClientProvider>
  );
}