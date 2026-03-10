import { useState } from "react";
import { Search, Filter, Heart, MessageSquare, Share2, Eye, ChevronDown, ChevronUp, Link2, Send } from "lucide-react";
import PageExplainer from "@/components/PageExplainer";
import { ALL_SAMPLE_POSTS, type Platform } from "@/lib/sampleData";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const PLATFORM_FILTERS: { key: Platform | "all"; label: string; color: string }[] = [
  { key: "all", label: "الكل", color: "#000" },
  { key: "x", label: "X / تويتر", color: "#1DA1F2" },
  { key: "tiktok", label: "TikTok", color: "#ff0050" },
  { key: "instagram", label: "Instagram", color: "#E4405F" },
  { key: "youtube", label: "YouTube", color: "#FF0000" },
];

const SENTIMENT_COLORS = {
  positive: { bg: "bg-thmanyah-green/[0.08]", text: "text-thmanyah-green", label: "إيجابي" },
  negative: { bg: "bg-thmanyah-red/[0.08]", text: "text-thmanyah-red", label: "سلبي" },
  neutral: { bg: "bg-muted/30", text: "text-muted-foreground", label: "محايد" },
};

const SENTIMENT_FILTERS = [
  { key: "all" as const, label: "الكل" },
  { key: "positive" as const, label: "إيجابي" },
  { key: "negative" as const, label: "سلبي" },
  { key: "neutral" as const, label: "محايد" },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const platformColor = (p: Platform) => PLATFORM_FILTERS.find((pf) => pf.key === p)?.color || "#666";
const platformLabel = (p: Platform): string => ({ x: "X", tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" })[p];

export default function Explore() {
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleAddComment = (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), text] }));
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/explore?post=${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "تم نسخ الرابط", description: "تم نسخ رابط المنشور إلى الحافظة" });
    });
  };

  const filtered = ALL_SAMPLE_POSTS.filter((p) => {
    if (platformFilter !== "all" && p.platform !== platformFilter) return false;
    if (sentimentFilter !== "all" && p.sentiment !== sentimentFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return p.text.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q) || p.keywords.some((k) => k.includes(q));
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const visible = showAll ? filtered : filtered.slice(0, 15);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageExplainer
        icon={Search}
        title="استكشاف البيانات"
        description="ابحث وتصفّح جميع الإشارات والتعليقات عبر المنصات المختلفة مع فلاتر متقدمة حسب المنصة والمشاعر والموضوع"
        color="#FFBC0A"
      />

      {/* Search Bar */}
      <div className="card-stagger" style={{ animationDelay: "0s" }}>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الإشارات والتعليقات..."
            className="w-full py-3.5 pr-11 pl-4 rounded-xl bg-card border border-border/50 text-sm font-bold text-foreground/80 placeholder:text-muted-foreground/30 placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20 focus:border-thmanyah-green/30 transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card-stagger flex flex-wrap gap-2" style={{ animationDelay: "0.05s" }}>
        {PLATFORM_FILTERS.map((pf) => (
          <button
            key={pf.key}
            onClick={() => setPlatformFilter(pf.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              platformFilter === pf.key
                ? "bg-foreground text-white"
                : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
            }`}
          >
            {pf.key === "all" && <Filter className="w-3 h-3" />}
            {pf.label}
          </button>
        ))}
        <div className="w-px h-6 bg-border/40 mx-1 self-center" />
        {SENTIMENT_FILTERS.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setSentimentFilter(sf.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              sentimentFilter === sf.key
                ? "bg-foreground text-white"
                : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="card-stagger flex items-center gap-3" style={{ animationDelay: "0.1s" }}>
        <span className="text-[12px] font-bold text-muted-foreground/50 nums-en">{filtered.length} نتيجة</span>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-bold text-muted-foreground/40">بيانات تجريبية</span>
      </div>

      {/* Posts Feed */}
      {filtered.length === 0 ? (
        <div className="card-stagger text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Search className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <h3 className="text-base font-display font-bold text-foreground/60 mb-1.5">لا توجد نتائج</h3>
          <p className="text-[12px] font-bold text-muted-foreground/40">جرّب تغيير كلمات البحث أو الفلاتر</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((post, i) => {
            const sc = SENTIMENT_COLORS[post.sentiment];
            const isOpen = expandedPost === post.id;
            const color = platformColor(post.platform);
            return (
              <div key={post.id} className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden" style={{ animationDelay: `${0.12 + i * 0.03}s` }}>
                <button onClick={() => setExpandedPost(isOpen ? null : post.id)} className="w-full text-right p-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: color }}>
                      {post.authorAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[12px] font-bold text-foreground/80">{post.authorName}</span>
                        {post.authorVerified && (
                          <svg className="w-3.5 h-3.5 text-thmanyah-blue shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground/30 nums-en" dir="ltr">@{post.author}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${color}10`, color }}>{platformLabel(post.platform)}</span>
                        <span className="text-[10px] font-bold text-muted-foreground/30 mr-auto">{format(new Date(post.createdAt), "d MMM", { locale: ar })}</span>
                      </div>
                      <p className="text-[12px] font-bold text-foreground/70 leading-relaxed line-clamp-2">{post.text}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en"><Heart className="w-3 h-3" /> {fmt(post.likes)}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en"><MessageSquare className="w-3 h-3" /> {fmt(post.comments)}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en"><Share2 className="w-3 h-3" /> {fmt(post.shares)}</span>
                        {post.views !== undefined && post.views > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en"><Eye className="w-3 h-3" /> {fmt(post.views)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyLink(post.id); }}
                          className="p-1 rounded-md hover:bg-muted/20 transition-colors"
                          title="نسخ الرابط"
                        >
                          <Link2 className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-thmanyah-blue transition-colors" />
                        </button>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/30" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/20" />}
                      </div>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border/30 p-4 bg-muted/5 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">المشاعر</div>
                        <div className={`text-[12px] font-bold ${sc.text}`}>{sc.label}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">الثقة</div>
                        <div className="text-[12px] font-bold text-foreground/80 nums-en">{Math.round(post.confidence * 100)}%</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">العاطفة</div>
                        <div className="text-[12px] font-bold text-foreground/80">{post.emotion}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">المنصة</div>
                        <div className="text-[12px] font-bold" style={{ color }}>{platformLabel(post.platform)}</div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card border border-border/30">
                      <div className="text-[10px] font-bold text-muted-foreground/40 mb-1">سبب التصنيف</div>
                      <p className="text-[11px] font-bold text-foreground/70 leading-relaxed">{post.reason}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {post.keywords.map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded-full bg-muted/30 text-[9px] font-bold text-muted-foreground/60">{kw}</span>
                      ))}
                    </div>

                    {/* ── Comment Section ── */}
                    <div className="border-t border-border/20 pt-3 mt-1">
                      <div className="text-[10px] font-bold text-muted-foreground/40 mb-2">التعليقات</div>
                      {(comments[post.id] || []).length > 0 && (
                        <div className="space-y-1.5 mb-2.5">
                          {(comments[post.id] || []).map((c, ci) => (
                            <div key={ci} className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/20">
                              <div className="w-5 h-5 rounded-full bg-thmanyah-green/10 flex items-center justify-center shrink-0">
                                <span className="text-[8px] font-bold text-thmanyah-green">أ</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-muted-foreground/40">أنت</span>
                                <p className="text-[11px] font-bold text-foreground/70">{c}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post.id); }}
                          placeholder="أضف تعليقاً..."
                          className="flex-1 py-2 px-3 rounded-lg bg-card border border-border/30 text-[11px] font-bold text-foreground/80 placeholder:text-muted-foreground/25 placeholder:font-bold focus:outline-none focus:ring-1 focus:ring-thmanyah-green/20 focus:border-thmanyah-green/30 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddComment(post.id); }}
                          className="p-2 rounded-lg bg-thmanyah-green/10 border border-thmanyah-green/20 hover:bg-thmanyah-green/20 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5 text-thmanyah-green" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 15 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/40 text-[12px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all">
          {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> عرض أقل</> : <><ChevronDown className="w-3.5 h-3.5" /> عرض جميع النتائج ({filtered.length})</>}
        </button>
      )}
    </div>
  );
}
