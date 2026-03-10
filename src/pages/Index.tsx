import { useState } from 'react';
import { TweetAnalysisForm } from '@/components/TweetAnalysisForm';
import { AnalysisResults } from '@/components/AnalysisResults';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { AnalysisDocumentation } from '@/components/AnalysisDocumentation';
import { Twitter, Clock, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import PageExplainer from '@/components/PageExplainer';

interface TweetSample {
  text: string;
  author: string;
  authorName?: string;
  authorVerified?: boolean;
  authorBlueVerified?: boolean;
  likes: number;
  retweets: number;
  replies: number;
  quotes?: number;
  bookmarks?: number;
  createdAt?: string;
  isRetweet?: boolean;
  isQuote?: boolean;
  reason: string;
  confidence: number;
  emotion: string;
  keywords: string[];
  url: string;
  matchedSearchTerms?: string[];
  matchedHandles?: string[];
}

interface AnalysisResult {
  success: boolean;
  totalTweets: number;
  analyzedTweets: number;
  sentiments: {
    positive: number;
    negative: number;
    neutral: number;
    percentages: {
      positive: string;
      negative: string;
      neutral: string;
    };
  };
  emotions?: Record<string, number>;
  topKeywords?: Array<{ keyword: string; count: number }>;
  themes?: string[];
  mainIssues?: string[];
  insights: string;
  recommendations: string | string[];
  sentimentSummary?: {
    dominant_sentiment: string;
    trend: string;
    engagement_correlation: string;
  };
  allTweets?: TweetSample[];
  sampleTweets: {
    positive: TweetSample[];
    negative: TweetSample[];
    neutral: TweetSample[];
  };
  performance?: {
    totalDuration: number;
    dataCollectionDuration: number;
    analysisDuration: number;
  };
}

const analysisSteps = [
  { id: 'validate', label: 'التحقق من البيانات', description: 'التحقق من صحة المدخلات والمفاتيح' },
  { id: 'fetch', label: 'جمع التغريدات', description: 'استخراج التغريدات من منصة تويتر' },
  { id: 'prepare', label: 'تجهيز البيانات', description: 'معالجة وتنظيف التغريدات للتحليل' },
  { id: 'analyze', label: 'تحليل المشاعر', description: 'تحليل المشاعر والاتجاهات من التغريدات' },
  { id: 'process', label: 'معالجة النتائج', description: 'استخراج الرؤى والإحصائيات' },
  { id: 'save', label: 'حفظ التحليل', description: 'حفظ النتائج في قاعدة البيانات' },
  { id: 'complete', label: 'اكتمل التحليل', description: 'تم الانتهاء من جميع الخطوات' },
];

const Index = () => {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string>();
  const { toast } = useToast();

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setCurrentStep(0);
    setError(undefined);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= analysisSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);
  };

  const handleResults = (data: AnalysisResult) => {
    console.log('Received results in Index:', {
      totalTweets: data.totalTweets,
      analyzedTweets: data.analyzedTweets,
      hasAllTweets: !!data.allTweets,
      allTweetsCount: data.allTweets?.length || 0,
      sentiments: data.sentiments
    });
    setResults(data);
    setIsAnalyzing(false);
    setCurrentStep(analysisSteps.length - 1);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageExplainer
        icon={Twitter}
        title="تحليل التغريدات"
        description="حلّل المشاعر والآراء من تويتر باستخدام الذكاء الاصطناعي — ابحث بالكلمات المفتاحية أو الحسابات واحصل على رؤى فورية"
        color="#1DA1F2"
      />

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 rounded-full bg-secondary p-1">
          <TabsTrigger value="analysis" className="text-base font-bold gap-2 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-primary-foreground">
            <Twitter className="h-4 w-4" />
            تحليل التغريدات
          </TabsTrigger>
          <TabsTrigger value="documentation" className="text-base font-bold gap-2 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4" />
            خيارات التحليل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-8">
          {!results && !isAnalyzing ? (
            <div className="max-w-2xl mx-auto">
              <TweetAnalysisForm
                onResults={handleResults}
                onAnalysisStart={handleAnalysisStart}
                onError={handleError}
              />
            </div>
          ) : isAnalyzing ? (
            <div className="max-w-3xl mx-auto">
              <AnalysisProgress
                currentStep={currentStep}
                steps={analysisSteps}
                error={error}
              />
            </div>
          ) : results ? (
            <>
              <div className="flex justify-between items-center">
                <Button
                  onClick={() => {
                    setResults(null);
                    setCurrentStep(0);
                    setError(undefined);
                  }}
                  className="bg-foreground text-primary-foreground font-bold hover:bg-foreground/90 rounded-full px-6"
                >
                  تحليل جديد
                </Button>

                {results.performance && (
                  <Card className="px-5 py-3 flex items-center gap-3 rounded-2xl border border-border">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-bold">وقت التحليل: </span>
                      <span className="font-bold text-lg nums-en">{(results.performance.totalDuration / 1000).toFixed(1)}ث</span>
                    </div>
                  </Card>
                )}
              </div>
              <AnalysisResults results={results} />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="documentation">
          <AnalysisDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
