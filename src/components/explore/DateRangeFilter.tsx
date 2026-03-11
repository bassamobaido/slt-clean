import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useDateRange, type DatePreset } from "@/contexts/DateRangeContext";

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "7d", label: "٧ أيام" },
  { key: "30d", label: "٣٠ يوم" },
  { key: "90d", label: "٩٠ يوم" },
  { key: "custom", label: "مخصص" },
];

export default function DateRangeFilter() {
  const { dateRange, setPreset, setCustomRange } = useDateRange();
  const [showCustom, setShowCustom] = useState(dateRange.preset === "custom");
  const [customFrom, setCustomFrom] = useState(dateRange.from.split("T")[0]);
  const [customTo, setCustomTo] = useState(dateRange.to.split("T")[0]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays className="w-4 h-4 text-muted-foreground/40" />
      <span className="text-[12px] font-bold text-muted-foreground/50">الفترة:</span>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => {
            if (p.key === "custom") {
              setShowCustom(true);
            } else {
              setShowCustom(false);
              setPreset(p.key);
            }
          }}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
            dateRange.preset === p.key
              ? "bg-thmanyah-green text-white"
              : "bg-card border border-border/50 text-muted-foreground/60 hover:text-foreground"
          }`}
        >
          {p.label}
        </button>
      ))}

      {showCustom && (
        <div className="flex items-center gap-2 mr-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2 py-1 rounded-lg border border-border/50 bg-card text-[11px] font-bold text-foreground/70 focus:outline-none focus:ring-1 focus:ring-thmanyah-green/30"
            dir="ltr"
          />
          <span className="text-[11px] text-muted-foreground/40">←</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2 py-1 rounded-lg border border-border/50 bg-card text-[11px] font-bold text-foreground/70 focus:outline-none focus:ring-1 focus:ring-thmanyah-green/30"
            dir="ltr"
          />
          <button
            onClick={() => {
              if (customFrom && customTo) {
                setCustomRange(
                  customFrom + "T00:00:00.000Z",
                  customTo + "T23:59:59.999Z"
                );
              }
            }}
            className="px-3 py-1.5 rounded-full bg-thmanyah-green text-white text-[11px] font-bold hover:bg-thmanyah-green/90 transition-colors"
          >
            تطبيق
          </button>
        </div>
      )}
    </div>
  );
}
