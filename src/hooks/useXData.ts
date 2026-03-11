import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { XDataRow, PostItem, PlatformStats } from "@/lib/db-types";
import { daysAgoDate } from "@/lib/db-types";

const PAGE_SIZE = 100;

export function useXPosts(options: {
  days?: number;
  page?: number;
  sentiment?: string;
}) {
  const { days = 30, page = 0, sentiment } = options;

  return useQuery({
    queryKey: ["x-posts", days, page, sentiment],
    queryFn: async () => {
      let query = (supabase as any)
        .from("x_data")
        .select("*", { count: "exact" })
        .order("date", { ascending: false })
        .gte("date", daysAgoDate(days))
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (sentiment) query = query.eq("sentiment", sentiment);

      const { data, error, count } = await query;
      if (error) throw error;

      const posts: PostItem[] = ((data || []) as XDataRow[]).map((p) => ({
        id: p.document_id,
        text: p.hit_sentence || "",
        url: p.url || "",
        createdAt: p.date
          ? `${p.date}${p.time ? "T" + p.time : "T00:00:00"}Z`
          : "",
        likes: p.likes || 0,
        commentsCount: p.comments || 0,
        shares: p.reposts || 0,
        views: p.views || 0,
        accountUsername: p.author_handle || "",
        accountNameAr: p.author_name || "",
        platform: "x" as const,
        sentiment: p.sentiment || undefined,
        authorName: p.author_name || undefined,
        authorHandle: p.author_handle || undefined,
        extra: {
          engagement: p.engagement,
          reach: p.reach,
          hashtags: p.hashtags,
          language: p.language,
          sourceName: p.source_name,
          replies: p.replies,
        },
      }));

      return { posts, total: count || 0 };
    },
  });
}

export function useXStats(options: { days?: number }) {
  const { days = 30 } = options;

  return useQuery({
    queryKey: ["x-stats", days],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("x_data")
        .select("sentiment, engagement, likes, views, reposts, comments")
        .gte("date", daysAgoDate(days))
        .limit(10000);

      if (error) throw error;

      const rows = (data || []) as XDataRow[];
      return {
        totalPosts: rows.length,
        totalComments: rows.reduce((s, p) => s + (p.comments || 0), 0),
        totalLikes: rows.reduce((s, p) => s + (p.likes || 0), 0),
        totalViews: rows.reduce((s, p) => s + (p.views || 0), 0),
        totalShares: rows.reduce((s, p) => s + (p.reposts || 0), 0),
      } as PlatformStats;
    },
  });
}

export function useXSentiment(options: { days?: number }) {
  const { days = 30 } = options;

  return useQuery({
    queryKey: ["x-sentiment", days],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("x_data")
        .select("sentiment")
        .gte("date", daysAgoDate(days))
        .limit(10000);

      if (error) throw error;

      const rows = (data || []) as XDataRow[];
      let positive = 0;
      let negative = 0;
      let neutral = 0;

      for (const r of rows) {
        const s = (r.sentiment || "").toLowerCase();
        if (s === "positive" || s === "إيجابي") positive++;
        else if (s === "negative" || s === "سلبي") negative++;
        else neutral++;
      }

      return { positive, negative, neutral, total: rows.length };
    },
  });
}
