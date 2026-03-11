import { Heart, CornerDownLeft, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { EnrichedComment } from "@/lib/db-types";
import { PLATFORM_COLORS } from "@/lib/db-types";

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ar });
  } catch {
    return "";
  }
}

export default function CommentCard({ comment }: { comment: EnrichedComment }) {
  const c = comment;
  const platformColor = PLATFORM_COLORS[c.platform];

  return (
    <div className="group rounded-xl bg-card border border-border/40 p-4 hover:border-border/60 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {c.authorAvatar ? (
            <img
              src={c.authorAvatar}
              alt=""
              className="w-9 h-9 rounded-full object-cover bg-muted/20"
              loading="lazy"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
              style={{ backgroundColor: platformColor }}
            >
              {c.authorName.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[12px] font-bold text-foreground/80">
              {c.authorName}
            </span>
            {c.isVerified && (
              <svg className="w-3.5 h-3.5 text-thmanyah-blue" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            {c.isReply && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground/40 bg-muted/10 px-1.5 py-0.5 rounded">
                <CornerDownLeft className="w-2.5 h-2.5" /> رد
              </span>
            )}
            <span className="text-[10px] font-bold text-muted-foreground/30 mr-auto" dir="ltr">
              {relativeTime(c.createdAt)}
            </span>
          </div>

          {/* Comment text */}
          <p className="text-[12px] font-bold text-foreground/70 leading-relaxed mb-2 whitespace-pre-wrap">
            {c.text}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40">
              <Heart className="w-3 h-3" />
              <span dir="ltr">{c.likes}</span>
            </span>
            {c.replyCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40">
                <CornerDownLeft className="w-3 h-3" />
                <span dir="ltr">{c.replyCount}</span> رد
              </span>
            )}
            {c.parentPostText && (
              <a
                href={c.parentPostUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-thmanyah-blue/60 hover:text-thmanyah-blue transition-colors truncate max-w-[200px]"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{c.parentPostText}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
