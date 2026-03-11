import { X } from "lucide-react";
import type { EnrichedComment } from "@/lib/db-types";
import CommentCard from "./CommentCard";
import { fmtNum } from "@/lib/db-types";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  comments: EnrichedComment[];
  total: number;
  isLoading: boolean;
}

export default function CommentsDrawer({ open, onClose, title, comments, total, isLoading }: Props) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 left-0 z-50 h-full w-[50%] max-w-[700px] min-w-[360px] bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h3 className="text-[14px] font-display font-bold text-foreground/85">{title}</h3>
            <span className="text-[11px] font-bold text-muted-foreground/40" dir="ltr">
              {fmtNum(total)} تعليق
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground/50" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-card border border-border/40 p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted/20" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-muted/20 rounded" />
                      <div className="h-3 w-full bg-muted/15 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[12px] font-bold text-muted-foreground/40">لا توجد تعليقات</p>
            </div>
          ) : (
            comments.map((c) => <CommentCard key={c.id} comment={c} />)
          )}
        </div>
      </div>
    </>
  );
}
