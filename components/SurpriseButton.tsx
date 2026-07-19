"use client";

import { usePlayer, type StationSummary } from "@/components/PlayerProvider";

export default function SurpriseButton({ stations }: { stations: StationSummary[] }) {
  const { playStation } = usePlayer();

  const handleSurprise = () => {
    if (stations.length === 0) return;
    const random = stations[Math.floor(Math.random() * stations.length)];
    if (random) playStation(random);
  };

  return (
    <button
      onClick={handleSurprise}
      disabled={stations.length === 0}
      className="font-mono text-[11px] tracking-widemono uppercase border border-ink/60 text-ink px-4 py-2 transition-colors duration-instant ease-enter hover:bg-ink hover:text-void disabled:opacity-30"
    >
      Escanear señal →
    </button>
  );
}
