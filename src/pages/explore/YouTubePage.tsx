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
import { YouTubeIcon } from "@/components/icons/PlatformIcons";

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
