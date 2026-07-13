import { useState, useEffect, useRef } from "react";
import { Play, AlertCircle, RefreshCw } from "lucide-react";

type VideoType = "youtube" | "vimeo" | string;

interface VideoPlayerProps {
  videoId: string;
  assetType: VideoType;
  autoplay?: boolean;
  muted?: boolean;
  background?: boolean;
  className?: string;
  onReady?: () => void;
  onError?: () => void;
}

function buildSrc(videoId: string, assetType: VideoType, autoplay: boolean, muted: boolean, background: boolean) {
  if (!videoId) return null;
  if (assetType === "youtube") {
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      mute: muted ? "1" : "0",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1",
      ...(background ? { controls: "0", disablekb: "1", fs: "0", loop: "1", playlist: videoId } : {}),
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  }
  if (assetType === "vimeo") {
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      muted: muted ? "1" : "0",
      background: background ? "1" : "0",
      title: "0",
      byline: "0",
      portrait: "0",
      badge: "0",
      dnt: "1",
    });
    return `https://player.vimeo.com/video/${videoId}?${params}`;
  }
  return null;
}

const BLANK_CHECK_DELAY = 6000; // 6 s before declaring a video blank
const MAX_RETRIES = 2;

export function VideoPlayer({
  videoId,
  assetType,
  autoplay = false,
  muted = false,
  background = false,
  className = "",
  onReady,
  onError,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "blank">("loading");
  const [retries, setRetries] = useState(0);
  const [key, setKey] = useState(0); // force re-mount

  const src = buildSrc(videoId, assetType, autoplay, muted, background);

  // Blank-video detection: YouTube fires message "onStateChange" or "onReady".
  // Vimeo fires "ready". If neither fires within BLANK_CHECK_DELAY, mark blank.
  useEffect(() => {
    if (!src) { setStatus("error"); return; }
    setStatus("loading");

    let resolved = false;

    const resolve = (s: "ready" | "error" | "blank") => {
      if (resolved) return;
      resolved = true;
      clearTimeout(blankTimer);
      setStatus(s);
      if (s === "ready") onReady?.();
      else onError?.();
    };

    const handleMessage = (e: MessageEvent) => {
      try {
        // YouTube postMessage
        if (typeof e.data === "string") {
          const d = JSON.parse(e.data);
          if (d.event === "onReady" || d.event === "onStateChange" || d.event === "initialDelivery") {
            resolve("ready");
          }
          if (d.event === "onError") resolve("error");
        }
        // Vimeo postMessage
        if (typeof e.data === "object" && e.data?.event === "ready") {
          resolve("ready");
        }
      } catch {
        /* non-JSON postMessage from other embeds — ignore */
      }
    };

    window.addEventListener("message", handleMessage);

    // Fallback: assume loaded after delay (iframes don't surface load failures)
    const blankTimer = setTimeout(() => {
      if (!resolved) {
        // We never got a ready signal — likely blocked or blank
        resolve("blank");
      }
    }, BLANK_CHECK_DELAY);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(blankTimer);
    };
  }, [src, key]);

  const retry = () => {
    if (retries >= MAX_RETRIES) return;
    setRetries(r => r + 1);
    setKey(k => k + 1);
    setStatus("loading");
  };

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-[#f5f5f7] ${className}`}>
        <div className="text-center p-6">
          <AlertCircle size={32} className="text-[#86868b] mx-auto mb-2" />
          <p className="text-[13px] text-[#86868b]">No video available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Iframe — always in DOM so it loads */}
      <iframe
        key={key}
        ref={iframeRef}
        src={src}
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        style={{ border: "none" }}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />

      {/* Loading shimmer */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-[#1d1d1f] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <p className="text-[12px] text-white/40">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error / Blank state */}
      {(status === "error" || status === "blank") && (
        <div className="absolute inset-0 bg-[#1d1d1f] flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-white/60" />
            </div>
            <p className="text-white font-medium text-[15px] mb-1">
              {status === "blank" ? "Video unavailable" : "Couldn't load video"}
            </p>
            <p className="text-white/40 text-[13px] mb-4">
              {status === "blank"
                ? "This video may be restricted in your region."
                : "Check your connection and try again."}
            </p>
            {retries < MAX_RETRIES && (
              <button
                onClick={retry}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white text-[13px] font-medium border border-white/20 hover:border-white/40 px-4 py-2 rounded-full transition-all"
              >
                <RefreshCw size={13} /> Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Simplified thumbnail-style tile for ad feed grids */
export function VideoTile({
  videoId,
  assetType,
  brandName,
  title,
  pointReward,
  multiplier,
  onClick,
}: {
  videoId: string;
  assetType: VideoType;
  brandName: string;
  title: string;
  pointReward: number;
  multiplier: number;
  onClick?: () => void;
}) {
  const [thumbError, setThumbError] = useState(false);
  const thumbUrl = !thumbError
    ? assetType === "youtube"
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : assetType === "vimeo"
      ? `https://vumbnail.com/${videoId}.jpg`
      : null
    : null;

  return (
    <div
      onClick={onClick}
      className="group rounded-2xl border border-black/[0.08] bg-white overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-black/[0.14] transition-all cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1d1d1f] overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setThumbError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] flex items-center justify-center">
            <Play size={32} className="text-white/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play size={18} className="text-[#1d1d1f] ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Multiplier badge */}
        {multiplier > 1.0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-amber-500 text-white text-[11px] font-bold px-2 py-1 rounded-full">
            {multiplier.toFixed(1)}×
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">{brandName}</p>
        <p className="text-[14px] font-semibold text-[#1d1d1f] line-clamp-2 leading-snug mb-2 group-hover:text-[#0071e3] transition-colors">
          {title}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-bold text-[#1d1d1f]">+{pointReward} pts</span>
          {multiplier > 1.0 && (
            <span className="text-[12px] text-amber-600 font-medium">
              ({Math.round(pointReward * multiplier)} with boost)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
