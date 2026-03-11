import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  InstagramPostRow,
  InstagramCommentRow,
  PostItem,
  CommentItem,
  PlatformStats,
} from "@/lib/db-types";
import { daysAgo } from "@/lib/db-types";

const PAGE_SIZE = 100;

export function useInstagramPosts(options: {
  account?: string;
  days?: number;
  page?: number;
}) {
  const { account, days = 30, page = 0 } = options;

  return useQuery({
    queryKey: ["instagram-posts", account, days, page],
    queryFn: async () => {
      let query = (supabase as any)
        .from("instagram_posts")
        .select("*", { count: "exact" })
        .order("post_timestamp", { ascending: false })
        .gte("post_timestamp", daysAgo(days))
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (account) query = query.eq("account_username", account);

      const { data, error, count } = await query;
      if (error) throw error;

      const posts: PostItem[] = ((data || []) as InstagramPostRow[]).map(
        (p) => ({
          id: p.post_id,
          text: p.post_caption || "",
          url: p.post_url || "",
          createdAt: p.post_timestamp || "",
          likes: p.post_likes_count || 0,
          commentsCount: p.post_comments_count || 0,
          shares: 0,
          views: p.post_views_count || 0,
          accountUsername: p.account_username || "",
          accountNameAr: p.account_name_ar || "",
          platform: "instagram" as const,
          extra: {
            postType: p.post_type,
            shortcode: p.post_shortcode,
            isCollaboration: p.is_collaboration,
            collaborationAccounts: p.collaboration_accounts,
          },
        })
      );

      return { posts, total: count || 0 };
    },
  });
}

export function useInstagramComments(postId?: string) {
  return useQuery({
    queryKey: ["instagram-comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("instagram_comments")
        .select("*")
        .eq("post_id", postId)
        .order("comment_timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;

      return ((data || []) as InstagramCommentRow[]).map(
        (c): CommentItem => ({
          id: c.comment_id,
          text: c.comment_text || "",
          createdAt: c.comment_timestamp || "",
          likes: c.comment_likes || 0,
          authorName: c.comment_owner_username || "مجهول",
          isVerified: c.comment_owner_is_verified || false,
          isReply: false,
          replyCount: 0,
        })
      );
    },
  });
}

export function useInstagramStats(options: {
  account?: string;
  days?: number;
}) {
  const { account, days = 30 } = options;

  return useQuery({
    queryKey: ["instagram-stats", account, days],
    queryFn: async () => {
      let query = (supabase as any)
        .from("instagram_posts")
        .select(
          "post_likes_count, post_comments_count, post_views_count"
        )
        .gte("post_timestamp", daysAgo(days))
        .limit(10000);

      if (account) query = query.eq("account_username", account);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as InstagramPostRow[];
      return {
        totalPosts: rows.length,
        totalLikes: rows.reduce(
          (s, p) => s + (p.post_likes_count || 0),
          0
        ),
        totalComments: rows.reduce(
          (s, p) => s + (p.post_comments_count || 0),
          0
        ),
        totalShares: 0,
        totalViews: rows.reduce(
          (s, p) => s + (p.post_views_count || 0),
          0
        ),
      } as PlatformStats;
    },
  });
}
