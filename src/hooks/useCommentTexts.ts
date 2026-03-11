import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Platform } from "@/lib/db-types";

const TABLE_MAP: Record<Exclude<Platform, "x">, { table: string; textCol: string; dateCol: string; accountCol: string }> = {
  tiktok: { table: "tiktok_comments", textCol: "comment_text", dateCol: "comment_create_time_iso", accountCol: "account_username" },
  instagram: { table: "instagram_comments", textCol: "comment_text", dateCol: "comment_timestamp", accountCol: "account_username" },
  youtube: { table: "youtube_data", textCol: "comment_text", dateCol: "comment_published_at", accountCol: "account_name" },
};

interface Opts {
  platform: Exclude<Platform, "x">;
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useCommentTexts(opts: Opts) {
  const { platform, account, dateFrom, dateTo } = opts;
  const cfg = TABLE_MAP[platform];

  return useQuery<string[]>({
    queryKey: ["comment-texts", platform, account, dateFrom, dateTo],
    queryFn: async () => {
      let q = (supabase as any)
        .from(cfg.table)
        .select(cfg.textCol)
        .order(cfg.dateCol, { ascending: false })
        .limit(5000);

      if (account) q = q.eq(cfg.accountCol, account);
      if (dateFrom) q = q.gte(cfg.dateCol, dateFrom);
      if (dateTo) q = q.lte(cfg.dateCol, dateTo);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((r: any) => r[cfg.textCol]).filter(Boolean) as string[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Fetch from ALL platforms combined */
export function useAllCommentTexts(dateFrom?: string, dateTo?: string) {
  return useQuery<string[]>({
    queryKey: ["comment-texts-all", dateFrom, dateTo],
    queryFn: async () => {
      const results: string[] = [];

      for (const platform of ["tiktok", "instagram", "youtube"] as const) {
        const cfg = TABLE_MAP[platform];
        let q = (supabase as any)
          .from(cfg.table)
          .select(cfg.textCol)
          .order(cfg.dateCol, { ascending: false })
          .limit(2000);

        if (dateFrom) q = q.gte(cfg.dateCol, dateFrom);
        if (dateTo) q = q.lte(cfg.dateCol, dateTo);

        const { data } = await q;
        if (data) {
          results.push(...data.map((r: any) => r[cfg.textCol]).filter(Boolean));
        }
      }

      return results;
    },
    staleTime: 5 * 60_000,
  });
}
