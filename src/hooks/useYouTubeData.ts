import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  YouTubeDataRow,
  PlatformStats,
  EnrichedComment,
  ChartPoint,
  TopPost,
  AccountCount,
} from "@/lib/db-types";

interface QueryOpts {
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

/* ── Stats (RPC) ── */
export function useYouTubeStats(opts: QueryOpts) {
  const { account, dateFrom, dateTo } = opts;
  return useQuery<PlatformStats>({
    queryKey: ["youtube-stats", account, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_youtube_stats", {
        p_account: account || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
      });
      if (error) throw error;
      return data as PlatformStats;
    },
    staleTime: 5 * 60_000,
  });
}

/* ── Comments (paginated, infinite) ── */
export type CommentSort = "newest" | "oldest" | "most_likes" | "most_replies";

interface CommentOpts extends QueryOpts {
  search?: string;
  sort?: CommentSort;
  filterDate?: string;
  filterPostId?: string; // video_id
  filterPostIds?: string[]; // video_ids
  enabled?: boolean;
}

function sortConfig(sort: CommentSort) {
  const map: Record<CommentSort, { col: string; asc: boolean }> = {
    newest: { col: "comment_published_at", asc: false },
    oldest: { col: "comment_published_at", asc: true },
    most_likes: { col: "comment_like_count", asc: false },
    most_replies: { col: "comment_published_at", asc: false },
  };
  return map[sort];
}

export function useYouTubeComments(opts: CommentOpts) {
  const {
    account, dateFrom, dateTo, search,
    sort = "newest", filterDate, filterPostId, filterPostIds,
    enabled = true,
  } = opts;

  return useInfiniteQuery({
    queryKey: ["youtube-comments", account, dateFrom, dateTo, search, sort, filterDate, filterPostId, filterPostIds],
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { col, asc } = sortConfig(sort);
      const from = pageParam * 100;
      const to = from + 99;

      let q = (supabase as any)
        .from("youtube_data")
        .select("*", { count: "exact" })
        .order(col, { ascending: asc })
        .range(from, to);

      if (account) q = q.eq("account_name", account);
      if (dateFrom) q = q.gte("comment_published_at", dateFrom);
      if (dateTo) q = q.lte("comment_published_at", dateTo);
      if (search) q = q.ilike("comment_text", `%${search}%`);
      if (filterDate) {
        q = q.gte("comment_published_at", filterDate + "T00:00:00");
        q = q.lt("comment_published_at", filterDate + "T23:59:59.999");
      }
      if (filterPostId) q = q.eq("video_id", filterPostId);
      if (filterPostIds && filterPostIds.length > 0) q = q.in("video_id", filterPostIds);

      const { data: comments, count, error } = await q;
      if (error) throw error;
      const rows = (comments || []) as YouTubeDataRow[];

      const items: EnrichedComment[] = rows.map((c) => ({
        id: c.comment_id,
        text: c.comment_text || "",
        createdAt: c.comment_published_at || "",
        likes: c.comment_like_count || 0,
        authorName: c.author_display_name || "مجهول",
        authorAvatar: c.author_thumbnail_url || undefined,
        isReply: c.comment_type === "reply" || !!c.parent_comment_id,
        replyCount: 0,
        parentPostId: c.video_id || undefined,
        parentPostText: c.video_title || undefined,
        parentPostUrl: c.video_url || undefined,
        parentPostThumbnail: c.video_thumbnail_url || undefined,
        platform: "youtube" as const,
        accountName: c.account_name || undefined,
      }));

      return { items, total: count || 0, page: pageParam };
    },
    getNextPageParam: (last) =>
      (last.page + 1) * 100 < last.total ? last.page + 1 : undefined,
    staleTime: 60_000,
  });
}

/* ── Comments Per Day (RPC) ── */
export function useYouTubeCommentsPerDay(opts: QueryOpts) {
  const { account, dateFrom, dateTo } = opts;
  return useQuery<ChartPoint[]>({
    queryKey: ["youtube-comments-per-day", account, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_youtube_comments_per_day", {
        p_account: account || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
      });
      if (error) throw error;
      return (data || []) as ChartPoint[];
    },
    staleTime: 5 * 60_000,
  });
}

/* ── Top Videos (RPC) ── */
export function useYouTubeTopPosts(opts: QueryOpts & { limit?: number }) {
  const { account, dateFrom, dateTo, limit = 10 } = opts;
  return useQuery<TopPost[]>({
    queryKey: ["youtube-top-posts", account, dateFrom, dateTo, limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_youtube_top_posts_sorted", {
        p_account: account || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
        p_limit: limit,
      });
      if (error) throw error;
      return ((data || []) as any[]).map((p) => ({
        id: p.video_id,
        text: p.video_title || "",
        url: p.video_url || "",
        engagement: p.engagement || 0,
        likes: p.video_like_count || 0,
        comments: p.video_comment_count || 0,
        views: p.video_view_count || 0,
        account: p.account_name || "",
        accountAr: p.account_name || "",
        platform: "youtube" as const,
      }));
    },
    staleTime: 5 * 60_000,
  });
}

/* ── Comments Per Account (RPC) ── */
export function useYouTubeCommentsPerAccount(opts: { dateFrom?: string; dateTo?: string }) {
  const { dateFrom, dateTo } = opts;
  return useQuery<AccountCount[]>({
    queryKey: ["youtube-comments-per-account", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_youtube_comments_per_account", {
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
      });
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        account: r.account_name || "",
        accountAr: r.account_name || "",
        count: r.count || 0,
      }));
    },
    staleTime: 5 * 60_000,
  });
}
