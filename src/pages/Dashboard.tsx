import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Twitter,
  BarChart3,
  Radio,
  TrendingUp,
  MessageSquare,
  Eye,
  ArrowLeft,
  FileSpreadsheet,
  LayoutDashboard,
  Heart,
  Hash,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  AreaChart, Area,
} from "recharts";
import PageExplainer from "@/components/PageExplainer";
import SpaceHero from "@/components/SpaceHero";
import { ALL_SAMPLE_POSTS, type Platform, type SamplePost } from "@/lib/sampleData";

/* ── Brand colors from Design Guide ── */
const BRAND = {
  green: "#00C17A",
  red: "#F24935",
  blue: "#0072F9",
  amber: "#FFBC0A",
  purple: "#8B5CF6",
  charcoal: "#494C6B",
  pink: "#FF00B7",
  mint: "#B2E2BA",
  sky: "#84DBE5",
  peach: "#FF9172",
};

const SENTIMENT_COLORS = { positive: BRAND.green, negative: BRAND.red, neutral: BRAND.charcoal };
const PLATFORM_COLORS: Record<Platform, string> = { x: "#1DA1F2", tiktok: "#ff0050", instagram: "#E4405F", youtube: "#FF0000" };
const PLATFORM_LABELS: Record<Platform, string> = { x: "X / تويتر", tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
const EMOTION_COLORS: Record<string, string> = {
  "حماس": BRAND.amber, "فرح": BRAND.green, "محايد": BRAND.charcoal, "إحباط": BRAND.blue,
  "غضب": BRAND.red, "مفاجأة": BRAND.purple, "قلق": BRAND.pink,
};

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
    description: "رصد ومراقبة حسابات تويتر وتحليل التفاعل",
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

/* ── KPI overview cards (computed from sample data) ── */
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const totalMentions = ALL_SAMPLE_POSTS.length;
const totalLikes = ALL_SAMPLE_POSTS.reduce((s, p) => s + p.likes, 0);
const totalViews = ALL_SAMPLE_POSTS.reduce((s, p) => s + (p.views || 0), 0);
const totalEngagement = totalLikes + ALL_SAMPLE_POSTS.reduce((s, p) => s + p.comments + p.shares, 0);

const KPI_DATA = [
  { label: "إجمالي الإشارات", value: totalMentions.toString(), icon: MessageSquare, color: "text-thmanyah-blue", bg: "bg-thmanyah-blue/[0.06]" },
  { label: "المنصات النشطة", value: "4", icon: Radio, color: "text-thmanyah-green", bg: "bg-thmanyah-green/[0.06]" },
  { label: "المشاهدات", value: fmt(totalViews), icon: Eye, color: "text-thmanyah-amber", bg: "bg-thmanyah-amber/[0.06]" },
  { label: "التفاعل", value: fmt(totalEngagement), icon: Heart, color: "text-thmanyah-red", bg: "bg-thmanyah-red/[0.06]" },
];

/* ── Active shape for pie chart ── */
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="font-black text-lg">{payload.name}</text>
      <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#666" className="text-sm font-bold">{value} ({(percent * 100).toFixed(1)}%)</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15} fill={fill} />
    </g>
  );
};

/* ── Drill-down panel that shows filtered tweets ── */
interface DrillDown {
  title: string;
  posts: SamplePost[];
}

