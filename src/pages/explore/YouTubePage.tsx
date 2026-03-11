import { useState, useCallback } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import PlatformPage from "./PlatformPage";
import {
  useYouTubeStats,
  useYouTubeComments,
  useYouTubeCommentsPerDay,
  useYouTubeTopPosts,
  useYouTubeCommentsPerAccount,
} from "@/hooks/useYouTubeData";
import type { CommentSort } from "@/components/explore/CommentsPanel";
import type { DrawerFilter } from "@/lib/db-types";
import { YOUTUBE_ACCOUNTS } from "@/lib/db-types";

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function YouTubePage() {
  const { dateRange } = useDateRange();
  const [account, setAccount] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<CommentSort>("newest");
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter | null>(null);

  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebouncedSearch(v), 400));
  }, [timer]);

  const qOpts = { account: account || undefined, dateFrom: dateRange.from, dateTo: dateRange.to };

  const { data: stats, isLoading: statsLoading } = useYouTubeStats(qOpts);

  const commentsQ = useYouTubeComments({
    ...qOpts,
    search: debouncedSearch || undefined,
    sort,
  });

  const { data: commentsPerDay } = useYouTubeCommentsPerDay(qOpts);
  const { data: topPosts } = useYouTubeTopPosts(qOpts);
  const { data: commentsPerAccount } = useYouTubeCommentsPerAccount({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const drawerQ = useYouTubeComments({
    ...qOpts,
    filterDate: drawerFilter?.type === "date" ? drawerFilter.date : undefined,
    filterPostId: drawerFilter?.type === "post" ? drawerFilter.postId : undefined,
    account: drawerFilter?.type === "account" ? drawerFilter.account : qOpts.account,
    enabled: !!drawerFilter,
  });

  return (
    <PlatformPage
      platform="youtube"
      icon={YouTubeIcon as any}
      accounts={YOUTUBE_ACCOUNTS}
      stats={stats}
      statsLoading={statsLoading}
      commentsResult={commentsQ.data}
      commentsLoading={commentsQ.isLoading}
      commentsFetchingMore={commentsQ.isFetchingNextPage}
      commentsHasMore={!!commentsQ.hasNextPage}
      fetchMoreComments={() => commentsQ.fetchNextPage()}
      commentsPerDay={commentsPerDay}
      topPosts={topPosts}
      postsPerDay={undefined}
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
