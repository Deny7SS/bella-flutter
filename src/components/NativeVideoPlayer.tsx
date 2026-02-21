import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Film, ExternalLink, Play } from "lucide-react";
import { remoteLog } from "@/lib/remoteLogger";
import { supabase } from "@/integrations/supabase/client";

const CF_PROXY_URL = "https://bold-block-8917.denysouzah7.workers.dev";

/** Se a URL for HTTP, roteia pelo Cloudflare Worker para servir via HTTPS */
function getProxiedUrl(src: string): string {
  if (!src) return src;
  try {
    const u = new URL(src);
    if (u.protocol === "http:") {
      return `${CF_PROXY_URL}/?url=${encodeURIComponent(src)}`;
    }
  } catch {
    // url inválida, retorna como está
  }
  return src;
}

interface NativeVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  title?: string;
  poster?: string;
  contentId?: string;
  contentTitle?: string;
}

export default function NativeVideoPlayer({
  src,
  autoPlay = false,
  poster,
  contentId,
  contentTitle,
}: NativeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [userStarted, setUserStarted] = useState(autoPlay);
  const lastSavedRef = useRef(-1);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const effectiveContentId = contentId || src;
  const proxiedSrc = useMemo(() => getProxiedUrl(src), [src]);

  // Reset state when src changes
  useEffect(() => {
    setHasError(false);
    if (!autoPlay) setUserStarted(false);
    lastSavedRef.current = -1;
    setSavedPosition(null);
    setShowResumePrompt(false);
  }, [src, autoPlay]);

  // Fetch saved progress
  useEffect(() => {
    if (!effectiveContentId || !src) return;
    const fetchProgress = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) return;
        const { data } = await supabase
          .from("iptv_progresso")
          .select("posicao_segundos, duracao_segundos")
          .eq("user_id", session.session.user.id)
          .eq("content_id", effectiveContentId)
          .maybeSingle();
        if (data && data.posicao_segundos > 10) {
          const dur = data.duracao_segundos || 0;
          const pct = dur > 0 ? data.posicao_segundos / dur : 0;
          if (pct < 0.95) {
            setSavedPosition(data.posicao_segundos);
          }
        }
      } catch {
        // silent
      }
    };
    fetchProgress();
  }, [effectiveContentId, src]);

  // Save progress every 5s
  const saveProgress = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !effectiveContentId) return;
    const cur = Math.floor(video.currentTime);
    const dur = Math.floor(video.duration) || null;
    if (cur < 5 || cur === lastSavedRef.current) return;
    lastSavedRef.current = cur;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;
      await supabase.from("iptv_progresso").upsert(
        {
          user_id: session.session.user.id,
          content_id: effectiveContentId,
          content_title: contentTitle || "",
          posicao_segundos: cur,
          duracao_segundos: dur,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id" }
      );
    } catch {
      // silent
    }
  }, [effectiveContentId, contentTitle]);

  useEffect(() => {
    if (!userStarted) return;
    const interval = setInterval(saveProgress, 5000);
    return () => clearInterval(interval);
  }, [userStarted, saveProgress]);

  // Save on visibility change / unload
  useEffect(() => {
    if (!userStarted) return;
    const onHidden = () => { if (document.hidden) saveProgress(); };
    const onUnload = () => saveProgress();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [userStarted, saveProgress]);

  // Error handling
  useEffect(() => {
    const video = videoRef.current;
    remoteLog.info("[NativeVideoPlayer]", "src recebido", { src });
    if (!video) return;

    const onError = () => {
      const err = video.error;
      remoteLog.error("[NativeVideoPlayer]", "Erro no player de vídeo", {
        src,
        errorCode: err?.code,
        errorMessage: err?.message,
        networkState: video.networkState,
        readyState: video.readyState,
      });
      setHasError(true);
    };

    const onCanPlay = () => {
      remoteLog.info("[NativeVideoPlayer]", "canplay OK", { src });
      setHasError(false);
    };

    video.addEventListener("error", onError);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("error", onError);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [src]);

  // Restore position when video loads
  useEffect(() => {
    if (!userStarted) return;
    const video = videoRef.current;
    if (!video || savedPosition === null) return;

    const onLoaded = () => {
      setShowResumePrompt(true);
    };

    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [src, userStarted, savedPosition]);

  const handleResume = () => {
    const video = videoRef.current;
    if (video && savedPosition) {
      video.currentTime = savedPosition;
    }
    setShowResumePrompt(false);
    setSavedPosition(null);
  };

  const handleRestartFromBeginning = () => {
    setShowResumePrompt(false);
    setSavedPosition(null);
  };

  // Auto-fullscreen
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const tryFullscreen = () => {
      const v = video as any;
      if (v.requestFullscreen) v.requestFullscreen();
      else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    };

    video.addEventListener("loadedmetadata", tryFullscreen, { once: true });
    return () => video.removeEventListener("loadedmetadata", tryFullscreen);
  }, [src, autoPlay]);

  // No link
  if (!src || src.trim() === "") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 bg-black">
        <Film className="h-8 w-8 text-white/20" />
        <p className="text-white/30 text-xs font-mono">Nenhum link disponível</p>
      </div>
    );
  }

  // Error — show fallback to open in browser
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-black px-4">
        <Film className="h-8 w-8 text-white/30" />
        <p className="text-white/50 text-xs font-mono text-center">
          Não foi possível reproduzir o vídeo
        </p>
        <button
          onClick={() => window.open(src, "_blank", "noopener")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary text-xs font-mono hover:bg-primary/30 transition-colors ring-1 ring-primary/30"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir no navegador
        </button>
      </div>
    );
  }

  // Waiting for user to press play
  if (!userStarted) {
    const fmtTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${String(sec).padStart(2, "0")}`;
    };

    return (
      <div className="relative flex items-center justify-center h-full bg-black overflow-hidden">
        {poster && (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[2px] scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <button
            onClick={() => setUserStarted(true)}
            className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center ring-2 ring-white/20 hover:bg-primary hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
          >
            <Play className="h-7 w-7 text-primary-foreground ml-0.5" />
          </button>
          {savedPosition !== null && savedPosition > 0 && (
            <p className="text-white/50 text-[11px] font-mono">
              Continuar de {fmtTime(savedPosition)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Native embedded player
  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        key={src}
        src={proxiedSrc}
        controls
        autoPlay
        playsInline
        controlsList="nodownload"
        className="w-full h-full object-contain bg-black"
        style={{ maxHeight: "100%", maxWidth: "100%" }}
      />
      {/* Resume prompt */}
      {showResumePrompt && savedPosition !== null && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/90 backdrop-blur-sm rounded-xl px-4 py-2.5 ring-1 ring-white/10 shadow-xl">
          <p className="text-white/70 text-xs font-mono mr-1">
            Continuar de {Math.floor(savedPosition / 60)}:{String(Math.floor(savedPosition % 60)).padStart(2, "0")}?
          </p>
          <button
            onClick={handleResume}
            className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-semibold hover:bg-primary/90 transition-colors"
          >
            Sim
          </button>
          <button
            onClick={handleRestartFromBeginning}
            className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-xs font-mono hover:bg-white/20 transition-colors"
          >
            Início
          </button>
        </div>
      )}
    </div>
  );
}
