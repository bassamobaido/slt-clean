import { useState } from "react";
import {
  Radio,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
} from "lucide-react";
import PageExplainer from "@/components/PageExplainer";
import type {
  PostItem,
  CommentItem,
  PlatformStats,
  AccountOption,
} from "@/lib/db-types";
import { fmtNum } from "@/lib/db-types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

/* ── Props ── */

interface MonitoringLayoutProps {
  platformNameAr: string;
  color: string;
  icon: React.ReactNode;
  accounts: AccountOption[];
  // Filters
  selectedAccount: string;
  onAccountChange: (v: string) => void;
  days: number;
  onDaysChange: (v: number) => void;
  // Stats
  stats: PlatformStats | undefined;
  statsLoading: boolean;
  // Posts
  posts: PostItem[];
  postsLoading: boolean;
  totalPosts: number;
  page: number;
  onPageChange: (v: number) => void;
  pageSize?: number;
  // Expanded post & comments
  expandedPostId: string | null;
  onTogglePost: (id: string) => void;
  comments: CommentItem[];
  commentsLoading: boolean;
  // Optional: sentiment (X data)
  sentiment?: { positive: number; negative: number; neutral: number } | null;
  sentimentFilter?: string;
  onSentimentFilterChange?: (v: string) => void;
  // Error
  error?: Error | null;
}

