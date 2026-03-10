import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CommentaryResults from "@/components/CommentaryResults";

export default function CommentaryReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      if (!id) {
        toast({
          title: "خطأ",
          description: "معرف التقرير غير موجود",
          variant: "destructive",
        });
        navigate("/commentary-history");
        return;
      }

      const { data, error } = await supabase
        .from("commentary_analyses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "خطأ",
          description: "التقرير غير موجود",
          variant: "destructive",
        });
        navigate("/commentary-history");
        return;
      }

      const parseCriterion = (criterionData: any) => {
        if (typeof criterionData === 'object' && criterionData !== null) {
          return {
            score: criterionData.score || 0,
            explanation: criterionData.explanation || '',
            quotes: Array.isArray(criterionData.quotes) ? criterionData.quotes : []
          };
        }
        return {
          score: 0,
          explanation: typeof criterionData === 'string' ? criterionData : '',
          quotes: []
        };
      };

      const transformedData = {
        transcription: data.transcription,
        segments: data.segments || [],
        analysis: {
          overallScore: data.overall_score,
          criteria: {
            clarity: parseCriterion(data.clarity),
            enthusiasm: parseCriterion(data.enthusiasm),
            accuracy: parseCriterion(data.accuracy),
            timing: parseCriterion(data.timing),
            terminology: parseCriterion(data.terminology),
            eventReaction: parseCriterion(data.event_reaction),
            styleVariety: parseCriterion(data.style_variety)
          },
          emotionalAnalysis: parseCriterion(data.emotional_analysis),
          emotionalTimeline: data.emotional_timeline || [],
          strengths: data.strengths || [],
          improvements: data.improvements || [],
          excitementTimeline: data.excitement_timeline || []
        }
      };

      setReportData({
        data: transformedData,
        filename: data.filename
      });
    } catch (error: any) {
      console.error("Error fetching report:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل التقرير: " + error.message,
        variant: "destructive",
      });
      navigate("/commentary-history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-foreground text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate("/commentary-history")}
              variant="ghost"
              className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للسجل
            </Button>
            <h1 className="text-xl font-display font-bold" dir="rtl">{reportData.filename}</h1>
            <div className="w-[120px]"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 flex-1">
        <div className="max-w-6xl mx-auto">
          <CommentaryResults
            results={reportData.data}
            filename={reportData.filename}
          />
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            ثمانية — تقرير التحليل
          </p>
        </div>
      </footer>
    </div>
  );
}
