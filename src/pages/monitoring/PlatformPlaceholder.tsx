import { useState } from "react";
import { Radio, Heart, MessageSquare, Share2, Eye, ChevronDown, ChevronUp, Link2, Send } from "lucide-react";
import PageExplainer from "@/components/PageExplainer";
import { type Platform, getPlatformStats } from "@/lib/sampleData";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PlatformPlaceholderProps {
  platformName: string;
  platformNameAr: string;
  color: string;
  icon: React.ReactNode;
  platformKey: Platform;
  accounts?: { name: string; nameAr: string; handle: string }[];
}

const SENTIMENT_COLORS = {
  positive: { bg: "bg-thmanyah-green/[0.08]", text: "text-thmanyah-green", label: "إيجابي" },
  negative: { bg: "bg-thmanyah-red/[0.08]", text: "text-thmanyah-red", label: "سلبي" },
  neutral: { bg: "bg-muted/30", text: "text-muted-foreground", label: "محايد" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function PlatformPlaceholder({
  platformName,
  platformNameAr,
  color,
  icon,
  platformKey,
  accounts = [],
}: PlatformPlaceholderProps) {
  const stats = getPlatformStats(platformKey);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const visiblePosts = showAll ? stats.posts : stats.posts.slice(0, 5);
  const pct = (c: number) => (stats.total > 0 ? Math.round((c / stats.total) * 100) : 0);

  const handleAddComment = (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), text] }));
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/monitoring/${platformKey}?post=${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "تم نسخ الرابط", description: "تم نسخ رابط المنشور إلى الحافظة" });
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageExplainer
        icon={Radio}
        title={`رصد ${platformNameAr}`}
        description={`تابع التعليقات والتفاعل على حسابات ثمانية عبر ${platformName} — تحليل المشاعر والإحصائيات`}
        color={color}
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المنشورات", value: stats.total.toString(), ic: MessageSquare, ic2: color },
          { label: "الإعجابات", value: fmt(stats.totalLikes), ic: Heart, ic2: "#F24935" },
          { label: "المشاركات", value: fmt(stats.totalShares), ic: Share2, ic2: "#0072F9" },
          ...(stats.totalViews > 0
            ? [{ label: "المشاهدات", value: fmt(stats.totalViews), ic: Eye, ic2: "#FFBC0A" }]
            : [{ label: "التعليقات", value: fmt(stats.totalComments), ic: MessageSquare, ic2: "#00C17A" }]),
        ].map((kpi, i) => {
          const Icon = kpi.ic;
          return (
            <div key={kpi.label} className="card-stagger rounded-2xl bg-card border border-border/40 p-4" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${kpi.ic2}10` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: kpi.ic2 }} strokeWidth={1.8} />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground/90 nums-en">{kpi.value}</div>
              <div className="text-[11px] font-bold text-muted-foreground/50">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Sentiment Overview ── */}
      <div className="card-stagger rounded-2xl bg-card border border-border/40 p-5" style={{ animationDelay: "0.05s" }}>
        <h3 className="text-[14px] font-display font-bold text-foreground/85 mb-4">توزيع المشاعر</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["positive", "negative", "neutral"] as const).map((s) => {
            const cfg = SENTIMENT_COLORS[s];
            return (
              <div key={s} className={`text-center p-3 rounded-xl ${cfg.bg}`}>
                <div className={`text-xl font-bold ${cfg.text} nums-en`}>{stats[s]}</div>
                <div className={`text-[10px] font-bold ${cfg.text} opacity-60`}>{cfg.label}</div>
                <div className={`text-[10px] font-bold ${cfg.text} opacity-40 nums-en`}>{pct(stats[s])}%</div>
              </div>
            );
          })}
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/20">
          <div className="bg-thmanyah-green rounded-r-full transition-all" style={{ width: `${pct(stats.positive)}%` }} />
          <div className="bg-thmanyah-red transition-all" style={{ width: `${pct(stats.negative)}%` }} />
          <div className="bg-muted-foreground/20 rounded-l-full transition-all" style={{ width: `${pct(stats.neutral)}%` }} />
        </div>
      </div>

      {/* ── Monitored Accounts ── */}
      {accounts.length > 0 && (
        <div className="card-stagger" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-bold text-foreground/70 mb-3">الحسابات المراقبة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {accounts.map((account, i) => (
              <div key={account.handle} className="card-stagger flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/40" style={{ animationDelay: `${0.12 + i * 0.04}s` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: color }}>
                  {account.nameAr.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="text-[12px] font-bold text-foreground/80 block truncate">{account.nameAr}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/40">@{account.handle}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-thmanyah-green mr-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Posts Feed ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-display font-bold text-foreground/80">آخر المنشورات والتعليقات</h3>
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[10px] font-bold text-muted-foreground/40">بيانات تجريبية</span>
        </div>

        <div className="space-y-2.5">
          {visiblePosts.map((post, i) => {
            const sc = SENTIMENT_COLORS[post.sentiment];
            const isOpen = expandedPost === post.id;
            return (
              <div key={post.id} className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden" style={{ animationDelay: `${0.2 + i * 0.04}s` }}>
                <button onClick={() => setExpandedPost(isOpen ? null : post.id)} className="w-full text-right p-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: color }}>
                      {post.authorAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-bold text-foreground/80">{post.authorName}</span>
                        {post.authorVerified && (
                          <svg className="w-3.5 h-3.5 text-thmanyah-blue shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground/30 nums-en" dir="ltr">@{post.author}</span>
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
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">الحساب</div>
                        <div className="text-[12px] font-bold text-foreground/80 truncate" dir="ltr">@{post.matchedAccount || "—"}</div>
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

        {stats.posts.length > 5 && (
          <button onClick={() => setShowAll(!showAll)} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/40 text-[12px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all">
            {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> عرض أقل</> : <><ChevronDown className="w-3.5 h-3.5" /> عرض جميع المنشورات ({stats.posts.length})</>}
          </button>
        )}
      </div>
    </div>
  );
}
