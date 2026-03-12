import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS, type Product } from "@/lib/products";

export interface ProductMention {
  id: string;
  name: string;
  category: Product["category"];
  totalComments: number;
  totalLikes: number;
  postCount: number;
  firstTextTerm: string;
}

interface UseProductMentionsOpts {
  platform: "tiktok" | "instagram" | "youtube" | "all";
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Phase 1: Fetch posts from posts tables and match against product terms.
 * Returns a map of productId → Set<postId> per platform.
 */
async function findProductPostIds(
  platform: "tiktok" | "instagram" | "youtube" | "all",
  account?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<{
  tiktok: Map<string, Set<string>>;
  instagram: Map<string, Set<string>>;
  youtube: Map<string, Set<string>>;
}> {
  const result = {
    tiktok: new Map<string, Set<string>>(),
    instagram: new Map<string, Set<string>>(),
    youtube: new Map<string, Set<string>>(),
  };

  const fetchPosts = async (
    table: string,
    selectCols: string,
    textCol: string,
    idCol: string,
    dateCol: string,
    accountCol: string,
    platformKey: "tiktok" | "instagram" | "youtube",
  ) => {
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;
    const seenIds = new Set<string>();

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let q = (supabase as any)
        .from(table)
        .select(selectCols)
        .range(from, to);

      if (account) q = q.eq(accountCol, account);
      if (dateFrom) q = q.gte(dateCol, dateFrom);
      if (dateTo) q = q.lte(dateCol, dateTo);

      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];

      for (const row of rows) {
        const postId = row[idCol];
        if (!postId || seenIds.has(postId)) continue;
        seenIds.add(postId);

        const text = row[textCol] || "";
        if (!text) continue;

        for (const product of PRODUCTS) {
          const matched =
            product.hashtags.some(h => text.includes(h) || text.includes(`#${h}`)) ||
            product.textTerms.some(t => text.includes(t));

          if (matched) {
            if (!result[platformKey].has(product.id)) {
              result[platformKey].set(product.id, new Set());
            }
            result[platformKey].get(product.id)!.add(postId);
          }
        }
      }

      hasMore = rows.length === pageSize;
      page++;
      // Safety: max 5 pages per platform
      if (page >= 5) break;
    }
  };

  const tasks: Promise<void>[] = [];

  if (platform === "tiktok" || platform === "all") {
    tasks.push(fetchPosts(
      "tiktok_posts",
      "post_id, post_description",
      "post_description",
      "post_id",
      "post_create_time",
      "account_username",
      "tiktok",
    ));
  }

  if (platform === "instagram" || platform === "all") {
    tasks.push(fetchPosts(
      "instagram_posts",
      "post_id, post_caption",
      "post_caption",
      "post_id",
      "post_timestamp",
      "account_username",
      "instagram",
    ));
  }

  if (platform === "youtube" || platform === "all") {
    // YouTube: fetch from youtube_data but limit scan, dedupe by video_id
    tasks.push(fetchPosts(
      "youtube_data",
      "video_id, video_title",
      "video_title",
      "video_id",
      "comment_published_at",
      "account_name",
      "youtube",
    ));
  }

  await Promise.all(tasks);
  return result;
}

/**
 * Phase 2: Count actual comments from comments tables for matching post_ids.
 * Uses HEAD-only COUNT queries — fast and accurate.
 */
async function countCommentsForProducts(
  postIdsByPlatform: {
    tiktok: Map<string, Set<string>>;
    instagram: Map<string, Set<string>>;
    youtube: Map<string, Set<string>>;
  },
  dateFrom?: string,
  dateTo?: string,
): Promise<ProductMention[]> {
  // Collect all unique product IDs that have matches
  const allProductIds = new Set<string>();
  for (const map of [postIdsByPlatform.tiktok, postIdsByPlatform.instagram, postIdsByPlatform.youtube]) {
    for (const pid of map.keys()) allProductIds.add(pid);
  }

  // For each product, count comments across platforms
  const results: ProductMention[] = [];
  const countTasks: Promise<void>[] = [];

  for (const productId of allProductIds) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) continue;

    const mention: ProductMention = {
      id: product.id,
      name: product.name,
      category: product.category,
      totalComments: 0,
      totalLikes: 0,
      postCount: 0,
      firstTextTerm: product.textTerms[0] || product.name,
    };

    // Count post_ids across all platforms
    const ttIds = postIdsByPlatform.tiktok.get(productId);
    const igIds = postIdsByPlatform.instagram.get(productId);
    const ytIds = postIdsByPlatform.youtube.get(productId);

    mention.postCount = (ttIds?.size || 0) + (igIds?.size || 0) + (ytIds?.size || 0);

    // Count actual comments for these post_ids (with date filter on comment timestamp)
    const task = (async () => {
      const counts = await Promise.all([
        // TikTok comments
        ttIds && ttIds.size > 0 ? (async () => {
          let q = (supabase as any)
            .from("tiktok_comments")
            .select("comment_cid", { count: "exact", head: true })
            .in("post_id", [...ttIds]);
          if (dateFrom) q = q.gte("comment_create_time_iso", dateFrom);
          if (dateTo) q = q.lte("comment_create_time_iso", dateTo);
          const { count } = await q;
          return count || 0;
        })() : 0,
        // Instagram comments
        igIds && igIds.size > 0 ? (async () => {
          let q = (supabase as any)
            .from("instagram_comments")
            .select("comment_id", { count: "exact", head: true })
            .in("post_id", [...igIds]);
          if (dateFrom) q = q.gte("comment_timestamp", dateFrom);
          if (dateTo) q = q.lte("comment_timestamp", dateTo);
          const { count } = await q;
          return count || 0;
        })() : 0,
        // YouTube comments
        ytIds && ytIds.size > 0 ? (async () => {
          let q = (supabase as any)
            .from("youtube_data")
            .select("comment_id", { count: "exact", head: true })
            .in("video_id", [...ytIds]);
          if (dateFrom) q = q.gte("comment_published_at", dateFrom);
          if (dateTo) q = q.lte("comment_published_at", dateTo);
          const { count } = await q;
          return count || 0;
        })() : 0,
      ]);

      mention.totalComments = counts[0] + counts[1] + counts[2];
    })();

    countTasks.push(task);
    results.push(mention);
  }

  await Promise.all(countTasks);

  return results
    .filter(m => m.totalComments > 0)
    .sort((a, b) => b.totalComments - a.totalComments);
}

export function useProductMentions(opts: UseProductMentionsOpts) {
  const { platform, account, dateFrom, dateTo } = opts;

  return useQuery<ProductMention[]>({
    queryKey: ["product-mentions", platform, account, dateFrom, dateTo],
    queryFn: async () => {
      // Phase 1: Find which post_ids match which products
      const postIdsByPlatform = await findProductPostIds(platform, account, dateFrom, dateTo);

      // Phase 2: Count actual comments for those post_ids (date-filtered)
      return countCommentsForProducts(postIdsByPlatform, dateFrom, dateTo);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
