import { useState } from "react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import {
  useYouTubePosts,
  useYouTubeComments,
  useYouTubeStats,
} from "@/hooks/useYouTubeData";
import { YOUTUBE_ACCOUNTS } from "@/lib/db-types";

export default function YouTubeMonitoring() {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const { data: postsData, isLoading: postsLoading, error } = useYouTubePosts({
    account: selectedAccount || undefined,
    days,
    page,
  });

  const { data: stats, isLoading: statsLoading } = useYouTubeStats({
    account: selectedAccount || undefined,
    days,
  });

  const { data: comments = [], isLoading: commentsLoading } =
    useYouTubeComments(expandedPostId || undefined);

  return (
    <MonitoringLayout
      platformNameAr="يوتيوب"
      color="#FF0000"
      icon={
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      }
      accounts={YOUTUBE_ACCOUNTS}
      selectedAccount={selectedAccount}
      onAccountChange={setSelectedAccount}
      days={days}
      onDaysChange={setDays}
      stats={stats}
      statsLoading={statsLoading}
      posts={postsData?.posts || []}
      postsLoading={postsLoading}
      totalPosts={postsData?.total || 0}
      page={page}
      onPageChange={setPage}
      expandedPostId={expandedPostId}
      onTogglePost={(id) =>
        setExpandedPostId((prev) => (prev === id ? null : id))
      }
      comments={comments}
      commentsLoading={commentsLoading}
      error={error as Error | null}
    />
  );
}
