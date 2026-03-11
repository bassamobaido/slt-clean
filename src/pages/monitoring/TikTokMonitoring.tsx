import { useState } from "react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import { useTikTokPosts, useTikTokComments, useTikTokStats } from "@/hooks/useTikTokData";
import { TIKTOK_ACCOUNTS } from "@/lib/db-types";

export default function TikTokMonitoring() {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const { data: postsData, isLoading: postsLoading, error } = useTikTokPosts({
    account: selectedAccount || undefined,
    days,
    page,
  });

  const { data: stats, isLoading: statsLoading } = useTikTokStats({
    account: selectedAccount || undefined,
    days,
  });

  const { data: comments = [], isLoading: commentsLoading } =
    useTikTokComments(expandedPostId || undefined);

  return (
    <MonitoringLayout
      platformNameAr="تيك توك"
      color="#ff0050"
      icon={
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.28 8.28 0 004.77 1.52V6.91a4.84 4.84 0 01-1-.22z" />
        </svg>
      }
      accounts={TIKTOK_ACCOUNTS}
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
