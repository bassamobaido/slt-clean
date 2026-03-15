import { useState, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Heart,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  FileText,
  ExternalLink,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Play,
  Clock,
  Trash2,
  Heart as HeartIcon,
  Repeat2,
  Eye,
  Users,
  Sparkles,
  Trophy,
  Building2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageExplainer from '@/components/PageExplainer';
import { SentimentPieChart } from '@/components/SentimentPieChart';
import { TimelineCharts } from '@/components/meltwater/TimelineCharts';
import { ExcelExport } from '@/components/meltwater/ExcelExport';
import { WordCloud } from '@/components/meltwater/WordCloud';
import { DataImport } from '@/components/meltwater/DataImport';
import { Link } from 'react-router-dom';
import { loadApiKeys, loadSelectedModel } from '@/lib/settings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/* ── Robust JSON parser ── */
function safeParseJSON(raw: string): any {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response');
  try { return JSON.parse(raw); } catch {}
  let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(clean); } catch {}
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(clean.slice(firstBrace, lastBrace + 1)); } catch {}
  }
  const firstBracket = clean.indexOf('[');
  const lastBracket = clean.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try { return JSON.parse(clean.slice(firstBracket, lastBracket + 1)); } catch {}
  }
  throw new Error('Could not parse AI response as JSON');
}

