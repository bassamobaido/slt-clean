import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  TikTokPostRow,
  InstagramPostRow,
  YouTubeDataRow,
  XDataRow,
  PostItem,
} from "@/lib/db-types";
import { daysAgo, daysAgoDate } from "@/lib/db-types";

interface PlatformSummary {
  posts: number;
  likes: number;
  comments: number;
  views: number;
}

export interface DashboardData {
  platforms: {
    tiktok: PlatformSummary;
    instagram: PlatformSummary;
    youtube: PlatformSummary;
    x: PlatformSummary;
  };
  totals: {
    posts: number;
    likes: number;
    comments: number;
    views: number;
  };
  timeline: { date: string; tiktok: number; instagram: number; youtube: number; x: number }[];
  xSentiment: { positive: number; negative: number; neutral: number };
  trendingPosts: PostItem[];
}

export function useDashboardData(days = 30) {
  return useQuery({
    queryKey: ["dashboard", days],
    queryFn: async (): Promise<DashboardData> => {
      const since = daysAgo(days);
      const sinceDate = daysAgoDate(days);

      const [tiktokRes, instaRes, ytRes, xRes] = await Promise.all([
        (supabase as any)
          .from("tiktok_posts")
          .select(
            "post_like_count, post_comment_count, post_share_count, post_play_count, post_create_time, post_description, post_url, post_id, account_username, account_name_ar"
          )
          .gte("post_create_time", since)
          .order("post_like_count", { ascending: false })
          .limit(5000),
        (supabase as any)
          .from("instagram_posts")
          .select(
            "post_likes_count, post_comments_count, post_views_count, post_timestamp, post_caption, post_url, post_id, account_username, account_name_ar"
          )
          .gte("post_timestamp", since)
          .order("post_likes_count", { ascending: false })
          .limit(5000),
        (supabase as any)
          .from("youtube_data")
          .select(
            "video_id, video_title, video_url, video_view_count, video_like_count, video_comment_count, comment_published_at, account_name"
          )
          .gte("comment_published_at", since)
          .limit(5000),
        (supabase as any)
          .from("x_data")
          .select(
            "document_id, hit_sentence, sentiment, author_name, author_handle, date, likes, views, reposts, comments, url"
          )
          .gte("date", sinceDate)
          .order("likes", { ascending: false })
          .limit(5000),
      ]);

      const tiktokData = ((tiktokRes.data || []) as TikTokPostRow[]);
      const instaData = ((instaRes.data || []) as InstagramPostRow[]);
      const ytData = ((ytRes.data || []) as YouTubeDataRow[]);
      const xData = ((xRes.data || []) as XDataRow[]);

      // TikTok stats
      const tiktok: PlatformSummary = {
        posts: tiktokData.length,
        likes: tiktokData.reduce((s, p) => s + (p.post_like_count || 0), 0),
        comments: tiktokData.reduce((s, p) => s + (p.post_comment_count || 0), 0),
        views: tiktokData.reduce((s, p) => s + (p.post_play_count || 0), 0),
      };

      // Instagram stats
      const instagram: PlatformSummary = {
        posts: instaData.length,
        likes: instaData.reduce((s, p) => s + (p.post_likes_count || 0), 0),
        comments: instaData.reduce((s, p) => s + (p.post_comments_count || 0), 0),
        views: instaData.reduce((s, p) => s + (p.post_views_count || 0), 0),
      };

      // YouTube stats (deduplicate videos)
      const ytVideoMap = new Map<string, { views: number; likes: number; comments: number }>();
      for (const r of ytData) {
        const vid = r.video_id;
        if (!vid || ytVideoMap.has(vid)) continue;
        ytVideoMap.set(vid, {
          views: r.video_view_count || 0,
          likes: r.video_like_count || 0,
          comments: r.video_comment_count || 0,
        });
      }
      const ytVideos = Array.from(ytVideoMap.values());
      const youtube: PlatformSummary = {
        posts: ytVideos.length,
        likes: ytVideos.reduce((s, v) => s + v.likes, 0),
        comments: ytData.length,
        views: ytVideos.reduce((s, v) => s + v.views, 0),
      };

      // X stats
      const x: PlatformSummary = {
        posts: xData.length,
        likes: xData.reduce((s, p) => s + (p.likes || 0), 0),
        comments: xData.reduce((s, p) => s + (p.comments || 0), 0),
        views: xData.reduce((s, p) => s + (p.views || 0), 0),
      };

      // X sentiment
      let positive = 0, negative = 0, neutral = 0;
      for (const r of xData) {
        const s = (r.sentiment || "").toLowerCase();
        if (s === "positive" || s === "إيجابي") positive++;
        else if (s === "negative" || s === "سلبي") negative++;
        else neutral++;
      }

      // Activity timeline: posts per day
      const timelineMap: Record<string, { tiktok: number; instagram: number; youtube: number; x: number }> = {};
      const addToTimeline = (dateStr: string | null, platform: keyof typeof timelineMap extends string ? string : never) => {
        if (!dateStr) return;
        const day = dateStr.split("T")[0];
        if (!timelineMap[day]) timelineMap[day] = { tiktok: 0, instagram: 0, youtube: 0, x: 0 };
        (timelineMap[day] as any)[platform]++;
      };

      tiktokData.forEach((p) => addToTimeline(p.post_create_time, "tiktok"));
      instaData.forEach((p) => addToTimeline(p.post_timestamp, "instagram"));
      // For YouTube, count unique videos per day
      const ytVideoDateSet = new Set<string>();
      ytData.forEach((r) => {
        const key = `${r.video_id}_${(r.comment_published_at || "").split("T")[0]}`;
        if (!ytVideoDateSet.has(key) && r.video_id) {
          ytVideoDateSet.add(key);
          addToTimeline(r.comment_published_at, "youtube");
        }
      });
      xData.forEach((p) => addToTimeline(p.date ? p.date + "T00:00:00" : null, "x"));

      const timeline = Object.entries(timelineMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({ date: date.slice(5), ...counts }));

      // Trending posts (top 5 by likes across all platforms)
      const allPosts: PostItem[] = [
        ...tiktokData.slice(0, 3).map((p): PostItem => ({
          id: p.post_id || "",
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
        })),
        ...instaData.slice(0, 3).map((p): PostItem => ({
          id: p.post_id || "",
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
        })),
        ...xData.slice(0, 3).map((p): PostItem => ({
          id: p.document_id,
          text: p.hit_sentence || "",
          url: p.url || "",
          createdAt: p.date ? `${p.date}T00:00:00Z` : "",
          likes: p.likes || 0,
          commentsCount: p.comments || 0,
          shares: p.reposts || 0,
          views: p.views || 0,
          accountUsername: p.author_handle || "",
          accountNameAr: p.author_name || "",
          platform: "x",
          sentiment: p.sentiment || undefined,
        })),
      ];

      // Sort all by likes desc and take top 6
      const trendingPosts = allPosts
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 6);

      return {
        platforms: { tiktok, instagram, youtube, x },
        totals: {
          posts: tiktok.posts + instagram.posts + youtube.posts + x.posts,
          likes: tiktok.likes + instagram.likes + youtube.likes + x.likes,
          comments: tiktok.comments + instagram.comments + youtube.comments + x.comments,
          views: tiktok.views + instagram.views + youtube.views + x.views,
        },
        timeline,
        xSentiment: { positive, negative, neutral },
        trendingPosts,
      };
    },
  });
}
