import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Inbox,
} from "lucide-react";
import PageExplainer from "@/components/PageExplainer";
import { supabase } from "@/integrations/supabase/client";
import type {
  PostItem,
  TikTokPostRow,
  InstagramPostRow,
  YouTubeDataRow,
  XDataRow,
  Platform,
} from "@/lib/db-types";
import { fmtNum, daysAgo, daysAgoDate } from "@/lib/db-types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PLATFORM_FILTERS: { key: Platform | "all"; label: string; color: string }[] = [
  { key: "all", label: "الكل", color: "#000" },
  { key: "x", label: "X / تويتر", color: "#1DA1F2" },
  { key: "tiktok", label: "TikTok", color: "#ff0050" },
  { key: "instagram", label: "Instagram", color: "#E4405F" },
  { key: "youtube", label: "YouTube", color: "#FF0000" },
];

const PLATFORM_COLORS: Record<Platform, string> = {
  x: "#1DA1F2",
  tiktok: "#ff0050",
  instagram: "#E4405F",
  youtube: "#FF0000",
};

const PLATFORM_LABEL: Record<Platform, string> = {
  x: "X",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

const SENTIMENT_COLORS = {
  positive: { bg: "bg-thmanyah-green/[0.08]", text: "text-thmanyah-green", label: "إيجابي" },
  negative: { bg: "bg-thmanyah-red/[0.08]", text: "text-thmanyah-red", label: "سلبي" },
  neutral: { bg: "bg-muted/30", text: "text-muted-foreground", label: "محايد" },
};

function useExploreData(options: {
  query: string;
  platform: Platform | "all";
  days: number;
}) {
  const { query, platform, days } = options;

  return useQuery({
    queryKey: ["explore", query, platform, days],
    queryFn: async () => {
      const since = daysAgo(days);
      const sinceDate = daysAgoDate(days);
      const limit = 30;

      const results: PostItem[] = [];

      // Fetch from each platform in parallel
      const queries: Promise<void>[] = [];

      if (platform === "all" || platform === "tiktok") {
        queries.push(
          (async () => {
            let q = (supabase as any)
              .from("tiktok_posts")
              .select("*")
              .gte("post_create_time", since)
              .order("post_create_time", { ascending: false })
              .limit(limit);
            if (query) q = q.ilike("post_description", `%${query}%`);
            const { data } = await q;
            for (const p of (data || []) as TikTokPostRow[]) {
              results.push({
                id: `tt_${p.post_id}`,
                text: p.post_description || "",
                url: p.post_url || "",
                createdAt: p.post_create_time || "",
                likes: p.post_like_count || 0,
                commentsCount: p.post_comment_count || 0,
                shares: p.post_share_count || 0,
                views: p.post_play_count || 0,
                accountUsername: p.account_username || "",
                accountNameAr: p.account_name_ar || "",
                platform: "tiktok",
              });
            }
          })()
        );
      }

      if (platform === "all" || platform === "instagram") {
        queries.push(
          (async () => {
            let q = (supabase as any)
              .from("instagram_posts")
              .select("*")
              .gte("post_timestamp", since)
              .order("post_timestamp", { ascending: false })
              .limit(limit);
            if (query) q = q.ilike("post_caption", `%${query}%`);
            const { data } = await q;
            for (const p of (data || []) as InstagramPostRow[]) {
              results.push({
                id: `ig_${p.post_id}`,
                text: p.post_caption || "",
                url: p.post_url || "",
                createdAt: p.post_timestamp || "",
                likes: p.post_likes_count || 0,
                commentsCount: p.post_comments_count || 0,
                shares: 0,
                views: p.post_views_count || 0,
                accountUsername: p.account_username || "",
                accountNameAr: p.account_name_ar || "",
                platform: "instagram",
              });
            }
          })()
        );
      }

      if (platform === "all" || platform === "youtube") {
        queries.push(
          (async () => {
            let q = (supabase as any)
              .from("youtube_data")
              .select("video_id, video_title, video_url, video_view_count, video_like_count, video_comment_count, comment_published_at, account_name")
              .gte("comment_published_at", since)
              .order("comment_published_at", { ascending: false })
              .limit(200);
            if (query) q = q.ilike("video_title", `%${query}%`);
            const { data } = await q;
            // Deduplicate videos
            const seen = new Set<string>();
            for (const r of (data || []) as YouTubeDataRow[]) {
              if (!r.video_id || seen.has(r.video_id)) continue;
              seen.add(r.video_id);
              results.push({
                id: `yt_${r.video_id}`,
                text: r.video_title || "",
                url: r.video_url || "",
                createdAt: r.comment_published_at || "",
                likes: r.video_like_count || 0,
                commentsCount: r.video_comment_count || 0,
                shares: 0,
                views: r.video_view_count || 0,
                accountUsername: r.account_name || "",
                accountNameAr: r.account_name || "",
                platform: "youtube",
              });
              if (seen.size >= limit) break;
            }
          })()
        );
      }

      if (platform === "all" || platform === "x") {
        queries.push(
          (async () => {
            let q = (supabase as any)
              .from("x_data")
              .select("*")
              .gte("date", sinceDate)
              .order("date", { ascending: false })
              .limit(limit);
            if (query) q = q.ilike("hit_sentence", `%${query}%`);
            const { data } = await q;
            for (const p of (data || []) as XDataRow[]) {
              results.push({
                id: `x_${p.document_id}`,
                text: p.hit_sentence || "",
                url: p.url || "",
                createdAt: p.date ? `${p.date}T${p.time || "00:00:00"}Z` : "",
                likes: p.likes || 0,
                commentsCount: p.comments || 0,
                shares: p.reposts || 0,
                views: p.views || 0,
                accountUsername: p.author_handle || "",
                accountNameAr: p.author_name || "",
                platform: "x",
                sentiment: p.sentiment || undefined,
              });
            }
          })()
        );
      }

      await Promise.all(queries);

      // Sort by date descending
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return results;
    },
    staleTime: 60_000,
  });
}

export default function Explore() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [days, setDays] = useState(30);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Simple debounce
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebouncedQuery(val), 400));
  };

  const { data: posts = [], isLoading } = useExploreData({
    query: debouncedQuery,
    platform: platformFilter,
    days,
  });

  const visible = showAll ? posts : posts.slice(0, 20);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageExplainer
        icon={Search}
        title="استكشاف البيانات"
        description="ابحث وتصفّح جميع المنشورات والتعليقات عبر المنصات المختلفة — بيانات حية من قاعدة البيانات"
        color="#FFBC0A"
      />

      {/* Search Bar */}
      <div className="card-stagger" style={{ animationDelay: "0s" }}>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="ابحث في المنشورات والتعليقات..."
            className="w-full py-3.5 pr-11 pl-4 rounded-xl bg-card border border-border/50 text-sm font-bold text-foreground/80 placeholder:text-muted-foreground/30 placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-thmanyah-green/20 focus:border-thmanyah-green/30 transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card-stagger flex flex-wrap items-center gap-2" style={{ animationDelay: "0.05s" }}>
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
        <div className="w-px h-6 bg-border/40 mx-1" />
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

      {/* Results Count */}
      <div className="card-stagger flex items-center gap-3" style={{ animationDelay: "0.1s" }}>
        <span className="text-[12px] font-bold text-muted-foreground/50 nums-en">
          {posts.length} نتيجة
        </span>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-card border border-border/40 p-4 space-y-3 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-muted/30 rounded" />
              <div className="h-3 w-1/2 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card-stagger text-center py-16">
          <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
          <h3 className="text-base font-display font-bold text-foreground/60 mb-1.5">
            لا توجد نتائج
          </h3>
          <p className="text-[12px] font-bold text-muted-foreground/40">
            جرّب تغيير كلمات البحث أو الفلاتر
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((post, i) => {
            const isOpen = expandedPost === post.id;
            const color = PLATFORM_COLORS[post.platform];
            const sentimentKey =
              post.sentiment === "Positive" || post.sentiment === "إيجابي"
                ? "positive"
                : post.sentiment === "Negative" || post.sentiment === "سلبي"
                ? "negative"
                : post.sentiment
                ? "neutral"
                : null;

            return (
              <div
                key={post.id}
                className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden"
                style={{ animationDelay: `${0.12 + i * 0.02}s` }}
              >
                <button
                  onClick={() => setExpandedPost(isOpen ? null : post.id)}
                  className="w-full text-right p-4 hover:bg-muted/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {(post.accountNameAr || post.authorName || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[12px] font-bold text-foreground/80">
                          {post.accountNameAr || post.authorName || "—"}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{ backgroundColor: `${color}10`, color }}
                        >
                          {PLATFORM_LABEL[post.platform]}
                        </span>
                        {sentimentKey && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${SENTIMENT_COLORS[sentimentKey].bg} ${SENTIMENT_COLORS[sentimentKey].text}`}
                          >
                            {SENTIMENT_COLORS[sentimentKey].label}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground/30 mr-auto">
                          {post.createdAt
                            ? (() => {
                                try {
                                  return format(new Date(post.createdAt), "d MMM", { locale: ar });
                                } catch {
                                  return post.createdAt.split("T")[0];
                                }
                              })()
                            : ""}
                        </span>
                      </div>
                      <p className="text-[12px] font-bold text-foreground/70 leading-relaxed line-clamp-2">
                        {post.text || "—"}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                          <Heart className="w-3 h-3" /> {fmtNum(post.likes)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                          <MessageSquare className="w-3 h-3" /> {fmtNum(post.commentsCount)}
                        </span>
                        {post.shares > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                            <Share2 className="w-3 h-3" /> {fmtNum(post.shares)}
                          </span>
                        )}
                        {post.views > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                            <Eye className="w-3 h-3" /> {fmtNum(post.views)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/30" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/20" />
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border/30 p-4 bg-muted/5 space-y-3">
                    <p className="text-[12px] font-bold text-foreground/70 leading-relaxed whitespace-pre-wrap">
                      {post.text}
                    </p>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-thmanyah-blue hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        عرض المنشور الأصلي
                      </a>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">المنصة</div>
                        <div className="text-[12px] font-bold" style={{ color }}>
                          {PLATFORM_LABEL[post.platform]}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">الحساب</div>
                        <div className="text-[12px] font-bold text-foreground/80 truncate">
                          {post.accountNameAr || "—"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">الإعجابات</div>
                        <div className="text-[12px] font-bold text-foreground/80 nums-en">
                          {fmtNum(post.likes)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-0.5">المشاهدات</div>
                        <div className="text-[12px] font-bold text-foreground/80 nums-en">
                          {fmtNum(post.views)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {posts.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/40 text-[12px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> عرض أقل
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> عرض جميع النتائج ({posts.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
