import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, History, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CommentaryAnalysisForm from "@/components/CommentaryAnalysisForm";
import CommentaryResults from "@/components/CommentaryResults";
import CommentaryProgress from "@/components/CommentaryProgress";

interface CommentaryAnalysisResult {
  transcription: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  analysis: {
    overallScore: number;
    criteria: {
      clarity: {
        score: number;
        explanation: string;
        quotes: string[];
      };
      enthusiasm: {
        score: number;
        explanation: string;
        quotes: string[];
      };
      accuracy: {
        score: number;
        explanation: string;
        quotes: string[];
      };
      timing: {
        score: number;
        explanation: string;
        quotes: string[];
      };
      terminology: {
        score: number;
        explanation: string;
        quotes: string[];
      };
      eventReaction: {
        score: number;
        explanation: string;
        quotes: string[];
      };
      styleVariety: {
        score: number;
        explanation: string;
        quotes: string[];
      };
    };
    emotionalAnalysis?: {
      score: number;
      explanation: string;
      quotes: string[];
    };
    emotionalTimeline?: Array<{
      timestamp: number;
      emotion: string;
      intensity: number;
      description: string;
    }>;
    strengths: string[];
    improvements: string[];
    excitementTimeline: Array<{
      timestamp: number;
      score: number;
      event: string;
    }>;
  };
}

export default function CommentaryAnalysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<CommentaryAnalysisResult | null>(null);
  const [filename, setFilename] = useState<string>("");

  const handleAnalysisStart = (file: string) => {
    setIsAnalyzing(true);
    setResults(null);
    setFilename(file);
    setCurrentStep(0);
  };

  const handleResults = async (data: CommentaryAnalysisResult) => {
    setResults(data);
    setIsAnalyzing(false);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn("User not logged in, skipping save to database");
        toast({
          title: "تحليل مكتمل",
          description: "تم إنشاء التحليل. سجّل الدخول لحفظ النتائج.",
          duration: 5000,
        });
        return;
      }

      const analysisData = {
        user_id: user.id,
        filename: filename || "تحليل بدون اسم",
        transcription: data.transcription || "",
        segments: Array.isArray(data.segments) ? data.segments : [],
        overall_score: data.analysis?.overallScore || 0,
        clarity: data.analysis?.criteria?.clarity || { score: 0, explanation: "", quotes: [] },
        enthusiasm: data.analysis?.criteria?.enthusiasm || { score: 0, explanation: "", quotes: [] },
        accuracy: data.analysis?.criteria?.accuracy || { score: 0, explanation: "", quotes: [] },
        timing: data.analysis?.criteria?.timing || { score: 0, explanation: "", quotes: [] },
        terminology: data.analysis?.criteria?.terminology || { score: 0, explanation: "", quotes: [] },
        event_reaction: data.analysis?.criteria?.eventReaction || { score: 0, explanation: "", quotes: [] },
        style_variety: data.analysis?.criteria?.styleVariety || { score: 0, explanation: "", quotes: [] },
        strengths: Array.isArray(data.analysis?.strengths) ? data.analysis.strengths : [],
        improvements: Array.isArray(data.analysis?.improvements) ? data.analysis.improvements : [],
        excitement_timeline: Array.isArray(data.analysis?.excitementTimeline) ? data.analysis.excitementTimeline : [],
        emotional_analysis: data.analysis?.emotionalAnalysis || { score: 0, explanation: "", quotes: [] },
        emotional_timeline: Array.isArray(data.analysis?.emotionalTimeline) ? data.analysis.emotionalTimeline : [],
      };

      const { error } = await supabase
        .from("commentary_analyses")
        .insert(analysisData)
        .select();

      if (error) {
        throw new Error("فشل الحفظ: " + error.message);
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ التحليل في السجل. يمكنك الوصول إليه من صفحة السجل.",
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Error saving analysis:", error);
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "تم إنشاء التحليل لكن فشل الحفظ في قاعدة البيانات.",
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const handleError = (error: string) => {
    toast({
      title: "خطأ",
      description: error,
      variant: "destructive",
    });
    setIsAnalyzing(false);
    setCurrentStep(0);
  };

  const handleProgress = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-foreground text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full"
              >
                <ArrowRight className="h-4 w-4" />
                الرئيسية
              </Button>
              <Button
                onClick={() => navigate('/commentary-history')}
                variant="ghost"
                className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full"
              >
                <History className="h-4 w-4" />
                السجل
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">
                تحليل التعليق الرياضي
              </h1>
              <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-8 w-8" />
            </div>

            <div className="w-[120px]"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          {!results && !isAnalyzing && (
            <CommentaryAnalysisForm
              onAnalysisStart={handleAnalysisStart}
              onResults={handleResults}
              onError={handleError}
              onProgress={handleProgress}
            />
          )}

          {isAnalyzing && (
            <CommentaryProgress currentStep={currentStep} filename={filename} />
          )}

          {results && <CommentaryResults results={results} filename={filename} />}
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            ثمانية — تحليل التعليق الرياضي
          </p>
        </div>
      </footer>
    </div>
  );
}
