import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedComment, DrawerFilter } from "@/lib/db-types";

interface Opts {
  filter: DrawerFilter | null;
  dateFrom?: string;
  dateTo?: string;
}

export function useOverviewComments(opts: Opts) {
  const { filter, dateFrom, dateTo } = opts;

  return useQuery<{ items: EnrichedComment[]; total: number }>({
    queryKey: ["overview-comments", filter, dateFrom, dateTo],
    enabled: !!filter,
    queryFn: async () => {
      const items: EnrichedComment[] = [];

      // Build filters based on DrawerFilter type
      const filterDate = filter?.type === "date" ? (filter as any).date : undefined;
      const searchWord = filter?.type === "word" ? (filter as any).word : undefined;

      // Fetch from all 3 platforms in parallel (limited to 50 each)
      const promises: Promise<void>[] = [];

      // TikTok
      promises.push((async () => {
        let q = (supabase as any)
          .from("tiktok_comments")
          .select("comment_cid, comment_text, comment_create_time_iso, comment_digg_count, comment_unique_id, comment_avatar_thumbnail, post_id", { count: "exact" })
          .order("comment_create_time_iso", { ascending: false })
          .limit(50);
        if (dateFrom) q = q.gte("comment_create_time_iso", dateFrom);
        if (dateTo) q = q.lte("comment_create_time_iso", dateTo);
        if (filterDate) {
          q = q.gte("comment_create_time_iso", filterDate + "T00:00:00");
          q = q.lt("comment_create_time_iso", filterDate + "T23:59:59.999");
        }
        if (searchWord) q = q.ilike("comment_text", `%${searchWord}%`);
        const { data } = await q;
        for (const c of data || []) {
          items.push({
            id: c.comment_cid,
            text: c.comment_text || "",
            createdAt: c.comment_create_time_iso || "",
            likes: c.comment_digg_count || 0,
            authorName: c.comment_unique_id || "مجهول",
            authorAvatar: c.comment_avatar_thumbnail || undefined,
            isReply: false,
            replyCount: 0,
            parentPostId: c.post_id || undefined,
            platform: "tiktok",
          });
        }
      })());

      // Instagram
      promises.push((async () => {
        let q = (supabase as any)
          .from("instagram_comments")
          .select("comment_id, comment_text, comment_timestamp, comment_likes, comment_owner_username, comment_owner_profile_pic, post_id", { count: "exact" })
          .order("comment_timestamp", { ascending: false })
          .limit(50);
        if (dateFrom) q = q.gte("comment_timestamp", dateFrom);
        if (dateTo) q = q.lte("comment_timestamp", dateTo);
        if (filterDate) {
          q = q.gte("comment_timestamp", filterDate + "T00:00:00");
          q = q.lt("comment_timestamp", filterDate + "T23:59:59.999");
        }
        if (searchWord) q = q.ilike("comment_text", `%${searchWord}%`);
        const { data } = await q;
        for (const c of data || []) {
          items.push({
            id: c.comment_id,
            text: c.comment_text || "",
            createdAt: c.comment_timestamp || "",
            likes: c.comment_likes || 0,
            authorName: c.comment_owner_username || "مجهول",
            authorAvatar: c.comment_owner_profile_pic || undefined,
            isReply: false,
            replyCount: 0,
            parentPostId: c.post_id || undefined,
            platform: "instagram",
          });
        }
      })());

      // YouTube
      promises.push((async () => {
        let q = (supabase as any)
          .from("youtube_data")
          .select("comment_id, comment_text, comment_published_at, comment_like_count, author_display_name, author_thumbnail_url, video_id, video_title, video_thumbnail_url")
          .order("comment_published_at", { ascending: false })
          .limit(50);
        if (dateFrom) q = q.gte("comment_published_at", dateFrom);
        if (dateTo) q = q.lte("comment_published_at", dateTo);
        if (filterDate) {
          q = q.gte("comment_published_at", filterDate + "T00:00:00");
          q = q.lt("comment_published_at", filterDate + "T23:59:59.999");
        }
        if (searchWord) q = q.ilike("comment_text", `%${searchWord}%`);
        const { data } = await q;
        for (const c of data || []) {
          items.push({
            id: c.comment_id,
            text: c.comment_text || "",
            createdAt: c.comment_published_at || "",
            likes: c.comment_like_count || 0,
            authorName: c.author_display_name || "مجهول",
            authorAvatar: c.author_thumbnail_url || undefined,
            isReply: false,
            replyCount: 0,
            parentPostId: c.video_id || undefined,
            parentPostText: c.video_title || undefined,
            parentPostThumbnail: c.video_thumbnail_url || undefined,
            platform: "youtube",
          });
        }
      })());

      await Promise.all(promises);

      // Sort by date descending
      items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

      return { items, total: items.length };
    },
    staleTime: 60_000,
  });
}
