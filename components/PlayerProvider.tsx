"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { loadYouTubeApi } from "@/lib/youtube";
import MiniPlayer from "@/components/MiniPlayer";

export interface StationSummary {
  id: string;
  slug: string;
  name: string;
  franchise: string;
  logoUrl: string;
  accentColor: string;
  motif?: string; // "triforce" | "sonar" | "particles" | "scanlines" | "bars"
  featured: boolean;
}

interface CurrentTrack {
  id: string;
  title: string;
  channelTitle?: string | null;
  durationSec?: number | null;
}
interface PlayerContextValue {
  station: StationSummary | null;
  track: CurrentTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;
  progressSec: number;
  volume: number;
  isMuted: boolean;
  playStation: (station: StationSummary) => void;
  togglePlay: () => void;
  skip: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}
const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer debe usarse dentro de <PlayerProvider>");
  return ctx;
}

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [station, setStation] = useState<StationSummary | null>(null);
  const [track, setTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progressSec, setProgressSec] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef<YT.Player | null>(null);
  const stationRef = useRef<StationSummary | null>(null);
  const lastTrackIdRef = useRef<string | undefined>(undefined);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pide el siguiente track al backend — el cliente nunca conoce el catálogo completo.
  const fetchNextTrack = useCallback(async (stationId: string) => {
    setIsBuffering(true);
    try {
      const excludeParam = lastTrackIdRef.current
        ? `?exclude=${lastTrackIdRef.current}`
        : "";
      const res = await fetch(`/api/stations/${stationId}/next-track${excludeParam}`);
      if (!res.ok) throw new Error("next-track failed");
      const data = await res.json();
      return data.track as CurrentTrack & { youtubeId: string };
    } finally {
      setIsBuffering(false);
    }
  }, []);

  const playTrack = useCallback(
    async (stationId: string) => {
      const nextTrack = await fetchNextTrack(stationId);
      if (!nextTrack) return;
      lastTrackIdRef.current = nextTrack.id;
      setTrack(nextTrack);
      playerRef.current?.loadVideoById(nextTrack.youtubeId);
    },
    [fetchNextTrack]
  );

  const skip = useCallback(() => {
    if (stationRef.current) void playTrack(stationRef.current.id);
  }, [playTrack]);

  const playStation = useCallback(
    async (newStation: StationSummary) => {
      const isSameStation = stationRef.current?.id === newStation.id;
      stationRef.current = newStation;
      setStation(newStation);

      const YT = await loadYouTubeApi();

      if (!playerRef.current) {
        playerRef.current = new YT.Player("arcade-signal-yt-host", {
  height: "0",
  width: "0",
  playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0 },
  events: {
    onReady: () => {
      const saved = Number(window.localStorage.getItem("arcade-signal-volume"));
      const initialVolume = saved >= 0 && saved <= 100 ? saved : 80;
      setVolumeState(initialVolume);
      playerRef.current?.setVolume(initialVolume);
      void playTrack(newStation.id);
    },
    onStateChange: (e: YT.OnStateChangeEvent) => {
      if (e.data === window.YT!.PlayerState.PLAYING) setIsPlaying(true);
      if (e.data === window.YT!.PlayerState.PAUSED) setIsPlaying(false);
      if (e.data === window.YT!.PlayerState.ENDED) {
        if (stationRef.current) void playTrack(stationRef.current.id);
      }
    },
  },
});
      } else if (!isSameStation) {
        await playTrack(newStation.id);
        playerRef.current.playVideo();
      } else {
        playerRef.current.playVideo();
      }
    },
    [playTrack]
  );

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [isPlaying]);
  
  const setVolume = useCallback((v: number) => {
  const clamped = Math.max(0, Math.min(100, v));
  setVolumeState(clamped);
  playerRef.current?.setVolume(clamped);
  if (clamped > 0 && isMuted) {
    setIsMuted(false);
    playerRef.current?.unMute();
  }
  window.localStorage.setItem("arcade-signal-volume", String(clamped));
}, [isMuted]);

const toggleMute = useCallback(() => {
  if (isMuted) {
    playerRef.current?.unMute();
    setIsMuted(false);
  } else {
    playerRef.current?.mute();
    setIsMuted(true);
  }
}, [isMuted]);
  // Progreso del track actual (para la barra minimalista del mini-player)
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      const p = playerRef.current?.getCurrentTime?.();
      if (typeof p === "number") setProgressSec(p);
    }, 1000);
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);
  // Controles desde la pantalla bloqueada / audífonos Bluetooth
useEffect(() => {
  if (!("mediaSession" in navigator) || !track || !station) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: station.name,
    album: "Arcade Signal",
  });

  navigator.mediaSession.setActionHandler("play", () => {
    playerRef.current?.playVideo();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    playerRef.current?.pauseVideo();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    skip();
  });

  return () => {
    navigator.mediaSession.setActionHandler("play", null);
    navigator.mediaSession.setActionHandler("pause", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
  };
}, [track, station, skip]);

useEffect(() => {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}, [isPlaying]);

  return (
    <PlayerContext.Provider
      value={{ station, track, isPlaying, isBuffering, progressSec, volume, isMuted, playStation, togglePlay, skip,setVolume,toggleMute }}
    >
      {children}
      {/* Host oculto para el iframe de audio — nunca se muestra video */}
      <div id="arcade-signal-yt-host" className="sr-only" aria-hidden="true" />
      {station && <MiniPlayer />}
    </PlayerContext.Provider>
  );
}