/* ── Smart number formatter ── */
function formatSmart(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} مليار`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} مليون`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} ألف`;
  return n.toString();
}

/* ── Tweet type (Meltwater-compatible) ── */
interface Tweet {
  id: number;
  text: string;
  author: string;
  authorHandle?: string;
  authorName?: string;
  url?: string;
  date?: string;
  time?: string;
  meltwaterKeywords?: string;
  contentType?: string;
  sourceName?: string;
  hashtags?: string;
  language?: string;
  reach: number;
  totalEngagement?: number;
  views?: number;
  comments?: number;
  reposts?: number;
  sentiment: string;
  emotion: string;
  keywords: string[];
  topics?: string[];
  engagement: { likes: number; retweets: number; replies: number };
}

/* ── AI Report Insights (expanded) ── */
interface ReportTheme { name: string; description: string; percentage: number; sentiment?: string }
interface ReportIssue { title: string; description: string; severity: 'high' | 'medium' | 'low'; count: number }
interface ReportInsightItem { title: string; description: string }
interface ReportRecommendation { title: string; description: string; priority: 'high' | 'medium' | 'low' }
interface TopTweetAnalysis { rank: number; author: string; engagement: number; summary: string; why_viral: string }
interface AccountAnalysisItem { mentions: number; sentiment_summary: string }

interface ReportInsights {
  overall_summary: string;
  sentiment_analysis: string;
  visuals?: {
    description: string;
    top_topics: string[];
    key_moments: string[];
  };
  top_tweets_analysis?: TopTweetAnalysis[];
  themes: ReportTheme[];
  issues: ReportIssue[];
  insights: ReportInsightItem[];
  recommendations: ReportRecommendation[];
  account_analysis?: Record<string, AccountAnalysisItem>;
}

/* ── Saved report row type ── */
interface SavedReport {
  id: string;
  title: string;
  tweet_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  model_used: string;
  report_insights: ReportInsights;
  analyzed_tweets: Tweet[];
  summary: string;
  created_at: string;
}

/* ── Section navigation items ── */
const SECTIONS = [
  { id: "summary", label: "الملخص", icon: FileText },
  { id: "visuals", label: "المرئيات", icon: Sparkles },
  { id: "top10", label: "أعلى ١٠", icon: Trophy },
  { id: "sentiment", label: "المشاعر", icon: Heart },
  { id: "themes", label: "المواضيع", icon: Target },
  { id: "insights", label: "الرؤى", icon: Lightbulb },
  { id: "recommendations", label: "التوصيات", icon: CheckCircle },
  { id: "accounts", label: "الحسابات", icon: Building2 },
  { id: "wordcloud", label: "الكلمات", icon: Target },
  { id: "timeline", label: "الزمني", icon: TrendingUp },
  { id: "tweets", label: "التغريدات", icon: MessageSquare },
] as const;

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

const MeltwaterReport = () => {
  const [activeSection, setActiveSection] = useState("summary");
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Data state
  const [activeTweets, setActiveTweets] = useState<Tweet[]>([]);
  const [importedTweets, setImportedTweets] = useState<Tweet[] | null>(null);
  const [analysisState, setAnalysisState] = useState<'idle' | 'ready' | 'analyzing' | 'generating-report' | 'done' | 'error'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState('');
  const [reportInsights, setReportInsights] = useState<ReportInsights | null>(null);

  // Tweet list state
  const [tweetListLimit, setTweetListLimit] = useState(30);
  const [tweetSort, setTweetSort] = useState<'newest' | 'engagement' | 'reach' | 'positive' | 'negative'>('newest');
  const [expandedTweets, setExpandedTweets] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();

  // Fetch saved reports
  const { data: savedReports } = useQuery({
    queryKey: ['meltwater-reports'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('meltwater_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as SavedReport[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleDeleteReport = async (id: string) => {
    await (supabase as any).from('meltwater_reports').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['meltwater-reports'] });
  };

  const handleLoadReport = (report: SavedReport) => {
    setActiveTweets(report.analyzed_tweets);
    setReportInsights(report.report_insights);
    setAnalysisState('done');
  };

  // Computed stats
  const totalTweets = activeTweets.length;
  const sentimentCounts = useMemo(() => ({
    positive: activeTweets.filter(t => t.sentiment === "إيجابي").length,
    negative: activeTweets.filter(t => t.sentiment === "سلبي").length,
    neutral: activeTweets.filter(t => t.sentiment === "محايد").length,
  }), [activeTweets]);

  const sentimentPercentages = useMemo(() => ({
    positive: totalTweets ? ((sentimentCounts.positive / totalTweets) * 100).toFixed(1) : "0",
    negative: totalTweets ? ((sentimentCounts.negative / totalTweets) * 100).toFixed(1) : "0",
    neutral: totalTweets ? ((sentimentCounts.neutral / totalTweets) * 100).toFixed(1) : "0",
  }), [sentimentCounts, totalTweets]);

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTweets.forEach(t => { counts[t.emotion] = (counts[t.emotion] || 0) + 1; });
    return counts;
  }, [activeTweets]);

  const totalReach = useMemo(() => activeTweets.reduce((sum, t) => sum + t.reach, 0), [activeTweets]);
  const totalEngagement = useMemo(() => activeTweets.reduce((sum, t) => sum + (t.totalEngagement || (t.engagement.likes + t.engagement.retweets + t.engagement.replies)), 0), [activeTweets]);

  const sentimentFilteredTweets = useMemo(() => {
    if (!selectedSentiment) return [];
    return activeTweets.filter(t => t.sentiment === selectedSentiment);
  }, [selectedSentiment, activeTweets]);

  // Top 10 tweets by engagement
  const top10Tweets = useMemo(() => {
    return [...activeTweets]
      .sort((a, b) => {
        const eA = a.totalEngagement || (a.engagement.likes + a.engagement.retweets + a.engagement.replies);
        const eB = b.totalEngagement || (b.engagement.likes + b.engagement.retweets + b.engagement.replies);
        return eB - eA;
      })
      .slice(0, 10);
  }, [activeTweets]);

  // Account analysis from Keywords column
  const accountCounts = useMemo(() => {
    const counts: Record<string, { count: number; positive: number; negative: number; neutral: number }> = {};
    activeTweets.forEach(t => {
      const kw = t.meltwaterKeywords || '';
      // Extract account mentions from Keywords field
      const accounts: string[] = [];
      if (/thmanyahsports|رياضة ثمانية/i.test(kw)) accounts.push('رياضة ثمانية');
      if (/(?:^|;)@?thmanyah(?:$|;)/i.test(kw) || /(?:^|;)ثمانية(?:$|;)/i.test(kw)) accounts.push('ثمانية');
      if (/قناة ثمانية|قنوات ثمانية/i.test(kw)) accounts.push('قنوات ثمانية');
      if (/thmanyahexit/i.test(kw)) accounts.push('ثمانية إكزت');
      if (/thmanyahliving/i.test(kw)) accounts.push('ثمانية ليفنغ');
      if (/radiothmanyah/i.test(kw)) accounts.push('راديو ثمانية');
      if (accounts.length === 0) accounts.push('أخرى');
      accounts.forEach(acc => {
        if (!counts[acc]) counts[acc] = { count: 0, positive: 0, negative: 0, neutral: 0 };
        counts[acc].count++;
        if (t.sentiment === 'إيجابي') counts[acc].positive++;
        else if (t.sentiment === 'سلبي') counts[acc].negative++;
        else counts[acc].neutral++;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
  }, [activeTweets]);

  // Content type distribution
  const contentTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTweets.forEach(t => {
      const ct = t.contentType || 'غير محدد';
      counts[ct] = (counts[ct] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeTweets]);

  // Helpers
  const getTopKeywords = (tweets: Tweet[], n: number): string[] => {
    const counts: Record<string, number> = {};
    tweets.forEach(t => t.keywords.forEach(k => { counts[k] = (counts[k] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  };

  const getTopEmotions = (tweets: Tweet[], n: number): string[] => {
    const counts: Record<string, number> = {};
    tweets.forEach(t => { counts[t.emotion] = (counts[t.emotion] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  };

  // Import handler
  const handleImport = (tweets: any[]) => {
    setImportedTweets(tweets as Tweet[]);
    setAnalysisState('ready');
    setAnalysisError('');
  };

  // AI Analysis — parallel batches, skip-on-error
  const handleStartAnalysis = async () => {
    if (!importedTweets) return;

    const keys = loadApiKeys();
    if (!keys.openrouter) {
      setAnalysisError('no-key');
      setAnalysisState('error');
      return;
    }

    const modelId = loadSelectedModel();
    setAnalysisState('analyzing');
    setAnalysisProgress(0);
    setAnalysisError('');

    const BATCH_SIZE = 8;
    const PARALLEL = 5;
    const analyzed = [...importedTweets];

    const batches: { startIdx: number; tweets: Tweet[] }[] = [];
    for (let i = 0; i < analyzed.length; i += BATCH_SIZE) {
      batches.push({ startIdx: i, tweets: analyzed.slice(i, i + BATCH_SIZE) });
    }

    let completedBatches = 0;

    const analyzeBatch = async (batch: { startIdx: number; tweets: Tweet[] }) => {
      const tweetsText = batch.tweets.map((t, i) => `[${i + 1}] ${t.text}`).join('\n');

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.openrouter}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          messages: [
            {
              role: 'system',
              content: `أنت محلل مشاعر متخصص في النصوص العربية. حلل التغريدات المرقمة وأرجع JSON فقط.
