import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Trash2,
} from "lucide-react";
import PageExplainer from "@/components/PageExplainer";

interface AnalysisRow {
  id: number;
  text: string;
  platform: string;
  sentiment: "إيجابي" | "سلبي" | "محايد";
  confidence: number;
  topic: string;
  date: string;
}

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

export default function DataAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisRow[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && isValidFile(dropped)) {
      setFile(dropped);
      setStatus("idle");
      setResults([]);
      setErrorMsg("");
    } else {
      setErrorMsg("يرجى رفع ملف بصيغة CSV أو Excel فقط");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && isValidFile(selected)) {
      setFile(selected);
      setStatus("idle");
      setResults([]);
      setErrorMsg("");
    } else if (selected) {
      setErrorMsg("يرجى رفع ملف بصيغة CSV أو Excel فقط");
    }
  }, []);

  const isValidFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    return ["csv", "xlsx", "xls"].includes(ext || "");
  };

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    // Simulate upload progress
    for (let i = 0; i <= 40; i += 5) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }

    setStatus("processing");
    // Simulate processing
    for (let i = 40; i <= 90; i += 3) {
      await new Promise((r) => setTimeout(r, 120));
      setProgress(i);
    }

    // Generate demo results
    const demoResults: AnalysisRow[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      text: [
        "المحتوى ممتاز جداً واستمتعت بالحلقة",
        "لم يعجبني التغيير الجديد في البرنامج",
        "حلقة عادية لا بأس بها",
        "أفضل بودكاست عربي بلا منازع!",
        "أتمنى تحسين جودة الصوت",
        "شكراً ثمانية على هذا المحتوى الرائع",
        "الموضوع مكرر وممل للأسف",
        "تغطية شاملة ومتوازنة للحدث",
        "كنت أتوقع محتوى أعمق من هذا",
        "ضيف الحلقة كان رائعاً وملهماً",
        "الحلقة طويلة جداً بدون فائدة",
        "محتوى تعليمي ممتاز للشباب",
        "لا أوافق على الرأي المطروح",
        "أداء احترافي من الفريق",
        "التعليق العربي أفضل بكثير",
      ][i],
      platform: ["X", "TikTok", "Instagram", "YouTube", "X"][i % 5],
      sentiment: (["إيجابي", "سلبي", "محايد"] as const)[i % 3],
      confidence: Math.round(70 + Math.random() * 28),
      topic: ["محتوى", "جودة", "عام", "ضيوف", "تقنية"][i % 5],
      date: `2024-0${(i % 9) + 1}-${10 + (i % 20)}`,
    }));

    setResults(demoResults);
    setProgress(100);
    setStatus("done");
  }, [file]);

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setResults([]);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sentimentCounts = {
    positive: results.filter((r) => r.sentiment === "إيجابي").length,
    negative: results.filter((r) => r.sentiment === "سلبي").length,
    neutral: results.filter((r) => r.sentiment === "محايد").length,
  };

  const sentimentIcon = (s: string) => {
    if (s === "إيجابي") return <TrendingUp className="w-3.5 h-3.5 text-thmanyah-green" />;
    if (s === "سلبي") return <TrendingDown className="w-3.5 h-3.5 text-thmanyah-red" />;
    return <Minus className="w-3.5 h-3.5 text-thmanyah-amber" />;
  };

  const sentimentColor = (s: string) => {
    if (s === "إيجابي") return "bg-thmanyah-green/10 text-thmanyah-green border-thmanyah-green/20";
    if (s === "سلبي") return "bg-thmanyah-red/10 text-thmanyah-red border-thmanyah-red/20";
    return "bg-thmanyah-amber/10 text-thmanyah-amber border-thmanyah-amber/20";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageExplainer
        icon={FileSpreadsheet}
        title="تحليل البيانات"
        description="ارفع ملفات CSV أو Excel لتحليل المشاعر والمواضيع تلقائياً باستخدام الذكاء الاصطناعي مع تصدير النتائج"
        color="#0072F9"
      />
      {/* Upload Section */}
      <div className="card-stagger" style={{ animationDelay: "0s" }}>
        <div className="rounded-2xl bg-card border border-border/50 p-6">

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-10 text-center ${
              dragOver
                ? "border-thmanyah-green bg-thmanyah-green/[0.04]"
                : file
                ? "border-thmanyah-green/30 bg-thmanyah-green/[0.02]"
                : "border-border/60 hover:border-thmanyah-green/30 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-thmanyah-green" />
                <p className="text-sm font-bold text-foreground/80">{file.name}</p>
                <p className="text-[11px] font-bold text-muted-foreground/50">
                  {(file.size / 1024).toFixed(1)} كيلوبايت
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-bold text-foreground/70">
                    اسحب الملف هنا أو اضغط للاختيار
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground/40 mt-1">
                    CSV أو Excel — الحد الأقصى 50 ميغابايت
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 text-thmanyah-red text-[12px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errorMsg}
            </div>
          )}

          {/* Progress bar */}
          {status !== "idle" && status !== "error" && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground/60">
                <span>
                  {status === "uploading" && "جاري الرفع..."}
                  {status === "processing" && "جاري التحليل..."}
                  {status === "done" && "اكتمل التحليل"}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-thmanyah-green transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!file || status === "uploading" || status === "processing"}
              className="px-6 py-2.5 rounded-xl bg-foreground text-white text-[13px] font-bold hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {(status === "uploading" || status === "processing") && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {status === "done" ? "إعادة التحليل" : "بدء التحليل"}
            </button>
            {file && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-border/50 text-[13px] font-bold text-muted-foreground/60 hover:text-foreground hover:border-border transition-all flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {status === "done" && results.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/50 p-5" style={{ animationDelay: "0s" }}>
              <div className="text-2xl font-bold text-foreground/90 mb-1">{results.length}</div>
              <div className="text-[12px] font-bold text-muted-foreground/60">إجمالي السجلات</div>
            </div>
            <div className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/50 p-5" style={{ animationDelay: "0.05s" }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-thmanyah-green" />
                <span className="text-2xl font-bold text-thmanyah-green">{sentimentCounts.positive}</span>
              </div>
              <div className="text-[12px] font-bold text-muted-foreground/60">إيجابي</div>
            </div>
            <div className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/50 p-5" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-thmanyah-red" />
                <span className="text-2xl font-bold text-thmanyah-red">{sentimentCounts.negative}</span>
              </div>
              <div className="text-[12px] font-bold text-muted-foreground/60">سلبي</div>
            </div>
            <div className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/50 p-5" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-center gap-2 mb-1">
                <Minus className="w-4 h-4 text-thmanyah-amber" />
                <span className="text-2xl font-bold text-thmanyah-amber">{sentimentCounts.neutral}</span>
              </div>
              <div className="text-[12px] font-bold text-muted-foreground/60">محايد</div>
            </div>
          </div>

          {/* Results Table */}
          <div className="card-stagger rounded-2xl bg-card border border-border/50 overflow-hidden" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between p-5 border-b border-border/30">
              <h3 className="text-[14px] font-display font-bold text-foreground/80">
                نتائج التحليل
              </h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-[11px] font-bold text-muted-foreground/60 hover:text-foreground transition-all">
                <Download className="w-3 h-3" />
                تصدير
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground/60">#</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground/60">النص</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground/60">المنصة</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground/60">المشاعر</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground/60">الثقة</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground/60">الموضوع</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors card-stagger"
                      style={{ animationDelay: `${0.25 + i * 0.03}s` }}
                    >
                      <td className="px-5 py-3 text-muted-foreground/40 font-bold">{row.id}</td>
                      <td className="px-5 py-3 text-foreground/80 max-w-[300px] truncate font-medium">{row.text}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-muted/50 text-[11px] font-bold text-muted-foreground/70">
                          {row.platform}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${sentimentColor(row.sentiment)}`}>
                          {sentimentIcon(row.sentiment)}
                          {row.sentiment}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-foreground/60">{row.confidence}%</td>
                      <td className="px-5 py-3 text-muted-foreground/60 font-bold">{row.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
