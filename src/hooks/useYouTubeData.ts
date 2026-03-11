import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  YouTubeDataRow,
  PostItem,
  CommentItem,
  PlatformStats,
} from "@/lib/db-types";
import { daysAgo } from "@/lib/db-types";

const PAGE_SIZE = 100;

/**
 * YouTube data is stored as one row per comment, with video info duplicated.
 * This hook deduplicates by video_id to get unique videos (posts).
 */
export function useYouTubePosts(options: {
  account?: string;
  days?: number;
  page?: number;
}) {
  const { account, days = 30, page = 0 } = options;

  return useQuery({
    queryKey: ["youtube-posts", account, days, page],
    queryFn: async () => {
      let query = (supabase as any)
        .from("youtube_data")
        .select(
          "video_id, video_title, video_url, video_view_count, video_like_count, video_comment_count, comment_published_at, account_name"
        )
        .gte("comment_published_at", daysAgo(days))
        .order("comment_published_at", { ascending: false })
        .limit(5000);

      if (account) query = query.eq("account_name", account);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as YouTubeDataRow[];

      // Deduplicate by video_id
      const videoMap = new Map<
        string,
        PostItem & { latestComment: string }
      >();

      for (const row of rows) {
        const vid = row.video_id;
        if (!vid) continue;
        if (!videoMap.has(vid)) {
          videoMap.set(vid, {
            id: vid,
            text: row.video_title || "",
            url: row.video_url || "",
            createdAt: row.comment_published_at || "",
            likes: row.video_like_count || 0,
            commentsCount: row.video_comment_count || 0,
            shares: 0,
            views: row.video_view_count || 0,
            accountUsername: row.account_name || "",
            accountNameAr: row.account_name || "",
            platform: "youtube" as const,
            latestComment: row.comment_published_at || "",
          });
        }
      }

      const allVideos = Array.from(videoMap.values()).sort(
        (a, b) =>
          new Date(b.latestComment).getTime() -
          new Date(a.latestComment).getTime()
      );

      const total = allVideos.length;
      const posts = allVideos.slice(
        page * PAGE_SIZE,
        (page + 1) * PAGE_SIZE
      );

      return { posts, total };
    },
  });
}

export function useYouTubeComments(videoId?: string) {
  return useQuery({
    queryKey: ["youtube-comments", videoId],
    enabled: !!videoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("youtube_data")
        .select(
          "comment_id, comment_text, comment_published_at, comment_like_count, author_display_name, comment_type, parent_comment_id"
        )
        .eq("video_id", videoId)
        .order("comment_published_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return ((data || []) as YouTubeDataRow[]).map(
        (c): CommentItem => ({
          id: c.comment_id,
          text: c.comment_text || "",
          createdAt: c.comment_published_at || "",
          likes: c.comment_like_count || 0,
          authorName: c.author_display_name || "مجهول",
          isReply: c.comment_type === "reply" || !!c.parent_comment_id,
          replyCount: 0,
        })
      );
    },
  });
}

export function useYouTubeStats(options: {
  account?: string;
  days?: number;
}) {
  const { account, days = 30 } = options;

  return useQuery({
    queryKey: ["youtube-stats", account, days],
    queryFn: async () => {
      let query = (supabase as any)
        .from("youtube_data")
        .select(
          "video_id, video_view_count, video_like_count, video_comment_count"
        )
        .gte("comment_published_at", daysAgo(days))
        .limit(10000);

      if (account) query = query.eq("account_name", account);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as YouTubeDataRow[];

      // Deduplicate videos for accurate stats
      const videoMap = new Map<
        string,
        { views: number; likes: number; comments: number }
      >();
      for (const r of rows) {
        const vid = r.video_id;
        if (!vid || videoMap.has(vid)) continue;
        videoMap.set(vid, {
          views: r.video_view_count || 0,
          likes: r.video_like_count || 0,
          comments: r.video_comment_count || 0,
        });
      }

      const videos = Array.from(videoMap.values());
      return {
        totalPosts: videos.length,
        totalComments: rows.length,
        totalLikes: videos.reduce((s, v) => s + v.likes, 0),
        totalViews: videos.reduce((s, v) => s + v.views, 0),
        totalShares: 0,
      } as PlatformStats;
    },
  });
}
