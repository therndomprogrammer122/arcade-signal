"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCsrfToken } from "@/components/useCsrfToken";
import { CSRF_HEADER } from "@/lib/csrf-constants";
import Link from "next/link";

interface Track {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string | null;
  durationSec: number | null;
}

interface SearchResult {
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSec: number;
}

interface StationInfo {
  logoUrl: string;
  name: string;
  franchise: string;
  accentColor: string;
  featured: boolean;
}

function formatDuration(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const csrfToken = useCsrfToken();

  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modo playlist
  const [mode, setMode] = useState<"search" | "playlist">("search");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistResults, setPlaylistResults] = useState<SearchResult[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);

  // Borrado en lote
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Editar estación
  const [trackFilter, setTrackFilter] = useState("");
  const [station, setStation] = useState<StationInfo | null>(null);
  const [stationForm, setStationForm] = useState({
  name: "",
  franchise: "",
  accentColor: "#3E5C4A",
  featured: false,
});
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [savingStation, setSavingStation] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingStation, setDeletingStation] = useState(false);

  async function loadTracks() {
    const res = await fetch(`/api/admin/stations/${id}/tracks`);
    const data = await res.json();
    setTracks(data.tracks ?? []);
  }

  async function loadStation() {
  const res = await fetch(`/api/admin/stations/${id}`);
  const data = await res.json();
  setStation(data.station);
  if (data.station) {
    setLogoUrlInput(data.station.logoUrl ?? "");
    setStationForm({
      name: data.station.name ?? "",
      franchise: data.station.franchise ?? "",
      accentColor: data.station.accentColor ?? "#3E5C4A",
      featured: data.station.featured ?? false,
    });
  }
}

  useEffect(() => {
    void loadTracks();
    void loadStation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    const res = await fetch(`/api/admin/youtube/search?q=${encodeURIComponent(query)}`);
    setSearching(false);
    if (!res.ok) {
      setError("Error buscando en YouTube. Intenta de nuevo en un momento.");
      return;
    }
    const data = await res.json();
    setResults(data.results ?? []);
  }

  async function handleAdd(result: SearchResult) {
    if (!csrfToken) return;
    setAddingId(result.youtubeId);
    const res = await fetch(`/api/admin/stations/${id}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
      body: JSON.stringify(result),
    });
    setAddingId(null);
    if (res.ok) void loadTracks();
  }

  async function handleDelete(trackId: string, title: string) {
  if (!csrfToken) return;
  if (!window.confirm(`¿Eliminar "${title}"?`)) return;
  await fetch(`/api/admin/stations/${id}/tracks`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
    body: JSON.stringify({ trackId }),
  });
  void loadTracks();
}

  // --- Playlist ---
  async function handleLoadPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!playlistUrl.trim()) return;
    setLoadingPlaylist(true);
    setError(null);
    const res = await fetch(`/api/admin/youtube/playlist?playlist=${encodeURIComponent(playlistUrl)}`);
    setLoadingPlaylist(false);
    if (!res.ok) {
      setError("No se pudo cargar la playlist.");
      return;
    }
    const data = await res.json();
    setPlaylistResults(data.results ?? []);
    setSelected(new Set((data.results ?? []).map((r: SearchResult) => r.youtubeId)));
  }

  function toggleSelected(youtubeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(youtubeId) ? next.delete(youtubeId) : next.add(youtubeId);
      return next;
    });
  }

  function toggleSelectAllPlaylist() {
    if (!playlistResults) return;
    setSelected((prev) =>
      prev.size === playlistResults.length
        ? new Set()
        : new Set(playlistResults.map((r) => r.youtubeId))
    );
  }

  async function handleAddSelected() {
    if (!csrfToken || !playlistResults) return;
    const selectedTracks = playlistResults.filter((r) => selected.has(r.youtubeId));
    if (selectedTracks.length === 0) return;
    setBulkAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stations/${id}/tracks/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
        body: JSON.stringify({ tracks: selectedTracks }),
      });
      const data = await res.json().catch(() => null);
      setBulkAdding(false);
      if (!res.ok) {
        setError(
          `Error al agregar (${res.status}): ${
            typeof data?.error === "string" ? data.error : JSON.stringify(data?.error) || "sin detalle"
          }`
        );
        return;
      }
      setPlaylistResults(null);
      setPlaylistUrl("");
      void loadTracks();
    } catch (err) {
      setBulkAdding(false);
      setError("Error de red al agregar tracks.");
    }
  }

  // --- Borrado en lote ---
  function toggleSelectedForDelete(trackId: string) {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!tracks) return;
    setSelectedForDelete((prev) =>
      prev.size === tracks.length ? new Set() : new Set(tracks.map((t) => t.id))
    );
  }

  async function handleBulkDelete(trackIds: string[]) {
    if (!csrfToken || trackIds.length === 0) return;
    const ok = window.confirm(`¿Eliminar ${trackIds.length} tracks? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setBulkDeleting(true);
    const res = await fetch(`/api/admin/stations/${id}/tracks/bulk`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
      body: JSON.stringify({ trackIds }),
    });
    setBulkDeleting(false);
    if (res.ok) {
      setSelectedForDelete(new Set());
      void loadTracks();
    }
  }

  function shortTrackIds(): string[] {
    return (tracks ?? []).filter((t) => t.durationSec !== null && t.durationSec <= 10).map((t) => t.id);
  }

  // --- Editar logo ---
  async function handleSaveStation(e: React.FormEvent) {
  e.preventDefault();
  if (!csrfToken) return;
  setSavingStation(true);
  setError(null);
  const res = await fetch(`/api/admin/stations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
    body: JSON.stringify(stationForm),
  });
  const data = await res.json().catch(() => null);
  setSavingStation(false);
  if (!res.ok) {
    setError(typeof data?.error === "string" ? data.error : "No se pudo guardar la estación.");
    return;
  }
  void loadStation();
}

async function handleSaveLogoUrl(e: React.FormEvent) {
  e.preventDefault();
  if (!csrfToken || !logoUrlInput.trim()) return;
  setSavingStation(true);
  setError(null);
  const res = await fetch(`/api/admin/stations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
    body: JSON.stringify({ logoUrl: logoUrlInput.trim() }),
  });
  const data = await res.json().catch(() => null);
  setSavingStation(false);
  if (!res.ok) {
    setError(typeof data?.error === "string" ? data.error : "No se pudo guardar el logo.");
    return;
  }
  void loadStation();
}

