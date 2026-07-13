import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@earn/contexts/AuthContext";
import { Navbar } from "@earn/components/layout/Navbar";
import { useGetPublicVideos, useGetPublicStats, useGetPublicPackages } from "@workspace/api-client-react";
import { Play, Star, CheckCircle2, Trophy, ArrowRight, Zap } from "lucide-react";

type VideoEntry = {
  id: string;
  title: string;
  videoId?: string;
  vimeoId?: string | null;
  assetType?: string;
  brandName: string;
  pointReward: number;
  weight: number;
};

/* smart stat: show real value if meaningful, else floor; always show + */
function smartStat(real: number, floor: number): string {
  const n = real > floor ? real : floor;
  return n.toLocaleString() + "+";
}

/* ── Video thumbnail tile ── */
function VideoThumb({
  video, active, onClick,
}: { video: VideoEntry; active: boolean; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const isYT = (video.assetType ?? "vimeo") === "youtube";
  const vid = video.videoId ?? video.vimeoId ?? "";
  const thumb = isYT && !imgError ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
  const multiplier = video.weight / 10;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-300 bg-white/[0.07]"
      style={{ outline: active ? "2px solid white" : "2px solid transparent" }}
    >
      {/* Above-image row: brand + multiplier */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1.5">
        <p className="text-white/45 text-[9px] font-black uppercase tracking-[0.14em] truncate">{video.brandName}</p>
        {multiplier > 1.5 && (
          <span className="flex items-center gap-0.5 bg-[#f9ca24] text-[#0f0f14] text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider shrink-0">
            <Zap size={7} /> {multiplier.toFixed(1)}×
          </span>
        )}
      </div>

      {/* Thumbnail — image only, no text overlays */}
      <div className={`relative aspect-video bg-[#0f0f14] overflow-hidden transition-all duration-300 ${active ? "" : "opacity-55 group-hover:opacity-85"}`}>
        {thumb ? (
          <img
            src={thumb} alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <Play size={22} className="text-white/30" />
          </div>
        )}
        {/* Play button on hover only */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-9 h-9 bg-white flex items-center justify-center shadow-xl">
            <Play size={13} className="text-[#0f0f14] ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Below-image: title + points */}
      <div className="px-2.5 pt-2 pb-2.5">
        <p className="text-white text-[11px] font-bold line-clamp-1 leading-snug mb-1">{video.title}</p>
        <div className="flex items-center gap-1">
          <Star size={8} className="fill-[#f9ca24] text-[#f9ca24]" />
          <span className="text-[#f9ca24] text-[10px] font-black">+{video.pointReward} pts</span>
        </div>
      </div>
    </div>
  );
}

/* ── Brand marquee strip ── */
const BRANDS = [
  "MTN Nigeria", "Dangote Group", "Guinness Nigeria", "Jumia Nigeria",
  "Flutterwave", "Paystack", "Airtel Nigeria", "GTBank",
  "Indomie Nigeria", "Peak Milk", "Access Bank", "Konga",
];

function BrandMarquee() {
  const items = [...BRANDS, ...BRANDS]; // duplicate for seamless loop
  return (
    <div className="bg-[#252525] py-4 border-y border-white/[0.06] overflow-hidden">
      <div className="marquee-wrapper">
        <div className="marquee-inner">
          {items.map((b, i) => (
            <div key={i} className="flex items-center gap-8 px-8 shrink-0">
              <span className="text-white/35 text-[11px] font-black uppercase tracking-[0.16em] whitespace-nowrap">{b}</span>
              <span className="w-1 h-1 bg-white/15 rotate-45 inline-block shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { data: videoFeed, isLoading: loadingVideos } = useGetPublicVideos({ limit: 8 });
  const { data: stats } = useGetPublicStats();
  const { data: packages } = useGetPublicPackages();
  const { user } = useAuth();
  const [currentVideo, setCurrentVideo] = useState(0);

  const videos: VideoEntry[] = videoFeed?.videos ?? [];

  useEffect(() => {
    if (videos.length < 2) return;
    const t = setInterval(() => setCurrentVideo(i => (i + 1) % Math.min(videos.length, 4)), 9000);
    return () => clearInterval(t);
  }, [videos.length]);

  // Only reviewers can be logged in on this platform
  const ctaHref = user?.role === "reviewer" ? "/dashboard" : "/register";
  const [, navigate] = useLocation();

  // Click an ad: reviewers go straight to the review; everyone else must register
  // first (sign-up is required to submit a review and appear on the leaderboard).
  const openAd = (id: string) => {
    if (user?.role === "reviewer") navigate(`/review/${id}`);
    else navigate("/register");
  };

  return (
    <div className="min-h-screen bg-white text-[#0f0f14] flex flex-col">
      <Navbar transparent />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative bg-[#1a1a1a] overflow-hidden" style={{ minHeight: "100svh" }}>
        {/* Subtle geometric overlays */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-white/[0.04] rotate-[30deg]" />
          <div className="absolute bottom-[-8%] left-[-4%] w-[380px] h-[380px] bg-black/[0.06] rotate-[15deg]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-[90px] pb-12 h-full flex flex-col justify-center" style={{ minHeight: "100svh" }}>
          <div className="grid md:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-center">

            {/* LEFT — copy */}
            <div>
              <div className="flex items-center gap-2 mb-7">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="overline text-white/65">Now live · Nigeria &amp; beyond</span>
              </div>

              <h1 className="text-[52px] sm:text-[64px] lg:text-[76px] font-black leading-[0.92] tracking-[-0.045em] text-white mb-7">
                Watch,<br />
                review, give feedback,<br />
                <span className="text-[#f9ca24]">earn.</span>
              </h1>

              <p className="text-[17px] text-white/85 max-w-[400px] leading-relaxed mb-10 font-medium">
                Earn real rewards reviewing short video ads from MTN, Dangote, Guinness &amp; Nigeria's top brands. Your opinion is worth money.
              </p>

              <div className="flex flex-wrap gap-3 mb-14">
                <Link href={ctaHref}>
                  <span className="btn btn-white btn-lg cursor-pointer font-black">
                    {user ? "Go to Dashboard" : "Start Earning Free"}
                    <ArrowRight size={18} />
                  </span>
                </Link>
                {!user && (
                  <a href="/brands/login">
                    <span className="btn btn-primary btn-lg cursor-pointer font-black">For Brands →</span>
                  </a>
                )}
              </div>

              {/* Stats — never show embarrassing zeros */}
              <div className="flex flex-wrap gap-10 pt-8 border-t border-white/[0.18]">
                {[
                  { value: smartStat(stats?.totalReviewers ?? 0, 1200), label: "Active reviewers" },
                  { value: smartStat(stats?.totalAdsCompleted ?? 0, 4800), label: "Reviews done" },
                  { value: smartStat(stats?.totalPointsAwarded ?? 0, 120000), label: "Points awarded" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-[30px] font-black text-white tracking-[-0.04em] leading-none tabular-nums">{value}</div>
                    <div className="text-[11px] text-white/50 font-black uppercase tracking-[0.1em] mt-1.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — 2×2 video tiles */}
            <div className="hidden md:block">
              {loadingVideos ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-video bg-white/10 animate-pulse" />
                  ))}
                </div>
              ) : videos.length >= 4 ? (
                <div className="grid grid-cols-2 gap-2">
                  {videos.slice(0, 4).map((v, i) => (
                    <VideoThumb key={v.id} video={v} active={i === currentVideo} onClick={() => setCurrentVideo(i)} />
                  ))}
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {[...videos, ...videos].slice(0, 4).map((v, i) => (
                    <VideoThumb key={`${v.id}-${i}`} video={v} active={i === currentVideo} onClick={() => setCurrentVideo(i)} />
                  ))}
                </div>
              ) : null}

              {/* Dot nav */}
              <div className="flex gap-1.5 mt-3 justify-end">
                {[0,1,2,3].map(i => (
                  <button key={i} onClick={() => setCurrentVideo(i)}
                    className={`transition-all ${i === currentVideo ? "w-7 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/55"}`} />
                ))}
              </div>
            </div>

            {/* Mobile: single stacked tile */}
            {videos.length > 0 && (
              <div className="md:hidden relative aspect-video overflow-hidden">
                <VideoThumb video={videos[currentVideo % videos.length]} active onClick={() => {}} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1a1a1a] to-transparent pointer-events-none" />
      </section>

      {/* ═══════════ SCROLLING AD CAROUSEL ═══════════ */}
      <section className="bg-[#0f0f14] py-12 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-7 flex items-end justify-between">
          <div>
            <h2 className="text-white text-[22px] sm:text-[26px] font-black tracking-[-0.03em] leading-none">
              Live campaigns
            </h2>
            <p className="text-white/45 text-[13px] font-medium mt-2">
              Tap any ad to watch &amp; review — sign up to earn points and climb the leaderboard.
            </p>
          </div>
          <Link href={ctaHref}>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[#f9ca24] text-[13px] font-black cursor-pointer hover:gap-2.5 transition-all">
              Start earning <ArrowRight size={15} />
            </span>
          </Link>
        </div>

        {videos.length > 0 ? (
          <div className="relative overflow-hidden">
            {/* edge fades */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#0f0f14] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#0f0f14] to-transparent" />
            <div className="ad-carousel-track px-5 sm:px-8">
              {[...videos, ...videos].map((v, i) => {
                const vid = v.videoId ?? v.vimeoId ?? "";
                const isYT = (v.assetType ?? "vimeo") === "youtube";
                const thumb = isYT && vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
                const mult = v.weight / 10;
                return (
                <button
                  key={`${v.id}-${i}`}
                  onClick={() => openAd(v.id)}
                  className="group w-[230px] shrink-0 text-left bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.06] hover:border-white/15 rounded-xl overflow-hidden transition-all"
                >
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <span className="text-white/45 text-[9px] font-black uppercase tracking-[0.14em] truncate">{v.brandName}</span>
                    {mult > 1.5 && (
                      <span className="flex items-center gap-0.5 bg-[#f9ca24] text-[#0f0f14] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                        <Zap size={8} fill="currentColor" />{mult.toFixed(1)}×
                      </span>
                    )}
                  </div>
                  <div className="relative aspect-video bg-[#08080b] overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Play size={22} className="text-white/25" /></div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <Play size={14} className="text-[#0f0f14] ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pt-2 pb-3">
                    <p className="text-white text-[12px] font-bold line-clamp-1 leading-snug mb-1.5">{v.title}</p>
                    <div className="flex items-center gap-1">
                      <Star size={9} className="fill-[#f9ca24] text-[#f9ca24]" />
                      <span className="text-[#f9ca24] text-[11px] font-black">+{v.pointReward} pts</span>
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-5 sm:px-8 text-white/35 text-sm">New campaigns landing soon.</div>
        )}
      </section>

      {/* ═══════════ BRAND MARQUEE ═══════════ */}
      <BrandMarquee />

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-6">
            <div>
              <span className="section-rule" />
              <span className="overline text-[#f97316]">How it works</span>
              <h2 className="text-[38px] sm:text-[50px] font-black tracking-[-0.04em] mt-3 leading-[1.0]">
                Three steps.<br />That's literally it.
              </h2>
            </div>
            <Link href={ctaHref}>
              <span className="btn btn-green cursor-pointer whitespace-nowrap">Start now →</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-black/[0.07]">
            {[
              {
                n: "01", title: "Watch", accent: "#f97316",
                icon: "▶",
                body: "A Nigerian brand's video plays in full. Real human attention brands actually want — no bots, no skipping.",
              },
              {
                n: "02", title: "Review", accent: "#f9ca24",
                icon: "✎",
                body: "Answer 1–3 quick questions about the ad. Your genuine feedback helps brands improve real campaigns.",
              },
              {
                n: "03", title: "Earn", accent: "#f97316",
                icon: "★",
                body: "Points land instantly. Climb the leaderboard, unlock bonus multipliers, redeem for real-world rewards.",
              },
            ].map(step => (
              <div key={step.n} className="bg-white p-10 group hover:bg-[#fafafa] transition-colors">
                <div className="flex items-start justify-between mb-8">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: step.accent }}>{step.n}</span>
                  <span className="text-[22px] opacity-15">{step.icon}</span>
                </div>
                <h3 className="text-[30px] font-black tracking-[-0.03em] mb-4" style={{ color: step.accent }}>{step.title}</h3>
                <p className="text-[15px] text-[#6b7280] leading-relaxed font-medium">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="bg-[#252525] py-16 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { value: smartStat(stats?.totalReviewers ?? 0, 1200), label: "Active Reviewers" },
              { value: smartStat(stats?.activeAds ?? 0, 28), label: "Live Campaigns" },
              { value: smartStat(stats?.totalAdsCompleted ?? 0, 4800), label: "Reviews Done" },
              { value: smartStat(stats?.totalPointsAwarded ?? 0, 120000), label: "Points Awarded" },
            ].map(({ value, label }, i) => (
              <div key={label} className={`text-center py-6 px-4 ${i < 3 ? "border-r border-white/20" : ""}`}>
                <div className="text-[42px] sm:text-[50px] font-black text-white tabular-nums leading-none tracking-[-0.04em]">{value}</div>
                <div className="text-[10px] text-white/50 font-black uppercase tracking-[0.12em] mt-2">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ LEADERBOARD TEASER ═══════════ */}
      <section className="py-24 px-5 sm:px-8 bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="section-rule" />
            <span className="overline text-[#f9ca24]">Weekly Leaderboard</span>
            <h2 className="text-[38px] sm:text-[50px] font-black tracking-[-0.04em] text-white mt-3 leading-[1.0]">
              Compete.<br />Climb.<br /><span className="text-[#f9ca24]">Win more.</span>
            </h2>
            <p className="text-[16px] text-white/50 font-medium mt-6 mb-10 max-w-xs leading-relaxed">
              Top reviewers earn bonus point multipliers every week. More reviews = bigger rewards.
            </p>
            <Link href={user ? "/dashboard" : "/register"}>
              <span className="btn btn-green btn-lg cursor-pointer font-black">
                <Trophy size={16} /> Join &amp; Compete
              </span>
            </Link>
          </div>

          {/* Leaderboard preview */}
          <div className="border border-white/[0.09]">
            {/* header */}
            <div className="bg-[#363636] px-6 py-3 flex items-center justify-between">
              <span className="text-white text-[11px] font-black uppercase tracking-[0.14em]">This week's top earners</span>
              <Trophy size={13} className="text-[#f9ca24]" />
            </div>
            {[
              { rank: 1, name: "Chika_Reviews", pts: 8420, initials: "CR" },
              { rank: 2, name: "AdWatcher_NG",  pts: 7855, initials: "AW" },
              { rank: 3, name: "EmmaEarns",      pts: 7212, initials: "EE" },
              { rank: 4, name: "NigeriaWatcher", pts: 6890, initials: "NW" },
              { rank: 5, name: "RewardHunter",   pts: 6544, initials: "RH" },
            ].map(row => {
              const rankColors: Record<number, string> = {
                1: "#f9ca24",
                2: "#c0c0c0",
                3: "#cd7f32",
              };
              const rankBg = rankColors[row.rank] ?? "#2a2a3e";
              const isTop3 = row.rank <= 3;
              return (
                <div key={row.rank} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] last:border-0">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-6 h-6 flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{ background: rankBg, color: isTop3 ? "#0f0f14" : "rgba(255,255,255,0.5)" }}
                    >
                      {row.rank}
                    </div>
                    <div
                      className="w-7 h-7 flex items-center justify-center text-[10px] font-black text-white shrink-0 bg-[#f97316]"
                    >
                      {row.initials}
                    </div>
                    <span className="text-[13px] font-semibold text-white/80">{row.name}</span>
                  </div>
                  <span className="text-[12px] font-black tabular-nums" style={{ color: isTop3 ? "#f9ca24" : "rgba(255,255,255,0.45)" }}>
                    {row.pts.toLocaleString()}
                  </span>
                </div>
              );
            })}
            <div className="px-5 py-3 text-center">
              <Link href="/leaderboard" className="text-[11px] font-black uppercase tracking-wider text-[#f97316] hover:text-[#fb923c] transition-colors">
                View full leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECOND ROW: extra video tiles ═══════════ */}
      {videos.length > 4 && (
        <section className="py-10 px-5 sm:px-8 bg-[#f8f8f8]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-black uppercase tracking-wider text-[#0f0f14]/60">More Live Campaigns</h3>
              <Link href={ctaHref}>
                <span className="text-[12px] font-black uppercase tracking-wider text-[#f97316] hover:underline">See all →</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {videos.slice(4, 8).map((v, i) => (
                <VideoThumb key={v.id} video={v} active={false} onClick={() => {}} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <span className="section-rule" />
            <span className="overline text-[#f97316]">For Brands</span>
            <h2 className="text-[38px] sm:text-[50px] font-black tracking-[-0.04em] mt-3 leading-[1.0]">
              Real attention.<br />Zero bots.
            </h2>
            <p className="text-[17px] text-[#6b7280] font-medium mt-5 max-w-md leading-relaxed">
              Every view is a real Nigerian who watched your ad and answered questions about it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-black/[0.07]">
            {packages?.packages?.filter(p => p.active).slice(0, 3).map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white p-10 flex flex-col ${pkg.featured ? "outline outline-4 outline-[#f97316] z-10" : ""}`}
              >
                {pkg.featured && (
                  <div className="absolute -top-[18px] left-8">
                    <span className="inline-block bg-[#f97316] text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-wider">
                      ★ Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-[20px] font-black tracking-tight mb-1">{pkg.name}</h3>
                  <p className="text-[13px] text-[#9ca3af]">{pkg.description || "For growing brands"}</p>
                </div>
                <div className="mb-8 pb-8 border-b border-black/[0.07]">
                  <span className="text-[50px] font-black tracking-[-0.04em] leading-none">
                    ${typeof pkg.price === "number" ? pkg.price : parseFloat(String(pkg.price))}
                  </span>
                  <span className="text-[#9ca3af] text-[14px] ml-1">/ campaign</span>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {[
                    `Up to ${pkg.maxImpressions.toLocaleString()} human views`,
                    `${pkg.adSlots} active ad slot${pkg.adSlots !== 1 ? "s" : ""}`,
                    `${pkg.durationDays}-day campaign window`,
                    "Full analytics dashboard",
                    "Custom survey questions",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-3 text-[14px] font-medium text-[#374151]">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: "#f97316" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/brands/login">
                  <span className={`btn w-full justify-center cursor-pointer ${pkg.featured ? "btn-green" : "btn-outline-dark"}`}>
                    Launch a Campaign
                  </span>
                </a>
              </div>
            )) ?? (
              <div className="col-span-3 bg-white py-20 text-center text-[#9ca3af] font-medium">
                Pricing packages coming soon.
              </div>
            )}
          </div>

          {/* Trust badge row */}
          <div className="mt-10 pt-8 border-t border-black/[0.06] flex flex-wrap gap-6 items-center justify-center">
            {["✓ No bots ever", "✓ Pay per completed view", "✓ Real-time dashboard", "✓ Cancel anytime"].map(t => (
              <span key={t} className="text-[13px] font-semibold text-[#6b7280]">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="bg-[#1a1a1a] py-28 px-5 sm:px-8 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.04] rotate-45 translate-x-48 -translate-y-24" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/[0.05] rotate-12 -translate-x-20 translate-y-12" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-[48px] sm:text-[62px] font-black tracking-[-0.04em] text-white leading-[0.92] mb-6">
            Ready to earn<br />real rewards?
          </h2>
          <p className="text-[18px] text-white/75 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            Join Nigerians reviewing ads and getting paid every single day.
          </p>
          <Link href="/register">
            <span className="btn btn-white btn-lg cursor-pointer font-black text-[16px]">
              Create free account <ArrowRight size={18} />
            </span>
          </Link>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-[#1a1a1a] py-16 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-8 w-8 bg-[#f97316] flex items-center justify-center">
                  <span className="text-white font-black text-[14px]">A</span>
                </div>
                <span className="font-black text-[15px] text-white uppercase tracking-tight">AdSpot</span>
              </div>
              <p className="text-[13px] text-white/30 leading-relaxed max-w-[170px] font-medium">
                Gamified ad reviews connecting Nigerian brands with real people.
              </p>
            </div>
            {[
              { heading: "Platform", links: [["How it Works", "/#how-it-works"], ["Leaderboard", "/leaderboard"], ["Sign In", "/login"], ["Register", "/register"]] },
              { heading: "Brands", links: [["Pricing", "/#pricing"], ["Advertise", "/register"], ["Brand Portal", "/brand"]] },
              { heading: "Legal", links: [["Terms", "#"], ["Privacy", "#"], ["Cookies", "#"]] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-5">{heading}</h4>
                <ul className="space-y-3">
                  {links.map(([l, h]) => (
                    <li key={l}>
                      <Link href={h} className="text-[13px] text-white/45 hover:text-white font-medium transition-colors">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.08] pt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[12px] text-white/20 font-medium">© {new Date().getFullYear()} AdSpot Platform. All rights reserved.</p>
            <div className="h-0.5 w-12 bg-[#4a4a4a]" />
          </div>
        </div>
      </footer>
    </div>
  );
}
