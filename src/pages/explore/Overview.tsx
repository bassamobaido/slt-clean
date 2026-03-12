import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { MessageSquare, Eye, Heart, TrendingUp, ExternalLink, Compass } from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import DateRangeFilter from "@/components/explore/DateRangeFilter";
import { useOverviewData } from "@/hooks/useOverviewData";
import { useOverviewComments } from "@/hooks/useOverviewComments";
import { fmtNum, PLATFORM_COLORS, PLATFORM_LABELS, type Platform, type DrawerFilter } from "@/lib/db-types";
import { PLATFORM_ICON_MAP } from "@/components/icons/PlatformIcons";
import PageExplainer from "@/components/PageExplainer";
import WordCloud from "@/components/explore/WordCloud";
import ProductChart from "@/components/explore/ProductChart";
import CommentsDrawer from "@/components/explore/CommentsDrawer";
import { useAllCommentTexts } from "@/hooks/useCommentTexts";
import { useProductMentions } from "@/hooks/useProductMentions";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/20 ${className}`} />;
}

export default function Overview() {
  const navigate = useNavigate();
  const { dateRange } = useDateRange();
  const { data, isLoading } = useOverviewData(dateRange.from, dateRange.to);
  const { data: allTexts, isLoading: textsLoading } = useAllCommentTexts(dateRange.from, dateRange.to);
  const { data: productMentions, isLoading: productsLoading } = useProductMentions({
    platform: "all", dateFrom: dateRange.from, dateTo: dateRange.to,
  });

  // Drawer state
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter | null>(null);
  const { data: drawerData, isLoading: drawerLoading } = useOverviewComments({
    filter: drawerFilter,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const platformCards: { key: Platform; path: string }[] = [
    { key: "tiktok", path: "/explore/tiktok" },
    { key: "instagram", path: "/explore/instagram" },
    { key: "youtube", path: "/explore/youtube" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageExplainer
        icon={Compass}
        title="نظرة عامة"
        description="ملخص شامل للتفاعل عبر جميع المنصات — TikTok وInstagram وYouTube"
        color="#00C17A"
      />

      <DateRangeFilter />

      {/* Total KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المنشورات", value: data?.totals.total_posts, icon: TrendingUp, color: "text-thmanyah-blue", bg: "bg-thmanyah-blue/[0.06]" },
          { label: "إجمالي التعليقات", value: data?.totals.total_comments, icon: MessageSquare, color: "text-thmanyah-green", bg: "bg-thmanyah-green/[0.06]" },
          { label: "إجمالي الإعجابات", value: data?.totals.total_likes, icon: Heart, color: "text-thmanyah-red", bg: "bg-thmanyah-red/[0.06]" },
          { label: "إجمالي المشاهدات", value: data?.totals.total_views, icon: Eye, color: "text-thmanyah-amber", bg: "bg-thmanyah-amber/[0.06]" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-2xl border border-border/40 p-5 card-hover-lift">
              <div className={`p-2.5 rounded-xl ${kpi.bg} w-fit mb-3`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} strokeWidth={1.8} />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-foreground/90 mb-1 counter-animate" dir="ltr">
                  {fmtNum(kpi.value || 0)}
                </div>
              )}
              <div className="text-[12px] font-bold text-muted-foreground/50">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Per-Platform Breakdown */}
      <div>
        <h3 className="text-[14px] font-display font-bold text-foreground/70 mb-3">حسب المنصة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platformCards.map(({ key, path }) => {
            const pStats = data?.[key as "tiktok" | "instagram" | "youtube"];
            const color = PLATFORM_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className="group text-right bg-card rounded-2xl border border-border/40 p-5 hover:border-border card-hover-lift transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  {(() => { const PIcon = PLATFORM_ICON_MAP[key]; return PIcon ? <PIcon className="w-4 h-4" /> : null; })()}
                  <span className="text-[13px] font-bold text-foreground/80">{PLATFORM_LABELS[key]}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/20 mr-auto group-hover:text-muted-foreground/50 transition-colors" />
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground/40">منشورات</div>
                      <div className="text-[14px] font-bold text-foreground/80" dir="ltr">{fmtNum(pStats?.total_posts || 0)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground/40">تعليقات</div>
                      <div className="text-[14px] font-bold text-foreground/80" dir="ltr">{fmtNum(pStats?.total_comments || 0)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground/40">إعجابات</div>
                      <div className="text-[14px] font-bold text-foreground/80" dir="ltr">{fmtNum(pStats?.total_likes || 0)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground/40">مشاهدات</div>
                      <div className="text-[14px] font-bold text-foreground/80" dir="ltr">{fmtNum(pStats?.total_views || 0)}</div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Mentions */}
      <ProductChart
        data={productMentions}
        isLoading={productsLoading}
        title="تفاعل منتجات ثمانية"
        onProductClick={(term, name) => setDrawerFilter({ type: "word", word: term, label: `منتج: ${name}` })}
      />

      {/* Comments Timeline (changed from posts) */}
      {data && data.commentsTimeline.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/40 p-5">
          <h4 className="text-[14px] font-display font-bold text-foreground/70 mb-4">نشاط التعليقات عبر الزمن</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.commentsTimeline}
                margin={{ bottom: 10 }}
                onClick={(e: any) => {
                  if (e?.activeLabel) {
                    setDrawerFilter({ type: "date", date: e.activeLabel, label: e.activeLabel });
                  }
                }}
              >
                <defs>
                  {(["tiktok", "instagram", "youtube"] as const).map((p) => (
                    <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PLATFORM_COLORS[p]} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={PLATFORM_COLORS[p]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => v.toLocaleString("en-US")}
                />
                <Tooltip
                  content={({ active, payload, label }: any) =>
                    active && payload ? (
                      <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 text-[11px] font-bold">
                        <p className="text-white/60 mb-1">{label}</p>
                        {payload.map((p: any) => (
                          <p key={p.name} style={{ color: p.stroke }}>
                            {PLATFORM_LABELS[p.name as Platform] || p.name}: {p.value?.toLocaleString("en-US")} تعليق
                          </p>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="tiktok" stroke={PLATFORM_COLORS.tiktok} fill="url(#grad-tiktok)" strokeWidth={2} dot={false} animationDuration={800} style={{ cursor: "pointer" }} />
                <Area type="monotone" dataKey="instagram" stroke={PLATFORM_COLORS.instagram} fill="url(#grad-instagram)" strokeWidth={2} dot={false} animationDuration={800} style={{ cursor: "pointer" }} />
                <Area type="monotone" dataKey="youtube" stroke={PLATFORM_COLORS.youtube} fill="url(#grad-youtube)" strokeWidth={2} dot={false} animationDuration={800} style={{ cursor: "pointer" }} />
                <Legend
                  iconType="circle"
                  formatter={(v: string) => <span className="font-bold text-xs">{PLATFORM_LABELS[v as Platform] || v}</span>}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Word Cloud */}
      <WordCloud
        texts={allTexts || []}
        isLoading={textsLoading}
        onWordClick={(word) => setDrawerFilter({ type: "word", word, label: `كلمة: ${word}` })}
      />

      {/* Trending Posts */}
      {data && data.trendingPosts.length > 0 && (
        <div>
          <h3 className="text-[14px] font-display font-bold text-foreground/70 mb-3">الأكثر تفاعلاً</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.trendingPosts.map((post) => {
              const pColor = PLATFORM_COLORS[post.platform];
              return (
                <div key={`${post.platform}-${post.id}`} className="bg-card rounded-xl border border-border/40 p-4 card-hover-lift">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: pColor }}>
                      {PLATFORM_LABELS[post.platform]}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 mr-auto">
                      {post.accountAr || post.account}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-foreground/70 leading-relaxed line-clamp-2 mb-2 min-h-[32px]">
                    {post.text || "—"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground/40" dir="ltr">
                      <Heart className="w-3 h-3 inline ml-1" />{fmtNum(post.likes)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/40" dir="ltr">
                      <MessageSquare className="w-3 h-3 inline ml-1" />{fmtNum(post.comments)}
                    </span>
                    {post.url && (
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="mr-auto">
                        <ExternalLink className="w-3 h-3 text-muted-foreground/20 hover:text-thmanyah-blue transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comments Drawer */}
      <CommentsDrawer
        open={!!drawerFilter}
        onClose={() => setDrawerFilter(null)}
        title={drawerFilter?.label || ""}
        comments={drawerData?.items || []}
        total={drawerData?.total || 0}
        isLoading={drawerLoading}
      />
    </div>
  );
}