async function handleDeleteStation() {
  if (!csrfToken || !station) return;
  const typed = window.prompt(
    `Esta acción eliminará la estación "${station.name}" y sus ${tracks?.length ?? 0} tracks de forma permanente.\n\nEscribe el nombre exacto de la estación para confirmar:`
  );
  if (typed !== station.name) {
    if (typed !== null) setError("El nombre no coincide. No se eliminó nada.");
    return;
  }
  setDeletingStation(true);
  const res = await fetch(`/api/admin/stations/${id}`, {
    method: "DELETE",
    headers: { [CSRF_HEADER]: csrfToken },
  });
  setDeletingStation(false);
  if (res.ok) {
    router.push("/admin");
  } else {
    setError("No se pudo eliminar la estación.");
  }
}

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !csrfToken) return;
    setUploadingLogo(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(`/api/admin/upload`, {
      method: "POST",
      headers: { [CSRF_HEADER]: csrfToken },
      body: formData,
    });
    const uploadData = await uploadRes.json().catch(() => null);
    if (!uploadRes.ok) {
      setUploadingLogo(false);
      setError(typeof uploadData?.error === "string" ? uploadData.error : "Error al subir la imagen.");
      return;
    }

    const patchRes = await fetch(`/api/admin/stations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrfToken },
      body: JSON.stringify({ logoUrl: uploadData.url }),
    });
    setUploadingLogo(false);
    if (patchRes.ok) {
      setLogoUrlInput(uploadData.url);
      void loadStation();
    } else {
      setError("La imagen se subió pero no se pudo asignar a la estación.");
    }

    e.target.value = "";
  }
  const filteredTracks = tracks?.filter((t) =>
  t.title.toLowerCase().includes(trackFilter.toLowerCase())
  );
  return (
    <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <Link
        href="/admin"
        className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 text-carbon/50 inline-block mb-4"
      >
        ← Volver al panel
      </Link>

      <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-2">
        Panel — Estación
      </p>
      <h1 className="font-serif tracking-tightest text-4xl mb-8">Gestionar tracks</h1>

      <div className="hairline mb-8" />

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      {/* Editar estación */}
<section className="mb-12">
  <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-4">
    Editar estación
  </p>

  <form onSubmit={handleSaveStation} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
    <input
      placeholder="Nombre"
      value={stationForm.name}
      onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
      className="border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
    />
    <input
      placeholder="Franquicia"
      value={stationForm.franchise}
      onChange={(e) => setStationForm({ ...stationForm, franchise: e.target.value })}
      className="border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
    />
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={stationForm.accentColor}
        onChange={(e) => setStationForm({ ...stationForm, accentColor: e.target.value })}
        className="w-10 h-10 border border-carbon/20"
      />
      <span className="font-mono text-xs">{stationForm.accentColor}</span>
    </div>
    <label className="flex items-center gap-2 font-sans text-sm">
      <input
        type="checkbox"
        checked={stationForm.featured}
        onChange={(e) => setStationForm({ ...stationForm, featured: e.target.checked })}
      />
      Destacada (portada)
    </label>
    <button
      type="submit"
      disabled={savingStation}
      className="sm:col-span-2 border border-carbon py-2.5 font-mono text-[11px] tracking-widemono uppercase disabled:opacity-40"
    >
      {savingStation ? "Guardando…" : "Guardar cambios"}
    </button>
  </form>

  <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-4">
  Logo de la estación
</p>

  {station?.logoUrl && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={station.logoUrl}
      alt="Logo actual"
      className="w-20 h-20 object-contain border border-carbon/10 mb-4 bg-carbon/5"
    />
  )}

  <form onSubmit={handleSaveLogoUrl} className="flex gap-2 mb-3">
    <input
      value={logoUrlInput}
      onChange={(e) => setLogoUrlInput(e.target.value)}
      placeholder="URL del logo (https://...)"
      className="flex-1 border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
    />
    <button
      type="submit"
      disabled={savingStation}
      className="border border-carbon px-4 py-2 font-mono text-[11px] tracking-widemono uppercase disabled:opacity-40"
    >
      Guardar URL
    </button>
  </form>

  <label className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 cursor-pointer">
    {uploadingLogo ? "Subiendo…" : "O subir imagen desde tu computadora (PNG, JPG, GIF, WEBP)"}
    <input
      type="file"
      accept="image/png,image/jpeg,image/gif,image/webp"
      onChange={handleUploadLogo}
      disabled={uploadingLogo}
      className="hidden"
    />
  </label>
</section>

<div className="hairline mb-8" />

{/* Zona de peligro */}
<section className="mb-12 border border-red-700/30 p-4">
  <p className="font-mono text-[10px] tracking-widemono uppercase text-red-700 mb-2">
    Zona de peligro
  </p>
  <p className="font-sans text-sm text-carbon/60 mb-4">
    Eliminar esta estación borra también los {tracks?.length ?? 0} tracks que contiene. No se puede deshacer.
  </p>
  <button
    onClick={handleDeleteStation}
    disabled={deletingStation}
    className="border border-red-700 text-red-700 px-4 py-2 font-mono text-[11px] tracking-widemono uppercase disabled:opacity-40"
  >
    {deletingStation ? "Eliminando…" : "Eliminar estación"}
  </button>
</section>

<div className="hairline mb-8" />

      {/* Switch entre buscar y playlist */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode("search")}
          className={`font-mono text-[10px] tracking-widemono uppercase pb-1 border-b ${
            mode === "search" ? "border-carbon" : "border-transparent text-carbon/40"
          }`}
        >
          Buscar video
        </button>
        <button
          onClick={() => setMode("playlist")}
          className={`font-mono text-[10px] tracking-widemono uppercase pb-1 border-b ${
            mode === "playlist" ? "border-carbon" : "border-transparent text-carbon/40"
          }`}
        >
          Importar playlist
        </button>
      </div>

      {/* Modo playlist */}
      {mode === "playlist" && (
        <section className="mb-12">
          <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-4">
            Importar playlist de YouTube
          </p>
          <form onSubmit={handleLoadPlaylist} className="flex gap-2 mb-4">
            <input
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="Pega el link de la playlist de YouTube"
              className="flex-1 border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
            />
            <button
              type="submit"
              disabled={loadingPlaylist}
              className="border border-carbon px-4 py-2 font-mono text-[11px] tracking-widemono uppercase hover:bg-carbon hover:text-bone transition-colors duration-instant ease-enter disabled:opacity-40"
            >
              {loadingPlaylist ? "Cargando…" : "Cargar"}
            </button>
          </form>

          {playlistResults && (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="font-mono text-[10px] text-carbon/50">
                  {selected.size} de {playlistResults.length} seleccionados
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSelectAllPlaylist}
                    className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4"
                  >
                    {selected.size === playlistResults.length ? "Ninguna" : "Todas"}
                  </button>
                  <button
                    onClick={handleAddSelected}
                    disabled={bulkAdding || selected.size === 0}
                    className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 disabled:opacity-40"
                  >
                    {bulkAdding ? "Agregando…" : `Agregar ${selected.size} a esta estación`}
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-carbon/10 max-h-[500px] overflow-y-auto">
                {playlistResults.map((r) => (
                  <li key={r.youtubeId} className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.youtubeId)}
                      onChange={() => toggleSelected(r.youtubeId)}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.thumbnailUrl} alt="" className="w-16 h-10 object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm line-clamp-1">{r.title}</p>
                      <p className="font-mono text-[10px] text-carbon/50">
                        {r.channelTitle} · {formatDuration(r.durationSec)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* Buscador de YouTube (individual) */}
      {mode === "search" && (
        <section className="mb-12">
          <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-4">
            Buscar en YouTube
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ej. Zelda Ocarina of Time OST"
              className="flex-1 border border-carbon/20 px-3 py-2 text-sm bg-transparent focus-visible:outline-2 focus-visible:outline-carbon"
            />
            <button
              type="submit"
              disabled={searching}
              className="border border-carbon px-4 py-2 font-mono text-[11px] tracking-widemono uppercase hover:bg-carbon hover:text-bone transition-colors duration-instant ease-enter disabled:opacity-40"
            >
              {searching ? "Buscando…" : "Buscar"}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results?.map((r) => (
              <div key={r.youtubeId} className="border border-carbon/10 p-3 flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.thumbnailUrl} alt="" className="w-24 h-16 object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm font-medium line-clamp-2">{r.title}</p>
                  <p className="font-mono text-[10px] text-carbon/50 mt-1">
                    {r.channelTitle} · {formatDuration(r.durationSec)}
                  </p>
                  <button
                    onClick={() => handleAdd(r)}
                    disabled={addingId === r.youtubeId}
                    className="mt-2 font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 disabled:opacity-40"
                  >
                    {addingId === r.youtubeId ? "Agregando…" : "Agregar a esta estación"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="hairline mb-8" />

      {/* Tracks actuales */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <p className="font-mono text-[10px] tracking-widemono uppercase text-carbon/50">
            Tracks en esta estación ({tracks?.length ?? "…"})
          </p>
          <div className="flex items-center gap-4">
            {shortTrackIds().length > 0 && (
              <button
                onClick={() => handleBulkDelete(shortTrackIds())}
                disabled={bulkDeleting}
                className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 text-red-700 disabled:opacity-40"
              >
                Eliminar {shortTrackIds().length} cortos (≤10s)
              </button>
            )}
            {selectedForDelete.size > 0 && (
              <button
                onClick={() => handleBulkDelete(Array.from(selectedForDelete))}
                disabled={bulkDeleting}
                className="font-mono text-[10px] tracking-widemono uppercase underline underline-offset-4 text-red-700 disabled:opacity-40"
              >
                {bulkDeleting ? "Eliminando…" : `Eliminar ${selectedForDelete.size} seleccionados`}
              </button>
            )}
          </div>
        </div>

        {tracks && tracks.length > 0 && (
  <input
    value={trackFilter}
    onChange={(e) => setTrackFilter(e.target.value)}
    placeholder="Filtrar por título…"
    className="w-full border border-carbon/20 px-3 py-2 text-sm bg-transparent mb-3 focus-visible:outline-2 focus-visible:outline-carbon"
  />
)}

{tracks && tracks.length > 0 && (
  <label className="flex items-center gap-2 font-mono text-[10px] tracking-widemono uppercase text-carbon/50 mb-2">
    <input
      type="checkbox"
      checked={selectedForDelete.size === tracks.length}
      onChange={toggleSelectAll}
    />
    Seleccionar todos
  </label>
)}

        <ul className="divide-y divide-carbon/10">
          {filteredTracks?.map((t) => (
            <li key={t.id} className="flex items-center gap-4 py-3">
              <input
                type="checkbox"
                checked={selectedForDelete.has(t.id)}
                onChange={() => toggleSelectedForDelete(t.id)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm">{t.title}</p>
                <p className="font-mono text-[10px] text-carbon/50">
                  {t.channelTitle} · {formatDuration(t.durationSec)}
                  {t.durationSec !== null && t.durationSec <= 10 && (
                    <span className="text-red-700"> · corto</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(t.id, t.title)}
                className="font-mono text-[10px] tracking-widemono uppercase text-red-700 underline underline-offset-4"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
        {tracks?.length === 0 && (
          <p className="font-sans text-sm text-carbon/50">Sin tracks todavía. Busca arriba.</p>
        )}
      </section>
    </main>
  );
}