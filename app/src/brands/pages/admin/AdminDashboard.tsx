import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetAdminEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@brands/components/ui/card";
import { Skeleton } from "@brands/components/ui/skeleton";
import { Badge } from "@brands/components/ui/badge";
import {
  Activity, Users, Megaphone, CheckCircle, Shield,
  Coins, Clock, TrendingUp, UserCheck, Store,
} from "lucide-react";
import { Link } from "wouter";

const API = "/api";
const TOKEN_KEY = "adspot_brand_token";

async function apiFetch(path: string) {
  const token = localStorage.getItem(TOKEN_KEY);
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

type AdminStats = {
  totalUsers: number;
  totalReviewers: number;
  totalBrands: number;
  totalAdmins: number;
  totalAds: number;
  activeAds: number;
  totalCompletions: number;
  totalPointsIssued: number;
  pendingRedemptions: number;
  completedRedemptions: number;
};

function KpiCard({ title, value, sub, icon: Icon, accent, loading, href }: {
  title: string; value?: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  accent?: string; loading: boolean; href?: string;
}) {
  const content = (
    <Card className={`transition-colors ${href ? "hover:border-primary/40 cursor-pointer" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} size={16} />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : (
          <>
            <div className={`text-2xl font-bold ${accent ? "" : "text-foreground"}`}
              style={accent?.startsWith("#") ? { color: accent } : undefined}>
              {value ?? "—"}
            </div>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

const EVENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "admin.user": Users,
  "admin.ad": Megaphone,
  "admin.redemption": Coins,
  "admin.points": TrendingUp,
  "admin.brand": Store,
};

function getEventIcon(type: string) {
  for (const [prefix, Icon] of Object.entries(EVENT_ICON)) {
    if (type.startsWith(prefix)) return Icon;
  }
  return Activity;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/admin/stats"),
    staleTime: 30000,
  });
  const { data: eventsData, isLoading: eventsLoading } = useGetAdminEvents({ limit: 8 });

  const completionRate = stats && stats.totalAds > 0
    ? ((stats.totalCompletions / Math.max(stats.totalAds * 10, 1)) * 100).toFixed(0)
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time metrics across users, campaigns, and the points economy</p>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Users</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Users" icon={Users} value={stats?.totalUsers?.toLocaleString()}
            sub="All accounts on the platform" loading={statsLoading} href="/admin/users" />
          <KpiCard title="Reviewers" icon={UserCheck} value={stats?.totalReviewers?.toLocaleString()}
            sub="Earning points on platform" loading={statsLoading} href="/admin/users" />
          <KpiCard title="Brands" icon={Store} value={stats?.totalBrands?.toLocaleString()}
            sub="Running ad campaigns" loading={statsLoading} href="/admin/financials" />
          <KpiCard title="Admins" icon={Shield} value={stats?.totalAdmins?.toLocaleString()}
            sub="Platform administrators" loading={statsLoading} />
        </div>
      </div>

      {/* Campaign Metrics */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Campaigns</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Total Ads" icon={Megaphone} value={stats?.totalAds?.toLocaleString()}
            sub={`${stats?.activeAds ?? 0} currently active`} loading={statsLoading} href="/admin/ads" />
          <KpiCard title="Active Campaigns" icon={Activity} value={stats?.activeAds?.toLocaleString()}
            sub="Visible to reviewers now" accent="text-green-600" loading={statsLoading} href="/admin/ads" />
          <KpiCard title="Total Completions" icon={CheckCircle} value={stats?.totalCompletions?.toLocaleString()}
            sub="Reviews completed across all ads" accent="text-blue-600" loading={statsLoading} />
        </div>
      </div>

      {/* Financial Metrics */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Points Issued" icon={Coins}
            value={stats?.totalPointsIssued !== undefined ? stats.totalPointsIssued.toLocaleString() + " pts" : undefined}
            sub="Total lifetime points earned" accent="text-orange-500" loading={statsLoading} href="/admin/financials" />
          <KpiCard title="Pending Payouts" icon={Clock}
            value={stats?.pendingRedemptions}
            sub="Redemptions awaiting review"
            accent={(stats?.pendingRedemptions ?? 0) > 0 ? "text-amber-500" : "text-muted-foreground"}
            loading={statsLoading} href="/admin/financials" />
          <KpiCard title="Completed Payouts" icon={CheckCircle}
            value={stats?.completedRedemptions}
            sub="Successfully paid out" accent="text-green-600" loading={statsLoading} href="/admin/financials" />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </div>
          <Link href="/admin/events" className="text-sm text-primary hover:underline font-medium">
            View All Logs →
          </Link>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : eventsData?.events && eventsData.events.length > 0 ? (
            <div className="divide-y">
              {eventsData.events.map((event) => {
                const Icon = getEventIcon(event.eventType);
                return (
                  <div key={event.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="bg-muted p-2 rounded-full shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event.eventType}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.entityType} • {event.actorId ? `Actor: ${event.actorId.substring(0, 8)}…` : "System"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(event.createdAt).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No events recorded yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
