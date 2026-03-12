import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlatformStats, ChartPoint, TopPost, Platform } from "@/lib/db-types";

interface OverviewData {
  tiktok: PlatformStats;
  instagram: PlatformStats;
  youtube: PlatformStats;
  totals: { total_posts: number; total_likes: number; total_comments: number; total_views: number };
  trendingPosts: TopPost[];
}

export type TimeGranularity = "day" | "week" | "month";

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
  if (days <= 60) return "day";
  if (days <= 180) return "week";
  return "month";
}

/** Group daily data into weeks or months client-side */
function groupTimeline(
  daily: TimelinePoint[],
  granularity: TimeGranularity,
): TimelinePoint[] {
  if (granularity === "day") return daily;

  const grouped: Record<string, { tiktok: number; instagram: number; youtube: number }> = {};

  for (const pt of daily) {
    let key: string;
    if (granularity === "month") {
      key = pt.date.slice(0, 7); // YYYY-MM
    } else {
      // week: find Monday of the week
      const d = new Date(pt.date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      key = monday.toISOString().slice(0, 10);
    }
    if (!grouped[key]) grouped[key] = { tiktok: 0, instagram: 0, youtube: 0 };
    grouped[key].tiktok += pt.tiktok;
    grouped[key].instagram += pt.instagram;
    grouped[key].youtube += pt.youtube;
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}

export function useOverviewData(dateFrom?: string, dateTo?: string) {
  return useQuery<OverviewData>({
    queryKey: ["overview", dateFrom, dateTo],
    queryFn: async () => {
      const dp = { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null };

      // Per-platform stats + YouTube comment count (simple, reliable)
      const [ttRes, igRes, ytCountRes] = await Promise.all([
        (supabase as any).rpc("get_tiktok_stats", dp),
        (supabase as any).rpc("get_instagram_stats", dp),
        // YouTube: just count comments — reliable, no inflation
        (() => {
          let q = (supabase as any)
            .from("youtube_data")
            .select("comment_id", { count: "exact", head: true });
          if (dateFrom) q = q.gte("comment_published_at", dateFrom);
          if (dateTo) q = q.lte("comment_published_at", dateTo);
          return q;
        })(),
      ]);

      const tiktok: PlatformStats = ttRes.data || empty;
      const instagram: PlatformStats = igRes.data || empty;

      // YouTube: only show comment count — video/view counts duplicate per row
      const youtube: PlatformStats = {
        total_posts: 0,
        total_comments: ytCountRes.count ?? 0,
        total_likes: 0,
        total_shares: 0,
        total_views: 0,
      };

      const totals = {
        total_posts: tiktok.total_posts + instagram.total_posts,
        total_likes: tiktok.total_likes + instagram.total_likes,
        total_comments: tiktok.total_comments + instagram.total_comments + youtube.total_comments,
        total_views: tiktok.total_views + instagram.total_views,
      };

      // Trending posts
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
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

/**
 * Separate hook for comments timeline.
 * Always fetches DAILY data from existing RPCs, then groups client-side.
 */
export function useCommentsTimeline(dateFrom?: string, dateTo?: string, granularity?: TimeGranularity) {
  const g = granularity || autoGranularity(dateFrom, dateTo);

  return useQuery<TimelinePoint[]>({
    queryKey: ["overview-timeline", dateFrom, dateTo, g],
    queryFn: async () => {
      const dp = { p_account: null, p_date_from: dateFrom || null, p_date_to: dateTo || null };

      // Always fetch daily — these RPCs already exist and work
      const [ttRes, igRes, ytRes] = await Promise.all([
        (supabase as any).rpc("get_tiktok_comments_per_day", dp),
        (supabase as any).rpc("get_instagram_comments_per_day", dp),
        (supabase as any).rpc("get_youtube_comments_per_day", dp),
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

      const daily = Object.entries(timelineMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({ date, ...counts }));

      // Group into weeks/months client-side if needed
      return groupTimeline(daily, g);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