لكل تغريدة أرجع:
- index: رقم التغريدة (يبدأ من 1)
- sentiment: إيجابي أو سلبي أو محايد أو ساخر
- emotion: الفرح أو الغضب أو الحماس أو السخرية أو الإحباط أو الدعم أو الانتقاد أو محايد
- topics: قائمة 1-3 مواضيع
أرجع JSON بالشكل: {"results":[{"index":1,"sentiment":"...","emotion":"...","topics":["..."]},...]}
أجب بصيغة JSON فقط. لا تكتب أي نص قبل أو بعد الـ JSON.`,
            },
            { role: 'user', content: tweetsText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = safeParseJSON(content);
      const results = parsed.results || [];

      for (const r of results) {
        const idx = batch.startIdx + (r.index - 1);
        if (idx >= 0 && idx < analyzed.length) {
          analyzed[idx] = {
            ...analyzed[idx],
            sentiment: r.sentiment || analyzed[idx].sentiment,
            emotion: r.emotion || analyzed[idx].emotion,
            keywords: Array.isArray(r.topics) ? r.topics : analyzed[idx].keywords,
            topics: Array.isArray(r.topics) ? r.topics : [],
          };
        }
      }
    };

    let batchIndex = 0;
    const processNext = async (): Promise<void> => {
      const idx = batchIndex++;
      if (idx >= batches.length) return;
      try {
        await analyzeBatch(batches[idx]);
      } catch (err) {
        console.error(`Batch ${idx + 1}/${batches.length} failed, skipping:`, err);
      }
      completedBatches++;
      setAnalysisProgress(Math.round((completedBatches / batches.length) * 100));
      setActiveTweets([...analyzed]);
      return processNext();
    };

    await Promise.all(Array.from({ length: PARALLEL }, () => processNext()));
    setActiveTweets([...analyzed]);

    // Phase 2: Generate report insights
    setAnalysisState('generating-report');
    setAnalysisProgress(100);

    try {
      const sentimentSummary = {
        positive: analyzed.filter(t => t.sentiment === 'إيجابي').length,
        negative: analyzed.filter(t => t.sentiment === 'سلبي').length,
        neutral: analyzed.filter(t => t.sentiment === 'محايد').length,
      };
      const kwList = getTopKeywords(analyzed, 10);
      const emList = getTopEmotions(analyzed, 10);

      // Top 10 by engagement for the prompt
      const top10 = [...analyzed]
        .sort((a, b) => {
          const eA = a.totalEngagement || (a.engagement.likes + a.engagement.retweets + a.engagement.replies);
          const eB = b.totalEngagement || (b.engagement.likes + b.engagement.retweets + b.engagement.replies);
          return eB - eA;
        })
        .slice(0, 10);
      const top10Text = top10.map((t, i) => {
        const eng = t.totalEngagement || (t.engagement.likes + t.engagement.retweets + t.engagement.replies);
        return `${i + 1}. [${t.author}] (تفاعل: ${eng}) ${t.text.slice(0, 150)}`;
      }).join('\n');

      // Content type distribution
      const ctDist: Record<string, number> = {};
      analyzed.forEach(t => { ctDist[t.contentType || 'unknown'] = (ctDist[t.contentType || 'unknown'] || 0) + 1; });
      const ctText = Object.entries(ctDist).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', ');

      // Account mentions
      const accMentions: Record<string, number> = {};
      analyzed.forEach(t => {
        const kw = t.meltwaterKeywords || '';
        if (/thmanyahsports/i.test(kw)) accMentions['رياضة ثمانية'] = (accMentions['رياضة ثمانية'] || 0) + 1;
        if (/(?:^|;)@?thmanyah(?:$|;)/i.test(kw)) accMentions['ثمانية'] = (accMentions['ثمانية'] || 0) + 1;
      });
      const accText = Object.entries(accMentions).map(([k, v]) => `${k}: ${v} ذكر`).join(', ');

      // Top hashtags
      const hashCounts: Record<string, number> = {};
      analyzed.forEach(t => {
        if (t.hashtags) {
          t.hashtags.split(';').map(h => h.trim()).filter(Boolean).forEach(h => {
            hashCounts[h] = (hashCounts[h] || 0) + 1;
          });
        }
      });
      const topHashtags = Object.entries(hashCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([h, c]) => `${h} (${c})`).join(', ');

      const samplePos = analyzed.filter(t => t.sentiment === 'إيجابي').slice(0, 3).map(t => t.text.slice(0, 100));
      const sampleNeg = analyzed.filter(t => t.sentiment === 'سلبي').slice(0, 3).map(t => t.text.slice(0, 100));

      const reportPrompt = `أنت محلل بيانات متخصص في وسائل التواصل الاجتماعي لشركة ثمانية الإعلامية السعودية.

حللت ${analyzed.length} منشور. النتائج:

المشاعر: إيجابي ${sentimentSummary.positive} (${Math.round(100 * sentimentSummary.positive / analyzed.length)}%) | سلبي ${sentimentSummary.negative} (${Math.round(100 * sentimentSummary.negative / analyzed.length)}%) | محايد ${sentimentSummary.neutral}
أنواع المحتوى: ${ctText}
الحسابات: ${accText || 'غير متوفر'}
هاشتاقات: ${topHashtags || 'لا يوجد'}
كلمات: ${kwList.join('، ')}
مشاعر: ${emList.join('، ')}

أكثر 10 تغريدات تفاعلاً:
${top10Text}

عينة إيجابية: ${samplePos.join(' | ')}
عينة سلبية: ${sampleNeg.join(' | ')}

