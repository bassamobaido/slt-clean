import { useState, useCallback } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import PlatformPage from "./PlatformPage";
import {
  useTikTokStats,
  useTikTokComments,
  useTikTokCommentsPerDay,
  useTikTokTopPosts,
  useTikTokPostsPerDay,
  useTikTokCommentsPerAccount,
} from "@/hooks/useTikTokData";
import type { CommentSort } from "@/components/explore/CommentsPanel";
import type { DrawerFilter } from "@/lib/db-types";
import { TIKTOK_ACCOUNTS } from "@/lib/db-types";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.28 8.28 0 004.77 1.52V6.91a4.84 4.84 0 01-1-.22z" />
  </svg>
);

export default function TikTokPage() {
  const { dateRange } = useDateRange();
  const [account, setAccount] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<CommentSort>("newest");
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter | null>(null);

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebouncedSearch(v), 400));
  }, [timer]);

  const qOpts = { account: account || undefined, dateFrom: dateRange.from, dateTo: dateRange.to };

  // Stats
  const { data: stats, isLoading: statsLoading } = useTikTokStats(qOpts);

  // Comments
  const commentsQ = useTikTokComments({
    ...qOpts,
    search: debouncedSearch || undefined,
    sort,
  });

  // Charts
  const { data: commentsPerDay } = useTikTokCommentsPerDay(qOpts);
  const { data: topPosts } = useTikTokTopPosts(qOpts);
  const { data: postsPerDay } = useTikTokPostsPerDay(qOpts);
  const { data: commentsPerAccount } = useTikTokCommentsPerAccount({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // Drawer comments
  const drawerQ = useTikTokComments({
    ...qOpts,
    filterDate: drawerFilter?.type === "date" ? drawerFilter.date : undefined,
    filterPostId: drawerFilter?.type === "post" ? drawerFilter.postId : undefined,
    account: drawerFilter?.type === "account" ? drawerFilter.account : qOpts.account,
    enabled: !!drawerFilter,
  });

  return (
    <PlatformPage
      platform="tiktok"
      icon={TikTokIcon as any}
      accounts={TIKTOK_ACCOUNTS}
      stats={stats}
      statsLoading={statsLoading}
      commentsResult={commentsQ.data}
      commentsLoading={commentsQ.isLoading}
      commentsFetchingMore={commentsQ.isFetchingNextPage}
      commentsHasMore={!!commentsQ.hasNextPage}
      fetchMoreComments={() => commentsQ.fetchNextPage()}
      commentsPerDay={commentsPerDay}
      topPosts={topPosts}
      postsPerDay={postsPerDay}
      commentsPerAccount={commentsPerAccount}
      chartsLoading={false}
      account={account}
      onAccountChange={setAccount}
      search={search}
      onSearchChange={handleSearch}
      sort={sort}
      onSortChange={setSort}
      drawerComments={drawerQ.data}
      drawerLoading={drawerQ.isLoading}
      drawerFilter={drawerFilter}
      onDrawerFilterChange={setDrawerFilter}
    />
  );
}
