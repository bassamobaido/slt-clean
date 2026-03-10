import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Twitter, ArrowRight, Calendar, TrendingUp, TrendingDown, Minus, History as HistoryIcon, FlaskConical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AnalysisResults } from '@/components/AnalysisResults';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import PageExplainer from '@/components/PageExplainer';
import { SAMPLE_ANALYSES, type SampleAnalysis } from '@/lib/sampleData';

interface SavedAnalysis {
  id: string;
  created_at: string;
  search_terms: string[];
  total_tweets: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  insights: string;
  recommendations: string | string[];
  main_issues: string | null;
  sample_tweets: any;
  all_tweets: any;
  max_items: number;
  sort_order: string;
}

const History = () => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  /** Convert SampleAnalysis → SavedAnalysis shape for unified rendering */
  const sampleToSaved = (s: SampleAnalysis): SavedAnalysis => ({
    id: s.id,
    created_at: s.created_at,
    search_terms: s.search_terms,
    total_tweets: s.total_tweets,
    positive_count: s.positive_count,
    negative_count: s.negative_count,
    neutral_count: s.neutral_count,
    insights: s.insights,
    recommendations: s.recommendations,
    main_issues: s.main_issues.join("\n"),
    sample_tweets: { positive: [], negative: [], neutral: [] },
    all_tweets: null,
    max_items: s.total_tweets,
    sort_order: "Latest",
  });

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tweet_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setAnalyses(data);
        setIsDemo(false);
      } else {
        // Fall back to sample analyses for demo
        setAnalyses(SAMPLE_ANALYSES.map(sampleToSaved));
        setIsDemo(true);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      // On error, show sample data as demo
      setAnalyses(SAMPLE_ANALYSES.map(sampleToSaved));
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToAnalysisResult = (analysis: SavedAnalysis) => {
    const total = analysis.positive_count + analysis.negative_count + analysis.neutral_count;
    return {
      success: true,
      totalTweets: analysis.total_tweets,
      analyzedTweets: total,
      sentiments: {
        positive: analysis.positive_count,
        negative: analysis.negative_count,
        neutral: analysis.neutral_count,
        percentages: {
          positive: total > 0 ? ((analysis.positive_count / total) * 100).toFixed(1) : '0',
          negative: total > 0 ? ((analysis.negative_count / total) * 100).toFixed(1) : '0',
          neutral: total > 0 ? ((analysis.neutral_count / total) * 100).toFixed(1) : '0',
        }
      },
      insights: analysis.insights || '',
      recommendations: typeof analysis.recommendations === 'string'
        ? analysis.recommendations.split('\n').filter(Boolean)
        : (Array.isArray(analysis.recommendations) ? analysis.recommendations : []),
      sampleTweets: analysis.sample_tweets || { positive: [], negative: [], neutral: [] },
      allTweets: Array.isArray(analysis.all_tweets) ? analysis.all_tweets : [],
      mainIssues: analysis.main_issues ? analysis.main_issues.split('\n').filter(Boolean) : []
    };
  };

  const getSentimentIcon = (analysis: SavedAnalysis) => {
    const { positive_count, negative_count, neutral_count } = analysis;
    const max = Math.max(positive_count, negative_count, neutral_count);

    if (max === positive_count) {
      return <TrendingUp className="h-5 w-5 text-thmanyah-green" />;
    } else if (max === negative_count) {
      return <TrendingDown className="h-5 w-5 text-thmanyah-red" />;
    }
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  if (selectedAnalysis) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Button
          onClick={() => setSelectedAnalysis(null)}
          className="bg-foreground text-primary-foreground font-bold rounded-full"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للسجل
        </Button>

        <AnalysisResults results={convertToAnalysisResult(selectedAnalysis)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageExplainer
        icon={HistoryIcon}
        title="سجل التحليلات"
        description="تصفّح جميع تحليلات التغريدات المحفوظة سابقاً — اعرض النتائج والمشاعر والرؤى لكل تحليل"
        color="#8B5CF6"
      />

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-display font-bold text-foreground/80">جميع التحليلات المحفوظة</h2>
        <Button
          onClick={() => navigate('/tweet-analysis')}
          className="bg-foreground text-primary-foreground font-bold rounded-full text-[13px]"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          تحليل جديد
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-bold text-foreground/70">جاري التحميل...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="card-stagger rounded-2xl bg-card border border-border/40 p-12 text-center">
          <Twitter className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-lg font-bold text-foreground/70 mb-2">لا توجد تحليلات محفوظة</p>
          <p className="text-[12px] font-bold text-muted-foreground/40 mb-6">ابدأ بإنشاء تحليل جديد</p>
          <Button
            onClick={() => navigate('/tweet-analysis')}
            className="bg-foreground text-primary-foreground font-bold rounded-full"
          >
            إنشاء تحليل
          </Button>
        </div>
      ) : (<>
        {isDemo && (
          <div className="card-stagger flex items-center gap-2.5 px-4 py-3 rounded-xl bg-thmanyah-amber/[0.06] border border-thmanyah-amber/15">
            <FlaskConical className="w-4 h-4 text-thmanyah-amber shrink-0" />
            <span className="text-[12px] font-bold text-foreground/60">بيانات تجريبية — قم بتشغيل تحليل حقيقي لتظهر نتائجك هنا</span>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis, i) => (
            <div
              key={analysis.id}
              className="card-stagger card-hover-lift rounded-2xl bg-card border border-border/40 p-5 cursor-pointer transition-all hover:border-border"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => setSelectedAnalysis(analysis)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground/40" />
                    <div className="text-[12px]">
                      <div className="font-bold text-foreground/80">
                        {format(new Date(analysis.created_at), 'dd MMMM yyyy', { locale: ar })}
                      </div>
                      <div className="text-muted-foreground/40 nums-en">
                        {format(new Date(analysis.created_at), 'hh:mm a')}
                      </div>
                    </div>
                  </div>
                  {getSentimentIcon(analysis)}
                </div>

                <div className="space-y-1">
                  <div className="text-[14px] font-bold text-foreground/85">
                    {analysis.search_terms.join(', ')}
                  </div>
                  <div className="text-[11px] font-bold text-muted-foreground/40 nums-en">
                    {analysis.total_tweets} تغريدة
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-thmanyah-green/[0.06] rounded-xl">
                    <div className="text-[13px] font-bold text-thmanyah-green nums-en">{analysis.positive_count}</div>
                    <div className="text-[10px] font-bold text-thmanyah-green/60">إيجابي</div>
                  </div>
                  <div className="p-2 bg-thmanyah-red/[0.06] rounded-xl">
                    <div className="text-[13px] font-bold text-thmanyah-red nums-en">{analysis.negative_count}</div>
                    <div className="text-[10px] font-bold text-thmanyah-red/60">سلبي</div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-xl">
                    <div className="text-[13px] font-bold text-muted-foreground nums-en">{analysis.neutral_count}</div>
                    <div className="text-[10px] font-bold text-muted-foreground/60">محايد</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
};

export default History;
