import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlatformStats, ChartPoint, TopPost, Platform } from "@/lib/db-types";

interface OverviewData {
  tiktok: PlatformStats;
  instagram: PlatformStats;
  youtube: PlatformStats;
  totals: { total_posts: number; total_likes: number; total_comments: number; total_views: number };
  trendingPosts: TopPost[];
}

export type TimeGranularity = "hour" | "day" | "week" | "month";

export interface TimelinePoint {
  date: string;
  tiktok: number;
  instagram: number;
  youtube: number;
}

const empty: PlatformStats = { total_posts: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0 };

/** Auto-select granularity based on date range span */
export function autoGranularity(dateFrom?: string, dateTo?: string): TimeGranularity {
  if (!dateFrom || !dateTo) return "day";
  const ms = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (days <= 1) return "hour";
  if (days <= 60) return "day";
  if (days <= 180) return "week";
  return "month";
}

export function useOverviewData(dateFrom?: string, dateTo?: string) {
  return useQuery<OverviewData>({
    queryKey: ["overview", dateFrom, dateTo],
    queryFn: async () => {
      const dp = { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null };

      // 1. Per-platform stats + YouTube direct query (no posts table)
      const [ttRes, igRes, ytCommentsQ, ytVideosQ] = await Promise.all([
        (supabase as any).rpc("get_tiktok_stats", dp),
        (supabase as any).rpc("get_instagram_stats", dp),
        // YouTube: count comments & sum likes directly
        (supabase as any)
          .from("youtube_data")
          .select("comment_id", { count: "exact", head: true })
          .gte("comment_published_at", dateFrom || "1970-01-01")
          .lte("comment_published_at", dateTo || "2099-12-31"),
        // YouTube: count distinct videos (use RPC or aggregate)
        (supabase as any).rpc("get_youtube_stats", dp),
      ]);

      const tiktok: PlatformStats = ttRes.data || empty;
      const instagram: PlatformStats = igRes.data || empty;

      // YouTube: reliable counts from direct queries + RPC fallback for video counts
      const ytRpc = ytVideosQ.data || empty;
      const youtube: PlatformStats = {
        total_posts: ytRpc.total_posts || 0,
        total_comments: ytCommentsQ.count ?? ytRpc.total_comments ?? 0,
        total_likes: ytRpc.total_likes || 0,
        total_shares: 0,
        total_views: 0, // Don't show views — duplicated per comment row
      };

      const totals = {
        total_posts: tiktok.total_posts + instagram.total_posts + youtube.total_posts,
        total_likes: tiktok.total_likes + instagram.total_likes + youtube.total_likes,
        total_comments: tiktok.total_comments + instagram.total_comments + youtube.total_comments,
        total_views: tiktok.total_views + instagram.total_views, // Exclude YouTube views
      };

      // 2. Trending posts (top by engagement across platforms)
      const [ttTop, igTop, ytTop] = await Promise.all([
        (supabase as any).rpc("get_tiktok_top_posts", { ...dp, p_limit: 5 }),
        (supabase as any).rpc("get_instagram_top_posts", { ...dp, p_limit: 5 }),
        (supabase as any).rpc("get_youtube_top_posts_sorted", { ...dp, p_limit: 5 }),
      ]);

      const mapPost = (p: any, platform: Platform): TopPost => ({
        id: p.post_id || p.video_id || "",
        text: p.post_description || p.post_caption || p.video_title || "",
        url: p.post_url || p.video_url || "",
        engagement: p.engagement || 0,
        likes: p.post_like_count || p.post_likes_count || p.video_like_count || 0,
        comments: p.post_comment_count || p.post_comments_count || p.video_comment_count || 0,
        views: p.post_play_count || p.post_views_count || p.video_view_count || 0,
        account: p.account_username || p.account_name || "",
        accountAr: p.account_name_ar || p.account_name || "",
        platform,
      });

      const trendingPosts: TopPost[] = [
        ...((ttTop.data || []) as any[]).map((p) => mapPost(p, "tiktok")),
        ...((igTop.data || []) as any[]).map((p) => mapPost(p, "instagram")),
        ...((ytTop.data || []) as any[]).map((p) => mapPost(p, "youtube")),
      ]
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 10);

      return { tiktok, instagram, youtube, totals, trendingPosts };
    },
    staleTime: 5 * 60_000,
  });
}

/** Separate hook for comments timeline — re-fetches when granularity changes */
export function useCommentsTimeline(dateFrom?: string, dateTo?: string, granularity?: TimeGranularity) {
  const g = granularity || autoGranularity(dateFrom, dateTo);

  const rpcSuffix = g === "hour" ? "per_hour" : g === "week" ? "per_week" : g === "month" ? "per_month" : "per_day";

  return useQuery<TimelinePoint[]>({
    queryKey: ["overview-timeline", dateFrom, dateTo, g],
    queryFn: async () => {
      const dp = { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null };

      const [ttRes, igRes, ytRes] = await Promise.all([
        (supabase as any).rpc(`get_tiktok_comments_${rpcSuffix}`, dp),
        (supabase as any).rpc(`get_instagram_comments_${rpcSuffix}`, dp),
        (supabase as any).rpc(`get_youtube_comments_${rpcSuffix}`, dp),
      ]);

      const timelineMap: Record<string, { tiktok: number; instagram: number; youtube: number }> = {};
      for (const r of (ttRes.data || []) as ChartPoint[]) {
        if (!timelineMap[r.date]) timelineMap[r.date] = { tiktok: 0, instagram: 0, youtube: 0 };
        timelineMap[r.date].tiktok = Number(r.count);
      }
      for (const r of (igRes.data || []) as ChartPoint[]) {
        if (!timelineMap[r.date]) timelineMap[r.date] = { tiktok: 0, instagram: 0, youtube: 0 };
        timelineMap[r.date].instagram = Number(r.count);
      }
      for (const r of (ytRes.data || []) as ChartPoint[]) {
        if (!timelineMap[r.date]) timelineMap[r.date] = { tiktok: 0, instagram: 0, youtube: 0 };
        timelineMap[r.date].youtube = Number(r.count);
      }

      return Object.entries(timelineMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({ date, ...counts }));
    },
    staleTime: 5 * 60_000,
  });
}
