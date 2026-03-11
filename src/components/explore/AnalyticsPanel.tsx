import { Suspense, lazy, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { MessageSquare, Eye, Heart, TrendingUp, Share2 } from "lucide-react";
import type { PlatformStats, ChartPoint, TopPost, AccountCount, DrawerFilter, Platform } from "@/lib/db-types";
import { fmtNum, PLATFORM_COLORS } from "@/lib/db-types";

/* ── Skeleton ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/20 ${className}`} />;
}

/* ── KPI Card ── */
function KPICard({ label, value, icon: Icon, color, bg, loading }: {
  label: string; value: number; icon: React.ElementType;
  color: string; bg: string; loading: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/40 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.8} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-16 mb-1" />
      ) : (
        <div className="text-xl font-bold text-foreground/90 mb-0.5" dir="ltr">
          {fmtNum(value)}
        </div>
      )}
      <div className="text-[11px] font-bold text-muted-foreground/50">{label}</div>
    </div>
  );
}

/* ── Main Panel ── */
interface Props {
  platform: Platform;
  stats?: PlatformStats;
  commentsPerDay?: ChartPoint[];
  topPosts?: TopPost[];
  postsPerDay?: ChartPoint[];
  commentsPerAccount?: AccountCount[];
  isLoading: boolean;
  showAccountPie: boolean;
  onChartClick?: (filter: DrawerFilter) => void;
}

export default function AnalyticsPanel({
  platform, stats, commentsPerDay, topPosts, postsPerDay,
  commentsPerAccount, isLoading, showAccountPie, onChartClick,
}: Props) {
  const color = PLATFORM_COLORS[platform];

  return (
    <div className="space-y-4 overflow-y-auto custom-scrollbar">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="المنشورات" value={stats?.total_posts || 0} icon={TrendingUp} color="text-thmanyah-blue" bg="bg-thmanyah-blue/[0.06]" loading={isLoading} />
        <KPICard label="التعليقات" value={stats?.total_comments || 0} icon={MessageSquare} color="text-thmanyah-green" bg="bg-thmanyah-green/[0.06]" loading={isLoading} />
        <KPICard label="الإعجابات" value={stats?.total_likes || 0} icon={Heart} color="text-thmanyah-red" bg="bg-thmanyah-red/[0.06]" loading={isLoading} />
        <KPICard label="المشاهدات" value={stats?.total_views || 0} icon={Eye} color="text-thmanyah-amber" bg="bg-thmanyah-amber/[0.06]" loading={isLoading} />
      </div>

      {/* Comments Per Day */}
      {commentsPerDay && commentsPerDay.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">التعليقات يومياً</h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commentsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
                <Tooltip
                  content={({ active, payload, label }: any) =>
                    active && payload?.[0] ? (
                      <div className="bg-card p-2 border border-border rounded-lg shadow-lg text-[11px] font-bold">
                        <p>{label}</p>
                        <p className="text-muted-foreground">{payload[0].value} تعليق</p>
                      </div>
                    ) : null
                  }
                />
                <Bar
                  dataKey="count"
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (onChartClick && data?.date) {
                      onChartClick({ type: "date", date: data.date, label: data.date });
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Posts (Horizontal Bar) */}
      {topPosts && topPosts.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">الأكثر تفاعلاً</h4>
          <div className="space-y-2">
            {topPosts.slice(0, 5).map((p) => {
              const maxEng = topPosts[0].engagement || 1;
              const pct = Math.round((p.engagement / maxEng) * 100);
              return (
                <button
                  key={p.id}
                  onClick={() => onChartClick?.({ type: "post", postId: p.id, label: p.text.slice(0, 40) || p.id })}
                  className="w-full text-right group"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-foreground/60 truncate flex-1">
                      {p.text.slice(0, 50) || "—"}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 shrink-0" dir="ltr">
                      {fmtNum(p.engagement)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all group-hover:opacity-80"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comments Per Account (Pie) */}
      {showAccountPie && commentsPerAccount && commentsPerAccount.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">التعليقات حسب الحساب</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commentsPerAccount.map((a) => ({ name: a.accountAr || a.account, value: Number(a.count) }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={75}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  cursor="pointer"
                  onClick={(data: any) => {
                    const acc = commentsPerAccount.find((a) => (a.accountAr || a.account) === data?.name);
                    if (acc && onChartClick) {
                      onChartClick({ type: "account", account: acc.account, label: acc.accountAr || acc.account });
                    }
                  }}
                >
                  {commentsPerAccount.map((_, i) => (
                    <Cell key={i} fill={["#00C17A", "#0072F9", "#F24935", "#FFBC0A", "#8B5CF6"][i % 5]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) =>
                    active && payload?.[0] ? (
                      <div className="bg-card p-2 border border-border rounded-lg shadow-lg text-[11px] font-bold">
                        <p>{payload[0].name}</p>
                        <p className="text-muted-foreground">{payload[0].value} تعليق</p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Posts Per Day (Line) */}
      {postsPerDay && postsPerDay.length > 0 && (
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">وتيرة النشر</h4>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={postsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
                <Tooltip
                  content={({ active, payload, label }: any) =>
                    active && payload?.[0] ? (
                      <div className="bg-card p-2 border border-border rounded-lg shadow-lg text-[11px] font-bold">
                        <p>{label}</p>
                        <p className="text-muted-foreground">{payload[0].value} منشور</p>
                      </div>
                    ) : null
                  }
                />
                <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
