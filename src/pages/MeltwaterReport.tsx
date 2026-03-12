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
  Users,
  TrendingUp,
  FileText,
  ExternalLink,
  X,
  ChevronUp,
  Loader2,
  Play,
} from 'lucide-react';
import PageExplainer from '@/components/PageExplainer';
import { SentimentPieChart } from '@/components/SentimentPieChart';
import { TopicCategorization } from '@/components/meltwater/TopicCategorization';
import { TimelineCharts } from '@/components/meltwater/TimelineCharts';
import { TopicKPIs } from '@/components/meltwater/TopicKPIs';
import { ExcelExport } from '@/components/meltwater/ExcelExport';
import { AboutThamanyah } from '@/components/meltwater/AboutThamanyah';
import { WordCloud } from '@/components/meltwater/WordCloud';
import { DataImport } from '@/components/meltwater/DataImport';
import { Link } from 'react-router-dom';
import { loadApiKeys, loadSelectedModel } from '@/lib/settings';

/* ══════════════════════════════════════════════════════════════
   Sample Data
   ══════════════════════════════════════════════════════════════ */

const SAMPLE_TWEETS = [
  { id: 1, text: "ماشاء الله شرح تفصيلي ومشوق ما تمنيت الفيديو يخلص ...عمل جبار تشكرون عليه", author: "@reich_hadhrmi", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["شرح", "عمل جبار", "مشوق"], reach: 210, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 2, text: "قناه المدلل الزرقاء تطبل لهدف ضمك اللي خسرر واندعس", author: "@qcu8ero", sentiment: "سلبي", emotion: "غضب", keywords: ["تطبل", "خسر", "اندعس"], reach: 223, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 3, text: "كالعادة .. قناة ثمانية مع لقطة جواو فيلكس .. شاهد ماشفش حاجة !!", author: "@Aljamaz8910", sentiment: "سلبي", emotion: "إحباط", keywords: ["كالعادة", "ماشفش حاجة", "لقطة"], reach: 799, engagement: { likes: 0, retweets: 11, replies: 0 } },
  { id: 4, text: "في كل مكان ، كريستيانو رونالدو حاضر 🔝🐐", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "حماس", keywords: ["رونالدو", "حاضر", "كريستيانو"], reach: 12760, engagement: { likes: 0, retweets: 1, replies: 0 } },
  { id: 5, text: "960 هدف ⚽️ رقم جديد للأسطورة كريستيانو رونالدو 🐐", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "فخر", keywords: ["هدف", "أسطورة", "رقم جديد"], reach: 4160, engagement: { likes: 0, retweets: 3, replies: 0 } },
  { id: 6, text: "اما ثمانية ابومالح فتوجهها بات معلوم للجميع للاسف استغلال الحالة النصراوية للضغط وتشتيت الفريق", author: "@Turki_alharbi44", sentiment: "سلبي", emotion: "استياء", keywords: ["استغلال", "تشتيت", "ابومالح"], reach: 341, engagement: { likes: 0, retweets: 1, replies: 0 } },
  { id: 7, text: "مراوغة ⬅️➡️ ثم هدف 🎯 #دوري_روشن_السعودي", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "إثارة", keywords: ["مراوغة", "هدف", "دوري روشن"], reach: 436, engagement: { likes: 0, retweets: 6, replies: 0 } },
  { id: 8, text: "عرضية ساحرة من جواو فيليكس 🤩 #ضمك_النصر", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["ساحرة", "عرضية", "جواو فيليكس"], reach: 2140, engagement: { likes: 0, retweets: 1, replies: 0 } },
  { id: 9, text: "محاولة تلو الأخرى 🚀 والأسطورة رونالدو دائمًا يصل إلى الشباك ⚽️✅", author: "@thmanyahsports", sentiment: "إيجابي", emotion: "حماس", keywords: ["محاولة", "أسطورة", "الشباك"], reach: 804, engagement: { likes: 0, retweets: 2, replies: 0 } },
  { id: 10, text: "بما ان نادي أبها أفضل فريق في يلو هو أكثر نادي محتاج رضاء قناة ثمانية لتسليط الأضواء عليهم", author: "@mode_sh10", sentiment: "محايد", emotion: "تساؤل", keywords: ["أبها", "يلو", "تسليط الأضواء"], reach: 611, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 11, text: "ماذا يحدث في اليمن؟ 🇾🇪 إذا وقفت أمام كل الأخبار عن اليمن ولم تفهم أغلب ما تقرأه، فأنت مثل أغلب العرب", author: "@thmanyah", sentiment: "محايد", emotion: "فضول", keywords: ["اليمن", "أخبار", "شرح"], reach: 413, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 12, text: "قط رسبت في مادة، أو أخذت فيها درجة دنيئة، وكان السبب أنك لم تدرسها بالعربية؟", author: "@thmanyah", sentiment: "محايد", emotion: "تساؤل", keywords: ["رسبت", "مادة", "العربية"], reach: 75960, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 13, text: "كالعادة تعمد إخفاء شعبية النصر من قبل الهلالي ابومالح وقناته #ثمانية", author: "@Alqeeran", sentiment: "سلبي", emotion: "غضب", keywords: ["إخفاء", "شعبية", "ابومالح"], reach: 41, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 14, text: "محمد الخميس ينتقد الناقل الرسمي للدوري 'ثمانية' امس حتى مباراة الاهلي فيها مشاكل بدائية في البث", author: "@1432nayif", sentiment: "سلبي", emotion: "انتقاد", keywords: ["ينتقد", "مشاكل", "البث"], reach: 244, engagement: { likes: 0, retweets: 5, replies: 0 } },
  { id: 15, text: "اكيد قناة ثمانية متعاقدين مع فارس عوض عشان يغني راب", author: "@kfa7i", sentiment: "محايد", emotion: "سخرية", keywords: ["فارس عوض", "راب", "متعاقدين"], reach: 27420, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 16, text: "حسبي الله ونعم الوكيل", author: "@himo1947", sentiment: "سلبي", emotion: "استياء", keywords: ["حسبي الله"], reach: 3100, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 17, text: "مبدع ابن العم كعادتك♥️", author: "@i4wlk", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["مبدع", "كعادتك"], reach: 5, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 18, text: "في الفيديوهات التأريخية التوثيقية لايريد الحديث إلا عن أشياء مؤكدة صلبة عليها دليل", author: "@tamrh2016", sentiment: "إيجابي", emotion: "تقدير", keywords: ["تأريخية", "توثيقية", "دليل"], reach: 130, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 19, text: "صباح الخير 🌹 يا جماعة الخير، أبي اشتراك IPTV كفو وبدون أي تقطيع يكون شامل قنوات ثمانية", author: "@MhmdAlshmr79531", sentiment: "محايد", emotion: "طلب", keywords: ["IPTV", "قنوات ثمانية", "بدون تقطيع"], reach: 19, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 20, text: "ابو ثمانيه 🤣", author: "@4ramosz", sentiment: "محايد", emotion: "سخرية", keywords: ["ابو ثمانيه"], reach: 8, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 21, text: "هدفنا الانتصار 14 في الدوري 💫 الليلة موعدنا 💙", author: "@Alhilal_FC", sentiment: "إيجابي", emotion: "حماس", keywords: ["الانتصار", "الدوري", "الهلال"], reach: 1580, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 22, text: "عبدالكريم الجاسر: عندما كان يرأس النصر رئيس ميوله هلالية، سعود السويلم حقق النصر الدوري", author: "@NASRAWEHD", sentiment: "محايد", emotion: "تحليل", keywords: ["النصر", "الدوري", "السويلم"], reach: 43, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 23, text: "ليت كل دقيقة في المباراة الكرة في رجلك هل هناك لاعب في دوري روشن يصنع اسيست بهذا الجمال والروعه", author: "@Fahadalhurifi", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["اسيست", "دوري روشن", "جمال"], reach: 11080, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 24, text: "تكلفة جلب حكم اجنبي في الدوري السعودي 450 الف ريال للمباراه الواحده بينما تكلفته في الدوري الاماراتي والقطري لايتجاوز 170 الف", author: "@nzihhh2025", sentiment: "سلبي", emotion: "صدمة", keywords: ["حكم اجنبي", "تكلفة", "الدوري السعودي"], reach: 4920, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 25, text: "ولا أريد التشكيك في نزاهة جدولة الدوري السعودي، فأنا على يقين تام أن القائمين عليها يراعون الله", author: "@hfc1957_only", sentiment: "محايد", emotion: "تحفظ", keywords: ["جدولة", "الدوري السعودي", "نزاهة"], reach: 1030, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 26, text: "والله والله لو تكلمونهم beIN وتقولون لهم نبي دورات عندكم وكيف تشتغلون وكيف وصلتو للاحترافية", author: "@hamad_almohisn", sentiment: "سلبي", emotion: "انتقاد", keywords: ["beIN", "احترافية", "نقل سيء"], reach: 1420, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 27, text: "معقولة قناة ثمانية بعدتها و عتادها و كاميراتها و شغلها و تقنياتها اللي نسمع فيها وللحين ما شفناها", author: "@MaanAlquiae", sentiment: "سلبي", emotion: "إحباط", keywords: ["كاميرات", "تقنيات", "ما شفناها"], reach: 220, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 28, text: "وش صاير في اليمن؟ هل تعتقد أنها معقدة؟ هذه الحلقة ستفكك لك التعقيد من الحرب العالمية الأولى", author: "@alrougui", sentiment: "إيجابي", emotion: "تقدير", keywords: ["اليمن", "الحرب العالمية", "تفكيك"], reach: 3670, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 29, text: "الإنتاج جودتة رووووعة نفتخر بك 🇸🇦", author: "@k35g25", sentiment: "إيجابي", emotion: "فخر", keywords: ["إنتاج", "جودة", "نفتخر"], reach: 2750, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 30, text: "هذا الرجل قناة لحاله سرد تاريخي متسلسل تبسيط أصعب المعلومات جودة وتواريخ مذكوره الله درك يامالك", author: "@21m_ar", sentiment: "إيجابي", emotion: "إعجاب", keywords: ["سرد تاريخي", "تبسيط", "مالك"], reach: 1, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 31, text: "11 حالة ضد الأزيرق من أول الدوري لم يتم استدعاء الحكم للمراجعة", author: "@abw99902", sentiment: "سلبي", emotion: "غضب", keywords: ["VAR", "استدعاء", "الحكم"], reach: 242, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 32, text: "الاهلي مب منافس على الدوري بالعناصر ذي والشهرين الجايه بمجرد ما يبدأ التعثر", author: "@w2iac", sentiment: "سلبي", emotion: "تشاؤم", keywords: ["الاهلي", "الدوري", "تعثر"], reach: 147, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 33, text: "يوم المباراة ، يوم الهلال ، يوم المتصدر 💙 الهلال vs الفيحاء دوري روشن السعودي", author: "@bufaris9", sentiment: "إيجابي", emotion: "حماس", keywords: ["الهلال", "المتصدر", "دوري روشن"], reach: 2730, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 34, text: "أوه ذا حق اللي طلع مع أبو مالح", author: "@nameless__one1", sentiment: "محايد", emotion: "فضول", keywords: ["أبو مالح"], reach: 581, engagement: { likes: 0, retweets: 0, replies: 0 } },
  { id: 35, text: "قناة ثمانية هلالية ولكن الشكوى لغير الله مذله احمد ربك ما طلعت فضايحكم", author: "@alallah67343", sentiment: "سلبي", emotion: "استياء", keywords: ["هلالية", "فضايح", "شكوى"], reach: 5, engagement: { likes: 0, retweets: 0, replies: 0 } },
];

