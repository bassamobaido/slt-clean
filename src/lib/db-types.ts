/**
 * Database row types for social listening tables.
 * These correspond to the Supabase tables at vkxsivktlrjofjhllbya.supabase.co
 */

/* ═══════════════════════════════════════════════════
   TikTok
   ═══════════════════════════════════════════════════ */

export interface TikTokPostRow {
  post_id: string;
  post_url: string | null;
  post_description: string | null;
  post_create_time: string | null;
  post_comment_count: number | null;
  post_like_count: number | null;
  post_share_count: number | null;
  post_play_count: number | null;
  account_username: string | null;
  account_name_ar: string | null;
}

export interface TikTokCommentRow {
  comment_cid: string;
  post_id: string | null;
  comment_text: string | null;
  comment_create_time_iso: string | null;
  comment_digg_count: number | null;
  comment_reply_total: number | null;
  replies_to_id: string | null;
  comment_unique_id: string | null;
  account_username: string | null;
  account_name_ar: string | null;
}

/* ═══════════════════════════════════════════════════
   Instagram
   ═══════════════════════════════════════════════════ */

export interface InstagramPostRow {
  post_id: string;
  post_url: string | null;
  post_shortcode: string | null;
  post_caption: string | null;
  post_timestamp: string | null;
  post_comments_count: number | null;
  post_likes_count: number | null;
  post_views_count: number | null;
  post_type: string | null;
  account_username: string | null;
  account_name_ar: string | null;
  is_collaboration: boolean | null;
  collaboration_accounts: string[] | null;
}

export interface InstagramCommentRow {
  comment_id: string;
  post_id: string | null;
  comment_text: string | null;
  comment_timestamp: string | null;
  comment_likes: number | null;
  comment_owner_username: string | null;
  comment_owner_is_verified: boolean | null;
  account_username: string | null;
  account_name_ar: string | null;
}

/* ═══════════════════════════════════════════════════
   YouTube
   ═══════════════════════════════════════════════════ */

export interface YouTubeDataRow {
  video_id: string | null;
  video_title: string | null;
  video_url: string | null;
  video_view_count: number | null;
  video_like_count: number | null;
  video_comment_count: number | null;
  comment_id: string;
  comment_text: string | null;
  comment_published_at: string | null;
  comment_like_count: number | null;
  author_display_name: string | null;
  account_name: string | null;
  comment_type: string | null;
  parent_comment_id: string | null;
}

/* ═══════════════════════════════════════════════════
   X / Twitter (from Meltwater)
   ═══════════════════════════════════════════════════ */

export interface XDataRow {
  document_id: string;
  hit_sentence: string | null;
  sentiment: string | null;
  author_name: string | null;
  author_handle: string | null;
  date: string | null;
  time: string | null;
  engagement: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  comments: number | null;
  views: number | null;
  reach: number | null;
  source_name: string | null;
  url: string | null;
  hashtags: string | null;
  language: string | null;
}

/* ═══════════════════════════════════════════════════
   Normalized types (cross-platform)
   ═══════════════════════════════════════════════════ */

export type Platform = "tiktok" | "instagram" | "youtube" | "x";

export interface PostItem {
  id: string;
  text: string;
  url: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  shares: number;
  views: number;
  accountUsername: string;
  accountNameAr: string;
  platform: Platform;
  sentiment?: string;
  authorName?: string;
  authorHandle?: string;
  extra?: Record<string, unknown>;
}

export interface CommentItem {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  authorName: string;
  isVerified?: boolean;
  isReply: boolean;
  replyCount?: number;
}

export interface PlatformStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
  totalShares: number;
}

export interface AccountOption {
  username: string;
  nameAr: string;
}

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */

export function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function daysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/* ═══════════════════════════════════════════════════
   Account lists
   ═══════════════════════════════════════════════════ */

export const TIKTOK_ACCOUNTS: AccountOption[] = [
  { username: "thmanyah", nameAr: "ثمانية" },
  { username: "thmanyahsports", nameAr: "رياضة ثمانية" },
  { username: "thmanyahexit", nameAr: "مخرج ثمانية" },
  { username: "thmanyahliving", nameAr: "معيشة ثمانية" },
  { username: "radiothmanyah", nameAr: "راديو ثمانية" },
];

export const INSTAGRAM_ACCOUNTS: AccountOption[] = [
  { username: "thmanyah", nameAr: "ثمانية" },
  { username: "thmanyahsports", nameAr: "رياضة ثمانية" },
  { username: "thmanyahexit", nameAr: "مخرج ثمانية" },
  { username: "thmanyahliving", nameAr: "معيشة ثمانية" },
  { username: "radiothmanyah", nameAr: "راديو ثمانية" },
];

export const YOUTUBE_ACCOUNTS: AccountOption[] = [
  { username: "Thmanyah", nameAr: "ثمانية" },
  { username: "ThmanyahSports", nameAr: "رياضة ثمانية" },
  { username: "ThmanyahExit", nameAr: "مخرج ثمانية" },
  { username: "ThmanyahLiving", nameAr: "معيشة ثمانية" },
  { username: "RadioThmanyah", nameAr: "راديو ثمانية" },
];
