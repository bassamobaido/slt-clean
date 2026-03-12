import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlatformStats, ChartPoint, TopPost, Platform } from "@/lib/db-types";

interface OverviewData {
  tiktok: PlatformStats;
  instagram: PlatformStats;
  youtube: PlatformStats;
  totals: { total_posts: number; total_likes: number; total_comments: number; total_views: number };
  commentsTimeline: { date: string; tiktok: number; instagram: number; youtube: number }[];
  trendingPosts: TopPost[];
}

const empty: PlatformStats = { total_posts: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_views: 0 };

export function useOverviewData(dateFrom?: string, dateTo?: string) {
  return useQuery<OverviewData>({
    queryKey: ["overview", dateFrom, dateTo],
    queryFn: async () => {
      // 1. Per-platform stats in parallel
      const [ttRes, igRes, ytRes] = await Promise.all([
        (supabase as any).rpc("get_tiktok_stats", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null }),
        (supabase as any).rpc("get_instagram_stats", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null }),
        (supabase as any).rpc("get_youtube_stats", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null }),
      ]);

      const tiktok: PlatformStats = ttRes.data || empty;
      const instagram: PlatformStats = igRes.data || empty;
      const youtube: PlatformStats = ytRes.data || empty;

      const totals = {
        total_posts: tiktok.total_posts + instagram.total_posts + youtube.total_posts,
        total_likes: tiktok.total_likes + instagram.total_likes + youtube.total_likes,
        total_comments: tiktok.total_comments + instagram.total_comments + youtube.total_comments,
        total_views: tiktok.total_views + instagram.total_views + youtube.total_views,
      };

      // 2. Comments per day per platform (changed from posts per day)
      const [ttComments, igComments, ytComments] = await Promise.all([
        (supabase as any).rpc("get_tiktok_comments_per_day", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null }),
        (supabase as any).rpc("get_instagram_comments_per_day", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null }),
        (supabase as any).rpc("get_youtube_comments_per_day", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null }),
      ]);

      const timelineMap: Record<string, { tiktok: number; instagram: number; youtube: number }> = {};
      for (const r of (ttComments.data || []) as ChartPoint[]) {
        if (!timelineMap[r.date]) timelineMap[r.date] = { tiktok: 0, instagram: 0, youtube: 0 };
        timelineMap[r.date].tiktok = Number(r.count);
      }
      for (const r of (igComments.data || []) as ChartPoint[]) {
        if (!timelineMap[r.date]) timelineMap[r.date] = { tiktok: 0, instagram: 0, youtube: 0 };
        timelineMap[r.date].instagram = Number(r.count);
      }
      for (const r of (ytComments.data || []) as ChartPoint[]) {
        if (!timelineMap[r.date]) timelineMap[r.date] = { tiktok: 0, instagram: 0, youtube: 0 };
        timelineMap[r.date].youtube = Number(r.count);
      }

      const commentsTimeline = Object.entries(timelineMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({ date, ...counts }));

      // 3. Trending posts (top by engagement across platforms)
      const [ttTop, igTop, ytTop] = await Promise.all([
        (supabase as any).rpc("get_tiktok_top_posts", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null, p_limit: 5 }),
        (supabase as any).rpc("get_instagram_top_posts", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null, p_limit: 5 }),
        (supabase as any).rpc("get_youtube_top_posts_sorted", { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null, p_limit: 5 }),
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

      return { tiktok, instagram, youtube, totals, commentsTimeline, trendingPosts };
    },
    staleTime: 5 * 60_000,
  });
}
