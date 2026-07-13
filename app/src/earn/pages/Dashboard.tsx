import { useState } from "react";
import { DashboardLayout } from "@earn/components/layout/DashboardLayout";
import {
  useGetPointsBalance, useGetLeaderboard, useGetAdFeed,
  customFetch,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import {
  Play, Trophy, Star, Clock, Zap,
  TrendingUp, Coins, ChevronLeft, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { Link } from "wouter";

interface LedgerEntry {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  createdAt: string;
}

const SOURCE_LABEL: Record<string, string> = {
  ad_review:    "Ad Review",
  admin_grant:  "Admin Grant",
  bonus:        "Bonus",
  referral:     "Referral",
  adjustment:   "Adjustment",
};

const SOURCE_COLOR: Record<string, string> = {
  ad_review:   "text-[#f97316]",
  admin_grant: "text-[#7950f2]",
  bonus:       "text-[#0071e3]",
  referral:    "text-emerald-600",
  adjustment:  "text-[#9ca3af]",
};

const LEDGER_PAGE = 15;

function useMyLedger(offset: number) {
  return useQuery<{ entries: LedgerEntry[]; total: number }>({
    queryKey: ["my-ledger", offset],
    queryFn: () =>
      customFetch(`/api/points/ledger?limit=${LEDGER_PAGE}&offset=${offset}`),
    staleTime: 30_000,
  });
}

export default function Dashboard() {
  const { data: balance, isLoading: loadingBalance } = useGetPointsBalance();
  const { data: leaderboard } = useGetLeaderboard();
  const { data: eligibility } = useQuery<{ eligible: boolean; missingFields: string[] }>({
    queryKey: ["lb-eligibility"],
    queryFn: async () => {
      const token = localStorage.getItem("adspot_token");
      const r = await fetch("/api/leaderboard/eligibility", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return r.json();
    },
  });
  const { data: adFeed, isLoading: loadingFeed } = useGetAdFeed();
  const [tab, setTab] = useState<"ads" | "leaderboard" | "earnings">("ads");
  const [ledgerOffset, setLedgerOffset] = useState(0);
  const { data: ledger, isLoading: loadingLedger } = useMyLedger(ledgerOffset);

  const ledgerTotal = ledger?.total ?? 0;
  const ledgerPage = Math.floor(ledgerOffset / LEDGER_PAGE) + 1;
  const ledgerPages = Math.max(1, Math.ceil(ledgerTotal / LEDGER_PAGE));

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">

        {/* Points hero — gradient full-bleed */}
        <div className="gradient-bg p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rotate-45 translate-x-24 -translate-y-16 pointer-events-none" />
          <div className="absolute right-12 bottom-0 w-32 h-32 bg-white/5 rotate-12 translate-y-8 pointer-events-none" />

          <div className="relative grid md:grid-cols-[1fr_auto] items-end gap-6">
            <div>
              <p className="overline text-white/55 mb-3">Your Balance</p>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-[64px] sm:text-[80px] font-black tracking-[-0.05em] leading-none tabular-nums">
                  {loadingBalance ? "—" : (balance?.balance ?? 0).toLocaleString()}
                </span>
                <span className="text-white/50 text-[28px] font-bold mb-2">pts</span>
              </div>
              <p className="text-white/45 text-[13px] font-semibold">
                Lifetime: <span className="text-white font-black">{(balance?.totalEarned ?? 0).toLocaleString()} pts</span>
              </p>
            </div>
            {eligibility && !eligibility.eligible && (
              <Link href="/profile">
                <div style={{ margin: "0 0 12px", padding: "10px 14px", borderRadius: 12, border: "1px solid hsl(25 95% 53% / 0.4)", background: "hsl(25 95% 53% / 0.08)", cursor: "pointer", fontSize: 13 }}>
                  <b>Complete your profile</b> to join the leaderboard and win rewards ›
                </div>
              </Link>
            )}
            <Link href="/leaderboard">
              <span className="btn btn-outline cursor-pointer whitespace-nowrap">
                <Trophy size={15} /> View Leaderboard
              </span>
            </Link>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b-2 border-black/[0.07]">
          {(["ads", "leaderboard", "earnings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-[12px] font-black uppercase tracking-[0.1em] border-b-2 -mb-[2px] transition-all ${
                tab === t
                  ? "border-[#e91e8c] text-[#e91e8c]"
                  : "border-transparent text-[#9ca3af] hover:text-[#0f0f14]"
              }`}>
              {t === "ads" ? "Available Ads" : t === "leaderboard" ? "Leaderboard" : "My Earnings"}
            </button>
          ))}
        </div>

        {/* ── Ad Feed ─────────────────────────────────────────────────────── */}
        {tab === "ads" && (
          <div>
            {loadingFeed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/[0.07]">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white overflow-hidden animate-pulse">
                    <div className="aspect-video bg-[#f0f0f0]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#f0f0f0] w-1/3" />
                      <div className="h-5 bg-[#f0f0f0] w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : adFeed?.ads && adFeed.ads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/[0.07]">
                {adFeed.ads.map(ad => {
                  const multiplier = parseFloat(String(ad.multiplierFactor));
                  const hasMultiplier = multiplier > 1.0;
                  const isYT = (ad.assetType ?? "vimeo") === "youtube";
                  const thumbUrl = isYT ? `https://img.youtube.com/vi/${ad.assetUrl}/mqdefault.jpg` : null;

                  return (
                    <Link key={ad.id} href={`/review/${ad.id}`}>
                      <div className="group bg-white overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.14)] relative z-0 hover:z-10 transition-all cursor-pointer">

                        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
                          <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.12em]">{ad.brandName}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-[10px] font-black text-[#6b7280] uppercase tracking-wide">
                              <Clock size={9} className="text-[#9ca3af]" /> {ad.minWatchSeconds}s
                            </span>
                            {hasMultiplier && (
                              <span className="flex items-center gap-0.5 bg-[#f9ca24] text-[#0f0f14] text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider">
                                <Zap size={8} /> {multiplier.toFixed(1)}×
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="relative aspect-video bg-[#0f0f14] overflow-hidden">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt={ad.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="absolute inset-0 gradient-bg opacity-25" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <div className="w-12 h-12 bg-white flex items-center justify-center shadow-xl">
                              <Play size={18} className="text-[#0f0f14] ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                        </div>

                        <div className="px-4 pt-3 pb-4 border-t border-black/[0.06]">
                          <h3 className="text-[14px] font-bold text-[#0f0f14] line-clamp-2 leading-snug mb-3 group-hover:text-[#e91e8c] transition-colors">
                            {ad.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Star size={12} className="fill-[#f9ca24] text-[#f9ca24]" />
                              <span className="text-[13px] font-black text-[#0f0f14]">+{ad.pointReward} pts</span>
                              {hasMultiplier && (
                                <span className="text-[11px] text-[#ff6635] font-bold">
                                  → {Math.round(ad.pointReward * multiplier)} boosted
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-black text-[#f97316] uppercase tracking-wide group-hover:underline">
                              Review →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="border-2 border-dashed border-black/10 py-24 text-center">
                <div className="w-16 h-16 bg-[#f8f8f8] flex items-center justify-center mx-auto mb-5">
                  <Play size={28} className="text-[#d1d5db]" />
                </div>
                <h3 className="text-[18px] font-black mb-2">No ads available right now</h3>
                <p className="text-[14px] text-[#9ca3af] font-medium">You've caught up on all campaigns. Check back soon.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard Tab ─────────────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="max-w-lg">
            <div className="gradient-bg px-6 py-4 flex items-center gap-3">
              <Trophy size={18} className="text-[#f9ca24]" />
              <h3 className="text-[14px] font-black text-white uppercase tracking-wider">Weekly Top Reviewers</h3>
            </div>
            <div className="border border-t-0 border-black/[0.07] divide-y divide-black/[0.05]">
              {leaderboard?.entries && leaderboard.entries.length > 0 ? (
                leaderboard.entries.slice(0, 10).map(entry => (
                  <div key={entry.userId}
                    className={`flex items-center justify-between px-6 py-4 ${entry.isCurrentUser ? "bg-[#f97316]/[0.06] border-l-4 border-l-[#f97316]" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-7 h-7 flex items-center justify-center text-[12px] font-black ${
                        entry.rank === 1 ? "bg-[#f9ca24] text-[#0f0f14]" :
                        entry.rank === 2 ? "bg-[#C0C0C0] text-white" :
                        entry.rank === 3 ? "bg-[#CD7F32] text-white" :
                        "bg-[#f0f0f0] text-[#9ca3af]"
                      }`}>
                        {entry.rank}
                      </div>
                      <span className={`text-[14px] font-bold ${entry.isCurrentUser ? "text-[#f97316]" : "text-[#0f0f14]"}`}>
                        {entry.isCurrentUser ? "You ✓" : entry.username}
                      </span>
                    </div>
                    <span className="text-[13px] font-black text-[#0f0f14] tabular-nums">
                      {entry.pointsTotal.toLocaleString()} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-6 py-16 text-center text-[14px] text-[#9ca3af] font-medium">
                  No activity this week. Start reviewing to appear here!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Earnings Tab ────────────────────────────────────────────────── */}
        {tab === "earnings" && (
          <div className="space-y-4">

            {/* Summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/[0.07]">
              <div className="bg-white px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#9ca3af] mb-1">Current Balance</p>
                <p className="text-[26px] font-black tracking-[-0.03em] text-[#0f0f14]">
                  {loadingBalance ? "—" : (balance?.balance ?? 0).toLocaleString()}
                  <span className="text-[14px] font-bold text-[#9ca3af] ml-1">pts</span>
                </p>
              </div>
              <div className="bg-white px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#9ca3af] mb-1">Lifetime Earned</p>
                <p className="text-[26px] font-black tracking-[-0.03em] text-[#f97316]">
                  {loadingBalance ? "—" : (balance?.totalEarned ?? 0).toLocaleString()}
                  <span className="text-[14px] font-bold text-[#9ca3af] ml-1">pts</span>
                </p>
              </div>
              <div className="bg-white px-6 py-5 col-span-2 sm:col-span-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#9ca3af] mb-1">Total Transactions</p>
                <p className="text-[26px] font-black tracking-[-0.03em] text-[#0f0f14]">
                  {ledgerTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Ledger table */}
            <div className="bg-white border border-black/[0.07]">
              <div className="px-6 py-4 border-b border-black/[0.07] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#f97316]" />
                  <h3 className="text-[14px] font-black text-[#0f0f14]">Points History</h3>
                </div>
                <span className="text-[11px] text-[#9ca3af]">{ledgerTotal} transactions</span>
              </div>

              {loadingLedger ? (
                <div className="py-16 text-center">
                  <div className="w-5 h-5 border-2 border-[#e91e8c] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : ledger?.entries.length === 0 ? (
                <div className="py-16 text-center">
                  <Coins size={28} className="text-[#d1d5db] mx-auto mb-3" />
                  <p className="text-[14px] font-bold text-[#9ca3af]">No earnings yet</p>
                  <p className="text-[12px] text-[#d1d5db] mt-1">Complete your first ad review to start earning points.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.05]">
                  {ledger?.entries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                          entry.amount > 0
                            ? "bg-[#f97316]/10"
                            : "bg-red-50"
                        }`}>
                          <Coins size={14} className={entry.amount > 0 ? "text-[#f97316]" : "text-red-400"} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-black uppercase tracking-wider ${SOURCE_COLOR[entry.source] ?? "text-[#9ca3af]"}`}>
                            {SOURCE_LABEL[entry.source] ?? entry.source}
                          </p>
                          {entry.description && (
                            <p className="text-[12px] text-[#6b7280] truncate mt-0.5">{entry.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={`text-[15px] font-black tabular-nums ${entry.amount > 0 ? "text-[#f97316]" : "text-red-500"}`}>
                          {entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()}
                          <span className="text-[11px] font-bold text-[#9ca3af] ml-0.5">pts</span>
                        </p>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5">
                          {new Date(entry.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {ledgerPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-black/[0.06] bg-[#fafafa]">
                  <span className="text-[11px] text-[#9ca3af]">
                    Page {ledgerPage} of {ledgerPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLedgerOffset(Math.max(0, ledgerOffset - LEDGER_PAGE))}
                      disabled={ledgerOffset === 0}
                      className="w-7 h-7 flex items-center justify-center border border-black/[0.1] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={() => setLedgerOffset(ledgerOffset + LEDGER_PAGE)}
                      disabled={ledgerOffset + LEDGER_PAGE >= ledgerTotal}
                      className="w-7 h-7 flex items-center justify-center border border-black/[0.1] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
