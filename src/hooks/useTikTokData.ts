import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  TikTokPostRow,
  TikTokCommentRow,
  PostItem,
  CommentItem,
  PlatformStats,
} from "@/lib/db-types";
import { daysAgo } from "@/lib/db-types";

const PAGE_SIZE = 100;

export function useTikTokPosts(options: {
  account?: string;
  days?: number;
  page?: number;
}) {
  const { account, days = 30, page = 0 } = options;

  return useQuery({
    queryKey: ["tiktok-posts", account, days, page],
    queryFn: async () => {
      let query = (supabase as any)
        .from("tiktok_posts")
        .select("*", { count: "exact" })
        .order("post_create_time", { ascending: false })
        .gte("post_create_time", daysAgo(days))
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (account) query = query.eq("account_username", account);

      const { data, error, count } = await query;
      if (error) throw error;

      const posts: PostItem[] = ((data || []) as TikTokPostRow[]).map((p) => ({
        id: p.post_id,
        text: p.post_description || "",
        url: p.post_url || "",
        createdAt: p.post_create_time || "",
        likes: p.post_like_count || 0,
        commentsCount: p.post_comment_count || 0,
        shares: p.post_share_count || 0,
        views: p.post_play_count || 0,
        accountUsername: p.account_username || "",
        accountNameAr: p.account_name_ar || "",
        platform: "tiktok" as const,
      }));

      return { posts, total: count || 0 };
    },
  });
}

export function useTikTokComments(postId?: string) {
  return useQuery({
    queryKey: ["tiktok-comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tiktok_comments")
        .select("*")
        .eq("post_id", postId)
        .order("comment_create_time_iso", { ascending: false })
        .limit(100);

      if (error) throw error;

      return ((data || []) as TikTokCommentRow[]).map(
        (c): CommentItem => ({
          id: c.comment_cid,
          text: c.comment_text || "",
          createdAt: c.comment_create_time_iso || "",
          likes: c.comment_digg_count || 0,
          authorName: c.comment_unique_id || "مجهول",
          isReply: !!c.replies_to_id,
          replyCount: c.comment_reply_total || 0,
        })
      );
    },
  });
}

export function useTikTokStats(options: {
  account?: string;
  days?: number;
}) {
  const { account, days = 30 } = options;

  return useQuery({
    queryKey: ["tiktok-stats", account, days],
    queryFn: async () => {
      let query = (supabase as any)
        .from("tiktok_posts")
        .select(
          "post_like_count, post_comment_count, post_share_count, post_play_count"
        )
        .gte("post_create_time", daysAgo(days))
        .limit(10000);

      if (account) query = query.eq("account_username", account);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as TikTokPostRow[];
      return {
        totalPosts: rows.length,
        totalLikes: rows.reduce((s, p) => s + (p.post_like_count || 0), 0),
        totalComments: rows.reduce(
          (s, p) => s + (p.post_comment_count || 0),
          0
        ),
        totalShares: rows.reduce(
          (s, p) => s + (p.post_share_count || 0),
          0
        ),
        totalViews: rows.reduce((s, p) => s + (p.post_play_count || 0), 0),
      } as PlatformStats;
    },
  });
}
