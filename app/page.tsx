"use client";

import { useEffect, useState } from "react";
import { usePlayer, type StationSummary } from "@/components/PlayerProvider";
import StationCard from "@/components/StationCard";
import StationSkeleton from "@/components/StationSkeleton";
import SurpriseButton from "@/components/SurpriseButton";
import SignalDial from "@/components/SignalDial";

export default function HomePage() {
  const [stations, setStations] = useState<StationSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const { station, togglePlay, playStation } = usePlayer();

  useEffect(() => {
    fetch("/api/stations")
      .then((res) => res.json())
      .then((data) => setStations(data.stations ?? []))
      .catch(() => setStations([]));
  }, []);

  // Atajos de teclado: espacio = play/pausa, flechas = cambiar de estación
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
      {/* Header tipo consola de radio */}
      <header className="pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="flex items-baseline justify-between font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-6">
          <span>Frecuencia pirata</span>
          <span>Transmisión continua</span>
        </div>
        <h1 className="font-serif font-extrabold tracking-tightest text-[15vw] sm:text-[6.5rem] leading-[0.88] text-ink">
          Arcade
          <br />
          Signal
        </h1>
        <p className="font-sans text-base sm:text-lg text-ink/55 max-w-md mt-4">
          Elige una estación. No busques canciones — solo dale play y deja que
          suene la banda sonora de tu franquicia favorita, sin parar.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          {stations && stations.length > 0 && <SurpriseButton stations={stations} />}
          <a
            href="/sugerencias"
            className="font-mono text-xs tracking-widemono uppercase underline underline-offset-4 decoration-ink/30 hover:decoration-led hover:text-led transition-colors duration-instant ease-enter"
          >
            Sugiere una estación →
          </a>
        </div>

        {/* Elemento firma — el dial de frecuencia */}
        <div className="mt-8">
          <SignalDial stations={stations ?? []} />
        </div>

        {/* Atajos de teclado — nota discreta tipo pie de imprenta */}
        <p className="font-mono text-[9px] tracking-widemono uppercase text-ink/30 mt-3">
          ␣ reproducir / pausar · ← → cambiar de estación
        </p>
      </header>

      <div className="hairline-signal" />

      {/* Buscador de estaciones */}
      <div className="py-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar estación o franquicia…"
          className="w-full sm:w-80 border border-wire bg-transparent px-3 py-2 text-sm font-sans text-ink placeholder:text-ink/35 focus-visible:outline-2 focus-visible:outline-ink"
          aria-label="Buscar estación"
        />
      </div>

      <div className="hairline-signal" />

      {noResults && (
        <p className="font-sans text-sm text-ink/40 py-10">
          No hay estaciones que coincidan con &ldquo;{query}&rdquo;.
        </p>
      )}

      {!noResults && (
        <>
          {/* Portada — estaciones destacadas, grandes */}
          {featured.length > 0 && (
            <>
              <section className="py-8 sm:py-10">
                <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-4">
                  Lado A — en portada
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

          {/* Sumario — el resto de estaciones, grid compacto */}
          <section className="py-8 sm:py-10">
            <p className="font-mono text-[10px] tracking-widemono uppercase text-ink/40 mb-4">
              Lado B — catálogo completo
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
              <p className="font-sans text-sm text-ink/40 py-8">
                Todavía no hay estaciones cargadas. Vuelve pronto.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}