function DrillDownPanel({ data, onClose }: { data: DrillDown; onClose: () => void }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-xl border border-thmanyah-green/20 bg-thmanyah-green/[0.03] overflow-hidden transition-all">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 hover:bg-thmanyah-green/[0.06] transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-thmanyah-green animate-pulse" />
          <span className="text-[12px] font-bold text-foreground/80">{data.title}</span>
          <span className="text-[10px] font-bold text-muted-foreground/40">{data.posts.length} منشور</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 rounded-md hover:bg-muted/30"><X className="w-3 h-3 text-muted-foreground/40" /></button>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-thmanyah-green/10 max-h-[320px] overflow-y-auto divide-y divide-border/10">
          {data.posts.slice(0, 20).map((post) => {
            const sentimentColor = post.sentiment === "positive" ? BRAND.green : post.sentiment === "negative" ? BRAND.red : BRAND.charcoal;
            return (
              <div key={post.id} className="p-3 hover:bg-card/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: sentimentColor }}>
                    {post.authorAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-foreground/80">{post.authorName}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/30" dir="ltr">@{post.author}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: sentimentColor }}>
                        {post.sentiment === "positive" ? "إيجابي" : post.sentiment === "negative" ? "سلبي" : "محايد"}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-foreground/65 leading-relaxed line-clamp-2">{post.text}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground/30">❤️ {post.likes.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-muted-foreground/30">💬 {post.comments.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-muted-foreground/30">🔁 {post.shares.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-muted-foreground/30">{post.emotion}</span>
                      {post.url && post.url !== "#" && (
                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-thmanyah-blue hover:underline">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SENTIMENT_NAME_MAP: Record<string, SamplePost["sentiment"]> = { "إيجابي": "positive", "سلبي": "negative", "محايد": "neutral" };
const PLATFORM_NAME_MAP: Record<string, Platform> = { "X / تويتر": "x", "TikTok": "tiktok", "Instagram": "instagram", "YouTube": "youtube" };

export default function Dashboard() {
  const navigate = useNavigate();
  const [pieActiveIndex, setPieActiveIndex] = useState<number | undefined>(undefined);
  const [drillDown, setDrillDown] = useState<Record<string, DrillDown | null>>({});

  const openDrillDown = (chartId: string, title: string, posts: SamplePost[]) => {
    setDrillDown((prev) => ({ ...prev, [chartId]: { title, posts } }));
  };
  const closeDrillDown = (chartId: string) => {
    setDrillDown((prev) => ({ ...prev, [chartId]: null }));
  };

  /* ── Computed analysis data ── */
  const analysis = useMemo(() => {
    const posts = ALL_SAMPLE_POSTS;

    // Sentiment distribution
    const positive = posts.filter((p) => p.sentiment === "positive").length;
    const negative = posts.filter((p) => p.sentiment === "negative").length;
    const neutral = posts.filter((p) => p.sentiment === "neutral").length;
    const sentimentPie = [
      { name: "إيجابي", value: positive, color: SENTIMENT_COLORS.positive },
      { name: "سلبي", value: negative, color: SENTIMENT_COLORS.negative },
      { name: "محايد", value: neutral, color: SENTIMENT_COLORS.neutral },
    ];

    // Platform breakdown
    const platformData = (["x", "tiktok", "instagram", "youtube"] as Platform[]).map((p) => {
      const pp = posts.filter((post) => post.platform === p);
      return {
        name: PLATFORM_LABELS[p],
        total: pp.length,
        positive: pp.filter((x) => x.sentiment === "positive").length,
        negative: pp.filter((x) => x.sentiment === "negative").length,
        neutral: pp.filter((x) => x.sentiment === "neutral").length,
        engagement: pp.reduce((s, x) => s + x.likes + x.comments + x.shares, 0),
        color: PLATFORM_COLORS[p],
      };
    });

    // Emotion distribution
    const emotionMap: Record<string, number> = {};
    posts.forEach((p) => { emotionMap[p.emotion] = (emotionMap[p.emotion] || 0) + 1; });
    const emotionData = Object.entries(emotionMap)
      .sort(([, a], [, b]) => b - a)
      .map(([emotion, count]) => ({
        name: emotion,
        count,
        color: EMOTION_COLORS[emotion] || BRAND.charcoal,
      }));

    // Keywords frequency
    const kwMap: Record<string, number> = {};
    posts.forEach((p) => p.keywords.forEach((kw) => { kwMap[kw] = (kwMap[kw] || 0) + 1; }));
    const keywordsData = Object.entries(kwMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([keyword, count]) => ({ keyword, count }));

    // Timeline (posts per day)
    const dayMap: Record<string, { positive: number; negative: number; neutral: number }> = {};
    posts.forEach((p) => {
      const day = p.createdAt.split("T")[0];
      if (!dayMap[day]) dayMap[day] = { positive: 0, negative: 0, neutral: 0 };
      dayMap[day][p.sentiment]++;
    });
    const timelineData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: date.slice(5), // "MM-DD"
        ...counts,
        total: counts.positive + counts.negative + counts.neutral,
      }));

    // Engagement by platform (for area chart)
    const engagementByPlatform = (["x", "tiktok", "instagram", "youtube"] as Platform[]).map((p) => {
      const pp = posts.filter((post) => post.platform === p);
      return {
        name: PLATFORM_LABELS[p],
        likes: pp.reduce((s, x) => s + x.likes, 0),
        comments: pp.reduce((s, x) => s + x.comments, 0),
        shares: pp.reduce((s, x) => s + x.shares, 0),
      };
    });

    // Top themes (matched accounts)
    const accountMap: Record<string, number> = {};
    posts.forEach((p) => { if (p.matchedAccount) accountMap[p.matchedAccount] = (accountMap[p.matchedAccount] || 0) + 1; });
    const topAccounts = Object.entries(accountMap).sort(([, a], [, b]) => b - a).slice(0, 6);

    return { sentimentPie, platformData, emotionData, keywordsData, timelineData, engagementByPlatform, topAccounts, positive, negative, neutral };
  }, []);

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

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi, i) => {
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
              <div className="text-2xl font-bold text-foreground/90 mb-1 counter-animate">{kpi.value}</div>
              <div className="text-[12px] font-bold text-muted-foreground/60">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
          FULL ANALYSIS SECTION — Charts & Insights
         ═══════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-display font-bold text-foreground/80">تحليل شامل</h3>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Row 1: Sentiment Pie + Platform Sentiment Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Sentiment Pie Chart */}
          <div className="card-stagger bg-card rounded-2xl border border-border/50 p-5" style={{ animationDelay: "0.15s" }}>
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">توزيع المشاعر</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.sentimentPie}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={100}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={3}
                    activeIndex={pieActiveIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setPieActiveIndex(index)}
                    onMouseLeave={() => setPieActiveIndex(undefined)}
                    onClick={(_, index) => {
                      const entry = analysis.sentimentPie[index];
                      if (!entry) return;
                      const sentimentKey = SENTIMENT_NAME_MAP[entry.name];
                      const filtered = ALL_SAMPLE_POSTS.filter((p) => p.sentiment === sentimentKey);
                      openDrillDown("sentiment", `تغريدات ${entry.name} (${filtered.length})`, filtered);
                    }}
                    className="cursor-pointer"
                  >
                    {analysis.sentimentPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }: any) =>
                      active && payload?.[0] ? (
                        <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                          <p className="font-bold text-sm">{payload[0].name}</p>
                          <p className="text-xs font-bold text-muted-foreground">{payload[0].value} منشور ({((payload[0].value / totalMentions) * 100).toFixed(1)}%)</p>
                        </div>
                      ) : null
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => <span className="font-bold text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {drillDown.sentiment && <DrillDownPanel data={drillDown.sentiment} onClose={() => closeDrillDown("sentiment")} />}
          </div>

          {/* Platform Sentiment Stacked Bar */}
          <div className="card-stagger bg-card rounded-2xl border border-border/50 p-5" style={{ animationDelay: "0.2s" }}>
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">المشاعر حسب المنصة</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.platformData} layout="vertical" margin={{ right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip
                    content={({ active, payload, label }: any) =>
                      active && payload ? (
                        <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                          <p className="font-bold text-sm mb-1">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.name} className="text-xs font-bold" style={{ color: p.color }}>
                              {p.name}: {p.value}
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="positive" name="إيجابي" stackId="s" fill={BRAND.green} radius={[0, 0, 0, 0]} className="cursor-pointer" onClick={(d: any) => {
                    const plat = PLATFORM_NAME_MAP[d.name]; if (!plat) return;
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.platform === plat && p.sentiment === "positive");
                    openDrillDown("platform", `${d.name} — إيجابي (${filtered.length})`, filtered);
                  }} />
                  <Bar dataKey="negative" name="سلبي" stackId="s" fill={BRAND.red} className="cursor-pointer" onClick={(d: any) => {
                    const plat = PLATFORM_NAME_MAP[d.name]; if (!plat) return;
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.platform === plat && p.sentiment === "negative");
                    openDrillDown("platform", `${d.name} — سلبي (${filtered.length})`, filtered);
                  }} />
                  <Bar dataKey="neutral" name="محايد" stackId="s" fill={BRAND.charcoal} radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={(d: any) => {
                    const plat = PLATFORM_NAME_MAP[d.name]; if (!plat) return;
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.platform === plat && p.sentiment === "neutral");
                    openDrillDown("platform", `${d.name} — محايد (${filtered.length})`, filtered);
                  }} />
                  <Legend iconType="circle" formatter={(v: string) => <span className="font-bold text-xs">{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {drillDown.platform && <DrillDownPanel data={drillDown.platform} onClose={() => closeDrillDown("platform")} />}
          </div>
        </div>

        {/* Row 2: Emotion Distribution + Engagement by Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Emotion Bar Chart */}
          <div className="card-stagger bg-card rounded-2xl border border-border/50 p-5" style={{ animationDelay: "0.25s" }}>
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">العواطف السائدة</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.emotionData} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip
                    content={({ active, payload }: any) =>
                      active && payload?.[0] ? (
                        <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                          <p className="font-bold text-sm">{payload[0].payload.name}</p>
                          <p className="text-xs font-bold text-muted-foreground">{payload[0].value} منشور</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} className="cursor-pointer" onClick={(d: any) => {
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.emotion === d.name);
                    openDrillDown("emotion", `عاطفة: ${d.name} (${filtered.length})`, filtered);
                  }}>
                    {analysis.emotionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} className="cursor-pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {drillDown.emotion && <DrillDownPanel data={drillDown.emotion} onClose={() => closeDrillDown("emotion")} />}
          </div>

          {/* Engagement Breakdown Area */}
          <div className="card-stagger bg-card rounded-2xl border border-border/50 p-5" style={{ animationDelay: "0.3s" }}>
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">التفاعل حسب المنصة</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.engagementByPlatform} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 700 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip
                    content={({ active, payload, label }: any) =>
                      active && payload ? (
                        <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                          <p className="font-bold text-sm mb-1">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.name} className="text-xs font-bold" style={{ color: p.color }}>
                              {p.name}: {fmt(p.value)}
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="likes" name="إعجابات" fill={BRAND.red} radius={[0, 0, 0, 0]} stackId="eng" className="cursor-pointer" onClick={(d: any) => {
                    const plat = PLATFORM_NAME_MAP[d.name]; if (!plat) return;
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.platform === plat).sort((a, b) => b.likes - a.likes);
                    openDrillDown("engagement", `${d.name} — الأكثر تفاعلاً (${filtered.length})`, filtered);
                  }} />
                  <Bar dataKey="comments" name="تعليقات" fill={BRAND.blue} stackId="eng" className="cursor-pointer" onClick={(d: any) => {
                    const plat = PLATFORM_NAME_MAP[d.name]; if (!plat) return;
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.platform === plat).sort((a, b) => b.comments - a.comments);
                    openDrillDown("engagement", `${d.name} — الأكثر تعليقات (${filtered.length})`, filtered);
                  }} />
                  <Bar dataKey="shares" name="مشاركات" fill={BRAND.green} stackId="eng" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={(d: any) => {
                    const plat = PLATFORM_NAME_MAP[d.name]; if (!plat) return;
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.platform === plat).sort((a, b) => b.shares - a.shares);
                    openDrillDown("engagement", `${d.name} — الأكثر مشاركات (${filtered.length})`, filtered);
                  }} />
                  <Legend iconType="circle" formatter={(v: string) => <span className="font-bold text-xs">{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {drillDown.engagement && <DrillDownPanel data={drillDown.engagement} onClose={() => closeDrillDown("engagement")} />}
          </div>
        </div>

        {/* Row 3: Timeline + Keywords + Top Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Sentiment Timeline */}
          <div className="card-stagger lg:col-span-2 bg-card rounded-2xl border border-border/50 p-5" style={{ animationDelay: "0.35s" }}>
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">المشاعر عبر الزمن</h4>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysis.timelineData} margin={{ bottom: 10, right: 10 }}>
                  <defs>
                    <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.green} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={BRAND.green} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.red} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={BRAND.red} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradNeu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.charcoal} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={BRAND.charcoal} stopOpacity={0} />
                    </linearGradient>
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
                              {p.name}: {p.value}
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Area type="monotone" dataKey="positive" name="إيجابي" stroke={BRAND.green} fill="url(#gradPos)" strokeWidth={2.5} dot={{ r: 4, fill: BRAND.green, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, className: "cursor-pointer", onClick: (_: any, e: any) => {
                    if (e?.payload?.date) { const d = e.payload.date; const filtered = ALL_SAMPLE_POSTS.filter((p) => p.createdAt.includes(d) && p.sentiment === "positive"); openDrillDown("timeline", `${d} — إيجابي (${filtered.length})`, filtered); }
                  }}} />
                  <Area type="monotone" dataKey="negative" name="سلبي" stroke={BRAND.red} fill="url(#gradNeg)" strokeWidth={2.5} dot={{ r: 4, fill: BRAND.red, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, className: "cursor-pointer", onClick: (_: any, e: any) => {
                    if (e?.payload?.date) { const d = e.payload.date; const filtered = ALL_SAMPLE_POSTS.filter((p) => p.createdAt.includes(d) && p.sentiment === "negative"); openDrillDown("timeline", `${d} — سلبي (${filtered.length})`, filtered); }
                  }}} />
                  <Area type="monotone" dataKey="neutral" name="محايد" stroke={BRAND.charcoal} fill="url(#gradNeu)" strokeWidth={2} dot={{ r: 3, fill: BRAND.charcoal, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, className: "cursor-pointer", onClick: (_: any, e: any) => {
                    if (e?.payload?.date) { const d = e.payload.date; const filtered = ALL_SAMPLE_POSTS.filter((p) => p.createdAt.includes(d) && p.sentiment === "neutral"); openDrillDown("timeline", `${d} — محايد (${filtered.length})`, filtered); }
                  }}} />
                  <Legend iconType="circle" formatter={(v: string) => <span className="font-bold text-xs">{v}</span>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {drillDown.timeline && <DrillDownPanel data={drillDown.timeline} onClose={() => closeDrillDown("timeline")} />}
          </div>

          {/* Top Accounts */}
          <div className="card-stagger bg-card rounded-2xl border border-border/50 p-5" style={{ animationDelay: "0.4s" }}>
            <h4 className="text-[14px] font-display font-bold text-foreground/85 mb-4">الحسابات الأكثر ذكراً</h4>
            <div className="space-y-2.5">
              {analysis.topAccounts.map(([account, count], i) => {
                const pct = Math.round((count / totalMentions) * 100);
                const barColors = [BRAND.green, BRAND.blue, BRAND.amber, BRAND.red, BRAND.purple, BRAND.pink];
                return (
                  <button key={account} className="w-full text-right cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {
                    const filtered = ALL_SAMPLE_POSTS.filter((p) => p.matchedAccount === account);
                    openDrillDown("accounts", `@${account} (${filtered.length})`, filtered);
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-foreground/80 truncate" dir="ltr">@{account}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/50 nums-en">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColors[i % barColors.length] }} />
                    </div>
                  </button>
                );
              })}
            </div>
            {drillDown.accounts && <DrillDownPanel data={drillDown.accounts} onClose={() => closeDrillDown("accounts")} />}
          </div>
        </div>

        {/* Row 4: Keywords Cloud-style Bars */}
        <div className="card-stagger bg-card rounded-2xl border border-border/50 p-5" style={{ animationDelay: "0.45s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-muted-foreground/50" strokeWidth={2} />
            <h4 className="text-[14px] font-display font-bold text-foreground/85">الكلمات المفتاحية الأكثر تكراراً</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {analysis.keywordsData.map((kw, i) => {
              const maxCount = analysis.keywordsData[0]?.count || 1;
              const intensity = 0.3 + (kw.count / maxCount) * 0.7;
              const colors = [BRAND.green, BRAND.blue, BRAND.red, BRAND.amber, BRAND.purple, BRAND.pink, BRAND.sky, BRAND.peach, BRAND.mint, BRAND.charcoal, BRAND.green, BRAND.blue];
              return (
                <button key={kw.keyword} onClick={() => {
                  const filtered = ALL_SAMPLE_POSTS.filter((p) => p.keywords.includes(kw.keyword));
                  openDrillDown("keywords", `كلمة: "${kw.keyword}" (${filtered.length})`, filtered);
                }} className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer text-right">
                  <span className="text-[12px] font-bold text-foreground/80">{kw.keyword}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white nums-en"
                    style={{ backgroundColor: colors[i % colors.length], opacity: intensity }}
                  >
                    {kw.count}
                  </span>
                </button>
              );
            })}
          </div>
          {drillDown.keywords && <DrillDownPanel data={drillDown.keywords} onClose={() => closeDrillDown("keywords")} />}
        </div>
      </div>

      {/* ── Platform Tools Grid ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-display font-bold text-foreground/80">أدوات الرصد والتحليل</h3>
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
                    style={{ backgroundColor: `${card.color}12`, color: card.color }}
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
          <h3 className="text-lg font-display font-bold text-foreground/80">إجراءات سريعة</h3>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "بحث جديد", icon: Twitter, path: "/tweet-analysis", color: "thmanyah-green", hoverBorder: "hover:border-thmanyah-green/20" },
            { label: "تحليل ملف", icon: FileSpreadsheet, path: "/data-analysis", color: "thmanyah-blue", hoverBorder: "hover:border-thmanyah-blue/20" },
            { label: "رفع تقرير Meltwater", icon: BarChart3, path: "/meltwater-report", color: "purple-500", hoverBorder: "hover:border-purple-500/20" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`card-hover-lift flex items-center gap-3 p-4 rounded-xl bg-card border border-border/40 ${action.hoverBorder} transition-all group`}
              >
                <div className={`p-2 rounded-lg bg-${action.color}/[0.06]`}>
                  <Icon className={`w-4 h-4 text-${action.color}`} strokeWidth={1.8} />
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
