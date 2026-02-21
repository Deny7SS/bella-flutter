import { useState, useMemo, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { Play as PlayIcon, Star, Search, X, Film, Tv, Loader2, ChevronDown, List, ChevronLeft, ChevronRight, Server, Clock, ExternalLink, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import NativeVideoPlayer from "@/components/NativeVideoPlayer";

// ── Types ──
interface ContentItem {
  id: string;
  titulo: string;
  sinopse: string;
  capa_url: string;
  video_url: string;
  tipo: "filme" | "serie";
  categoria: string;
  categoria_id?: string;
  idioma: string;
  views: number;
  temporadas: number;
  stream_id?: string;
  series_id?: string;
}

interface XtreamConfig {
  url: string;
  username: string;
  password: string;
}

interface Episode {
  id: string;
  nome: string;
  link: string;
  temporada: number;
  episodio: number;
  historico: string;
}

interface XtreamCategory {
  id: string;
  nome: string;
  tipo: "filme" | "serie";
}

const TIPOS = [
  { value: "todos", label: "Tudo", icon: null },
  { value: "filme", label: "Filmes", icon: Film },
  { value: "serie", label: "Séries", icon: Tv },
];

const PAGE_SIZE = 48;

// ── Rating Stars ──
function RatingBadge({ rating }: { rating: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <span className="text-[11px] font-semibold text-yellow-400">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Content Card (Netflix style) ──
function ContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative flex-shrink-0 w-[150px] sm:w-[170px] md:w-[180px] text-left focus:outline-none"
      whileHover={{ scale: 1.08, zIndex: 10 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-black/40 group-hover:shadow-xl group-hover:shadow-black/60 transition-shadow duration-300">
        {item.capa_url ? (
          <img
            src={item.capa_url}
            alt={item.titulo}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-muted/20 flex items-center justify-center">
            {item.tipo === "serie" ? <Tv className="h-8 w-8 text-muted-foreground/30" /> : <Film className="h-8 w-8 text-muted-foreground/30" />}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">{item.titulo}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <RatingBadge rating={item.views} />
            <span className="text-[9px] text-white/40 uppercase tracking-wider">
              {item.tipo === "filme" ? "Filme" : "Série"}
            </span>
          </div>
        </div>
      </div>
      {/* Title below (visible when not hovering) */}
      <p className="mt-2 text-xs text-foreground/70 truncate px-0.5 group-hover:text-foreground transition-colors leading-normal">{item.titulo}</p>
    </motion.button>
  );
}

// ── Horizontal Rail (Netflix row) ──
function ContentRail({
  title,
  items,
  onSelect,
  hasMore,
  onLoadMore,
  loadingMore,
}: {
  title: string;
  items: ContentItem[];
  onSelect: (item: ContentItem) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="space-y-2 group/rail">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
        <div className="flex items-center gap-1 opacity-0 group-hover/rail:opacity-100 transition-opacity">
          <button onClick={() => scroll("left")} className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-foreground/60" />
          </button>
          <button onClick={() => scroll("right")} className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onClick={() => onSelect(item)} />
        ))}
        {hasMore && (
          <div className="flex-shrink-0 w-[130px] sm:w-[150px] flex items-center justify-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              {loadingMore ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
              {loadingMore ? "..." : "Ver mais"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Episodes List ──
function EpisodesList({
  episodes,
  onSelectEpisode,
  selectedEpisodeId,
}: {
  episodes: Episode[];
  onSelectEpisode: (ep: Episode) => void;
  selectedEpisodeId?: string;
}) {
  const seasons = useMemo(() => {
    const map = new Map<number, Episode[]>();
    episodes.forEach((ep) => {
      const list = map.get(ep.temporada) || [];
      list.push(ep);
      map.set(ep.temporada, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [episodes]);

  const [activeSeason, setActiveSeason] = useState(seasons[0]?.[0] || 1);
  const activeEpisodes = seasons.find(([s]) => s === activeSeason)?.[1] || [];

  return (
    <div className="space-y-3">
      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {seasons.map(([season]) => (
            <button
              key={season}
              onClick={() => setActiveSeason(season)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                activeSeason === season
                  ? "bg-white text-black font-semibold"
                  : "bg-white/[0.06] text-white/50 hover:bg-white/10"
              }`}
            >
              Temporada {season}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-1 max-h-[45vh] overflow-y-auto scrollbar-none">
        {activeEpisodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelectEpisode(ep)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
              selectedEpisodeId === ep.id
                ? "bg-white/10 ring-1 ring-white/20"
                : "hover:bg-white/[0.04]"
            }`}
          >
            <div className="h-9 w-9 rounded-md bg-white/[0.06] flex items-center justify-center flex-shrink-0">
              <PlayIcon className="h-3.5 w-3.5 text-white/50 ml-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white/90 truncate">
                {ep.episodio}. {ep.nome}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">Temporada {ep.temporada}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Player / Detail Modal (Netflix style) ──
function PlayerView({
  item,
  onClose,
  xtreamConfig,
  playSource,
}: {
  item: ContentItem;
  onClose: () => void;
  xtreamConfig: XtreamConfig | null;
  playSource: string;
}) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(
    item.tipo === "serie" ? "" : (item.video_url || "")
  );
  const [selectedEpId, setSelectedEpId] = useState<string | undefined>();
  const isNative = Capacitor.isNativePlatform();

  const [details, setDetails] = useState<{
    sinopse?: string; rating?: number; genero?: string; duracao?: string;
    elenco?: string; diretor?: string; ano?: string;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const PLAYER_BASE_URL = "https://bella-learns-it.lovable.app/player.html";

  const openNativePlayer = async (videoUrl: string, title: string) => {
    try {
      const { Browser } = await import("@capacitor/browser");
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";
      const userId = sessionData?.session?.user?.id || "";
      const params = new URLSearchParams({ url: videoUrl, uid: userId, token, cid: item.id, title });
      await Browser.open({ url: `${PLAYER_BASE_URL}?${params.toString()}`, presentationStyle: "fullscreen" });
    } catch (e) {
      console.error("[PlayerView] Erro ao abrir Browser:", e);
    }
  };

  const isXtream = playSource === "xtream";

  // Fetch VOD details
  useEffect(() => {
    if (!isXtream || !xtreamConfig || !item.stream_id) return;
    setLoadingDetails(true);
    const fetchDetails = async () => {
      try {
        if (isNative) {
          const base = xtreamConfig.url.replace(/\/$/, "");
          const auth = `username=${encodeURIComponent(xtreamConfig.username)}&password=${encodeURIComponent(xtreamConfig.password)}`;
          const res = await fetch(`${base}/player_api.php?${auth}&action=get_vod_info&vod_id=${item.stream_id}`);
          const data = await res.json();
          const info = data?.info || data?.movie_data || {};
          setDetails({
            sinopse: info.plot || info.description || '', rating: Number(info.rating || info.rating_5based || 0),
            genero: info.genre || '', duracao: info.duration || '', elenco: info.cast || '',
            diretor: info.director || '', ano: info.releasedate || info.year || '',
          });
        } else {
          const { data } = await supabase.functions.invoke("xtream-catalog", {
            body: { action: "vod_info", url: xtreamConfig.url, username: xtreamConfig.username, password: xtreamConfig.password, vod_id: item.stream_id },
          });
          if (data) setDetails(data);
        }
      } catch (e) {
        console.error("Error loading VOD details", e);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [item, isXtream, xtreamConfig]);

  // Fetch episodes for series
  useEffect(() => {
    if (item.tipo !== "serie") return;
    setLoadingEps(true);
    const fetchEps = async () => {
      try {
        if (playSource === "xtream" && xtreamConfig && item.series_id) {
          if (isNative) {
            const res = await fetch(
              `${xtreamConfig.url.replace(/\/$/, "")}/player_api.php?username=${encodeURIComponent(xtreamConfig.username)}&password=${encodeURIComponent(xtreamConfig.password)}&action=get_series_info&series_id=${item.series_id}`
            );
            const data = await res.json();
            const eps: Episode[] = [];
            const seasonsObj = data.episodes || {};
            Object.entries(seasonsObj).forEach(([season, epsArr]: [string, any]) => {
              if (Array.isArray(epsArr)) {
                epsArr.forEach((ep: any) => {
                  eps.push({
                    id: String(ep.id), nome: ep.title || String(ep.episode_num),
                    link: `${xtreamConfig.url.replace(/\/$/, "")}/series/${xtreamConfig.username}/${xtreamConfig.password}/${ep.id}.${ep.container_extension || "mkv"}`,
                    temporada: Number(season), episodio: Number(ep.episode_num), historico: "",
                  });
                });
              }
            });
            eps.sort((a, b) => a.temporada - b.temporada || a.episodio - b.episodio);
            setEpisodes(eps);
            if (eps.length > 0) { setActiveVideoUrl(eps[0].link); setSelectedEpId(eps[0].id); setShowEpisodes(true); }
          } else {
            const { data: fnData } = await supabase.functions.invoke("xtream-catalog", {
              body: { action: "series_episodes", url: xtreamConfig.url, username: xtreamConfig.username, password: xtreamConfig.password, series_id: item.series_id },
            });
            const eps = fnData?.episodes || [];
            setEpisodes(eps);
            if (eps.length > 0) { setActiveVideoUrl(eps[0].link); setSelectedEpId(eps[0].id); setShowEpisodes(true); }
          }
        } else {
          const { data } = await supabase.functions.invoke("baserow-content", { body: { action: "episodes", serie_name: item.titulo } });
          const eps = data?.episodes || [];
          setEpisodes(eps);
          if (eps.length > 0) { setActiveVideoUrl(eps[0].link); setSelectedEpId(eps[0].id); setShowEpisodes(true); }
        }
      } catch (e) { console.error("Error loading episodes", e); }
      finally { setLoadingEps(false); }
    };
    fetchEps();
  }, [item]);

  const url = activeVideoUrl;

  const openInBrowser = (videoUrl: string) => { window.open(videoUrl, "_blank", "noopener"); };

  const handlePlayFilm = () => {
    if (!url) return;
    if (isNative) openNativePlayer(url, item.titulo);
    else openInBrowser(url);
  };

  const handleSelectEpisode = (ep: Episode) => {
    const epTitle = `${item.titulo} - T${ep.temporada}E${ep.episodio} ${ep.nome}`;
    if (isNative) openNativePlayer(ep.link, epTitle);
    else if (isXtream) openInBrowser(ep.link);
    else setActiveVideoUrl(ep.link);
    setSelectedEpId(ep.id);
  };

  // Auto-open only for native + non-xtream films
  useEffect(() => {
    if (isNative && !isXtream && item.tipo === "filme" && url && url.trim() !== "") {
      openNativePlayer(url, item.titulo);
      onClose();
    }
  }, [url]);

  const sinopse = details?.sinopse || item.sinopse;
  const genres = (details?.genero || item.categoria || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Backdrop image */}
      <div className="relative w-full aspect-[16/9] max-h-[45vh] flex-shrink-0 overflow-hidden">
        {item.capa_url ? (
          <img src={item.capa_url} alt={item.titulo} className="w-full h-full object-cover opacity-50 scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-muted/20 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title + Play overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight max-w-[80%]">{item.titulo}</h1>
          
          <div className="flex items-center gap-2 flex-wrap">
            {(details?.rating && details.rating > 0) && (
              <span className="text-sm font-semibold text-green-400">{Math.round(details.rating * 10)}% Match</span>
            )}
            {details?.ano && <span className="text-sm text-white/50">{details.ano}</span>}
            {details?.duracao && <span className="text-sm text-white/50">{details.duracao}</span>}
            {item.tipo === "serie" && (
              <span className="text-[11px] px-1.5 py-0.5 border border-white/20 text-white/60 rounded">Série</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Play button */}
            {item.tipo === "filme" && url && url.trim() !== "" && (
              <button
                onClick={handlePlayFilm}
                className="flex items-center gap-2 px-5 py-2 rounded bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.97] transition-all"
              >
                <PlayIcon className="h-4 w-4 fill-black" />
                Assistir
              </button>
            )}
            {item.tipo === "serie" && episodes.length > 0 && (
              <button
                onClick={() => {
                  if (episodes[0]) handleSelectEpisode(episodes[0]);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.97] transition-all"
              >
                <PlayIcon className="h-4 w-4 fill-black" />
                Assistir
              </button>
            )}
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="h-9 w-9 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:border-white hover:text-white transition-all"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Loading indicator for episodes */}
        {item.tipo === "serie" && loadingEps && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          </div>
        )}
      </div>

      {/* Info Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
      >
        {/* Sinopse */}
        {loadingDetails && !details && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white/20" />
            <span className="text-xs text-white/20">Carregando detalhes...</span>
          </div>
        )}
        {sinopse && (
          <p className="text-sm text-white/60 leading-relaxed max-w-2xl">{sinopse}</p>
        )}

        {/* Metadata row */}
        <div className="space-y-1.5 text-[12px] text-white/40">
          {genres.length > 0 && (
            <p><span className="text-white/20">Gêneros:</span> {genres.join(", ")}</p>
          )}
          {details?.elenco && <p><span className="text-white/20">Elenco:</span> {details.elenco}</p>}
          {details?.diretor && <p><span className="text-white/20">Diretor:</span> {details.diretor}</p>}
        </div>

        {/* Episodes */}
        {item.tipo === "serie" && (
          <div className="pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="flex items-center gap-2 w-full py-2"
            >
              <span className="text-sm font-semibold text-white/80">
                Episódios {episodes.length > 0 && `(${episodes.length})`}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-white/30 ml-auto transition-transform duration-200 ${showEpisodes ? "rotate-180" : ""}`} />
            </button>

            {loadingEps && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                <span className="text-xs text-white/30">Carregando episódios...</span>
              </div>
            )}

            {showEpisodes && !loadingEps && episodes.length > 0 && (
              <EpisodesList episodes={episodes} onSelectEpisode={handleSelectEpisode} selectedEpisodeId={selectedEpId} />
            )}

            {!loadingEps && episodes.length === 0 && (
              <p className="text-xs text-white/20 py-2">Nenhum episódio encontrado</p>
            )}
          </div>
        )}

        {/* Play button for xtream films (secondary) */}
        {isXtream && item.tipo === "filme" && url && url.trim() !== "" && (
          <button
            onClick={handlePlayFilm}
            className="flex items-center justify-center gap-2 w-full py-3 rounded bg-white/[0.06] hover:bg-white/10 text-white/70 text-sm font-medium transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir no navegador
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Category Browser (Xtream) ──
function XtreamCategoryBrowser({
  config,
  tipoFilter,
  search,
  onSelect,
}: {
  config: XtreamConfig;
  tipoFilter: string;
  search: string;
  onSelect: (item: ContentItem) => void;
}) {
  const [categories, setCategories] = useState<XtreamCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<XtreamCategory | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Global search state
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories
  useEffect(() => {
    const load = async () => {
      setLoadingCats(true);
      try {
        let cats: XtreamCategory[] = [];
        if (isNative) {
          const base = config.url.replace(/\/$/, "");
          const auth = `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`;
          const [vodCats, seriesCats] = await Promise.all([
            fetch(`${base}/player_api.php?${auth}&action=get_vod_categories`).then(r => r.json()).catch(() => []),
            fetch(`${base}/player_api.php?${auth}&action=get_series_categories`).then(r => r.json()).catch(() => []),
          ]);
          cats = [
            ...(Array.isArray(vodCats) ? vodCats.map((c: any) => ({ id: c.category_id, nome: c.category_name, tipo: "filme" as const })) : []),
            ...(Array.isArray(seriesCats) ? seriesCats.map((c: any) => ({ id: c.category_id, nome: c.category_name, tipo: "serie" as const })) : []),
          ];
        } else {
          const { data } = await supabase.functions.invoke("xtream-catalog", {
            body: { action: "categories", url: config.url, username: config.username, password: config.password },
          });
          cats = data?.categories || [];
        }
        setCategories(cats);
        if (cats.length > 0) setSelectedCat(cats[0]);
      } catch (e) {
        console.error("Error loading Xtream categories", e);
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, [config]);

  // Load items when category changes
  useEffect(() => {
    if (!selectedCat) return;
    setItems([]);
    setPage(1);
    setHasMore(false);
    loadPage(selectedCat, 1, false);
  }, [selectedCat]);

  const loadPage = async (cat: XtreamCategory, p: number, append: boolean) => {
    if (p === 1) setLoadingItems(true);
    else setLoadingMore(true);

    try {
      const action = cat.tipo === "serie" ? "series" : "vod";
      let newItems: ContentItem[] = [];
      let moreAvailable = false;

      if (isNative) {
        const base = config.url.replace(/\/$/, "");
        const auth = `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`;
        const apiAction = cat.tipo === "serie" ? "get_series" : "get_vod_streams";
        const res = await fetch(`${base}/player_api.php?${auth}&action=${apiAction}&category_id=${cat.id}`);
        const all = await res.json().catch(() => []);
        const start = (p - 1) * PAGE_SIZE;
        const slice = Array.isArray(all) ? all.slice(start, start + PAGE_SIZE) : [];
        moreAvailable = start + PAGE_SIZE < (Array.isArray(all) ? all.length : 0);

        newItems = slice.map((s: any) => cat.tipo === "serie" ? ({
          id: String(s.series_id), titulo: s.name || "", capa_url: s.cover || "",
          sinopse: s.plot || "", categoria: cat.nome, categoria_id: String(cat.id),
          video_url: "", tipo: "serie" as const, idioma: "", views: Number(s.rating || 0),
          temporadas: 0, series_id: String(s.series_id),
        }) : ({
          id: String(s.stream_id || s.num), titulo: s.name || "", capa_url: s.stream_icon || "",
          sinopse: s.plot || "", categoria: cat.nome, categoria_id: String(cat.id),
          video_url: `${base}/movie/${config.username}/${config.password}/${s.stream_id}.${s.container_extension || "mp4"}`,
          tipo: "filme" as const, idioma: "", views: Number(s.rating || 0),
          temporadas: 0, stream_id: String(s.stream_id),
        }));
      } else {
        const { data } = await supabase.functions.invoke("xtream-catalog", {
          body: { action, url: config.url, username: config.username, password: config.password, category_id: cat.id, page: p, limit: PAGE_SIZE },
        });
        newItems = data?.items || [];
        moreAvailable = data?.has_more || false;
      }

      setItems(prev => append ? [...prev, ...newItems] : newItems);
      setHasMore(moreAvailable);
      setPage(p);
    } catch (e) {
      console.error("Error loading Xtream items", e);
    } finally {
      setLoadingItems(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!selectedCat || loadingMore) return;
    loadPage(selectedCat, page + 1, true);
  };

  // Global search
  useEffect(() => {
    if (!search || search.length < 2) { setSearchResults([]); setSearchDone(false); return; }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setLoadingSearch(true); setSearchDone(false);
      try {
        const base = config.url.replace(/\/$/, "");
        const auth = `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`;
        let allItems: ContentItem[] = [];
        const shouldSearchVod = tipoFilter === "todos" || tipoFilter === "filme";
        const shouldSearchSeries = tipoFilter === "todos" || tipoFilter === "serie";

        if (isNative) {
          const fetches: Promise<any>[] = [];
          if (shouldSearchVod) fetches.push(fetch(`${base}/player_api.php?${auth}&action=get_vod_streams`).then(r => r.json()).catch(() => []));
          else fetches.push(Promise.resolve([]));
          if (shouldSearchSeries) fetches.push(fetch(`${base}/player_api.php?${auth}&action=get_series`).then(r => r.json()).catch(() => []));
          else fetches.push(Promise.resolve([]));
          const [vodData, seriesData] = await Promise.all(fetches);
          if (Array.isArray(vodData)) {
            allItems.push(...vodData.map((s: any) => ({
              id: String(s.stream_id || s.num), titulo: s.name || "", capa_url: s.stream_icon || "",
              sinopse: s.plot || "", categoria: "", video_url: `${base}/movie/${config.username}/${config.password}/${s.stream_id}.${s.container_extension || "mp4"}`,
              tipo: "filme" as const, idioma: "", views: Number(s.rating || 0), temporadas: 0, stream_id: String(s.stream_id),
            })));
          }
          if (Array.isArray(seriesData)) {
            allItems.push(...seriesData.map((s: any) => ({
              id: String(s.series_id), titulo: s.name || "", capa_url: s.cover || "",
              sinopse: s.plot || "", categoria: "", video_url: "", tipo: "serie" as const,
              idioma: "", views: Number(s.rating || 0), temporadas: 0, series_id: String(s.series_id),
            })));
          }
        } else {
          const fetches: Promise<any>[] = [];
          if (shouldSearchVod) fetches.push(supabase.functions.invoke("xtream-catalog", { body: { action: "vod", url: config.url, username: config.username, password: config.password, page: 1, limit: 10000 } }).then(r => r.data));
          else fetches.push(Promise.resolve({ items: [] }));
          if (shouldSearchSeries) fetches.push(supabase.functions.invoke("xtream-catalog", { body: { action: "series", url: config.url, username: config.username, password: config.password, page: 1, limit: 10000 } }).then(r => r.data));
          else fetches.push(Promise.resolve({ items: [] }));
          const [vodRes, seriesRes] = await Promise.all(fetches);
          allItems = [...(vodRes?.items || []), ...(seriesRes?.items || [])];
        }
        const q = search.toLowerCase();
        setSearchResults(allItems.filter(i => i.titulo.toLowerCase().includes(q)));
      } catch (e) { console.error("Error in global search", e); setSearchResults([]); }
      finally { setLoadingSearch(false); setSearchDone(true); }
    }, 500);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search, tipoFilter, config, isNative]);

  const filteredCats = categories.filter(c => tipoFilter === "todos" || c.tipo === tipoFilter);
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.titulo.toLowerCase().includes(q) || i.sinopse.toLowerCase().includes(q));
  }, [items, search]);

  const isSearching = search.length >= 2;
  const displayItems = isSearching ? searchResults : filteredItems;

  if (loadingCats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
        <p className="text-sm text-muted-foreground">Conectando ao servidor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category chips */}
      {!isSearching && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filteredCats.map((cat) => (
            <button
              key={`${cat.tipo}-${cat.id}`}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-all ${
                selectedCat?.id === cat.id && selectedCat?.tipo === cat.tipo
                  ? "bg-white text-black font-semibold"
                  : "bg-white/[0.06] text-foreground/50 hover:bg-white/10 hover:text-foreground/70"
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      {(isSearching ? loadingSearch : loadingItems) ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {isSearching ? `Buscando "${search}"...` : "Carregando..."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {isSearching && (
            <p className="text-xs text-muted-foreground px-1">
              {displayItems.length} resultado{displayItems.length !== 1 ? "s" : ""} para "{search}"
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayItems.map((item) => (
              <ContentCard key={`${item.tipo}-${item.id}`} item={item} onClick={() => onSelect(item)} />
            ))}
          </div>
          {!isSearching && hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/[0.06] hover:bg-white/10 text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          )}
          {displayItems.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center space-y-2">
              <Search className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Nenhum título encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function PlayPage() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playSource, setPlaySource] = useState<string>("baserow");
  const [xtreamConfig, setXtreamConfig] = useState<XtreamConfig | null>(null);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  // Load watch history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) return;
        const { data } = await supabase
          .from("iptv_progresso")
          .select("*")
          .eq("user_id", session.session.user.id)
          .order("updated_at", { ascending: false })
          .limit(20);
        if (data) setWatchHistory(data);
      } catch { /* silent */ }
    };
    loadHistory();
  }, [selected]);

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await supabase.from("admin_config").select("play_source, xtream_url, xtream_username, xtream_password").eq("id", 1).single();
        if (data) {
          const source = (data as any).play_source || "baserow";
          setPlaySource(source);
          if (source === "xtream" && (data as any).xtream_url) {
            setXtreamConfig({ url: (data as any).xtream_url, username: (data as any).xtream_username || "", password: (data as any).xtream_password || "" });
          }
        }
      } catch (e) { console.error("Error loading play config", e); }
      finally { setLoading(false); }
    };
    loadConfig();
  }, []);

  // Load Baserow catalog
  useEffect(() => {
    if (playSource !== "baserow") return;
    const fetchContent = async () => {
      try {
        setLoading(true);
        const { data, error: fnError } = await supabase.functions.invoke("baserow-content");
        if (fnError) throw fnError;
        setContent(data.items || []);
        setSessoes(data.sessoes || []);
      } catch (err: any) { console.error("Error fetching content:", err); setError("Erro ao carregar conteúdo"); }
      finally { setLoading(false); }
    };
    fetchContent();
  }, [playSource]);

  const filtered = useMemo(() => {
    return content.filter((item) => {
      const matchTipo = tipoFilter === "todos" || item.tipo === tipoFilter;
      const matchSearch = !search || item.titulo.toLowerCase().includes(search.toLowerCase()) || item.sinopse.toLowerCase().includes(search.toLowerCase());
      return matchTipo && matchSearch;
    });
  }, [search, tipoFilter, content]);

  const groupedByCategoria = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    if (sessoes.length > 0) {
      sessoes.forEach((sessao) => {
        const key = sessao.categoria;
        const tipoLower = (sessao.tipo || "").toLowerCase();
        const sessaoTipo = tipoLower === "série" || tipoLower === "serie" ? "serie" : "filme";
        const matching = filtered.filter((item) => {
          const itemCats = item.categoria.split(",").map((c: string) => c.trim().toLowerCase());
          return itemCats.includes(key.toLowerCase()) && item.tipo === sessaoTipo;
        });
        if (matching.length > 0) groups[`${key} (${sessao.tipo})`] = matching;
      });
    }
    filtered.forEach((item) => {
      item.categoria.split(",").forEach((cat: string) => {
        const trimmed = cat.trim();
        if (trimmed) {
          const inSession = sessoes.some((s: any) => s.categoria.toLowerCase() === trimmed.toLowerCase());
          if (!inSession) {
            if (!groups[trimmed]) groups[trimmed] = [];
            if (!groups[trimmed].find((i) => i.id === item.id)) groups[trimmed].push(item);
          }
        }
      });
    });
    return groups;
  }, [filtered, sessoes]);

  const featured = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.views - a.views);
    return sorted[0] || null;
  }, [filtered]);

  return (
    <Layout>
      <div className="space-y-5 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-lg font-bold text-foreground">Play</h1>
          </div>
          {playSource === "xtream" && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Server className="h-3 w-3" /> IPTV
            </span>
          )}
        </div>

        {/* Search */}
        <div role="presentation" onSubmit={(e: any) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input
              placeholder="Buscar títulos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-full bg-white/[0.04] border-white/[0.06] text-sm placeholder:text-muted-foreground/40 focus:bg-white/[0.06] focus:border-white/10 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1.5">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTipoFilter(t.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                tipoFilter === t.value
                  ? "bg-white text-black font-semibold"
                  : "bg-white/[0.06] text-foreground/50 hover:bg-white/10 hover:text-foreground/70"
              }`}
            >
              {t.icon && <t.icon className="h-3 w-3" />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {playSource === "xtream" ? "Conectando ao servidor..." : "Carregando catálogo..."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Continue Watching */}
        {!loading && !search && watchHistory.length > 0 && (
          <ContentRail
            title="Continuar Assistindo"
            items={watchHistory.map(prog => {
              const matchItem = content.find(c => c.id === prog.content_id);
              return matchItem || {
                id: prog.content_id,
                titulo: prog.content_title || "Sem título",
                sinopse: "",
                capa_url: "",
                video_url: "",
                tipo: "filme" as const,
                categoria: "",
                idioma: "",
                views: 0,
                temporadas: 0,
              };
            }).filter(Boolean)}
            onSelect={setSelected}
          />
        )}

        {/* Xtream content */}
        {!loading && !error && playSource === "xtream" && xtreamConfig && (
          <XtreamCategoryBrowser config={xtreamConfig} tipoFilter={tipoFilter} search={search} onSelect={setSelected} />
        )}

        {/* Xtream not configured */}
        {!loading && playSource === "xtream" && !xtreamConfig && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Server className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Servidor IPTV não configurado</p>
            <p className="text-xs text-muted-foreground/50">Configure no painel admin → Play</p>
          </div>
        )}

        {/* Baserow content */}
        {!loading && !error && playSource === "baserow" && (
          <>
            {/* Hero */}
            {featured && !search && (
              <motion.button
                onClick={() => setSelected(featured)}
                className="relative w-full aspect-[16/9] rounded-xl overflow-hidden group text-left"
                whileTap={{ scale: 0.98 }}
              >
                <img src={featured.capa_url} alt={featured.titulo} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
                  <h2 className="text-xl font-bold text-white leading-tight">{featured.titulo}</h2>
                  <p className="text-xs text-white/50 line-clamp-2 max-w-md">{featured.sinopse}</p>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-white text-black text-xs font-semibold">
                      <PlayIcon className="h-3.5 w-3.5 fill-black" /> Assistir
                    </span>
                    <RatingBadge rating={featured.views} />
                  </div>
                </div>
              </motion.button>
            )}

            {/* Category Rails */}
            {Object.keys(groupedByCategoria).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedByCategoria).map(([cat, items]) => (
                  <ContentRail key={cat} title={cat} items={items} onSelect={setSelected} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Film className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Nenhum título encontrado</p>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <PlayerView item={selected} onClose={() => setSelected(null)} xtreamConfig={xtreamConfig} playSource={playSource} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
