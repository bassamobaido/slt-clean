import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Twitter,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Eye,
  ArrowLeft,
  FileSpreadsheet,
  LayoutDashboard,
  Heart,
  ExternalLink,
  Inbox,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import PageExplainer from "@/components/PageExplainer";
import SpaceHero from "@/components/SpaceHero";
import { useDashboardData } from "@/hooks/useDashboardData";
import { fmtNum } from "@/lib/db-types";
import type { PostItem } from "@/lib/db-types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

/* ── Brand colors ── */
const BRAND = {
  green: "#00C17A",
  red: "#F24935",
  blue: "#0072F9",
  amber: "#FFBC0A",
  purple: "#8B5CF6",
  charcoal: "#494C6B",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#ff0050",
  instagram: "#E4405F",
  youtube: "#FF0000",
  x: "#1DA1F2",
};
const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X / تويتر",
};

/* ── Skeleton ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/30 ${className}`} />;
}

/* ── Platform tool cards ── */
const PLATFORM_CARDS = [
  {
    label: "تحليل التغريدات",
    description: "تحليل المشاعر والآراء من تويتر بالذكاء الاصطناعي",
    icon: Twitter,
    path: "/tweet-analysis",
    color: "#1DA1F2",
    bgClass: "from-[#1DA1F2]/[0.06] to-[#1DA1F2]/[0.02]",
  },
  {
    label: "تحليل البيانات",
    description: "رفع وتحليل ملفات CSV و Excel لتحليل المشاعر والمحتوى",
    icon: FileSpreadsheet,
    path: "/data-analysis",
    color: "#0072F9",
    bgClass: "from-[#0072F9]/[0.06] to-[#0072F9]/[0.02]",
  },
  {
    label: "رصد X / تويتر",
    description: "رصد ومراقبة إشارات تويتر وتحليل المشاعر",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    path: "/monitoring/x",
    color: "#000000",
    bgClass: "from-black/[0.04] to-black/[0.01]",
  },
  {
    label: "رصد TikTok",
    description: "تحليل التعليقات والتفاعل على فيديوهات تيك توك",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.28 8.28 0 004.77 1.52V6.91a4.84 4.84 0 01-1-.22z" />
      </svg>
    ),
    path: "/monitoring/tiktok",
    color: "#ff0050",
    bgClass: "from-[#ff0050]/[0.06] to-[#ff0050]/[0.02]",
  },
  {
    label: "رصد Instagram",
    description: "متابعة التعليقات والتفاعل على منشورات إنستغرام",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    path: "/monitoring/instagram",
    color: "#E4405F",
    bgClass: "from-[#E4405F]/[0.06] to-[#E4405F]/[0.02]",
  },
  {
    label: "رصد YouTube",
    description: "تحليل التعليقات والتفاعل على قنوات يوتيوب",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    path: "/monitoring/youtube",
    color: "#FF0000",
    bgClass: "from-[#FF0000]/[0.06] to-[#FF0000]/[0.02]",
  },
  {
    label: "تقارير Meltwater",
    description: "عرض وتحليل تقارير الرصد الاجتماعي من Meltwater",
    icon: BarChart3,
    path: "/meltwater-report",
    color: "#8B5CF6",
    bgClass: "from-purple-500/[0.06] to-purple-500/[0.02]",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data, isLoading } = useDashboardData(days);

  /* ── Computed chart data ── */
  const platformBarData = data
    ? (["tiktok", "instagram", "youtube", "x"] as const).map((p) => ({
        name: PLATFORM_LABELS[p],
        posts: data.platforms[p].posts,
        color: PLATFORM_COLORS[p],
      }))
    : [];

  const engagementData = data
    ? (["tiktok", "instagram", "youtube", "x"] as const).map((p) => ({
        name: PLATFORM_LABELS[p],
        likes: data.platforms[p].likes,
        comments: data.platforms[p].comments,
        views: data.platforms[p].views,
      }))
    : [];

  const sentimentPieData = data
    ? [
        { name: "إيجابي", value: data.xSentiment.positive, color: BRAND.green },
        { name: "سلبي", value: data.xSentiment.negative, color: BRAND.red },
        { name: "محايد", value: data.xSentiment.neutral, color: BRAND.charcoal },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageExplainer
        icon={LayoutDashboard}
        title="لوحة التحكم"
        description="نظرة شاملة على أداء الرصد الاجتماعي — تتبع الإشارات والتفاعل عبر جميع المنصات من مكان واحد"
        color="#00C17A"
      />

      {/* ── Space Hero Banner ── */}
      <div className="card-stagger" style={{ animationDelay: "0s" }}>
        <SpaceHero />
      </div>

      {/* ── Date filter ── */}
      <div className="card-stagger flex items-center gap-2" style={{ animationDelay: "0.05s" }}>
        <span className="text-[12px] font-bold text-muted-foreground/50">الفترة:</span>
        {[
          { v: 7, l: "٧ أيام" },
          { v: 30, l: "٣٠ يوم" },
          { v: 90, l: "٩٠ يوم" },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => setDays(opt.v)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              days === opt.v
                ? "bg-foreground text-white"
                : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "إجمالي المنشورات",
            value: data?.totals.posts,
            icon: MessageSquare,
            color: "text-thmanyah-blue",
            bg: "bg-thmanyah-blue/[0.06]",
          },
          {
            label: "المنصات النشطة",
            value: 4,
            icon: TrendingUp,
            color: "text-thmanyah-green",
            bg: "bg-thmanyah-green/[0.06]",
          },
          {
            label: "المشاهدات",
            value: data?.totals.views,
            icon: Eye,
            color: "text-thmanyah-amber",
            bg: "bg-thmanyah-amber/[0.06]",
          },
          {
            label: "الإعجابات",
            value: data?.totals.likes,
            icon: Heart,
            color: "text-thmanyah-red",
            bg: "bg-thmanyah-red/[0.06]",
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="card-stagger card-hover-lift bg-card rounded-2xl border border-border/50 p-5"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} strokeWidth={1.8} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-foreground/90 mb-1 counter-animate nums-en">
                  {typeof kpi.value === "number" ? fmtNum(kpi.value) : "—"}
                </div>
              )}
              <div className="text-[12px] font-bold text-muted-foreground/60">
                {kpi.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Charts Section ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-display font-bold text-foreground/80">
            تحليل شامل
          </h3>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Row 1: Posts per platform + Sentiment pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Posts per platform */}
          <div
            className="card-stagger bg-card rounded-2xl border border-border/50 p-5"
            style={{ animationDelay: "0.15s" }}
          >
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">
              المنشورات حسب المنصة
            </h4>
            {isLoading ? (
              <Skeleton className="h-[280px]" />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
                    <Tooltip
                      content={({ active, payload }: any) =>
                        active && payload?.[0] ? (
                          <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                            <p className="font-bold text-sm">{payload[0].payload.name}</p>
                            <p className="text-xs font-bold text-muted-foreground">
                              {payload[0].value} منشور
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="posts" radius={[6, 6, 0, 0]}>
                      {platformBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* X Sentiment pie */}
          <div
            className="card-stagger bg-card rounded-2xl border border-border/50 p-5"
            style={{ animationDelay: "0.2s" }}
          >
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">
              المشاعر — X / تويتر
            </h4>
            {isLoading ? (
              <Skeleton className="h-[280px]" />
            ) : sentimentPieData.every((d) => d.value === 0) ? (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-[12px] font-bold text-muted-foreground/40">
                  لا توجد بيانات مشاعر
                </p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={95}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {sentimentPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) =>
                        active && payload?.[0] ? (
                          <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                            <p className="font-bold text-sm">{payload[0].name}</p>
                            <p className="text-xs font-bold text-muted-foreground">
                              {payload[0].value} إشارة
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(v: string) => (
                        <span className="font-bold text-sm">{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Activity timeline */}
        {data && data.timeline.length > 0 && (
          <div
            className="card-stagger bg-card rounded-2xl border border-border/50 p-5 mb-4"
            style={{ animationDelay: "0.25s" }}
          >
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">
              النشاط عبر الزمن
            </h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ bottom: 10, right: 10 }}>
                  <defs>
                    {(["tiktok", "instagram", "youtube", "x"] as const).map((p) => (
                      <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PLATFORM_COLORS[p]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={PLATFORM_COLORS[p]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip
                    content={({ active, payload, label }: any) =>
                      active && payload ? (
                        <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                          <p className="font-bold text-sm mb-1">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.name} className="text-xs font-bold" style={{ color: p.stroke }}>
                              {PLATFORM_LABELS[p.name] || p.name}: {p.value}
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Area type="monotone" dataKey="tiktok" name="tiktok" stroke={PLATFORM_COLORS.tiktok} fill="url(#grad-tiktok)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="instagram" name="instagram" stroke={PLATFORM_COLORS.instagram} fill="url(#grad-instagram)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="youtube" name="youtube" stroke={PLATFORM_COLORS.youtube} fill="url(#grad-youtube)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="x" name="x" stroke={PLATFORM_COLORS.x} fill="url(#grad-x)" strokeWidth={2} dot={false} />
                  <Legend
                    iconType="circle"
                    formatter={(v: string) => (
                      <span className="font-bold text-xs">
                        {PLATFORM_LABELS[v] || v}
                      </span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Row 3: Engagement breakdown */}
        {data && (
          <div
            className="card-stagger bg-card rounded-2xl border border-border/50 p-5 mb-4"
            style={{ animationDelay: "0.3s" }}
          >
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">
              التفاعل حسب المنصة
            </h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 700 }} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip
                    content={({ active, payload, label }: any) =>
                      active && payload ? (
                        <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                          <p className="font-bold text-sm mb-1">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.name} className="text-xs font-bold" style={{ color: p.color }}>
                              {p.name}: {fmtNum(p.value)}
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="likes" name="إعجابات" fill={BRAND.red} stackId="eng" />
                  <Bar dataKey="comments" name="تعليقات" fill={BRAND.blue} stackId="eng" />
                  <Bar dataKey="views" name="مشاهدات" fill={BRAND.amber} stackId="eng" radius={[4, 4, 0, 0]} />
                  <Legend iconType="circle" formatter={(v: string) => <span className="font-bold text-xs">{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Trending Posts ── */}
      {data && data.trendingPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h3 className="text-lg font-display font-bold text-foreground/80">
              الأكثر تفاعلاً
            </h3>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.trendingPosts.map((post, i) => {
              const pColor = PLATFORM_COLORS[post.platform] || BRAND.charcoal;
              return (
                <div
                  key={post.id}
                  className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-4"
                  style={{ animationDelay: `${0.35 + i * 0.05}s` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold text-white"
                      style={{ backgroundColor: pColor }}
                    >
                      {PLATFORM_LABELS[post.platform]}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 mr-auto">
                      {post.accountNameAr || post.authorName || "—"}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-foreground/70 leading-relaxed line-clamp-3 mb-3 min-h-[48px]">
                    {post.text || "—"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                      <Heart className="w-3 h-3" /> {fmtNum(post.likes)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                      <MessageSquare className="w-3 h-3" /> {fmtNum(post.commentsCount)}
                    </span>
                    {post.views > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                        <Eye className="w-3 h-3" /> {fmtNum(post.views)}
                      </span>
                    )}
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-auto"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-thmanyah-blue transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Platform Tools Grid ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-display font-bold text-foreground/80">
            أدوات الرصد والتحليل
          </h3>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className={`card-stagger card-hover-lift group w-full text-right rounded-2xl bg-gradient-to-bl ${card.bgClass} border border-border/40 p-5 transition-all duration-300 hover:border-border`}
                style={{ animationDelay: `${0.3 + i * 0.06}s` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 p-3 rounded-xl transition-all duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: `${card.color}12`,
                      color: card.color,
                    }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-foreground/85 group-hover:text-foreground transition-colors mb-1">
                      {card.label}
                    </h4>
                    <p className="text-[12px] font-bold text-muted-foreground/50 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <ArrowLeft className="flex-shrink-0 w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-all duration-300 group-hover:-translate-x-1 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card-stagger" style={{ animationDelay: "0.6s" }}>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-display font-bold text-foreground/80">
            إجراءات سريعة
          </h3>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "بحث جديد",
              icon: Twitter,
              path: "/tweet-analysis",
              color: "thmanyah-green",
              hoverBorder: "hover:border-thmanyah-green/20",
            },
            {
              label: "تحليل ملف",
              icon: FileSpreadsheet,
              path: "/data-analysis",
              color: "thmanyah-blue",
              hoverBorder: "hover:border-thmanyah-blue/20",
            },
            {
              label: "رفع تقرير Meltwater",
              icon: BarChart3,
              path: "/meltwater-report",
              color: "purple-500",
              hoverBorder: "hover:border-purple-500/20",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`card-hover-lift flex items-center gap-3 p-4 rounded-xl bg-card border border-border/40 ${action.hoverBorder} transition-all group`}
              >
                <div className={`p-2 rounded-lg bg-${action.color}/[0.06]`}>
                  <Icon
                    className={`w-4 h-4 text-${action.color}`}
                    strokeWidth={1.8}
                  />
                </div>
                <span className="text-[13px] font-bold text-foreground/80 group-hover:text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