أعطني تحليلاً بصيغة JSON:
{"overall_summary":"ملخص 3-4 جمل","sentiment_analysis":"تحليل مشاعر 2-3 جمل","visuals":{"description":"وصف ما تفاعل عليه الناس","top_topics":["موضوع1","موضوع2"],"key_moments":["لحظة1","لحظة2"]},"top_tweets_analysis":[{"rank":1,"author":"@handle","engagement":2055,"summary":"وصف","why_viral":"لماذا"}],"themes":[{"name":"...","description":"...","percentage":25}],"insights":[{"title":"...","description":"..."}],"recommendations":[{"title":"...","description":"...","priority":"high"}],"account_analysis":{"رياضة ثمانية":{"mentions":2703,"sentiment_summary":"..."}}}

3-5 لكل قسم. 10 تغريدات في top_tweets_analysis. بالعربية.
أجب بصيغة JSON فقط. لا تكتب أي نص قبل أو بعد الـ JSON.`;

      const reportRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${keys.openrouter}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          messages: [{ role: 'user', content: reportPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0,
        }),
      });

      if (!reportRes.ok) throw new Error(`Report API error: ${reportRes.status}`);
      const reportData = await reportRes.json();
      const reportContent = reportData.choices?.[0]?.message?.content || '{}';
      const insights = safeParseJSON(reportContent) as ReportInsights;
      setReportInsights(insights);

      // Auto-save report to Supabase
      const posCount = analyzed.filter(t => t.sentiment === 'إيجابي').length;
      const negCount = analyzed.filter(t => t.sentiment === 'سلبي').length;
      const neuCount = analyzed.filter(t => t.sentiment === 'محايد').length;
      try {
        await (supabase as any).from('meltwater_reports').insert({
          title: `تقرير ${new Date().toLocaleDateString('ar-SA')} — ${analyzed.length} منشور`,
          tweet_count: analyzed.length,
          positive_count: posCount,
          negative_count: negCount,
          neutral_count: neuCount,
          model_used: modelId,
          report_insights: insights,
          analyzed_tweets: analyzed,
          summary: insights.overall_summary || '',
        });
        queryClient.invalidateQueries({ queryKey: ['meltwater-reports'] });
      } catch (_) { /* silent */ }

      setAnalysisState('done');
    } catch (err: any) {
      setAnalysisError(err.message || 'حدث خطأ أثناء إعداد التقرير');
      setAnalysisState('done'); // still show Phase 1 data
    }
  };

  const handleUseDirectly = () => {
    if (!importedTweets) return;
    setActiveTweets(importedTweets);
    setReportInsights(null);
    setAnalysisState('done');
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "إيجابي": return "bg-thmanyah-green/10 text-thmanyah-green border-thmanyah-green/20";
      case "سلبي": return "bg-thmanyah-red/10 text-thmanyah-red border-thmanyah-red/20";
      case "ساخر": return "bg-thmanyah-amber/10 text-thmanyah-amber border-thmanyah-amber/20";
      default: return "bg-muted text-muted-foreground border-border/50";
    }
  };

  const getEmotionBadge = (emotion: string) => {
    const map: Record<string, string> = {
      "الفرح": "bg-thmanyah-green/10 text-thmanyah-green",
      "الغضب": "bg-thmanyah-red/10 text-thmanyah-red",
      "الحماس": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "السخرية": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "الإحباط": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "الدعم": "bg-thmanyah-green/10 text-thmanyah-green",
      "الانتقاد": "bg-thmanyah-red/10 text-thmanyah-red",
      "إعجاب": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "غضب": "bg-thmanyah-red/10 text-thmanyah-red",
      "حماس": "bg-thmanyah-green/10 text-thmanyah-green",
      "فخر": "bg-purple-500/10 text-purple-600",
      "استياء": "bg-thmanyah-amber/10 text-thmanyah-amber",
    };
    return map[emotion] || "bg-muted text-muted-foreground";
  };

  // Account bar chart data
  const accountChartData = useMemo(() => {
    const COLORS = ['#0072F9', '#00C17A', '#F24935', '#FFBC0A', '#8B5CF6', '#FF00B7'];
    return accountCounts.map(([name, data], i) => ({
      name,
      value: data.count,
      color: COLORS[i % COLORS.length],
    }));
  }, [accountCounts]);

  return (
    <div ref={mainRef} className="max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <PageExplainer
        icon={BarChart3}
        title="تقارير Meltwater"
        description="استيراد وتحليل بيانات Meltwater بالذكاء الاصطناعي — تحليل المشاعر والمواضيع والرؤى"
        color="#8B5CF6"
      />

      {/* ── Previous Reports ── */}
      {savedReports && savedReports.length > 0 && (
        <div className="card-stagger space-y-3" style={{ animationDelay: "0.03s" }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
            <h3 className="text-[14px] font-display font-bold text-foreground/70">التقارير السابقة</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {savedReports.map((report) => {
              const total = report.positive_count + report.negative_count + report.neutral_count;
              const posPct = total ? Math.round((report.positive_count / total) * 100) : 0;
              const negPct = total ? Math.round((report.negative_count / total) * 100) : 0;
              const neuPct = total ? Math.round((report.neutral_count / total) * 100) : 0;
              return (
                <div key={report.id} onClick={() => handleLoadReport(report)}
                  className="shrink-0 w-[260px] rounded-2xl bg-card border border-border/40 p-4 cursor-pointer hover:border-thmanyah-blue/40 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-[12px] font-bold text-foreground/80 leading-snug line-clamp-2">{report.title}</h4>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                      className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-thmanyah-red/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5 text-thmanyah-red" />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 mb-2">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ar })}
                    {' · '}<span className="nums-en">{report.tweet_count}</span> منشور
                  </p>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/20 mb-2">
                    <div className="bg-thmanyah-green" style={{ width: `${posPct}%` }} />
                    <div className="bg-muted-foreground/30" style={{ width: `${neuPct}%` }} />
                    <div className="bg-thmanyah-red" style={{ width: `${negPct}%` }} />
                  </div>
                  {report.summary && <p className="text-[10px] font-bold text-muted-foreground/40 leading-relaxed line-clamp-2">{report.summary}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section Navigation ── */}
      {activeTweets.length > 0 && (
        <nav className="card-stagger sticky top-16 z-30 -mx-2 px-2 py-3 bg-background/80 backdrop-blur-xl border-b border-border/30" style={{ animationDelay: "0.05s" }}>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                    isActive ? "bg-foreground text-white shadow-md" : "bg-card border border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border"
                  }`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── Data Import & Export ── */}
      <div className="card-stagger grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animationDelay: "0.1s" }}>
        <DataImport onImport={handleImport} />
        <ExcelExport tweets={activeTweets as any} reportDate={new Date().toISOString().slice(0, 10)} />
      </div>

      {/* ── Analysis Controls ── */}
      {analysisState !== 'idle' && analysisState !== 'done' && (
        <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6 text-center space-y-4" style={{ animationDelay: "0.15s" }}>
          {analysisState === 'ready' && (
            <>
              <div className="flex items-center justify-center gap-2 text-thmanyah-green mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-[14px] font-bold">تم استيراد {formatSmart(importedTweets?.length || 0)} منشور بنجاح</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={handleStartAnalysis}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-thmanyah-green text-white font-bold text-[15px] hover:bg-thmanyah-green/90 transition-all shadow-lg shadow-thmanyah-green/20">
                  <Play className="w-5 h-5" />
                  ابدأ التحليل
                </button>
                <button onClick={handleUseDirectly}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border/40 text-muted-foreground font-bold text-[13px] hover:bg-muted/30 transition-all">
                  استخدام البيانات مباشرة
                </button>
              </div>
            </>
          )}
          {analysisState === 'analyzing' && (
            <>
              <Loader2 className="w-8 h-8 text-thmanyah-green animate-spin mx-auto" />
              <p className="text-[14px] font-bold text-foreground/80">جاري التحليل...</p>
              <Progress value={analysisProgress} className="max-w-xs mx-auto h-2" />
              <p className="text-[11px] font-bold text-muted-foreground/40">{analysisProgress}%</p>
            </>
          )}
          {analysisState === 'generating-report' && (
            <>
              <Loader2 className="w-8 h-8 text-thmanyah-blue animate-spin mx-auto" />
              <p className="text-[14px] font-bold text-foreground/80">جاري إعداد التقرير الشامل...</p>
            </>
          )}
          {analysisState === 'error' && (
            <div className="space-y-3">
              {analysisError === 'no-key' ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-thmanyah-red">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[14px] font-bold">يجب إضافة مفتاح OpenRouter API أولاً</span>
                  </div>
                  <Link to="/settings" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-thmanyah-blue hover:underline">
                    الذهاب للإعدادات <ExternalLink className="w-3 h-3" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-thmanyah-red">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[14px] font-bold">{analysisError}</span>
                  </div>
                  <button onClick={handleStartAnalysis} className="text-[12px] font-bold text-thmanyah-blue hover:underline">إعادة المحاولة</button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          REPORT SECTIONS — only show when we have data
          ════════════════════════════════════════════════════════════ */}
      {activeTweets.length > 0 && (
        <>
          {/* ═══ 1. الملخص العام ═══ */}
          <section id="summary" className="scroll-mt-32 space-y-5">
            <SectionHeading icon={FileText} color="#8B5CF6">الملخص العام</SectionHeading>

            {reportInsights && (
              <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6 space-y-4" style={{ animationDelay: "0s" }}>
                <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">{reportInsights.overall_summary}</p>
                <div className="h-px bg-border/40" />
                <p className="text-[12px] font-bold text-muted-foreground/60 leading-relaxed">{reportInsights.sentiment_analysis}</p>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard label="المنشورات" value={formatSmart(totalTweets)} sub="إجمالي" color="#8B5CF6" delay={0} />
              <KpiCard label="إيجابي" value={`${sentimentPercentages.positive}%`} sub={`${formatSmart(sentimentCounts.positive)}`} color="#00C17A" delay={1} />
              <KpiCard label="سلبي" value={`${sentimentPercentages.negative}%`} sub={`${formatSmart(sentimentCounts.negative)}`} color="#F24935" delay={2} />
              <KpiCard label="محايد" value={`${sentimentPercentages.neutral}%`} sub={`${formatSmart(sentimentCounts.neutral)}`} color="#6B7280" delay={3} />
              <KpiCard label="الوصول" value={formatSmart(totalReach)} sub="إجمالي" color="#0072F9" delay={4} />
              <KpiCard label="التفاعل" value={formatSmart(totalEngagement)} sub="إجمالي" color="#FFBC0A" delay={5} />
            </div>
          </section>

          {/* ═══ 2. المرئيات ═══ */}
          {reportInsights?.visuals && (
            <section id="visuals" className="scroll-mt-32 space-y-5">
              <SectionHeading icon={Sparkles} color="#FF00B7">ما تفاعل عليه الناس</SectionHeading>

              <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6 space-y-4" style={{ animationDelay: "0s" }}>
                <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">{reportInsights.visuals.description}</p>

                {reportInsights.visuals.top_topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reportInsights.visuals.top_topics.map((topic, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[12px] font-bold text-purple-600">{topic}</span>
                    ))}
                  </div>
                )}

                {reportInsights.visuals.key_moments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <h4 className="text-[12px] font-display font-bold text-foreground/60">اللحظات الرئيسية</h4>
                    {reportInsights.visuals.key_moments.map((moment, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="shrink-0 w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px] font-bold text-purple-600">{i + 1}</div>
                        <p className="text-[12px] font-bold text-muted-foreground/60 leading-relaxed">{moment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═══ 3. أكثر ١٠ تغريدات تفاعلاً ═══ */}
          <section id="top10" className="scroll-mt-32 space-y-5">
            <SectionHeading icon={Trophy} color="#FFBC0A">أكثر ١٠ منشورات تفاعلاً</SectionHeading>

            <div className="space-y-3">
              {top10Tweets.map((tweet, i) => {
                const eng = tweet.totalEngagement || (tweet.engagement.likes + tweet.engagement.retweets + tweet.engagement.replies);
                const aiAnalysis = reportInsights?.top_tweets_analysis?.find(t => t.rank === i + 1);
                const RANK_COLORS = ['#FFBC0A', '#C0C0C0', '#CD7F32', '#8B5CF6', '#0072F9', '#00C17A', '#F24935', '#FF00B7', '#84DBE5', '#6B7280'];

                return (
                  <div key={tweet.id} className="card-stagger rounded-2xl bg-card border border-border/40 p-5 hover:border-thmanyah-amber/30 transition-colors" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                    <div className="flex items-start gap-4">
                      {/* Rank badge */}
                      <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold shadow-lg"
                        style={{ backgroundColor: RANK_COLORS[i] }}>
                        #{i + 1}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-foreground/80">{tweet.authorName || tweet.author}</span>
                          {tweet.authorHandle && <span className="text-[11px] text-muted-foreground/40" dir="ltr">{tweet.authorHandle.startsWith('@') ? tweet.authorHandle : `@${tweet.authorHandle}`}</span>}
                        </div>

                        {/* Text */}
                        <p className="text-[13px] leading-relaxed text-foreground/80">{tweet.text}</p>

                        {/* AI analysis */}
                        {aiAnalysis && (
                          <div className="p-3 rounded-xl bg-thmanyah-amber/[0.04] border border-thmanyah-amber/10 space-y-1">
                            <p className="text-[11px] font-bold text-foreground/70">{aiAnalysis.summary}</p>
                            <p className="text-[10px] font-bold text-thmanyah-amber/70">{aiAnalysis.why_viral}</p>
                          </div>
                        )}

                        {/* Engagement metrics */}
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/50">
                          <span className="inline-flex items-center gap-1"><HeartIcon className="w-3 h-3" />{formatSmart(tweet.engagement.likes)}</span>
                          <span className="inline-flex items-center gap-1"><Repeat2 className="w-3 h-3" />{formatSmart(tweet.engagement.retweets)}</span>
                          <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" />{formatSmart(tweet.engagement.replies)}</span>
                          {tweet.views ? <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{formatSmart(tweet.views)}</span> : null}
                          <span className="inline-flex items-center gap-1 text-thmanyah-amber font-bold">تفاعل: {formatSmart(eng)}</span>
                          {tweet.url && (
                            <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-thmanyah-blue hover:underline mr-auto">
                              <ExternalLink className="w-3 h-3" />رابط
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══ 4. توزيع المشاعر ═══ */}
          <section id="sentiment" className="scroll-mt-32 space-y-5">
            <SectionHeading icon={Heart} color="#E4405F">توزيع المشاعر والعواطف</SectionHeading>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6">
                <h3 className="text-[14px] font-display font-bold text-foreground/80 mb-4">توزيع المشاعر</h3>
                <SentimentPieChart
                  positive={sentimentCounts.positive}
                  negative={sentimentCounts.negative}
                  neutral={sentimentCounts.neutral}
                  onSliceClick={(sentiment) => setSelectedSentiment(selectedSentiment === sentiment ? null : sentiment)}
                />
              </div>

              <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6">
                <h3 className="text-[14px] font-display font-bold text-foreground/80 mb-4">توزيع العواطف</h3>
                <div className="space-y-2.5">
                  {Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => (
                    <div key={emotion} className="flex items-center gap-3">
                      <Badge className={`${getEmotionBadge(emotion)} border-0 text-[11px] font-bold min-w-[60px] justify-center`}>{emotion}</Badge>
                      <Progress value={(count / totalTweets) * 100} className="flex-1 h-2" />
                      <span className="text-[11px] font-bold text-muted-foreground/50 w-8 text-left">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedSentiment && (
              <div className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-display font-bold text-foreground/80">منشورات &ldquo;{selectedSentiment}&rdquo;</h3>
                    <Badge className="bg-foreground text-white border-0 text-[10px] font-bold">{sentimentFilteredTweets.length}</Badge>
                  </div>
                  <button onClick={() => setSelectedSentiment(null)} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <X className="w-4 h-4 text-muted-foreground/40" />
                  </button>
                </div>
                <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto">
                  {sentimentFilteredTweets.slice(0, 50).map(tweet => (
                    <div key={tweet.id} className="px-5 py-4 hover:bg-muted/10 transition-colors">
                      <p className="text-[11px] font-bold text-muted-foreground/50">{tweet.author}</p>
                      <p className="text-[13px] mt-1 leading-relaxed text-foreground/80">{tweet.text}</p>
                      <div className="flex gap-3 mt-2 text-[10px] font-bold text-muted-foreground/40">
                        <span>{formatSmart(tweet.engagement.likes)} إعجاب</span>
                        <span>{formatSmart(tweet.engagement.retweets)} إعادة</span>
                        <span>{formatSmart(tweet.reach)} وصول</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ═══ 5. المواضيع الرئيسية ═══ */}
          {reportInsights && reportInsights.themes.length > 0 && (
            <section id="themes" className="scroll-mt-32 space-y-5">
              <SectionHeading icon={Target} color="#FFBC0A">المواضيع الرئيسية</SectionHeading>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reportInsights.themes.map((theme, i) => {
                  const colors = ["#0072F9", "#00C17A", "#FFBC0A", "#F24935", "#8B5CF6"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={i} className="card-stagger rounded-2xl bg-card border border-border/40 p-5" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[13px] font-bold text-foreground/80">{theme.name}</h4>
                        <span className="text-[11px] font-bold" style={{ color }}>{theme.percentage}%</span>
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed mb-3">{theme.description}</p>
                      <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${theme.percentage}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ 6. الرؤى والملاحظات ═══ */}
          {reportInsights && reportInsights.insights.length > 0 && (
            <section id="insights" className="scroll-mt-32 space-y-5">
              <SectionHeading icon={Lightbulb} color="#0072F9">الرؤى والملاحظات</SectionHeading>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reportInsights.insights.map((insight, i) => (
                  <div key={i} className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-5" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 p-2 rounded-xl bg-thmanyah-blue/[0.06]">
                        <Lightbulb className="w-4 h-4 text-thmanyah-blue" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-foreground/85 mb-1">{insight.title}</h4>
                        <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══ 7. التوصيات ═══ */}
          {reportInsights && reportInsights.recommendations.length > 0 && (
            <section id="recommendations" className="scroll-mt-32 space-y-5">
              <SectionHeading icon={CheckCircle} color="#00C17A">التوصيات</SectionHeading>

              <div className="space-y-4">
                {reportInsights.recommendations.map((rec, i) => (
                  <div key={i} className="card-stagger rounded-2xl bg-card border border-border/40 p-5" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 p-2 rounded-xl bg-thmanyah-green/[0.06]">
                        <CheckCircle className="w-4 h-4 text-thmanyah-green" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[13px] font-bold text-foreground/85">{rec.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.priority === 'high' ? 'bg-thmanyah-red/10 text-thmanyah-red' :
                            rec.priority === 'medium' ? 'bg-thmanyah-amber/10 text-thmanyah-amber' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {rec.priority === 'high' ? 'عالية' : rec.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══ 8. تحليل الحسابات ═══ */}
          {accountCounts.length > 0 && (
            <section id="accounts" className="scroll-mt-32 space-y-5">
              <SectionHeading icon={Building2} color="#0072F9">تحليل الحسابات</SectionHeading>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Bar chart */}
                <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6">
                  <h3 className="text-[14px] font-display font-bold text-foreground/80 mb-4">الذكر حسب الحساب</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={accountChartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                        <Tooltip content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="bg-card p-3 border border-border rounded-xl shadow-lg">
                                <p className="font-bold text-[12px]">{payload[0].payload.name}</p>
                                <p className="text-[11px] text-muted-foreground">{formatSmart(payload[0].value as number)} ذكر</p>
                              </div>
                            );
                          }
                          return null;
                        }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {accountChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Account cards */}
                <div className="space-y-3">
                  {accountCounts.map(([name, data], i) => {
                    const total = data.count;
                    const posPct = total ? Math.round((data.positive / total) * 100) : 0;
                    const negPct = total ? Math.round((data.negative / total) * 100) : 0;
                    const aiSummary = reportInsights?.account_analysis?.[name]?.sentiment_summary;
                    return (
                      <div key={name} className="card-stagger rounded-xl bg-card border border-border/40 p-4" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[13px] font-bold text-foreground/80">{name}</h4>
                          <span className="text-[11px] font-bold text-muted-foreground/50">{formatSmart(data.count)} ذكر</span>
                        </div>
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/20 mb-2">
                          <div className="bg-thmanyah-green" style={{ width: `${posPct}%` }} />
                          <div className="bg-muted-foreground/30" style={{ width: `${100 - posPct - negPct}%` }} />
                          <div className="bg-thmanyah-red" style={{ width: `${negPct}%` }} />
                        </div>
                        <div className="flex gap-3 text-[10px] font-bold text-muted-foreground/40">
                          <span className="text-thmanyah-green">{posPct}% إيجابي</span>
                          <span className="text-thmanyah-red">{negPct}% سلبي</span>
                        </div>
                        {aiSummary && <p className="text-[10px] font-bold text-muted-foreground/40 mt-2 leading-relaxed">{aiSummary}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content type distribution */}
              {contentTypeCounts.length > 0 && (
                <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6">
                  <h3 className="text-[14px] font-display font-bold text-foreground/80 mb-4">نوع المحتوى</h3>
                  <div className="flex flex-wrap gap-3">
                    {contentTypeCounts.map(([type, count]) => (
                      <div key={type} className="px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30">
                        <span className="text-[12px] font-bold text-foreground/70">{type}</span>
                        <span className="text-[11px] font-bold text-muted-foreground/40 mr-2">{formatSmart(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ═══ 9. سحابة الكلمات ═══ */}
          <section id="wordcloud" className="scroll-mt-32 space-y-5">
            <SectionHeading icon={Target} color="#FF00B7">سحابة الكلمات</SectionHeading>
            <WordCloud tweets={activeTweets as any} />
          </section>

          {/* ═══ 10. التوزيع الزمني ═══ */}
          <section id="timeline" className="scroll-mt-32 space-y-5">
            <SectionHeading icon={TrendingUp} color="#0072F9">التحليل الزمني</SectionHeading>
            <TimelineCharts tweets={activeTweets as any} />
          </section>

          {/* ═══ 11. جميع التغريدات ═══ */}
          <section id="tweets" className="scroll-mt-32 space-y-5">
            <div className="flex items-center gap-2">
              <SectionHeading icon={MessageSquare} color="#494C6B">جميع المنشورات</SectionHeading>
              <Badge className="bg-foreground text-white border-0 text-[10px] font-bold mr-2">{formatSmart(totalTweets)}</Badge>
            </div>

            {/* Sort controls */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {([
                ['newest', 'الأحدث'],
                ['engagement', 'الأكثر تفاعلاً'],
                ['reach', 'الأكثر وصولاً'],
                ['positive', 'إيجابي فقط'],
                ['negative', 'سلبي فقط'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => { setTweetSort(key); setTweetListLimit(30); }}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    tweetSort === key ? 'bg-foreground text-white' : 'bg-card border border-border/40 text-muted-foreground/60 hover:text-foreground'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {(() => {
              let sorted = [...activeTweets];
              switch (tweetSort) {
                case 'engagement':
                  sorted.sort((a, b) => {
                    const eA = a.totalEngagement || (a.engagement.likes + a.engagement.retweets + a.engagement.replies);
                    const eB = b.totalEngagement || (b.engagement.likes + b.engagement.retweets + b.engagement.replies);
                    return eB - eA;
                  });
                  break;
                case 'reach':
                  sorted.sort((a, b) => b.reach - a.reach);
                  break;
                case 'positive':
                  sorted = sorted.filter(t => t.sentiment === 'إيجابي');
                  break;
                case 'negative':
                  sorted = sorted.filter(t => t.sentiment === 'سلبي');
                  break;
              }
              const visible = sorted.slice(0, tweetListLimit);
              const hasMore = tweetListLimit < sorted.length;

              return (
                <>
                  <div className="space-y-2.5">
                    {visible.map((tweet, i) => {
                      const isExpanded = expandedTweets.has(tweet.id);
                      const isLong = tweet.text.length > 200;
                      const displayText = isLong && !isExpanded ? tweet.text.slice(0, 200) + '...' : tweet.text;

                      return (
                        <div key={tweet.id} className="card-stagger rounded-xl bg-card border border-border/30 px-5 py-4 hover:border-thmanyah-green/30 transition-colors"
                          style={{ animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-[12px] font-bold text-foreground/80">{tweet.authorName || tweet.author}</p>
                            {tweet.authorHandle && <span className="text-[10px] text-muted-foreground/40" dir="ltr">{tweet.authorHandle.startsWith('@') ? tweet.authorHandle : `@${tweet.authorHandle}`}</span>}
                            {tweet.date && <span className="text-[10px] text-muted-foreground/30 mr-auto">{tweet.date}</span>}
                          </div>

                          <p className="text-[13px] leading-relaxed text-foreground/80 mb-3">
                            {displayText}
                            {isLong && !isExpanded && (
                              <button onClick={() => setExpandedTweets(prev => new Set(prev).add(tweet.id))}
                                className="text-thmanyah-blue text-[11px] font-bold mr-1 hover:underline">المزيد...</button>
                            )}
                          </p>

                          <div className="flex items-center gap-4 mb-2 text-[10px] font-bold text-muted-foreground/50">
                            <span className="inline-flex items-center gap-1"><HeartIcon className="w-3 h-3" />{formatSmart(tweet.engagement.likes)}</span>
                            <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" />{formatSmart(tweet.engagement.replies)}</span>
                            <span className="inline-flex items-center gap-1"><Repeat2 className="w-3 h-3" />{formatSmart(tweet.engagement.retweets)}</span>
                            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{formatSmart(tweet.reach)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={`${getSentimentBadge(tweet.sentiment)} border text-[10px] font-bold`}>{tweet.sentiment}</Badge>
                            <Badge className={`${getEmotionBadge(tweet.emotion)} border-0 text-[10px] font-bold`}>{tweet.emotion}</Badge>
                            <div className="flex-1" />
                            {tweet.url && (
                              <a href={tweet.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-thmanyah-blue hover:underline">
                                <ExternalLink className="w-3 h-3" />رابط
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center pt-2">
                      <button onClick={() => setTweetListLimit(prev => prev + 30)}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-muted/40 border border-border/30 text-[12px] font-bold text-muted-foreground/60 hover:text-foreground hover:border-border transition-all">
                        <ChevronDown className="w-3.5 h-3.5" />
                        عرض المزيد ({formatSmart(sorted.length - tweetListLimit)} متبقية)
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        </>
      )}

      {/* ── Back to top ── */}
      {activeTweets.length > 0 && (
        <div className="flex justify-center pb-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/40 border border-border/30 text-[11px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all">
            <ChevronUp className="w-3.5 h-3.5" />
            العودة للأعلى
          </button>
        </div>
      )}
    </div>
  );
};

export default MeltwaterReport;

/* ══════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════ */

function SectionHeading({ icon: Icon, color, children }: { icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}10`, color }}>
        <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
      </div>
      <h2 className="text-lg font-display font-bold text-foreground/85">{children}</h2>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

function KpiCard({ label, value, sub, color, delay }: { label: string; value: string; sub: string; color: string; delay: number }) {
  return (
    <div className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-5" style={{ animationDelay: `${delay * 0.06}s` }}>
      <p className="text-[11px] font-bold mb-2" style={{ color: `${color}99` }}>{label}</p>
      <p className="text-2xl font-bold mb-1" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground/40">{sub}</p>
    </div>
  );
}
