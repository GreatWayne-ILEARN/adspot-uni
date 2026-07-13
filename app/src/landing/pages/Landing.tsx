import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@landing/components/Navbar";
import { Footer } from "@landing/components/Footer";
import { Button } from "@landing/components/ui/button";
import { Card, CardContent } from "@landing/components/ui/card";
import { Badge } from "@landing/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@landing/components/ui/dialog";
import { PlayCircle, TrendingUp, Users, Zap, ShieldCheck, Target, ArrowRight, X } from "lucide-react";
import {
  useGetPublicStats, getGetPublicStatsQueryKey,
  useGetPublicVideos, getGetPublicVideosQueryKey,
  useGetPublicPackages, getGetPublicPackagesQueryKey,
  type PublicVideoItem
} from "@workspace/api-client-react";

// Align with the real API model (Vimeo-only). The previous local type carried
// YouTube fields (videoId/assetType) that the API never returns.
type PublicVideo = PublicVideoItem;

export default function Landing() {
  const { data: stats } = useGetPublicStats({ query: { queryKey: getGetPublicStatsQueryKey() } });
  const { data: videos } = useGetPublicVideos({ limit: 8 }, { query: { queryKey: getGetPublicVideosQueryKey({ limit: 8 }) } });
  const [lightboxLoaded, setLightboxLoaded] = useState(false);
  const [lightboxError, setLightboxError] = useState(false);
  const { data: packages } = useGetPublicPackages({ query: { queryKey: getGetPublicPackagesQueryKey() } });
  const [selectedVideo, setSelectedVideo] = useState<PublicVideo | null>(null);

  const getEmbedUrl = (video: PublicVideo) =>
    `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-6 pb-0 md:pt-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/5"></div>

          <div className="container relative mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-8 lg:gap-16">

              {/* LEFT — headline + explainer + CTAs */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55 }}
                className="flex-1 max-w-xl pt-8 pb-16"
              >
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary py-1 px-3 text-xs font-semibold tracking-widest uppercase mb-5 inline-flex">
                  Nigeria's #1 Ad Review Platform
                </Badge>

                <h1 className="font-display text-6xl font-black tracking-tight text-foreground md:text-7xl lg:text-[5.5rem] leading-[0.88] mb-6">
                  WATCH.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#c2410c]">REVIEW.</span><br />
                  EARN.
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
                  Watch real Nigerian brand ads and share your honest take.<br />
                  <span className="text-foreground font-semibold">Top 30 reviewers earn massive weekly cash payouts.</span><br />
                  Turn watching into serious Naira — every single week.
                </p>

                <div className="flex">
                  <a href="/earn">
                    <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-[0_0_25px_rgba(249,115,22,0.3)] hover:shadow-[0_0_45px_rgba(249,115,22,0.45)] hover:scale-[1.02] transition-all">
                      Start Earning
                    </Button>
                  </a>
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  {stats?.totalReviewers
                    ? `Join ${stats.totalReviewers.toLocaleString()} reviewer${stats.totalReviewers === 1 ? "" : "s"} already earning`
                    : "Join reviewers already earning"}
                </p>
              </motion.div>

              {/* RIGHT — product mockup */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.2 }}
                className="flex-1 flex justify-center md:justify-end md:pt-8"
              >
                <div className="relative w-full max-w-[420px]">
                  {/* Glow behind card */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary/15 via-secondary/8 to-transparent rounded-3xl blur-2xl -z-10" />

                  {/* Main product card */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Live Review</span>
                      </div>
                      {(videos?.videos?.[0]?.pointReward ?? stats?.avgPointsPerAd) && (
                        <Badge className="bg-primary/20 text-primary border-0 text-xs font-bold">
                          +{videos?.videos?.[0]?.pointReward ?? stats?.avgPointsPerAd} pts
                        </Badge>
                      )}
                    </div>

                    {/* Video thumbnail — shows real live ad from API */}
                    <div className="relative aspect-video bg-zinc-900 flex items-center justify-center border-b border-border overflow-hidden">
                      {videos?.videos?.[0] && (
                        <img
                          src={`https://vumbnail.com/${videos.videos[0].vimeoId}.jpg`}
                          alt={videos.videos[0].title}
                          className="absolute inset-0 w-full h-full object-cover opacity-85"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)] text-black pl-1 relative z-10">
                        <PlayCircle size={30} />
                      </div>
                      {/* Progress bar — animated to show active watching */}
                      <div className="absolute bottom-3 left-5 right-5 h-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: ["0%", "72%", "58%", "85%"] }}
                          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                      {/* Brand label */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                          {videos?.videos?.[0]?.brandName ?? "A Nigerian Brand"}
                        </span>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="px-5 pt-4 pb-2">
                      <p className="text-sm font-semibold text-foreground mb-3">How likely are you to buy this product?</p>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-bold cursor-default transition-all ${i === 4 ? 'bg-primary text-black shadow-[0_0_12px_rgba(249,115,22,0.35)]' : 'bg-muted text-muted-foreground'}`}>{i}</div>
                        ))}
                      </div>
                    </div>

                    {/* Reviewer stats row */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-border mt-2">
                      <div className="flex -space-x-2">
                        {['bg-primary','bg-secondary','bg-accent'].map((c,i) => (
                          <div key={i} className={`w-7 h-7 rounded-full border-2 border-card ${c} flex items-center justify-center text-[10px] font-bold text-white`}>{i+1}</div>
                        ))}
                        {stats?.totalReviewers && stats.totalReviewers > 3 && (
                          <div className="w-7 h-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] text-muted-foreground font-bold">
                            +{Math.min(stats.totalReviewers - 3, 999)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {stats?.totalReviewers ? `${stats.totalReviewers.toLocaleString()} reviewers` : "Join reviewers"}
                      </span>
                      <div className="flex items-center gap-1 text-primary">
                        <Zap size={13} />
                        <span className="text-xs font-bold">
                          {stats?.activeAds ? `${stats.activeAds} live ads` : "Ads live now"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating brand badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    className="absolute -right-4 top-20 bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg"
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Brands on AdSpot</p>
                    <p className="text-[12px] font-bold text-foreground">{stats?.totalBrands ? `${stats.totalBrands} active brands` : "Nigerian Brands"}</p>
                  </motion.div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section id="stats" className="border-y border-border bg-muted/40 py-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Users size={28} />
                </div>
                <h3 className="font-display text-4xl font-bold text-foreground mb-2">{stats?.totalReviewers?.toLocaleString() ?? "—"}</h3>
                <p className="text-muted-foreground font-medium">Active Reviewers</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <PlayCircle size={28} />
                </div>
                <h3 className="font-display text-4xl font-bold text-foreground mb-2">{stats?.totalAdsCompleted?.toLocaleString() ?? "—"}</h3>
                <p className="text-muted-foreground font-medium">Ads Reviewed</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Zap size={28} />
                </div>
                <h3 className="font-display text-4xl font-bold text-foreground mb-2">{stats?.totalPointsAwarded?.toLocaleString() ?? "—"}</h3>
                <p className="text-muted-foreground font-medium">Points Awarded</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 text-orange-500">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="font-display text-4xl font-bold text-foreground mb-2">{stats?.totalBrands?.toLocaleString() ?? "—"}</h3>
                <p className="text-muted-foreground font-medium">Brand Partners</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* EXPLORE THE PLATFORM */}
        <section id="explore" className="py-24 relative border-t border-border">
          <div className="container mx-auto px-6">
            <div className="mb-14 text-center">
              <h2 className="font-display text-4xl font-bold text-foreground mb-4 lg:text-5xl">Explore the Full Platform</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Three portals, one ecosystem. Jump straight into any part of AdSpot using the demo accounts below.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

              {/* Reviewer Portal */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-8 flex flex-col shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                  <PlayCircle size={24} className="text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">Reviewer Portal</h3>
                <p className="text-muted-foreground mb-6 flex-1">Watch video ads, answer brand questions, earn points and climb the weekly leaderboard.</p>
                <a href="/earn/login">
                  <Button className="w-full font-bold">
                    Open Reviewer Platform <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </motion.div>

              {/* Brand Portal */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border-2 border-primary/40 bg-card p-8 flex flex-col shadow-[0_0_30px_rgba(249,115,22,0.08)] relative"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center mb-5">
                  <TrendingUp size={24} className="text-secondary" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">Brand Portal</h3>
                <p className="text-muted-foreground mb-6 flex-1">Launch ad campaigns, track engagement analytics, manage questions, and get AI-powered performance summaries.</p>
                <a href="/brands/login">
                  <Button className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                    Open Brand Portal <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </motion.div>

              {/* Admin Panel */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-8 flex flex-col shadow-sm hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-5">
                  <ShieldCheck size={24} className="text-accent" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">Admin Panel</h3>
                <p className="text-muted-foreground mb-6 flex-1">Manage packages, platform settings, all users and campaigns, view the event log, and monitor system health.</p>
                <a href="/brands/login">
                  <Button variant="outline" className="w-full font-bold">
                    Open Admin Panel <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </motion.div>

            </div>
          </div>
        </section>

        {/* VIDEOS SHOWCASE */}
        {videos?.videos && videos.videos.length > 0 && (
          <section className="py-24 relative bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="font-display text-4xl font-bold text-foreground mb-4">Live on AdSpot Now</h2>
                  <p className="text-xl text-muted-foreground max-w-xl">
                    Real campaigns paying real ₦₦₦ — scroll to browse, click to preview.
                  </p>
                </div>
                <a href="/earn">
                  <Button variant="outline" className="border-border text-foreground shrink-0">Start Earning <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </a>
              </div>

              {/* Horizontal scroll pane */}
              <div
                className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 px-6"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {videos.videos.map((video, idx) => (
                  <motion.button
                    key={video.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(idx * 0.07, 0.35) }}
                    onClick={() => setSelectedVideo(video)}
                    className="group relative rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-all shadow-sm cursor-pointer text-left flex-none w-[300px] sm:w-[340px] snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Watch ${video.title}`}
                  >
                    <div className="aspect-video bg-zinc-900 relative">
                      <img
                        src={`https://vumbnail.com/${video.vimeoId}.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-95 transition-opacity duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        <Badge className="bg-black/60 text-white backdrop-blur-md border-white/10 text-[11px]">{video.brandName}</Badge>
                        <Badge className="bg-primary text-primary-foreground font-bold border-0 shadow-[0_0_12px_rgba(249,115,22,0.5)] text-[11px]">
                          +{video.pointReward} pts
                        </Badge>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 duration-200">
                        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.6)] text-black pl-0.5">
                          <PlayCircle size={28} />
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-[14px] font-bold text-white leading-tight drop-shadow-md line-clamp-2">{video.title}</h3>
                        <p className="text-[11px] text-white/60 mt-1">Watch {video.minWatchSeconds}s · Earn {video.pointReward} pts</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Video lightbox modal */}
              <Dialog open={!!selectedVideo} onOpenChange={(open) => {
                if (!open) { setSelectedVideo(null); setLightboxLoaded(false); setLightboxError(false); }
              }}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-zinc-950 border-zinc-800">
                  <DialogTitle className="sr-only">{selectedVideo?.title}</DialogTitle>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                    <div>
                      <p className="text-sm font-bold text-white">{selectedVideo?.title}</p>
                      <p className="text-xs text-zinc-400">{selectedVideo?.brandName} · Earn {selectedVideo?.pointReward} pts on AdSpot</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href="/earn" className="hidden sm:inline-flex">
                        <Button size="sm" className="font-bold text-xs h-8">
                          Sign up to earn pts
                        </Button>
                      </a>
                      <button
                        onClick={() => { setSelectedVideo(null); setLightboxLoaded(false); setLightboxError(false); }}
                        className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800"
                        aria-label="Close video"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="aspect-video w-full bg-black relative">
                    {selectedVideo && !lightboxError && (
                      <iframe
                        key={selectedVideo.id}
                        src={getEmbedUrl(selectedVideo)}
                        title={selectedVideo.title}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${lightboxLoaded ? "opacity-100" : "opacity-0"}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        onLoad={() => setLightboxLoaded(true)}
                      />
                    )}
                    {!lightboxLoaded && !lightboxError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                        <p className="text-white/40 text-xs">Loading video…</p>
                      </div>
                    )}
                    {lightboxError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50 text-sm">
                        <PlayCircle size={40} className="opacity-30" />
                        <p>Video unavailable</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 lg:py-32 relative">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="font-display text-4xl font-bold text-foreground mb-6 lg:text-5xl">The New Economy of Attention</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                We've gamified market research. Brands get guaranteed engagement. Reviewers get a share of the ad spend.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Brands Launch Campaigns</h3>
                    <p className="text-muted-foreground leading-relaxed">Brands upload video ads and set specific questions they want answered. Instead of paying Facebook for scroll-pasts, they pay for guaranteed attention.</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-white font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Reviewers Watch & Answer</h3>
                    <p className="text-muted-foreground leading-relaxed">Our community of verified reviewers watches the full ad, then answers the brand's questions thoughtfully. No bots, just real people.</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Earn & Climb the Leaderboard</h3>
                    <p className="text-muted-foreground leading-relaxed">Reviewers earn points for high-quality answers. Top earners hit the weekly leaderboard for massive bonus payouts and real rewards.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-2xl border border-border bg-card p-8 shadow-lg"
              >
                <div className="absolute -top-4 -right-4 -bottom-4 -left-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-3xl -z-10"></div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-orange-600"></div>
                      <div>
                        <p className="font-bold text-foreground">Lagos Hustler</p>
                        <p className="text-xs text-muted-foreground">Rank #4 this week</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/15 text-primary border-0">+450 pts</Badge>
                  </div>
                  <div className="relative aspect-video rounded-xl bg-zinc-900 overflow-hidden border border-border flex items-center justify-center">
                    <PlayCircle className="text-white/40 w-16 h-16" />
                    <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-2/3"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="font-semibold text-foreground">How memorable was this brand message?</p>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`flex-1 h-12 rounded-lg flex items-center justify-center font-bold cursor-default ${i === 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 lg:py-32 bg-muted/40 border-t border-border relative">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <Badge variant="outline" className="border-secondary/30 bg-secondary/10 text-secondary mb-6 py-1.5 px-4 text-sm font-semibold uppercase">For Brands</Badge>
              <h2 className="font-display text-4xl font-bold text-foreground mb-6 lg:text-5xl">Stop Guessing. Start Knowing.</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Purchase ad slots to get your content in front of a highly engaged, verified audience. Pay for insights, not just impressions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
              {packages?.packages?.map((pkg, i) => {
                const actualNaira    = Number(pkg.price) / 100;
                const bundles        = pkg.maxImpressions / 1000;           // each bundle = 1,000 impressions
                const baseNaira      = bundles * 10000;                     // ₦10,000 per bundle — rack rate
                const discountPct    = baseNaira > actualNaira
                  ? Math.round((1 - actualNaira / baseNaira) * 100)
                  : 0;
                const perBundleNaira = Math.round(actualNaira / bundles);   // effective ₦ per bundle
                return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={pkg.featured ? "scale-105 z-10 relative" : ""}
                >
                  <Card className={
                    pkg.featured
                      ? "h-full relative overflow-hidden border-2 border-primary bg-card shadow-[0_0_40px_rgba(249,115,22,0.18)]"
                      : "h-full relative overflow-hidden border border-border bg-card shadow-sm"
                  }>
                    {pkg.featured && (
                      <>
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-orange-400" />
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <span className="bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">Most Popular</span>
                        </div>
                      </>
                    )}
                    <CardContent className="p-8 pt-10">
                      <h3 className="text-2xl font-bold mb-1 text-foreground">{pkg.name}</h3>
                      <p className="text-muted-foreground mb-5 text-sm min-h-[40px]">{pkg.description}</p>

                      <div className="mb-6">
                        {discountPct > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground line-through">₦{baseNaira.toLocaleString()}</span>
                            <span className="text-xs font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{discountPct}% OFF</span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-display font-bold text-foreground">
                            ₦{actualNaira.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">total</span>
                        </div>
                        {bundles > 1 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ₦{perBundleNaira.toLocaleString()} per 1,000-impression bundle
                          </p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-muted-foreground text-sm">
                          <Users size={16} className="text-primary shrink-0" />
                          <span>
                            <strong className="text-foreground">{bundles.toLocaleString()}</strong>
                            {" × 1,000-impression bundle"}{bundles > 1 ? "s" : ""}
                          </span>
                        </li>
                        <li className="flex items-center gap-3 text-muted-foreground text-sm">
                          <Target size={16} className="text-primary shrink-0" />
                          <span>
                            <strong className="text-foreground">{pkg.adSlots}</strong>
                            {" ad campaign slot"}{pkg.adSlots > 1 ? "s" : ""}
                          </span>
                        </li>
                        <li className="flex items-center gap-3 text-muted-foreground text-sm">
                          <TrendingUp size={16} className="text-primary shrink-0" />
                          <span>No expiry — use at your own pace</span>
                        </li>
                      </ul>

                      <a href="/brands/login">
                        <Button
                          className={`w-full font-bold h-11 ${pkg.featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-foreground text-background hover:bg-foreground/90"}`}
                        >
                          {pkg.featured ? "Get Started" : "Select Package"}
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
                );
              }) || (
                [1,2,3].map(i => (
                  <Card key={i} className="h-full bg-card border-border">
                    <CardContent className="p-8 flex flex-col justify-center items-center h-64 text-muted-foreground">
                      Loading packages...
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-24 relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[100px] -z-10"></div>

          <div className="container relative mx-auto px-6 text-center">
            <h2 className="font-display text-5xl font-bold text-foreground mb-4 lg:text-7xl">Ready to dive in?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-lg mx-auto">
              Join the top 30 reviewers earning weekly cash — or launch your brand's next campaign.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <a href="/earn">
                <Button size="lg" className="h-16 px-10 text-xl font-bold shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] hover:scale-[1.02] transition-all">
                  Start Earning
                  <ArrowRight className="ml-2" />
                </Button>
              </a>
              <a href="/brands/login">
                <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold">
                  Start Engaging
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
