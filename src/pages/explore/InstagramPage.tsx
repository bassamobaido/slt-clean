import { useState, useCallback } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import PlatformPage from "./PlatformPage";
import {
  useInstagramStats,
  useInstagramComments,
  useInstagramCommentsPerDay,
  useInstagramTopPosts,
  useInstagramPostsPerDay,
  useInstagramCommentsPerAccount,
} from "@/hooks/useInstagramData";
import type { CommentSort } from "@/components/explore/CommentsPanel";
import type { DrawerFilter } from "@/lib/db-types";
import { INSTAGRAM_ACCOUNTS } from "@/lib/db-types";
import { InstagramIcon } from "@/components/icons/PlatformIcons";
import { useCommentTexts } from "@/hooks/useCommentTexts";

export default function InstagramPage() {
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

  const { data: stats, isLoading: statsLoading } = useInstagramStats(qOpts);

  const commentsQ = useInstagramComments({
    ...qOpts,
    search: debouncedSearch || undefined,
    sort,
  });

  const { data: commentsPerDay } = useInstagramCommentsPerDay(qOpts);
  const { data: topPosts } = useInstagramTopPosts(qOpts);
  const { data: postsPerDay } = useInstagramPostsPerDay(qOpts);
  const { data: commentsPerAccount } = useInstagramCommentsPerAccount({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // Comment texts for word cloud
  const { data: commentTexts, isLoading: commentTextsLoading } = useCommentTexts({
    platform: "instagram", account: qOpts.account, dateFrom: qOpts.dateFrom, dateTo: qOpts.dateTo,
  });

  const drawerQ = useInstagramComments({
    ...qOpts,
    filterDate: drawerFilter?.type === "date" ? drawerFilter.date : undefined,
    filterPostId: drawerFilter?.type === "post" ? drawerFilter.postId : undefined,
    account: drawerFilter?.type === "account" ? drawerFilter.account : qOpts.account,
    search: drawerFilter?.type === "word" ? drawerFilter.word : undefined,
    enabled: !!drawerFilter,
  });

  return (
    <PlatformPage
      platform="instagram"
      icon={InstagramIcon as any}
      accounts={INSTAGRAM_ACCOUNTS}
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
      commentTexts={commentTexts}
      commentTextsLoading={commentTextsLoading}
    />
  );
}
