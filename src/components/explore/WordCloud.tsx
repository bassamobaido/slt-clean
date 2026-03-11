import { useMemo, useState } from "react";
import { Cloud } from "lucide-react";

/* ── Arabic Stop Words ── */
const STOP_WORDS = new Set([
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'بين', 'حتى', 'منذ', 'خلال', 'حول',
  'بعد', 'قبل', 'عند', 'دون', 'فوق', 'تحت', 'أمام', 'وراء', 'ضد',
  'و', 'أو', 'ثم', 'بل', 'لكن', 'ف', 'ب', 'ل', 'ك',
  'هو', 'هي', 'هم', 'هن', 'أنا', 'أنت', 'أنتم', 'نحن', 'أنتي',
  'له', 'لها', 'لهم', 'لنا', 'لك', 'لكم',
  'كان', 'يكون', 'يمكن', 'كانت', 'كانوا', 'يكن',
  'لم', 'لن', 'قد', 'سوف', 'سـ',
  'هذا', 'هذه', 'ذلك', 'تلك', 'هؤلاء', 'أولئك',
  'التي', 'الذي', 'اللذان', 'اللتان', 'الذين', 'اللاتي', 'اللواتي',
  'كل', 'بعض', 'غير', 'ما', 'لا', 'إن', 'أن', 'إذا', 'كما', 'مثل',
  'أيضا', 'أيضاً', 'فقط', 'جدا', 'جداً', 'حيث', 'ليس', 'ليست',
  'أي', 'عبر', 'ضمن', 'نحو', 'لدى', 'لدي', 'أكثر', 'أقل',
  'يا', 'آه', 'آخ', 'إلخ', 'الخ',
  'الله', 'سبحان', 'ماشاء', 'ماشاءالله', 'الحمدلله', 'إنشاء', 'انشاء',
  'اللهم', 'صلى', 'وسلم', 'عليه', 'رضي', 'عنه', 'عنها',
  'شكرا', 'شكراً', 'جزاك', 'جزاكم', 'بارك', 'يارب', 'آمين', 'امين',
  'اول', 'أول', 'ثاني', 'واحد', 'اثنين',
  'the', 'is', 'are', 'was', 'and', 'or', 'for', 'not', 'you', 'this',
  'that', 'with', 'have', 'from', 'they', 'been', 'has', 'will',
  'ثمانية', 'thmanyah', 'thmanyahsports', 'thmanyahexit', 'thmanyahliving', 'radiothmanyah',
  '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩',
  'مو', 'بس', 'اللي', 'الي', 'اني', 'انه', 'عشان', 'ليه', 'كذا', 'فيه', 'فيها',
  'مره', 'اكثر', 'كلش', 'والله', 'يعني', 'طيب', 'خلاص', 'ابد',
]);

const BRAND_COLORS = [
  "#00C17A", "#0072F9", "#F24935", "#FFBC0A", "#8B5CF6",
  "#FF00B7", "#84DBE5", "#FF9172", "#B2E2BA", "#D1C4E2",
];

interface WordItem {
  text: string;
  count: number;
  type: "word" | "bigram";
}

function analyzeComments(texts: string[]): WordItem[] {
  const wordFreq: Record<string, number> = {};
  const bigramFreq: Record<string, number> = {};

  for (const text of texts) {
    const cleaned = text
      .replace(/[\u{1F600}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}]/gu, '')
      .replace(/[٠-٩0-9]/g, '')
      .replace(/[a-zA-Z]/g, '')
      .replace(/#\S+/g, '')
      .replace(/@\S+/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^\u0600-\u06FF\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleaned.split(' ').filter(w => w.length > 1 && !STOP_WORDS.has(w));

    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigramFreq[bigram] = (bigramFreq[bigram] || 0) + 1;
    }
  }

  const combined: WordItem[] = [];

  for (const [word, count] of Object.entries(wordFreq)) {
    if (count >= 3) combined.push({ text: word, count, type: "word" });
  }
  for (const [bigram, count] of Object.entries(bigramFreq)) {
    if (count >= 2) combined.push({ text: bigram, count, type: "bigram" });
  }

  combined.sort((a, b) => b.count - a.count);
  return combined.slice(0, 80);
}

/* ── Component ── */
interface Props {
  texts: string[];
  isLoading: boolean;
  onWordClick?: (word: string) => void;
}

export default function WordCloud({ texts, isLoading, onWordClick }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);

  const words = useMemo(() => analyzeComments(texts), [texts]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">سحابة الكلمات</h4>
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-pulse flex flex-wrap gap-2 justify-center p-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-muted/20"
                style={{
                  width: 40 + Math.random() * 60,
                  height: 16 + Math.random() * 16,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (words.length === 0) return null;

  const maxCount = words[0]?.count || 1;
  const minSize = 12;
  const maxSize = 42;

  return (
    <div className="bg-card rounded-xl border border-border/40 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-right mb-3"
      >
        <Cloud className="w-3.5 h-3.5 text-muted-foreground/40" />
        <h4 className="text-[12px] font-display font-bold text-foreground/70 flex-1">سحابة الكلمات</h4>
        <svg
          className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center items-baseline py-4 min-h-[120px]" dir="rtl">
          {words.map((w, i) => {
            const ratio = w.count / maxCount;
            const size = minSize + (maxSize - minSize) * Math.pow(ratio, 0.6);
            const color = BRAND_COLORS[i % BRAND_COLORS.length];
            const opacity = 0.7 + 0.3 * ratio;
            const isHovered = hoveredIdx === i;

            return (
              <button
                key={w.text}
                onClick={() => onWordClick?.(w.text)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative inline-block transition-transform duration-150 hover:scale-110 cursor-pointer"
                style={{
                  fontSize: `${size}px`,
                  lineHeight: 1.2,
                  color,
                  opacity,
                  fontWeight: w.type === "bigram" ? 700 : 500,
                  animationDelay: `${i * 20}ms`,
                }}
                title={`${w.text} — ${w.count} مرة`}
              >
                {w.text}
                {isHovered && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1a1a2e] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl border border-white/10 z-10 pointer-events-none">
                    {w.count} مرة
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
