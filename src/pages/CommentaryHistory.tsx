import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trash2, Mic, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedAnalysis {
  id: string;
  filename: string;
  overall_score: number;
  created_at: string;
  segments: any[];
  transcription: string;
  clarity: string;
  enthusiasm: string;
  accuracy: string;
  timing: string;
  terminology: string;
  event_reaction: string;
  style_variety: string;
  strengths: string[];
  improvements: string[];
  excitement_timeline: any[];
}

export default function CommentaryHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();

    const interval = setInterval(() => {
      fetchAnalyses();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from("commentary_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAnalyses((data || []) as SavedAnalysis[]);
    } catch (error: any) {
      console.error("Error fetching analyses:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل السجل: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("commentary_analyses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAnalyses(analyses.filter((a) => a.id !== id));
      toast({
        title: "تم الحذف",
        description: "تم حذف التحليل بنجاح",
      });
    } catch (error: any) {
      console.error("Error deleting analysis:", error);
      toast({
        title: "خطأ",
        description: "فشل حذف التحليل",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-thmanyah-green";
    if (score >= 6) return "bg-thmanyah-amber";
    return "bg-thmanyah-red";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-foreground text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setLoading(true);
                  fetchAnalyses();
                }}
                variant="ghost"
                className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
              <Button
                onClick={() => navigate("/commentary-analysis")}
                variant="ghost"
                className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full"
              >
                <ArrowRight className="h-4 w-4" />
                تحليل جديد
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">سجل التحليلات</h1>
              <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-8 w-8" />
            </div>

            <div className="w-[120px]"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 flex-1">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-12 w-12 mx-auto mb-4 animate-pulse" />
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : analyses.length === 0 ? (
            <Card className="rounded-2xl border border-border shadow-th-sm">
              <CardContent className="py-12 text-center">
                <Mic className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-lg font-bold mb-2">لا توجد تحليلات محفوظة</p>
                <p className="text-muted-foreground mb-6">
                  قم بتحليل تعليق رياضي أولاً
                </p>
                <Button
                  onClick={() => navigate("/commentary-analysis")}
                  className="bg-foreground text-primary-foreground font-bold rounded-full"
                >
                  بدء التحليل
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4" dir="rtl">
              {analyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="rounded-2xl border border-border hover:shadow-th-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/commentary-history/${analysis.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 font-display">
                          {analysis.filename}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground nums-en">
                          {new Date(analysis.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${getScoreColor(
                            analysis.overall_score
                          )} text-white text-lg px-4 py-1 rounded-full nums-en`}
                        >
                          {analysis.overall_score}/10
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(analysis.id);
                          }}
                          className="hover:bg-thmanyah-red/10 rounded-full"
                        >
                          <Trash2 className="h-4 w-4 text-thmanyah-red" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-bold mb-1">نقاط القوة:</p>
                        <p className="text-muted-foreground nums-en">
                          {analysis.strengths?.length || 0} نقطة
                        </p>
                      </div>
                      <div>
                        <p className="font-bold mb-1">نقاط التحسين:</p>
                        <p className="text-muted-foreground nums-en">
                          {analysis.improvements?.length || 0} نقطة
                        </p>
                      </div>
                      <div>
                        <p className="font-bold mb-1">مدة التعليق:</p>
                        <p className="text-muted-foreground nums-en">
                          {Math.floor(
                            (analysis.segments[analysis.segments.length - 1]
                              ?.end || 0) / 60
                          )}{" "}
                          دقيقة
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            ثمانية — سجل التحليلات
          </p>
        </div>
      </footer>
    </div>
  );
}
