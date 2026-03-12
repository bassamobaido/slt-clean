import { useState, useMemo, useCallback } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import DateRangeFilter from "@/components/explore/DateRangeFilter";
import CommentsPanel, { type CommentSort } from "@/components/explore/CommentsPanel";
import AnalyticsPanel from "@/components/explore/AnalyticsPanel";
import CommentsDrawer, { type DrawerSort } from "@/components/explore/CommentsDrawer";
import PageExplainer from "@/components/PageExplainer";
import type {
  Platform, AccountOption, PlatformStats,
  ChartPoint, TopPost, AccountCount,
  EnrichedComment, DrawerFilter,
} from "@/lib/db-types";
import type { ProductMention } from "@/hooks/useProductMentions";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/db-types";
import { getAccountAvatar } from "@/lib/accountAvatars";

/* ── Types for hook results ── */
interface InfiniteCommentResult {
  pages: { items: EnrichedComment[]; total: number; page: number }[];
}

interface PlatformPageProps {
  platform: Platform;
  icon: React.ElementType;
  accounts: AccountOption[];
  /* Data hooks - called by the parent platform page component */
  stats?: PlatformStats;
  statsLoading: boolean;
  commentsResult?: InfiniteCommentResult;
  commentsLoading: boolean;
  commentsFetchingMore: boolean;
  commentsHasMore: boolean;
  fetchMoreComments: () => void;
  commentsPerDay?: ChartPoint[];
  topPosts?: TopPost[];
  postsPerDay?: ChartPoint[];
  commentsPerAccount?: AccountCount[];
  chartsLoading: boolean;
  /* Filter state (managed by parent) */
  account: string;
  onAccountChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  sort: CommentSort;
  onSortChange: (v: CommentSort) => void;
  /* Drawer hooks */
  drawerComments?: InfiniteCommentResult;
  drawerLoading: boolean;
  drawerHasMore?: boolean;
  drawerFetchingMore?: boolean;
  onDrawerLoadMore?: () => void;
  drawerFilter: DrawerFilter | null;
  onDrawerFilterChange: (f: DrawerFilter | null) => void;
  drawerSort?: DrawerSort;
  onDrawerSortChange?: (s: DrawerSort) => void;
  drawerError?: Error | null;
  onDrawerRetry?: () => void;
  /* Word Cloud */
  commentTexts?: string[];
  commentTextsLoading?: boolean;
  /* Product Mentions */
  productMentions?: ProductMention[];
  productMentionsLoading?: boolean;
}

export default function PlatformPage({
  platform, icon, accounts,
  stats, statsLoading,
  commentsResult, commentsLoading, commentsFetchingMore, commentsHasMore, fetchMoreComments,
  commentsPerDay, topPosts, postsPerDay, commentsPerAccount, chartsLoading,
  account, onAccountChange, search, onSearchChange, sort, onSortChange,
  drawerComments, drawerLoading, drawerHasMore, drawerFetchingMore, onDrawerLoadMore,
  drawerFilter, onDrawerFilterChange, drawerSort, onDrawerSortChange,
  drawerError, onDrawerRetry,
  commentTexts, commentTextsLoading,
  productMentions, productMentionsLoading,
}: PlatformPageProps) {
  const color = PLATFORM_COLORS[platform];
  const allComments = useMemo(
    () => commentsResult?.pages.flatMap((p) => p.items) || [],
    [commentsResult]
  );
  const totalComments = commentsResult?.pages[0]?.total || 0;

  const allDrawerComments = useMemo(
    () => drawerComments?.pages.flatMap((p) => p.items) || [],
    [drawerComments]
  );
  const totalDrawerComments = drawerComments?.pages[0]?.total || 0;

  return (
    <div className="space-y-4">
      <PageExplainer
        icon={icon}
        title={PLATFORM_LABELS[platform]}
        description={`تحليل التعليقات والتفاعل على ${PLATFORM_LABELS[platform]}`}
        color={color}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilter />
      </div>

      {/* Account Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onAccountChange("")}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
            !account
              ? "text-white"
              : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground"
          }`}
          style={!account ? { backgroundColor: color } : undefined}
        >
          الكل
        </button>
        {accounts.map((acc) => {
          const avatar = getAccountAvatar(acc.username);
          return (
            <button
              key={acc.username}
              onClick={() => onAccountChange(acc.username)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                account === acc.username
                  ? "text-white"
                  : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground"
              }`}
              style={account === acc.username ? { backgroundColor: color } : undefined}
            >
              {avatar && (
                <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
              )}
              {acc.nameAr}
            </button>
          );
        })}
      </div>

      {/* Split Layout */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Left: Analytics (40%) */}
        <div className="w-[40%] shrink-0">
          <AnalyticsPanel
            platform={platform}
            stats={stats}
            commentsPerDay={commentsPerDay}
            topPosts={topPosts}
            postsPerDay={postsPerDay}
            commentsPerAccount={commentsPerAccount}
            isLoading={statsLoading || chartsLoading}
            showAccountPie={!account}
            onChartClick={(f) => onDrawerFilterChange(f)}
            commentTexts={commentTexts}
            commentTextsLoading={commentTextsLoading}
            onWordClick={(word) => onDrawerFilterChange({ type: "word", word, label: `كلمة: ${word}` })}
            productMentions={productMentions}
            productMentionsLoading={productMentionsLoading}
            onProductClick={(term, name, productId) => onDrawerFilterChange(
              productId
                ? { type: "product", productId, label: `منتج: ${name}` }
                : { type: "word", word: term, label: `منتج: ${name}` }
            )}
          />
        </div>

        {/* Right: Comments (60%) */}
        <div className="flex-1 min-w-0">
          <CommentsPanel
            comments={allComments}
            total={totalComments}
            isLoading={commentsLoading}
            isFetchingMore={commentsFetchingMore}
            hasMore={commentsHasMore}
            search={search}
            onSearchChange={onSearchChange}
            sort={sort}
            onSortChange={onSortChange}
            onLoadMore={fetchMoreComments}
          />
        </div>
      </div>

      {/* Drawer */}
      <CommentsDrawer
        open={!!drawerFilter}
        onClose={() => onDrawerFilterChange(null)}
        title={drawerFilter?.label || ""}
        comments={allDrawerComments}
        total={totalDrawerComments}
        isLoading={drawerLoading}
        hasMore={drawerHasMore}
        isFetchingMore={drawerFetchingMore}
        onLoadMore={onDrawerLoadMore}
        sort={drawerSort}
        onSortChange={onDrawerSortChange}
        filterDetails={drawerFilter?.label}
        error={drawerError as Error | undefined}
        onRetry={onDrawerRetry}
      />
    </div>
  );
}
