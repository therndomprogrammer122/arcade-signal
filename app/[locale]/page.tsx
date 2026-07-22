"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePlayer, type StationSummary } from "@/components/PlayerProvider";
import StationCard from "@/components/StationCard";
import StationSkeleton from "@/components/StationSkeleton";
import SurpriseButton from "@/components/SurpriseButton";
import SignalDial from "@/components/SignalDial";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [stations, setStations] = useState<StationSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const { station, togglePlay, playStation } = usePlayer();

  useEffect(() => {
    fetch(`/api/stations?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setStations(data.stations ?? []))
      .catch(() => setStations([]));
  }, [locale]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isTyping) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (station) togglePlay();
        return;
      }

      if (!stations || stations.length === 0) return;
      const currentIndex = station ? stations.findIndex((s) => s.id === station.id) : -1;

      if (e.code === "ArrowRight") {
        e.preventDefault();
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % stations.length : 0;
        const next = stations[nextIndex];
        if (next) void playStation(next);
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const prevIndex =
          currentIndex >= 0 ? (currentIndex - 1 + stations.length) % stations.length : 0;
        const prev = stations[prevIndex];
        if (prev) void playStation(prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stations, station, togglePlay, playStation]);

  const matchesQuery = (s: StationSummary) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.franchise.toLowerCase().includes(q);
  };

  const featured = stations?.filter((s) => s.featured && matchesQuery(s)) ?? [];
  const rest = stations?.filter((s) => !s.featured && matchesQuery(s)) ?? [];
  const noResults = stations !== null && query.trim() !== "" && featured.length === 0 && rest.length === 0;

  return (
    <main className="max-w-5xl mx-auto px-5 sm:px-8">
      <header className="pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="flex items-baseline justify-between font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-6">
  <span>{t("eyebrow")}</span>
  <div className="flex items-center gap-3">
    <span>{t("subtitle")}</span>
    <LanguageSwitcher />
  </div>
</div>
        <h1 className="font-serif font-extrabold tracking-tightest text-[15vw] sm:text-[6.5rem] leading-[0.88] text-ink">
          Arcade
          <br />
          Signal
        </h1>
        <p className="font-sans text-base sm:text-lg text-ink/55 max-w-md mt-4">
          {t("description")}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          {stations && stations.length > 0 && <SurpriseButton stations={stations} />}
          <a
            href="/sugerencias"
            className="font-mono text-xs tracking-widemono uppercase underline underline-offset-4 decoration-ink/30 hover:decoration-led hover:text-led transition-colors duration-instant ease-enter"
          >
            {t("suggestStation")} →
          </a>
        </div>

        <div className="mt-8">
          <SignalDial stations={stations ?? []} />
        </div>

        <p className="font-mono text-[9px] tracking-widemono uppercase text-ink/30 mt-3">
          {t("shortcuts")}
        </p>
      </header>

      <div className="hairline-signal" />

      <div className="py-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:w-80 border border-wire bg-transparent px-3 py-2 text-sm font-sans text-ink placeholder:text-ink/35 focus-visible:outline-2 focus-visible:outline-ink"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <div className="hairline-signal" />

      {noResults && (
        <p className="font-sans text-sm text-ink/40 py-10">
          {t("noResults", { query })}
        </p>
      )}

      {!noResults && (
        <>
          {featured.length > 0 && (
            <>
              <section className="py-8 sm:py-10">
                <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-4">
                  {t("sideA")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {stations === null &&
                    Array.from({ length: 2 }).map((_, i) => <StationSkeleton key={i} featured />)}
                  {featured.map((s) => (
                    <StationCard
                      key={s.id}
                      station={s}
                      index={stations!.findIndex((st) => st.id === s.id)}
                      total={stations!.length}
                      featured
                    />
                  ))}
                </div>
              </section>
              <div className="hairline-signal" />
            </>
          )}

          <section className="py-8 sm:py-10">
            <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-4">
              {t("sideB")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {stations === null &&
                Array.from({ length: 8 }).map((_, i) => <StationSkeleton key={i} />)}
              {rest.map((s) => (
                <StationCard
                  key={s.id}
                  station={s}
                  index={stations!.findIndex((st) => st.id === s.id)}
                  total={stations!.length}
                />
              ))}
            </div>
            {stations !== null && stations.length === 0 && (
              <p className="font-sans text-sm text-ink/40 py-8">{t("noStations")}</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}