type Tweet = typeof SAMPLE_TWEETS[number];

/* ── Section navigation items ── */
const SECTIONS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "sentiment", label: "المشاعر", icon: Heart },
  { id: "topics", label: "المواضيع", icon: Target },
  { id: "timeline", label: "التحليل الزمني", icon: TrendingUp },
  { id: "issues", label: "المشاكل", icon: AlertTriangle },
  { id: "insights", label: "الرؤى", icon: Lightbulb },
  { id: "recommendations", label: "التوصيات", icon: CheckCircle },
  { id: "teams", label: "الفرق", icon: Users },
  { id: "tweets", label: "التغريدات", icon: MessageSquare },
] as const;

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

const MeltwaterReport = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Data state
  const [activeTweets, setActiveTweets] = useState<Tweet[]>(SAMPLE_TWEETS);
  const [importedTweets, setImportedTweets] = useState<Tweet[] | null>(null);
  const [analysisState, setAnalysisState] = useState<'idle' | 'ready' | 'analyzing' | 'done' | 'error'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState('');

  // Computed stats
  const totalTweets = activeTweets.length;
  const duplicatesRemoved = activeTweets === SAMPLE_TWEETS ? 89 : 0;
  const originalCount = totalTweets + duplicatesRemoved;

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

  const topKeywords = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTweets.forEach(t => { t.keywords.forEach(k => { counts[k] = (counts[k] || 0) + 1; }); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [activeTweets]);

  const totalReach = useMemo(() => activeTweets.reduce((sum, t) => sum + t.reach, 0), [activeTweets]);

  const sentimentFilteredTweets = useMemo(() => {
    if (!selectedSentiment) return [];
    return activeTweets.filter(t => t.sentiment === selectedSentiment);
  }, [selectedSentiment, activeTweets]);

  // Import handler
  const handleImport = (tweets: any[]) => {
    setImportedTweets(tweets as Tweet[]);
    setAnalysisState('ready');
    setAnalysisError('');
  };

  // AI Analysis
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

    const BATCH_SIZE = 10;
    const analyzed = [...importedTweets];
    const totalBatches = Math.ceil(analyzed.length / BATCH_SIZE);

    try {
      for (let bi = 0; bi < totalBatches; bi++) {
        const start = bi * BATCH_SIZE;
        const batch = analyzed.slice(start, start + BATCH_SIZE);
        const tweetsText = batch.map((t, i) => `[${i + 1}] ${t.text}`).join('\n');

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keys.openrouter}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              {
                role: 'system',
                content: `أنت محلل مشاعر متخصص في النصوص العربية. حلل التغريدات المرقمة وأرجع JSON فقط.
لكل تغريدة أرجع:
- index: رقم التغريدة (يبدأ من 1)
- sentiment: إيجابي أو سلبي أو محايد
- emotion: العاطفة (إعجاب، غضب، إحباط، حماس، فخر، استياء، إثارة، تساؤل، فضول، سخرية، انتقاد، تقدير، تشاؤم، صدمة، طلب، تحفظ، تحليل، محايد)
- keywords: أهم 2-4 كلمات مفتاحية
أرجع JSON بالشكل: {"results":[{"index":1,"sentiment":"...","emotion":"...","keywords":["..."]},...]}`,
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
        const parsed = JSON.parse(content);
        const results = parsed.results || [];

        for (const r of results) {
          const idx = start + (r.index - 1);
          if (idx >= 0 && idx < analyzed.length) {
            analyzed[idx] = {
              ...analyzed[idx],
              sentiment: r.sentiment || analyzed[idx].sentiment,
              emotion: r.emotion || analyzed[idx].emotion,
              keywords: Array.isArray(r.keywords) ? r.keywords : analyzed[idx].keywords,
            };
          }
        }

        setAnalysisProgress(Math.round(((bi + 1) / totalBatches) * 100));
      }

      setActiveTweets(analyzed);
      setAnalysisState('done');
    } catch (err: any) {
      setAnalysisError(err.message || 'حدث خطأ أثناء التحليل');
      setAnalysisState('error');
    }
  };

  // Use imported data directly without AI analysis
  const handleUseDirectly = () => {
    if (!importedTweets) return;
    setActiveTweets(importedTweets);
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
      default: return "bg-muted text-muted-foreground border-border/50";
    }
  };

  const getEmotionBadge = (emotion: string) => {
    const map: Record<string, string> = {
      "إعجاب": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "غضب": "bg-thmanyah-red/10 text-thmanyah-red",
      "إحباط": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "حماس": "bg-thmanyah-green/10 text-thmanyah-green",
      "فخر": "bg-purple-500/10 text-purple-600",
      "استياء": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "إثارة": "bg-thmanyah-red/10 text-thmanyah-red",
      "تساؤل": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "فضول": "bg-thmanyah-blue/10 text-thmanyah-blue",
      "سخرية": "bg-thmanyah-amber/10 text-thmanyah-amber",
      "انتقاد": "bg-thmanyah-red/10 text-thmanyah-red",
      "تقدير": "bg-thmanyah-green/10 text-thmanyah-green",
    };
    return map[emotion] || "bg-muted text-muted-foreground";
  };

  return (
    <div ref={mainRef} className="max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <PageExplainer
        icon={BarChart3}
        title="تقارير Meltwater"
        description="عرض تفاعلي شامل يتضمن تحليل المشاعر والاتجاهات والرسوم البيانية من تقارير Meltwater"
        color="#8B5CF6"
      />

      {/* ── Section Navigation ── */}
      <nav className="card-stagger sticky top-16 z-30 -mx-2 px-2 py-3 bg-background/80 backdrop-blur-xl border-b border-border/30" style={{ animationDelay: "0.05s" }}>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-foreground text-white shadow-md"
                    : "bg-card border border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Data Import & Export ── */}
      <div className="card-stagger grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animationDelay: "0.1s" }}>
        <DataImport onImport={handleImport} />
        <ExcelExport tweets={activeTweets} reportDate="2026-01-22" />
      </div>

      {/* ── Analysis Controls ── */}
      {analysisState !== 'idle' && (
        <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6 text-center space-y-4" style={{ animationDelay: "0.15s" }}>
          {analysisState === 'ready' && (
            <>
              <div className="flex items-center justify-center gap-2 text-thmanyah-green mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-[14px] font-bold">تم استيراد {importedTweets?.length} تغريدة بنجاح</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleStartAnalysis}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-thmanyah-green text-white font-bold text-[15px] hover:bg-thmanyah-green/90 transition-all shadow-lg shadow-thmanyah-green/20"
                >
                  <Play className="w-5 h-5" />
                  ابدأ التحليل
                </button>
                <button
                  onClick={handleUseDirectly}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border/40 text-muted-foreground font-bold text-[13px] hover:bg-muted/30 transition-all"
                >
                  استخدام البيانات مباشرة
                </button>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground/40">
                سيتم تحليل المشاعر والعواطف والكلمات المفتاحية باستخدام الذكاء الاصطناعي
              </p>
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

          {analysisState === 'done' && (
            <div className="flex items-center justify-center gap-2 text-thmanyah-green">
              <CheckCircle className="w-5 h-5" />
              <span className="text-[14px] font-bold">تم التحليل بنجاح! التقرير أدناه يعكس البيانات المستوردة.</span>
            </div>
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
                    الذهاب للإعدادات
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-thmanyah-red">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[14px] font-bold">{analysisError}</span>
                  </div>
                  <button
                    onClick={handleStartAnalysis}
                    className="text-[12px] font-bold text-thmanyah-blue hover:underline"
                  >
                    إعادة المحاولة
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          SECTION: Overview
          ══════════════════════════════════════════ */}
      <section id="overview" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={BarChart3} color="#8B5CF6">نظرة عامة</SectionHeading>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="التغريدات المحللة" value={String(totalTweets)} sub={`من أصل ${originalCount} (إزالة ${duplicatesRemoved} مكرر)`} color="#8B5CF6" delay={0} />
          <KpiCard label="إجمالي الوصول" value={`${(totalReach / 1000).toFixed(1)}K`} sub="مجموع reach للتغريدات" color="#0072F9" delay={1} />
          <KpiCard label="إيجابية" value={`${sentimentPercentages.positive}%`} sub={`${sentimentCounts.positive} تغريدة`} color="#00C17A" delay={2} />
          <KpiCard label="سلبية" value={`${sentimentPercentages.negative}%`} sub={`${sentimentCounts.negative} تغريدة`} color="#F24935" delay={3} />
        </div>

        {/* KPIs */}
        <TopicKPIs tweets={activeTweets} />

        {/* About Thamanyah */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-display font-bold text-foreground/70">عن ثمانية وليس عن ثمانية</h3>
          <AboutThamanyah tweets={activeTweets} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Sentiment & Emotions
          ══════════════════════════════════════════ */}
      <section id="sentiment" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={Heart} color="#E4405F">توزيع المشاعر والعواطف</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sentiment Pie */}
          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0s" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
              <h3 className="text-[14px] font-display font-bold text-foreground/80">توزيع المشاعر</h3>
            </div>
            <SentimentPieChart
              positive={sentimentCounts.positive}
              negative={sentimentCounts.negative}
              neutral={sentimentCounts.neutral}
              onSliceClick={(sentiment) => setSelectedSentiment(selectedSentiment === sentiment ? null : sentiment)}
            />
          </div>

          {/* Emotions */}
          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
              <h3 className="text-[14px] font-display font-bold text-foreground/80">توزيع العواطف</h3>
            </div>
            <div className="space-y-2.5">
              {Object.entries(emotionCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, count]) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <Badge className={`${getEmotionBadge(emotion)} border-0 text-[11px] font-bold min-w-[60px] justify-center`}>{emotion}</Badge>
                    <Progress value={(count / totalTweets) * 100} className="flex-1 h-2" />
                    <span className="text-[11px] font-bold text-muted-foreground/50 w-6 text-left nums-en">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Filtered tweets drawer */}
        {selectedSentiment && (
          <div className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden" style={{ animationDelay: "0s" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-display font-bold text-foreground/80">تغريدات &ldquo;{selectedSentiment}&rdquo;</h3>
                <Badge className="bg-foreground text-white border-0 text-[10px] font-bold nums-en">{sentimentFilteredTweets.length}</Badge>
              </div>
              <button onClick={() => setSelectedSentiment(null)} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <X className="w-4 h-4 text-muted-foreground/40" />
              </button>
            </div>
            <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto">
              {sentimentFilteredTweets.map(tweet => (
                <div key={tweet.id} className="px-5 py-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-muted-foreground/50">{tweet.author}</p>
                      <p className="text-[13px] mt-1 leading-relaxed text-foreground/80">{tweet.text}</p>
                      {tweet.engagement && (
                        <div className="flex gap-3 mt-2 text-[10px] font-bold text-muted-foreground/40 nums-en">
                          <span>{tweet.engagement.likes} إعجاب</span>
                          <span>{tweet.engagement.retweets} إعادة</span>
                          <span>{tweet.engagement.replies} رد</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={`${getSentimentBadge(tweet.sentiment)} border text-[10px] font-bold`}>{tweet.sentiment}</Badge>
                      <span className="text-[10px] font-bold text-muted-foreground/40 nums-en">{tweet.reach.toLocaleString()} وصول</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Topics
          ══════════════════════════════════════════ */}
      <section id="topics" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={Target} color="#FFBC0A">الكلمات المفتاحية والمواضيع</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Keywords */}
          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0s" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
              <h3 className="text-[14px] font-display font-bold text-foreground/80">الأكثر تكراراً</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(([keyword, count]) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/40 text-[12px] font-bold text-foreground/70"
                >
                  {keyword}
                  <span className="text-muted-foreground/40 nums-en">({count})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Themes */}
          <div className="card-stagger rounded-2xl bg-card border border-border/40 p-6" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
              <h3 className="text-[14px] font-display font-bold text-foreground/80">المواضيع الرئيسية</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: "البث الرياضي والنقل", desc: "نقاشات حول جودة البث ومشاكل تقنية في نقل المباريات", color: "#0072F9" },
                { title: "أداء اللاعبين", desc: "إشادة بأداء رونالدو وجواو فيليكس مع تغطية لأهداف مميزة", color: "#00C17A" },
                { title: "المحتوى التعليمي", desc: "تفاعل إيجابي مع المحتوى التوثيقي خاصة حلقات الشرح التاريخي", color: "#FFBC0A" },
                { title: "انتقادات التحيز", desc: "اتهامات بالتحيز لأندية معينة وإخفاء شعبية أندية أخرى", color: "#F24935" },
              ].map((theme) => (
                <div key={theme.title} className="p-3 rounded-xl border" style={{ borderColor: `${theme.color}15`, backgroundColor: `${theme.color}04` }}>
                  <h4 className="text-[13px] font-bold text-foreground/80 mb-1">{theme.title}</h4>
                  <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{theme.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Topic Categorization */}
        <TopicCategorization tweets={activeTweets} />

        {/* Word Cloud */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-display font-bold text-foreground/70">سحابة الكلمات</h3>
          <WordCloud tweets={activeTweets} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Timeline
          ══════════════════════════════════════════ */}
      <section id="timeline" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={TrendingUp} color="#0072F9">التحليل الزمني</SectionHeading>
        <p className="text-[11px] font-bold text-muted-foreground/40 -mt-3">اضغط على أي نقطة في الرسم البياني لعرض التغريدات المقابلة</p>
        <TimelineCharts tweets={activeTweets} />
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Issues
          ══════════════════════════════════════════ */}
      <section id="issues" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={AlertTriangle} color="#F24935">المشاكل والشكاوى الرئيسية</SectionHeading>

        <div className="space-y-4">
          {[
            {
              num: 1, title: "مشاكل تقنية في البث والنقل",
              desc: "تتكرر الشكاوى من مشاكل بدائية في البث المباشر، خاصة في المباريات الكبرى. المستخدمون يطالبون بالتعلم من قنوات أخرى مثل beIN للوصول للاحترافية المطلوبة.",
              severity: "عالي الخطورة", severityColor: "#F24935", note: "يؤثر على السمعة المهنية",
              quotes: [
                { text: "والله لو تكلمونهم beIN وتقولون لهم نبي دورات عندكم... وصلنا للدور الثاني من الدوري وانتم للحين اعذار ونقل سيء وتقطيع", author: "@hamad_almohisn", reach: "1.42K" },
                { text: "محمد الخميس ينتقد الناقل الرسمي للدوري 'ثمانية' امس حتى مباراة الاهلي فيها مشاكل بدائية في البث", author: "@1432nayif", reach: "244 (5 إعادات تغريد)" },
              ],
            },
            {
              num: 2, title: "اتهامات بالتحيز لأندية معينة",
              desc: "هناك اتهامات متكررة بأن القناة تتحيز للهلال على حساب أندية أخرى، خاصة النصر. يتم ربط هذا بشخص \"أبو مالح\" الذي يُتهم بالتوجه الهلالي.",
              severity: "عالي الخطورة", severityColor: "#F24935", note: "يهدد المصداقية والحيادية",
              quotes: [
                { text: "اما ثمانية ابومالح فتوجهها بات معلوم للجميع للاسف استغلال الحالة النصراوية للضغط وتشتيت الفريق منهج واضح", author: "@Turki_alharbi44", reach: "341" },
                { text: "كالعادة تعمد إخفاء شعبية النصر من قبل الهلالي ابومالح وقناته #ثمانية", author: "@Alqeeran", reach: "41" },
              ],
            },
            {
              num: 3, title: "إخفاء وعدم عرض لقطات مهمة",
              desc: "انتقادات حادة لعدم عرض لقطات مهمة أو إعادات للأحداث المثيرة، مما يُفقد المشاهد تجربة متكاملة.",
              severity: "متوسط الخطورة", severityColor: "#FFBC0A", note: "يؤثر على جودة التغطية",
              quotes: [
                { text: "كالعادة .. قناة ثمانية مع لقطة جواو فيلكس .. شاهد ماشفش حاجة !!", author: "@Aljamaz8910", reach: "799 (11 إعادة تغريد)" },
                { text: "معقولة قناة ثمانية بعدتها و عتادها و كاميراتها و شغلها و تقنياتها اللي نسمع فيها وللحين ما شفناها", author: "@MaanAlquiae", reach: "220" },
              ],
            },
            {
              num: 4, title: "الجدل حول التحكيم وتقنية VAR",
              desc: "نقاشات حادة حول تباين قرارات VAR وتكلفة الحكام الأجانب مقارنة بالدوريات الأخرى.",
              severity: "خارج السيطرة", severityColor: "#FFBC0A", note: "مسؤولية اتحاد الكرة",
              quotes: [
                { text: "تكلفة جلب حكم اجنبي في الدوري السعودي 450 الف ريال للمباراه الواحده بينما تكلفته في الدوري الاماراتي والقطري لايتجاوز 170 الف", author: "@nzihhh2025", reach: "4.92K" },
              ],
            },
            {
              num: 5, title: "انتقادات المعلقين والمحتوى",
              desc: "تعليقات ساخرة ومنتقدة لأسلوب بعض المعلقين، مع استياء عام من بعض جوانب التغطية.",
              severity: "متوسط الخطورة", severityColor: "#FFBC0A", note: "يؤثر على الرضا العام",
              quotes: [
                { text: "اكيد قناة ثمانية متعاقدين مع فارس عوض عشان يغني راب", author: "@kfa7i", reach: "27.42K (أعلى وصول)" },
              ],
            },
          ].map((issue, i) => (
            <div
              key={issue.num}
              className="card-stagger rounded-2xl bg-card border border-border/40 p-5 space-y-4"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: issue.severityColor }}>
                  {issue.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-foreground/85 mb-1">{issue.title}</h4>
                  <p className="text-[12px] font-bold text-muted-foreground/50 leading-relaxed">{issue.desc}</p>
                </div>
              </div>

              {/* Quotes */}
              <div className="space-y-2 mr-10">
                {issue.quotes.map((q, qi) => (
                  <div key={qi} className="p-3 rounded-xl bg-muted/30 border border-border/20">
                    <p className="text-[12px] italic text-muted-foreground/60 leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold" style={{ color: issue.severityColor }}>
                      <ExternalLink className="w-3 h-3" />
                      {q.author} — الوصول: {q.reach}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mr-10">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: issue.severityColor }}>{issue.severity}</span>
                <span className="text-[10px] font-bold text-muted-foreground/40">{issue.note}</span>
              </div>
            </div>
          ))}

          {/* Summary strip */}
          <div className="card-stagger rounded-2xl bg-muted/30 border border-border/30 p-5" style={{ animationDelay: "0.3s" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <MiniStat value={String(sentimentCounts.negative)} label="تغريدة سلبية" color="#F24935" />
              <MiniStat value={`${sentimentPercentages.negative}%`} label="من إجمالي التغريدات" color="#F24935" />
              <MiniStat value="5" label="مشاكل رئيسية" color="#F24935" />
              <MiniStat value="3" label="عالية الخطورة" color="#F24935" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Insights
          ══════════════════════════════════════════ */}
      <section id="insights" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={Lightbulb} color="#0072F9">الرؤى والملاحظات</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              title: "محتوى رونالدو يحقق أعلى وصول",
              desc: "التغريدات التي تتضمن رونالدو تحقق وصولاً يفوق 12K",
              quote: "في كل مكان ، كريستيانو رونالدو حاضر 🔝🐐",
              author: "@thmanyahsports", reach: "12.76K",
            },
            {
              title: "المحتوى التعليمي يلقى تفاعلاً عالياً",
              desc: "حلقات الشرح التاريخي تحظى بتقدير كبير، مع وصول يتجاوز 75K",
              quote: "ماشاء الله شرح تفصيلي ومشوق ما تمنيت الفيديو يخلص ...عمل جبار",
              author: "@reich_hadhrmi", reach: null,
            },
            {
              title: "المعلقون يثيرون نقاشات واسعة",
              desc: "تغريدات عن فارس عوض تحقق وصولاً عالياً (27K+)",
              quote: "اكيد قناة ثمانية متعاقدين مع فارس عوض عشان يغني راب",
              author: "@kfa7i", reach: "27.42K",
            },
            {
              title: "طلب متزايد على IPTV يشمل ثمانية",
              desc: "طلب واضح على اشتراكات IPTV تشمل قنوات ثمانية",
              quote: "أبي اشتراك IPTV كفو وبدون أي تقطيع يكون شامل قنوات ثمانية",
              author: "@MhmdAlshmr79531", reach: null,
            },
          ].map((insight, i) => (
            <div
              key={i}
              className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-5 space-y-3"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 p-2 rounded-xl bg-thmanyah-blue/[0.06]">
                  <Lightbulb className="w-4 h-4 text-thmanyah-blue" strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-foreground/85 mb-1">{insight.title}</h4>
                  <p className="text-[11px] font-bold text-muted-foreground/50 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-thmanyah-blue/[0.03] border border-thmanyah-blue/10">
                <p className="text-[12px] italic text-thmanyah-blue/70 leading-relaxed">&ldquo;{insight.quote}&rdquo;</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-thmanyah-blue/50">
                  <ExternalLink className="w-3 h-3" />
                  {insight.author}{insight.reach && ` — الوصول: ${insight.reach}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Recommendations
          ══════════════════════════════════════════ */}
      <section id="recommendations" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={CheckCircle} color="#00C17A">التوصيات</SectionHeading>

        <div className="space-y-4">
          {[
            { title: "تحسين البنية التقنية للبث", priority: "عالية", quote: "وصلنا للدور الثاني من الدوري وانتم للحين اعذار ونقل سيء وتقطيع", author: "@hamad_almohisn" },
            { title: "تعزيز الحيادية في التغطية", priority: "عالية", quote: "ثمانية ابومالح فتوجهها بات معلوم للجميع للاسف", author: "@Turki_alharbi44" },
            { title: "عرض جميع اللقطات المهمة", priority: "متوسطة", quote: "معقولة قناة ثمانية بعدتها وكاميراتها وللحين ما شفناها ما لقطوا", author: "@MaanAlquiae" },
            { title: "توسيع المحتوى التعليمي والتوثيقي", priority: "متوسطة", quote: "الإنتاج جودتة رووووعة نفتخر بك 🇸🇦", author: "@k35g25" },
            { title: "التركيز على محتوى النجوم العالميين", priority: "متوسطة", quote: "960 هدف ⚽️ رقم جديد للأسطورة كريستيانو رونالدو 🐐", author: "@thmanyahsports" },
          ].map((rec, i) => (
            <div
              key={i}
              className="card-stagger rounded-2xl bg-card border border-border/40 p-5"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 p-2 rounded-xl bg-thmanyah-green/[0.06]">
                  <CheckCircle className="w-4 h-4 text-thmanyah-green" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[13px] font-bold text-foreground/85">{rec.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.priority === "عالية" ? "bg-thmanyah-red/10 text-thmanyah-red" : "bg-thmanyah-amber/10 text-thmanyah-amber"
                      }`}>
                        الأولوية: {rec.priority}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-thmanyah-green/[0.03] border border-thmanyah-green/10">
                    <p className="text-[10px] font-bold text-thmanyah-green/60 mb-1">مستند إلى:</p>
                    <p className="text-[12px] italic text-thmanyah-green/70 leading-relaxed">&ldquo;{rec.quote}&rdquo;</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-thmanyah-green/50">
                      <ExternalLink className="w-3 h-3" /> {rec.author}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Priority Matrix */}
        <div className="card-stagger rounded-2xl bg-muted/30 border border-border/30 p-5" style={{ animationDelay: "0.3s" }}>
          <h4 className="text-[13px] font-display font-bold text-foreground/70 mb-4">مصفوفة الأولويات</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "أولوية عالية", items: ["إصلاح مشاكل البث", "معالجة اتهامات التحيز"], color: "#F24935" },
              { label: "أولوية متوسطة", items: ["تحسين عرض اللقطات", "توسيع المحتوى التعليمي"], color: "#FFBC0A" },
              { label: "تطوير مستمر", items: ["محتوى النجوم العالميين", "تغطية دوري يلو"], color: "#0072F9" },
              { label: "نقاط قوة", items: ["جودة الإنتاج التوثيقي", "تغطية رونالدو"], color: "#00C17A" },
            ].map((p) => (
              <div key={p.label} className="p-3 rounded-xl bg-card border" style={{ borderColor: `${p.color}15` }}>
                <p className="text-[11px] font-bold mb-2" style={{ color: p.color }}>{p.label}</p>
                <ul className="text-[10px] font-bold text-muted-foreground/50 space-y-1">
                  {p.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: Teams
          ══════════════════════════════════════════ */}
      <section id="teams" className="scroll-mt-32 space-y-5">
        <SectionHeading icon={Users} color="#8B5CF6">ماذا يعني هذا لفرق ثمانية؟</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Marketing */}
          <TeamCard
            icon={TrendingUp}
            title="فريق التسويق"
            subtitle="النمو وبناء السمعة"
            color="#E4405F"
            sections={[
              {
                heading: "فرص النمو المستخلصة",
                type: "opportunity",
                items: [
                  "محتوى رونالدو = وصول عالي: التغريدات المتعلقة برونالدو تحقق وصول 12K+",
                  "المحتوى التوثيقي محبوب: حلقة اليمن حققت تفاعلاً إيجابياً كبيراً",
                  "طلب IPTV: الناس تبحث عن قنوات ثمانية ضمن باقات IPTV",
                ],
              },
              {
                heading: "تحديات السمعة",
                type: "warning",
                items: [
                  "اتهامات التحيز: حملة علاقات عامة توضح الحيادية التحريرية",
                  "ربط \"أبو مالح\" بالتحيز: فصل الشخصية عن العلامة التجارية",
                ],
              },
              {
                heading: "خطوات فورية",
                type: "action",
                items: [
                  "إعداد حملة \"ثمانية للجميع\" تبرز تغطية متوازنة",
                  "زيادة محتوى رونالدو 30% في الأسبوعين القادمين",
                  "التواصل مع موزعي IPTV لشراكات رسمية",
                ],
              },
            ]}
          />

          {/* Tech */}
          <TeamCard
            icon={BarChart3}
            title="الفريق التقني"
            subtitle="تحسين تجربة المستخدم والبث"
            color="#0072F9"
            sections={[
              {
                heading: "مشاكل حرجة",
                type: "warning",
                items: [
                  "تقطيع البث: شكاوى متكررة خاصة في المباريات الكبرى. راجعوا CDN",
                  "مشاكل بدائية: المستخدمون يصفون المشاكل بـ\"بدائية\" — تدقيق شامل للبث",
                  "جودة 4K: الناس تطلب IPTV بجودة 4K — تأكدوا من دعم التطبيق",
                ],
              },
              {
                heading: "تحسينات UX",
                type: "opportunity",
                items: [
                  "إعادة اللقطات: نظام سهل لمشاهدة الإعادات واللقطات المهمة",
                  "مكتبة المباريات: سهولة الوصول لأرشيف المباريات",
                ],
              },
              {
                heading: "خطوات فورية",
                type: "action",
                items: [
                  "تدقيق أداء البث قبل مباراة الهلال القادمة",
                  "اختبار ضغط للخوادم في أوقات الذروة",
                  "إضافة زر \"مشاهدة اللقطة\" سهل الوصول",
                ],
              },
            ]}
          />

          {/* Sales */}
          <TeamCard
            icon={Target}
            title="فريق المبيعات"
            subtitle="الاشتراكات والشراكات"
            color="#FFBC0A"
            sections={[
              {
                heading: "رؤى للمبيعات",
                type: "opportunity",
                items: [
                  "سعر الاشتراك 700 ريال: هناك من يستغرب السعر مع وجود مشاكل تقنية",
                  "المنافسة مع beIN: أبرزوا ما يميز ثمانية (محتوى عربي، توثيقي، محلي)",
                  "طلب IPTV غير رسمي: فرصة لحزم B2B مع الموزعين",
                ],
              },
              {
                heading: "خطوات فورية",
                type: "action",
                items: [
                  "تطوير حزمة \"جرّب شهر مجاني\" لكسب المشككين",
                  "إعداد عرض تقديمي لموزعي IPTV",
                  "التركيز على المحتوى التوثيقي كميزة تنافسية",
                ],
              },
            ]}
          />

          {/* Content */}
          <TeamCard
            icon={FileText}
            title="فريق المحتوى"
            subtitle="الإنتاج والتغطية التحريرية"
            color="#00C17A"
            sections={[
              {
                heading: "ما يحبه الجمهور (استمروا)",
                type: "opportunity",
                items: [
                  "المحتوى التوثيقي: \"عمل جبار\"، \"سرد تاريخي متسلسل\" — هذا النوع محبوب جداً",
                  "تغطية النجوم: رونالدو، جواو فيليكس — أعلى وصول",
                  "جودة الإنتاج: \"الإنتاج جودته رووووعة\" — حافظوا على هذا المستوى",
                ],
              },
              {
                heading: "انتقادات تحتاج معالجة",
                type: "warning",
                items: [
                  "عدم عرض اللقطات: بروتوكول واضح لعرض كل اللقطات المهمة",
                  "تغطية غير متوازنة: أعطوا تغطية متساوية لكل الأندية",
                  "تعليق فارس عوض: يثير جدلاً — وازنوا بمعلقين آخرين",
                ],
              },
              {
                heading: "خطوات فورية",
                type: "action",
                items: [
                  "قائمة تدقيق لكل مباراة تضمن عرض جميع اللقطات المهمة",
                  "جدولة حلقة توثيقية جديدة كل أسبوعين",
                  "تنويع المعلقين على المباريات الكبرى",
                ],
              },
            ]}
          />
        </div>

        {/* Summary Table */}
        <div className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden" style={{ animationDelay: "0.2s" }}>
          <div className="px-5 py-4 border-b border-border/30">
            <h4 className="text-[13px] font-display font-bold text-foreground/80">ملخص الإجراءات لجميع الفرق</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-3.5 text-right font-bold text-foreground/70 border-b border-border/20">الفريق</th>
                  <th className="p-3.5 text-right font-bold text-foreground/70 border-b border-border/20">الأولوية القصوى</th>
                  <th className="p-3.5 text-right font-bold text-foreground/70 border-b border-border/20">الموعد النهائي</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { team: "التسويق", priority: "حملة \"ثمانية للجميع\" + زيادة محتوى رونالدو", deadline: "أسبوعين" },
                  { team: "التقني", priority: "إصلاح تقطيع البث + اختبار ضغط", deadline: "قبل المباراة القادمة" },
                  { team: "المبيعات", priority: "عرض \"شهر مجاني\" + التواصل مع موزعي IPTV", deadline: "شهر" },
                  { team: "المحتوى", priority: "قائمة تدقيق اللقطات + تنويع المعلقين", deadline: "فوري" },
                ].map((row, i) => (
                  <tr key={i} className={`${i % 2 ? "bg-muted/10" : ""} hover:bg-muted/20 transition-colors`}>
                    <td className="p-3.5 font-bold text-foreground/80 border-b border-border/10">{row.team}</td>
                    <td className="p-3.5 text-muted-foreground/60 border-b border-border/10">{row.priority}</td>
                    <td className="p-3.5 font-bold text-muted-foreground/50 border-b border-border/10">{row.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: All Tweets
          ══════════════════════════════════════════ */}
      <section id="tweets" className="scroll-mt-32 space-y-5">
        <div className="flex items-center gap-2">
          <SectionHeading icon={MessageSquare} color="#494C6B">جميع التغريدات المحللة</SectionHeading>
          <Badge className="bg-foreground text-white border-0 text-[10px] font-bold nums-en mr-2">{totalTweets}</Badge>
        </div>

        <div className="space-y-2">
          {activeTweets.map((tweet, i) => (
            <div
              key={tweet.id}
              className="card-stagger rounded-xl bg-card border border-border/30 px-5 py-4 hover:border-border/50 transition-colors"
              style={{ animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-muted-foreground/40">{tweet.author}</p>
                  <p className="text-[13px] mt-1 leading-relaxed text-foreground/80">{tweet.text}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tweet.keywords.map((kw, ki) => (
                      <span key={ki} className="px-2 py-0.5 rounded-full bg-muted/40 text-[10px] font-bold text-muted-foreground/50">{kw}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge className={`${getSentimentBadge(tweet.sentiment)} border text-[10px] font-bold`}>{tweet.sentiment}</Badge>
                  <Badge className={`${getEmotionBadge(tweet.emotion)} border-0 text-[10px] font-bold`}>{tweet.emotion}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground/30 nums-en">{tweet.reach.toLocaleString()} وصول</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Back to top ── */}
      <div className="flex justify-center pb-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/40 border border-border/30 text-[11px] font-bold text-muted-foreground/50 hover:text-foreground hover:border-border transition-all"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          العودة للأعلى
        </button>
      </div>
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
    <div
      className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-5"
      style={{ animationDelay: `${delay * 0.06}s` }}
    >
      <p className="text-[11px] font-bold mb-2" style={{ color: `${color}99` }}>{label}</p>
      <p className="text-2xl font-bold nums-en mb-1" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground/40 nums-en">{sub}</p>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div>
      <p className="text-xl font-bold nums-en" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground/50">{label}</p>
    </div>
  );
}

interface TeamSection {
  heading: string;
  type: "opportunity" | "warning" | "action";
  items: string[];
}

function TeamCard({
  icon: Icon,
  title,
  subtitle,
  color,
  sections,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  sections: TeamSection[];
}) {
  const typeStyles = {
    opportunity: { bg: "bg-thmanyah-blue/[0.03]", border: "border-thmanyah-blue/10", dot: "bg-thmanyah-blue" },
    warning: { bg: "bg-thmanyah-red/[0.03]", border: "border-thmanyah-red/10", dot: "bg-thmanyah-red" },
    action: { bg: "bg-thmanyah-green/[0.03]", border: "border-thmanyah-green/10", dot: "bg-thmanyah-green" },
  };

  return (
    <div className="card-stagger rounded-2xl bg-card border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}10`, color }}>
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-foreground/85">{title}</h4>
          <p className="text-[10px] font-bold" style={{ color: `${color}80` }}>{subtitle}</p>
        </div>
      </div>

      {/* Sections */}
      <div className="p-5 space-y-4">
        {sections.map((sec) => {
          const style = typeStyles[sec.type];
          return (
            <div key={sec.heading} className={`p-3.5 rounded-xl ${style.bg} border ${style.border}`}>
              <h5 className="text-[12px] font-bold text-foreground/70 mb-2.5">{sec.heading}</h5>
              <ul className="space-y-2">
                {sec.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] font-bold text-muted-foreground/60 leading-relaxed">
                    <div className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1.5 shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
