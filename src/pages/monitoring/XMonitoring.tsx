import { useState } from "react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import { useXPosts, useXStats, useXSentiment } from "@/hooks/useXData";

export default function XMonitoring() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState("");

  const { data: postsData, isLoading: postsLoading, error } = useXPosts({
    days,
    page,
    sentiment: sentimentFilter || undefined,
  });

  const { data: stats, isLoading: statsLoading } = useXStats({ days });
  const { data: sentiment } = useXSentiment({ days });

  return (
    <MonitoringLayout
      platformNameAr="تويتر"
      color="#1DA1F2"
      icon={
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      }
      accounts={[]}
      selectedAccount=""
      onAccountChange={() => {}}
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
      comments={[]}
      commentsLoading={false}
      sentiment={sentiment || null}
      sentimentFilter={sentimentFilter}
      onSentimentFilterChange={setSentimentFilter}
      error={error as Error | null}
    />
  );
}