/* ── Skeleton helper ── */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/30 ${className}`}
    />
  );
}

/* ── Date filter pills ── */

const DATE_OPTIONS = [
  { value: 7, label: "٧ أيام" },
  { value: 30, label: "٣٠ يوم" },
  { value: 90, label: "٩٠ يوم" },
  { value: 365, label: "سنة" },
];

/* ── Main component ── */

export default function MonitoringLayout({
  platformNameAr,
  color,
  icon,
  accounts,
  selectedAccount,
  onAccountChange,
  days,
  onDaysChange,
  stats,
  statsLoading,
  posts,
  postsLoading,
  totalPosts,
  page,
  onPageChange,
  pageSize = 100,
  expandedPostId,
  onTogglePost,
  comments,
  commentsLoading,
  sentiment,
  sentimentFilter,
  onSentimentFilterChange,
  error,
}: MonitoringLayoutProps) {
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <PageExplainer
        icon={Radio}
        title={`رصد ${platformNameAr}`}
        description={`تابع المنشورات والتعليقات والتفاعل على حسابات ثمانية عبر ${platformNameAr} — بيانات حية من قاعدة البيانات`}
        color={color}
      />

      {/* ── Filters ── */}
      <div
        className="card-stagger flex flex-wrap items-center gap-3"
        style={{ animationDelay: "0s" }}
      >
        {/* Account filter */}
        <select
          value={selectedAccount}
          onChange={(e) => {
            onAccountChange(e.target.value);
            onPageChange(0);
          }}
          className="py-2 px-3 rounded-xl bg-card border border-border/50 text-[12px] font-bold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{
            focusRingColor: color,
            ["--tw-ring-color" as string]: `${color}33`,
          }}
        >
          <option value="">جميع الحسابات</option>
          {accounts.map((a) => (
            <option key={a.username} value={a.username}>
              {a.nameAr}
            </option>
          ))}
        </select>

        {/* Date range pills */}
        <div className="flex gap-1.5">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onDaysChange(opt.value);
                onPageChange(0);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                days === opt.value
                  ? "text-white"
                  : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
              }`}
              style={
                days === opt.value ? { backgroundColor: color } : undefined
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sentiment filter (X only) */}
        {onSentimentFilterChange && (
          <>
            <div className="w-px h-6 bg-border/40 mx-1" />
            {[
              { key: "", label: "الكل" },
              { key: "Positive", label: "إيجابي" },
              { key: "Negative", label: "سلبي" },
              { key: "Neutral", label: "محايد" },
            ].map((sf) => (
              <button
                key={sf.key}
                onClick={() => {
                  onSentimentFilterChange(sf.key);
                  onPageChange(0);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  sentimentFilter === sf.key
                    ? "bg-foreground text-white"
                    : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="card-stagger flex items-center gap-3 p-4 rounded-xl bg-thmanyah-red/[0.06] border border-thmanyah-red/15">
          <AlertCircle className="w-5 h-5 text-thmanyah-red shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-foreground/80">
              خطأ في تحميل البيانات
            </p>
            <p className="text-[11px] font-bold text-muted-foreground/50">
              {error.message}
            </p>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "المنشورات",
            value: stats?.totalPosts,
            ic: MessageSquare,
            ic2: color,
          },
          {
            label: "الإعجابات",
            value: stats?.totalLikes,
            ic: Heart,
            ic2: "#F24935",
          },
          {
            label: "المشاهدات",
            value: stats?.totalViews,
            ic: Eye,
            ic2: "#FFBC0A",
          },
          {
            label: "التعليقات",
            value: stats?.totalComments,
            ic: MessageSquare,
            ic2: "#00C17A",
          },
        ].map((kpi, i) => {
          const Icon = kpi.ic;
          return (
            <div
              key={kpi.label}
              className="card-stagger rounded-2xl bg-card border border-border/40 p-4"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: `${kpi.ic2}10` }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: kpi.ic2 }}
                    strokeWidth={1.8}
                  />
                </div>
              </div>
              {statsLoading ? (
                <Skeleton className="h-6 w-16 mb-1" />
              ) : (
                <div className="text-xl font-bold text-foreground/90 nums-en">
                  {fmtNum(kpi.value ?? 0)}
                </div>
              )}
              <div className="text-[11px] font-bold text-muted-foreground/50">
                {kpi.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sentiment Bar (X only) ── */}
      {sentiment && sentiment.positive + sentiment.negative + sentiment.neutral > 0 && (
        <div
          className="card-stagger rounded-2xl bg-card border border-border/40 p-5"
          style={{ animationDelay: "0.05s" }}
        >
          <h3 className="text-[14px] font-display font-bold text-foreground/85 mb-4">
            توزيع المشاعر
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {([
              {
                key: "positive",
                count: sentiment.positive,
                label: "إيجابي",
                bg: "bg-thmanyah-green/[0.08]",
                text: "text-thmanyah-green",
              },
              {
                key: "negative",
                count: sentiment.negative,
                label: "سلبي",
                bg: "bg-thmanyah-red/[0.08]",
                text: "text-thmanyah-red",
              },
              {
                key: "neutral",
                count: sentiment.neutral,
                label: "محايد",
                bg: "bg-muted/30",
                text: "text-muted-foreground",
              },
            ] as const).map((s) => {
              const total =
                sentiment.positive +
                sentiment.negative +
                sentiment.neutral;
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div
                  key={s.key}
                  className={`text-center p-3 rounded-xl ${s.bg}`}
                >
                  <div className={`text-xl font-bold ${s.text} nums-en`}>
                    {s.count}
                  </div>
                  <div className={`text-[10px] font-bold ${s.text} opacity-60`}>
                    {s.label}
                  </div>
                  <div className={`text-[10px] font-bold ${s.text} opacity-40 nums-en`}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/20">
            {(() => {
              const total =
                sentiment.positive +
                sentiment.negative +
                sentiment.neutral;
              const pPos = total > 0 ? (sentiment.positive / total) * 100 : 0;
              const pNeg = total > 0 ? (sentiment.negative / total) * 100 : 0;
              const pNeu = total > 0 ? (sentiment.neutral / total) * 100 : 0;
              return (
                <>
                  <div
                    className="bg-thmanyah-green rounded-r-full transition-all"
                    style={{ width: `${pPos}%` }}
                  />
                  <div
                    className="bg-thmanyah-red transition-all"
                    style={{ width: `${pNeg}%` }}
                  />
                  <div
                    className="bg-muted-foreground/20 rounded-l-full transition-all"
                    style={{ width: `${pNeu}%` }}
                  />
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Monitored Accounts ── */}
      {accounts.length > 0 && (
        <div className="card-stagger" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-bold text-foreground/70 mb-3">
            الحسابات المراقبة
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {accounts.map((account, i) => (
              <button
                key={account.username}
                onClick={() => {
                  onAccountChange(
                    selectedAccount === account.username
                      ? ""
                      : account.username
                  );
                  onPageChange(0);
                }}
                className={`card-stagger flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                  selectedAccount === account.username
                    ? "border-current bg-opacity-10"
                    : "bg-card border-border/40 hover:border-border"
                }`}
                style={
                  selectedAccount === account.username
                    ? {
                        borderColor: color,
                        backgroundColor: `${color}08`,
                      }
                    : undefined
                }
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {account.nameAr.charAt(0)}
                </div>
                <div className="min-w-0 text-right">
                  <span className="text-[12px] font-bold text-foreground/80 block truncate">
                    {account.nameAr}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/40">
                    @{account.username}
                  </span>
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full mr-auto shrink-0"
                  style={{
                    backgroundColor:
                      selectedAccount === account.username ? color : "#00C17A",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Posts Feed ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-display font-bold text-foreground/80">
            المنشورات
          </h3>
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[10px] font-bold text-muted-foreground/40 nums-en">
            {totalPosts} نتيجة
          </span>
        </div>

        {postsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card border border-border/40 p-4 space-y-3"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border/40 p-12 text-center">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-[14px] font-bold text-foreground/60 mb-1">
              لا توجد بيانات
            </p>
            <p className="text-[12px] font-bold text-muted-foreground/40">
              جرّب تغيير الفلاتر أو الفترة الزمنية
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {posts.map((post, i) => {
              const isOpen = expandedPostId === post.id;
              const sentimentLabel =
                post.sentiment === "Positive" || post.sentiment === "إيجابي"
                  ? "إيجابي"
                  : post.sentiment === "Negative" || post.sentiment === "سلبي"
                  ? "سلبي"
                  : post.sentiment
                  ? "محايد"
                  : null;
              const sentimentColor =
                sentimentLabel === "إيجابي"
                  ? "#00C17A"
                  : sentimentLabel === "سلبي"
                  ? "#F24935"
                  : "#494C6B";

              return (
                <div
                  key={post.id}
                  className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden"
                  style={{ animationDelay: `${0.12 + i * 0.02}s` }}
                >
                  <button
                    onClick={() => onTogglePost(post.id)}
                    className="w-full text-right p-4 hover:bg-muted/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {(
                          post.accountNameAr ||
                          post.authorName ||
                          "?"
                        ).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[12px] font-bold text-foreground/80">
                            {post.accountNameAr || post.authorName || "—"}
                          </span>
                          {post.authorHandle && (
                            <span
                              className="text-[10px] font-bold text-muted-foreground/30 nums-en"
                              dir="ltr"
                            >
                              @{post.authorHandle}
                            </span>
                          )}
                          {sentimentLabel && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: sentimentColor }}
                            >
                              {sentimentLabel}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-muted-foreground/30 mr-auto">
                            {post.createdAt
                              ? (() => {
                                  try {
                                    return format(
                                      new Date(post.createdAt),
                                      "d MMM yyyy",
                                      { locale: ar }
                                    );
                                  } catch {
                                    return post.createdAt.split("T")[0];
                                  }
                                })()
                              : "—"}
                          </span>
                        </div>
                        <p className="text-[12px] font-bold text-foreground/70 leading-relaxed line-clamp-2">
                          {post.text || "—"}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                            <Heart className="w-3 h-3" /> {fmtNum(post.likes)}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                            <MessageSquare className="w-3 h-3" />{" "}
                            {fmtNum(post.commentsCount)}
                          </span>
                          {post.shares > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                              <Share2 className="w-3 h-3" />{" "}
                              {fmtNum(post.shares)}
                            </span>
                          )}
                          {post.views > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 nums-en">
                              <Eye className="w-3 h-3" /> {fmtNum(post.views)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground/30" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground/20" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* ── Expanded section ── */}
                  {isOpen && (
                    <div className="border-t border-border/30 p-4 bg-muted/5 space-y-3">
                      {/* Full text */}
                      <p className="text-[12px] font-bold text-foreground/70 leading-relaxed whitespace-pre-wrap">
                        {post.text}
                      </p>

                      {/* Link to original */}
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold hover:underline transition-colors"
                          style={{ color }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          عرض المنشور الأصلي
                        </a>
                      )}

                      {/* Extra metadata */}
                      {post.extra && (
                        <div className="flex flex-wrap gap-2">
                          {post.extra.hashtags && (
                            <span className="text-[10px] font-bold text-muted-foreground/50 px-2 py-1 bg-muted/20 rounded-lg">
                              {String(post.extra.hashtags)}
                            </span>
                          )}
                          {post.extra.postType && (
                            <span className="text-[10px] font-bold text-muted-foreground/50 px-2 py-1 bg-muted/20 rounded-lg">
                              {String(post.extra.postType)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Comments section */}
                      <div className="border-t border-border/20 pt-3">
                        <h4 className="text-[11px] font-bold text-muted-foreground/50 mb-2">
                          التعليقات
                        </h4>
                        {commentsLoading ? (
                          <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, ci) => (
                              <div
                                key={ci}
                                className="flex items-start gap-2 p-2"
                              >
                                <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1">
                                  <Skeleton className="h-3 w-20" />
                                  <Skeleton className="h-3 w-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : comments.length === 0 ? (
                          <p className="text-[11px] font-bold text-muted-foreground/30 py-2">
                            لا توجد تعليقات
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                            {comments.map((c) => (
                              <div
                                key={c.id}
                                className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                                  c.isReply
                                    ? "mr-6 bg-muted/10 border-border/20"
                                    : "bg-card border-border/30"
                                }`}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                                  style={{
                                    backgroundColor: c.isReply
                                      ? "#494C6B"
                                      : color,
                                  }}
                                >
                                  {c.authorName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-bold text-foreground/70 truncate">
                                      {c.authorName}
                                    </span>
                                    {c.isVerified && (
                                      <svg
                                        className="w-3 h-3 text-thmanyah-blue shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                      </svg>
                                    )}
                                    <span className="text-[9px] font-bold text-muted-foreground/30 mr-auto">
                                      {c.createdAt
                                        ? (() => {
                                            try {
                                              return format(
                                                new Date(c.createdAt),
                                                "d MMM",
                                                { locale: ar }
                                              );
                                            } catch {
                                              return "";
                                            }
                                          })()
                                        : ""}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-bold text-foreground/60 leading-relaxed">
                                    {c.text}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[9px] font-bold text-muted-foreground/30 nums-en">
                                      ❤️ {c.likes}
                                    </span>
                                    {c.replyCount !== undefined &&
                                      c.replyCount > 0 && (
                                        <span className="text-[9px] font-bold text-muted-foreground/30 nums-en">
                                          💬 {c.replyCount} رد
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="p-2 rounded-xl bg-card border border-border/40 disabled:opacity-30 hover:bg-muted/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-bold text-muted-foreground/60 nums-en">
              صفحة {page + 1} من {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-xl bg-card border border-border/40 disabled:opacity-30 hover:bg-muted/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
