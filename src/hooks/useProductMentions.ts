import { useQuery } from "@tanstack/react-query";
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

interface PostRow {
  text: string;
  commentCount: number;
  likeCount: number;
}

async function fetchAllPages(
  table: string,
  selectCols: string,
  filters: { account?: string; dateFrom?: string; dateTo?: string },
  dateCol: string,
  accountCol: string,
): Promise<any[]> {
  const pageSize = 1000;
  let allRows: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let q = (supabase as any)
      .from(table)
      .select(selectCols)
      .range(from, to);

    if (filters.account) q = q.eq(accountCol, filters.account);
    if (filters.dateFrom) q = q.gte(dateCol, filters.dateFrom);
    if (filters.dateTo) q = q.lte(dateCol, filters.dateTo);

    const { data, error } = await q;
    if (error) throw error;
    const rows = data || [];
    allRows = allRows.concat(rows);
    hasMore = rows.length === pageSize;
    page++;
  }

  return allRows;
}

function matchProducts(posts: PostRow[]): ProductMention[] {
  const result: Record<string, ProductMention> = {};

  for (const post of posts) {
    const text = post.text;
    if (!text) continue;

    for (const product of PRODUCTS) {
      const matched =
        product.hashtags.some(h => text.includes(h) || text.includes(`#${h}`)) ||
        product.textTerms.some(t => text.includes(t));

      if (matched) {
        if (!result[product.id]) {
          result[product.id] = {
            id: product.id,
            name: product.name,
            category: product.category,
            totalComments: 0,
            totalLikes: 0,
            postCount: 0,
            firstTextTerm: product.textTerms[0] || product.name,
          };
        }
        result[product.id].totalComments += post.commentCount;
        result[product.id].totalLikes += post.likeCount;
        result[product.id].postCount += 1;
      }
    }
  }

  return Object.values(result).sort((a, b) => b.totalComments - a.totalComments);
}

interface UseProductMentionsOpts {
  platform: "tiktok" | "instagram" | "youtube" | "all";
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useProductMentions(opts: UseProductMentionsOpts) {
  const { platform, account, dateFrom, dateTo } = opts;

  return useQuery<ProductMention[]>({
    queryKey: ["product-mentions", platform, account, dateFrom, dateTo],
    queryFn: async () => {
      const filters = { account, dateFrom, dateTo };
      const allPosts: PostRow[] = [];

      // TikTok
      if (platform === "tiktok" || platform === "all") {
        const rows = await fetchAllPages(
          "tiktok_posts",
          "post_description, post_comment_count, post_like_count",
          filters,
          "post_create_time",
          "account_username",
        );
        for (const r of rows) {
          allPosts.push({
            text: r.post_description || "",
            commentCount: r.post_comment_count || 0,
            likeCount: r.post_like_count || 0,
          });
        }
      }

      // Instagram
      if (platform === "instagram" || platform === "all") {
        const rows = await fetchAllPages(
          "instagram_posts",
          "post_caption, post_comments_count, post_likes_count",
          filters,
          "post_timestamp",
          "account_username",
        );
        for (const r of rows) {
          allPosts.push({
            text: r.post_caption || "",
            commentCount: r.post_comments_count || 0,
            likeCount: r.post_likes_count || 0,
          });
        }
      }

      // YouTube — dedupe by video_id
      if (platform === "youtube" || platform === "all") {
        const rows = await fetchAllPages(
          "youtube_data",
          "video_id, video_title, video_comment_count, video_like_count",
          filters,
          "comment_published_at",
          "account_name",
        );
        // Dedupe by video_id
        const seen = new Set<string>();
        for (const r of rows) {
          if (!r.video_id || seen.has(r.video_id)) continue;
          seen.add(r.video_id);
          allPosts.push({
            text: r.video_title || "",
            commentCount: r.video_comment_count || 0,
            likeCount: r.video_like_count || 0,
          });
        }
      }

      return matchProducts(allPosts);
    },
    staleTime: 5 * 60_000,
  });
}
