import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, Trash2, Download, ChevronDown, ChevronUp, CheckCircle, XCircle, MessageSquare, Save, Sparkles, BookmarkPlus, Bookmark } from "lucide-react";
import { QueryBuilder, Condition } from "@/components/QueryBuilder";
import { ExpandableImage } from "@/components/ExpandableImage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

// ... keep existing code (interfaces, etc.)

interface Search {
  id: string;
  job_title: string;
  city: string;
  job_titles: string[];
  cities: string[];
  skills: string[];
  experience_level: string[];
  education: string[];
  exclude_terms: string[];
  companies: string[];
  created_at: string;
  total_results: number;
}

interface AIAnalysis {
  score: number;
  strengths: string[];
  gaps: string[];
  assessment: string;
}

interface EnrichedProfile {
  fullName?: string;
  headline?: string;
  about?: string;
  profilePic?: string | null;
  skills?: Array<{ title: string }>;
  experiences?: Array<{
    title: string;
    companyName: string;
    jobLocation?: string;
    jobStartedOn?: string;
    jobEndedOn?: string;
    jobStillWorking?: boolean;
  }>;
  educations?: Array<{
    title: string;
    subtitle?: string;
    period?: {
      startedOn?: { year: number };
      endedOn?: { year: number };
    };
  }>;
}

interface Candidate {
  id: string;
  search_id: string;
  name: string;
  linkedin_url: string;
  profile_summary: string;
  ai_analysis: AIAnalysis;
  status: string;
  comment: string | null;
  created_at: string;
  enriched_profile?: EnrichedProfile | null;
  gender?: string;
  gender_confidence?: number;
  gender_explanation?: string;
  citizenship?: string;
  citizenship_confidence?: number;
  citizenship_explanation?: string;
  overall_relevancy_score?: number;
  job_title_relevancy_score?: number;
  industry_relevancy_score?: number;
  years_relevant_experience?: number;
  total_years_experience?: number;
  qualification_status?: string;
  saved?: boolean;
  ai_relevancy_analysis?: {
    explanation: string;
    analyzed_at: string;
  };
}

export default function CandidateHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searches, setSearches] = useState<Search[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [expandedSearches, setExpandedSearches] = useState<Set<string>>(new Set());
  const [expandedCandidates, setExpandedCandidates] = useState<Record<string, Record<string, boolean>>>({});
  const [editingComment, setEditingComment] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [analyzingDemographics, setAnalyzingDemographics] = useState<Record<string, boolean>>({});
  const [reanalyzingCandidate, setReanalyzingCandidate] = useState<Record<string, boolean>>({});
  const [enrichingCandidate, setEnrichingCandidate] = useState<Record<string, boolean>>({});
  
  // Relevancy filter states
  const [minOverallRelevancy, setMinOverallRelevancy] = useState<string>("");
  const [minJobTitleRelevancy, setMinJobTitleRelevancy] = useState<string>("");
  const [minIndustryRelevancy, setMinIndustryRelevancy] = useState<string>("");
  const [minYearsExperience, setMinYearsExperience] = useState<string>("");
  
  // Selected search filter
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("candidates");
  
  // Saved candidates state
  const [savingCandidate, setSavingCandidate] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: searchesData, error: searchesError } = await supabase
        .from('candidate_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchesError) throw searchesError;
      setSearches(searchesData || []);

      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;
      setCandidates((candidatesData || []) as unknown as Candidate[]);
    } catch (error: any) {
      console.error('Load history error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error: candidatesError } = await supabase
        .from('candidates')
        .delete()
        .eq('search_id', searchId);

      if (candidatesError) throw candidatesError;

      const { error: searchError } = await supabase
        .from('candidate_searches')
        .delete()
        .eq('id', searchId);

      if (searchError) throw searchError;

      setSearches(prev => prev.filter(s => s.id !== searchId));
      setCandidates(prev => prev.filter(c => c.search_id !== searchId));

      toast({
        title: "Deleted",
        description: "Search and candidates deleted successfully"
      });
    } catch (error: any) {
      console.error('Delete search error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteCandidate = async (candidateId: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;

      setCandidates(prev => prev.filter(c => c.id !== candidateId));

      toast({
        title: "Deleted",
        description: "Candidate deleted successfully"
      });
    } catch (error: any) {
      console.error('Delete candidate error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleSearchExpansion = (searchId: string) => {
    setExpandedSearches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(searchId)) {
        newSet.delete(searchId);
      } else {
        newSet.add(searchId);
      }
      return newSet;
    });
  };

  // Extract unique values for QueryBuilder
  const uniqueCompanies = Array.from(new Set(searches.flatMap(s => s.companies || [])));
  const uniqueCities = Array.from(new Set(searches.flatMap(s => s.cities || [])));
  const uniqueJobTitles = Array.from(new Set(searches.flatMap(s => s.job_titles || [])));
  const uniqueSkills = Array.from(new Set(searches.flatMap(s => s.skills || [])));
  const uniqueEducation = Array.from(new Set(searches.flatMap(s => s.education || [])));
  const uniqueExperience = Array.from(new Set(searches.flatMap(s => s.experience_level || [])));

  // Helper function to check if candidate matches a condition
  const matchesCondition = (candidate: Candidate, condition: Condition): boolean => {
    const search = searches.find(s => s.id === candidate.search_id);
    if (!search) return true;

    let value: string | undefined;
    let candidateValues: string[] = [];

    switch (condition.filterType) {
      case 'company':
        candidateValues = search.companies || [];
        break;
      case 'city':
        candidateValues = search.cities || [];
        break;
      case 'jobTitle':
        candidateValues = search.job_titles || [];
        break;
      case 'skills':
        candidateValues = search.skills || [];
        break;
      case 'education':
        candidateValues = search.education || [];
        break;
      case 'experience':
        candidateValues = search.experience_level || [];
        break;
      case 'gender':
        value = candidate.gender;
        break;
      case 'citizenship':
        value = candidate.citizenship;
        break;
    }

    const conditionValue = condition.value.toLowerCase();

    switch (condition.operator) {
      case 'is':
        if (candidateValues.length > 0) {
          return candidateValues.some(v => v.toLowerCase() === conditionValue);
        }
        return value?.toLowerCase() === conditionValue;
      
      case 'is_not':
        if (candidateValues.length > 0) {
          return !candidateValues.some(v => v.toLowerCase() === conditionValue);
        }
        return value?.toLowerCase() !== conditionValue;
      
      case 'contains':
        if (candidateValues.length > 0) {
          return candidateValues.some(v => v.toLowerCase().includes(conditionValue));
        }
        return value?.toLowerCase().includes(conditionValue) || false;
      
      case 'not_contains':
        if (candidateValues.length > 0) {
          return !candidateValues.some(v => v.toLowerCase().includes(conditionValue));
        }
        return !value?.toLowerCase().includes(conditionValue);
      
      default:
        return true;
    }
  };

  const handleSearchClick = (searchId: string) => {
    setSelectedSearchId(searchId);
    setActiveTab("candidates");
    toast({
      title: "Candidates Filtered",
      description: "Now showing candidates from this search only"
    });
  };

  const clearSearchFilter = () => {
    setSelectedSearchId(null);
    toast({
      title: "Filter Removed",
      description: "Now showing all candidates"
    });
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    // Filter by selected search first
    if (selectedSearchId && c.search_id !== selectedSearchId) {
      return false;
    }
    
    if (selectedStatus !== "all" && c.status !== selectedStatus) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = c.name.toLowerCase().includes(query);
      const matchesAssessment = c.ai_analysis.assessment?.toLowerCase().includes(query);
      if (!matchesName && !matchesAssessment) {
        return false;
      }
    }
    
    // Relevancy filters
    if (minOverallRelevancy && c.overall_relevancy_score !== undefined) {
      if (c.overall_relevancy_score < parseInt(minOverallRelevancy)) {
        return false;
      }
    }
    
    if (minJobTitleRelevancy && c.job_title_relevancy_score !== undefined) {
      if (c.job_title_relevancy_score < parseInt(minJobTitleRelevancy)) {
        return false;
      }
    }
    
    if (minIndustryRelevancy && c.industry_relevancy_score !== undefined) {
      if (c.industry_relevancy_score < parseInt(minIndustryRelevancy)) {
        return false;
      }
    }
    
    if (minYearsExperience && c.years_relevant_experience !== undefined) {
      if (c.years_relevant_experience < parseFloat(minYearsExperience)) {
        return false;
      }
    }

    if (conditions.length === 0) {
      return true;
    }

    // Group conditions by logical operator
    let currentGroup: Condition[] = [];
    const groups: Condition[][] = [];

    conditions.forEach((condition, index) => {
      currentGroup.push(condition);
      
      if (index === conditions.length - 1 || condition.logicalOperator === 'OR') {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    });

    // Evaluate groups (OR between groups, AND within groups)
    return groups.some(group => {
      return group.every(condition => matchesCondition(c, condition));
    });
  });

  const updateCandidateStatus = async (candidateId: string, newStatus: string) => {
    setSavingStatus(prev => ({ ...prev, [candidateId]: true }));
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidateId);

      if (error) throw error;

      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c)
      );

      toast({
        title: "Updated",
        description: "Candidate status updated successfully"
      });
    } catch (error: any) {
      console.error('Update status error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingStatus(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const updateCandidateComment = async (candidateId: string) => {
    setSavingStatus(prev => ({ ...prev, [candidateId]: true }));
    try {
      const comment = editingComment[candidateId] || '';
      const { error } = await supabase
        .from('candidates')
        .update({ comment })
        .eq('id', candidateId);

      if (error) throw error;

      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, comment } : c)
      );

      setEditingComment(prev => {
        const newState = { ...prev };
        delete newState[candidateId];
        return newState;
      });

      toast({
        title: "Saved",
        description: "Notes saved successfully"
      });
    } catch (error: any) {
      console.error('Update comment error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingStatus(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const analyzeDemographics = async (candidateId: string) => {
    setAnalyzingDemographics(prev => ({ ...prev, [candidateId]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-demographics', {
        body: { candidateId }
      });

      if (error) throw new Error(error.message || 'Failed to analyze demographics');
      if (data?.error) throw new Error(data.error);
      if (!data?.analysis) throw new Error('No analysis data received');

      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? {
          ...c,
          gender: data.analysis.gender,
          gender_confidence: data.analysis.gender_confidence,
          gender_explanation: data.analysis.gender_explanation,
          citizenship: data.analysis.citizenship,
          citizenship_confidence: data.analysis.citizenship_confidence,
          citizenship_explanation: data.analysis.citizenship_explanation
        } : c)
      );

      toast({
        title: "Analysis Complete",
        description: "Demographics analyzed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Analysis Error",
        description: error.message || 'Failed to analyze demographics',
        variant: "destructive"
      });
    } finally {
      setAnalyzingDemographics(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const reanalyzeCandidate = async (candidateId: string) => {
    setReanalyzingCandidate(prev => ({ ...prev, [candidateId]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('reanalyze-candidate', {
        body: { candidateId }
      });

      if (error) throw new Error(error.message || 'Re-analysis failed');
      if (data?.error) throw new Error(data.error);
      if (!data?.analysis) throw new Error('No analysis data received');

      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? {
          ...c,
          overall_relevancy_score: data.analysis.overall_relevancy_score,
          job_title_relevancy_score: data.analysis.job_title_relevancy_score,
          industry_relevancy_score: data.analysis.industry_relevancy_score,
          years_relevant_experience: data.analysis.years_relevant_experience,
          total_years_experience: data.analysis.total_years_experience,
          qualification_status: data.analysis.qualification_status,
          ai_relevancy_analysis: data.analysis.ai_relevancy_analysis
        } : c)
      );

      toast({
        title: "Re-analysis Complete",
        description: "Profile re-analyzed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Re-analysis Error",
        description: error.message || 'Failed to re-analyze profile',
        variant: "destructive"
      });
    } finally {
      setReanalyzingCandidate(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const enrichCandidate = async (candidateId: string) => {
    console.log('Starting enrichment for candidate:', candidateId);
    setEnrichingCandidate(prev => ({ ...prev, [candidateId]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('enrich-candidate', {
        body: { candidateId }
      });

      console.log('Enrichment response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to enrich profile');
      }
      
      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.success) {
        console.error('Function returned unsuccessful response');
        throw new Error('Failed to enrich profile');
      }

      console.log('Enrichment successful');
      toast({
        title: "Enrichment Successful",
        description: "Profile enriched successfully from LinkedIn"
      });

      await loadHistory();
    } catch (error: any) {
      console.error('Enrichment error:', error);
      toast({
        title: "Enrichment Error",
        description: error.message || 'Failed to enrich profile from LinkedIn',
        variant: "destructive"
      });
    } finally {
      setEnrichingCandidate(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredCandidates.map(candidate => {
      const search = searches.find(s => s.id === candidate.search_id);
      return {
        'Name': candidate.name,
        'Status': getStatusText(candidate.status),
        'Score': candidate.ai_analysis.score.toFixed(1),
        'LinkedIn URL': candidate.linkedin_url,
        'Assessment': candidate.ai_analysis.assessment,
        'Strengths': candidate.ai_analysis.strengths.join(', '),
        'Gaps': candidate.ai_analysis.gaps.join(', '),
        'Gender': candidate.gender || 'Unspecified',
        'Citizenship': candidate.citizenship || 'Unspecified',
        'Notes': candidate.comment || '',
        'Date Added': format(new Date(candidate.created_at), 'yyyy-MM-dd HH:mm'),
        'Search': search?.job_title || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, `candidates-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

    toast({
      title: "Exported",
      description: "Data exported to Excel successfully"
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'qualified': return 'Qualified';
      case 'not_qualified': return 'Not Qualified';
      default: return 'Under Review';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified': return 'bg-green-500 hover:bg-thmanyah-green';
      case 'not_qualified': return 'bg-red-500 hover:bg-thmanyah-red';
      default: return 'bg-yellow-500 hover:bg-thmanyah-amber';
    }
  };

  const getQualificationText = (status?: string) => {
    switch (status) {
      case 'overqualified': return 'Overqualified';
      case 'qualified': return 'Qualified';
      case 'underqualified': return 'Underqualified';
      default: return 'Pending Assessment';
    }
  };

  const getQualificationColor = (status?: string) => {
    switch (status) {
      case 'overqualified': return 'bg-blue-500';
      case 'qualified': return 'bg-green-500';
      case 'underqualified': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleSaveCandidate = async (candidateId: string, currentSaved: boolean) => {
    setSavingCandidate(prev => ({ ...prev, [candidateId]: true }));
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ saved: !currentSaved })
        .eq('id', candidateId);

      if (error) throw error;

      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, saved: !currentSaved } : c)
      );

      toast({
        title: !currentSaved ? "Saved" : "Unsaved",
        description: !currentSaved ? "Candidate saved successfully" : "Candidate unsaved"
      });
    } catch (error: any) {
      console.error('Toggle save error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingCandidate(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const calculateTotalExperience = (experiences?: Array<any>): number => {
    if (!experiences || experiences.length === 0) return 0;
    
    let totalMonths = 0;
    const now = new Date();
    
    experiences.forEach(exp => {
      if (!exp.jobStartedOn) return;
      
      const startDate = new Date(exp.jobStartedOn);
      const endDate = exp.jobStillWorking ? now : (exp.jobEndedOn ? new Date(exp.jobEndedOn) : now);
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
      
      if (months > 0) totalMonths += months;
    });
    
    return Math.round((totalMonths / 12) * 10) / 10;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-foreground text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button onClick={() => navigate("/candidate-hunter")} variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full">
                بحث جديد
              </Button>
              <Button onClick={() => navigate("/")} variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full">
                الرئيسية
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">سجل البحث عن مرشحين</h1>
              <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-8 w-8" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-1">
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 rounded-full bg-secondary p-1">
            <TabsTrigger value="candidates" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-primary-foreground font-bold">جميع المرشحين</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-primary-foreground font-bold">المحفوظون</TabsTrigger>
            <TabsTrigger value="searches" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-primary-foreground font-bold">عمليات البحث</TabsTrigger>
          </TabsList>

          <TabsContent value="candidates" className="space-y-4">
            <div className="space-y-4">
              {selectedSearchId && (
                <Card className="border-2 border-primary bg-primary/5">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="default">Active Filter</Badge>
                      <span className="text-sm font-semibold">
                        Showing candidates from search: {searches.find(s => s.id === selectedSearchId)?.job_title}
                      </span>
                    </div>
                    <Button onClick={clearSearchFilter} variant="ghost" size="sm">
                      Remove Filter
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Badge variant={selectedStatus === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedStatus("all")}>
                    All ({candidates.length})
                  </Badge>
                  <Badge variant={selectedStatus === "qualified" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedStatus("qualified")}>
                    Qualified ({candidates.filter(c => c.status === 'qualified').length})
                  </Badge>
                  <Badge variant={selectedStatus === "not_qualified" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedStatus("not_qualified")}>
                    Not Qualified ({candidates.filter(c => c.status === 'not_qualified').length})
                  </Badge>
                  <Badge variant={selectedStatus === "under_review" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedStatus("under_review")}>
                    Under Review ({candidates.filter(c => c.status === 'under_review').length})
                  </Badge>
                </div>
                <Button onClick={exportToExcel} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
                
                {/* Relevancy Filters */}
                <Card className="p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Analysis Filters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Overall Match (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        value={minOverallRelevancy}
                        onChange={(e) => setMinOverallRelevancy(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Job Title Relevancy (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        value={minJobTitleRelevancy}
                        onChange={(e) => setMinJobTitleRelevancy(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Industry Relevancy (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        value={minIndustryRelevancy}
                        onChange={(e) => setMinIndustryRelevancy(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Years Experience</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="e.g. 3.5"
                        value={minYearsExperience}
                        onChange={(e) => setMinYearsExperience(e.target.value)}
                      />
                    </div>
                  </div>
                  {(minOverallRelevancy || minJobTitleRelevancy || minIndustryRelevancy || minYearsExperience) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setMinOverallRelevancy("");
                        setMinJobTitleRelevancy("");
                        setMinIndustryRelevancy("");
                        setMinYearsExperience("");
                      }}
                      className="mt-3"
                    >
                      Clear Filters
                    </Button>
                  )}
                </Card>

                <Card className="p-4">
                  <QueryBuilder
                    conditions={conditions}
                    onConditionsChange={setConditions}
                    availableValues={{
                      companies: uniqueCompanies,
                      cities: uniqueCities,
                      jobTitles: uniqueJobTitles,
                      skills: uniqueSkills,
                      education: uniqueEducation,
                      experience: uniqueExperience
                    }}
                  />
                </Card>

                {(searchQuery || conditions.length > 0 || minOverallRelevancy || minJobTitleRelevancy || minIndustryRelevancy || minYearsExperience) && (
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredCandidates.length} of {candidates.length} candidates
                  </div>
                )}
              </div>
            </div>

            {/* ... keep existing code (candidate cards rendering) */}
            {filteredCandidates.length === 0 ? (
              <Card className="border-2">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No candidates found</p>
                </CardContent>
              </Card>
            ) : (
              filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <ExpandableImage 
                        src={candidate.enriched_profile?.profilePic}
                        alt={candidate.name}
                        fallback={candidate.name[0]}
                        className="h-24 w-24 shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl">{candidate.name}</CardTitle>
                          <Badge className={getStatusColor(candidate.status)}>
                            {getStatusText(candidate.status)}
                          </Badge>
                          
                          {/* Qualification Status Badge */}
                          {candidate.qualification_status && (
                            <Badge className={getQualificationColor(candidate.qualification_status)}>
                              {getQualificationText(candidate.qualification_status)}
                            </Badge>
                          )}
                          
                          <Badge variant="outline" className="text-lg font-bold">
                            Job Title Match: {candidate.job_title_relevancy_score || 'N/A'}%
                          </Badge>
                          
                          {/* Enrichment Status Badge */}
                          {candidate.enriched_profile ? (
                            <Badge variant="default" className="bg-thmanyah-green">
                              ✓ مُثرى
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-thmanyah-amber">
                              غير مُثرى
                            </Badge>
                          )}
                          
                          {candidate.gender && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Badge variant="secondary" className="cursor-help">
                                  {candidate.gender}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" dir="rtl">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">التفاصيل:</p>
                                  <p className="text-xs text-muted-foreground">{candidate.gender_explanation}</p>
                                  {candidate.gender_confidence && (
                                    <p className="text-xs">الثقة: {candidate.gender_confidence}%</p>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}

                          {candidate.citizenship && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Badge variant="secondary" className="cursor-help">
                                  {candidate.citizenship}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" dir="rtl">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">التفاصيل:</p>
                                  <p className="text-xs text-muted-foreground">{candidate.citizenship_explanation}</p>
                                  {candidate.citizenship_confidence && (
                                    <p className="text-xs">الثقة: {candidate.citizenship_confidence}%</p>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}

                          {candidate.enriched_profile && (
                            <>
                              <Button
                                onClick={() => reanalyzeCandidate(candidate.id)}
                                size="sm"
                                variant="outline"
                                disabled={reanalyzingCandidate[candidate.id]}
                              >
                                {reanalyzingCandidate[candidate.id] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary ml-2"></div>
                                    جاري إعادة التحليل...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 ml-2" />
                                    إعادة تحليل الملاءمة
                                  </>
                                )}
                              </Button>

                              <Button
                                onClick={() => analyzeDemographics(candidate.id)}
                                size="sm"
                                variant="outline"
                                disabled={analyzingDemographics[candidate.id]}
                              >
                                {analyzingDemographics[candidate.id] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary ml-2"></div>
                                    جاري التحليل...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 ml-2" />
                                    {candidate.gender || candidate.citizenship ? 'إعادة تحليل الديموغرافيا' : 'تحليل الديموغرافيا'}
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          
                          {/* Enrich Button - show only if not enriched */}
                          {!candidate.enriched_profile && (
                            <Button
                              onClick={() => enrichCandidate(candidate.id)}
                              size="sm"
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={enrichingCandidate[candidate.id]}
                            >
                              {enrichingCandidate[candidate.id] ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-2"></div>
                                  جاري الإثراء...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 ml-2" />
                                  إثراء من LinkedIn
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary">
                            <ExternalLink className="h-4 w-4 ml-1" />
                            LinkedIn Profile
                          </a>
                          <span>•</span>
                          <span>{format(new Date(candidate.created_at), 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                        
                        {/* LinkedIn Info - Display directly */}
                        {candidate.enriched_profile && (
                          <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-md">
                            {candidate.enriched_profile.headline && (
                              <p className="text-sm font-medium text-foreground">
                                📌 {candidate.enriched_profile.headline}
                              </p>
                            )}
                            
                            {/* Experience Breakdown */}
                            {(candidate.years_relevant_experience !== undefined || candidate.total_years_experience !== undefined) && (
                              <div className="flex gap-4 text-xs">
                                {candidate.years_relevant_experience !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-green-600">Relevant Experience:</span>
                                    <span>{candidate.years_relevant_experience} years</span>
                                  </div>
                                )}
                                {candidate.total_years_experience !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-blue-600">Total Experience:</span>
                                    <span>{candidate.total_years_experience} years</span>
                                  </div>
                                )}
                                {!candidate.total_years_experience && candidate.enriched_profile.experiences && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-blue-600">Total Experience:</span>
                                    <span>{calculateTotalExperience(candidate.enriched_profile.experiences)} years</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Current/Latest Position */}
                            {candidate.enriched_profile.experiences && candidate.enriched_profile.experiences.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                💼 {candidate.enriched_profile.experiences[0].title} at {candidate.enriched_profile.experiences[0].companyName}
                                {candidate.enriched_profile.experiences[0].jobStillWorking && " (Current)"}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => toggleSaveCandidate(candidate.id, candidate.saved || false)} 
                          variant={candidate.saved ? "default" : "outline"}
                          size="icon"
                          disabled={savingCandidate[candidate.id]}
                          title={candidate.saved ? "Unsave" : "Save Candidate"}
                        >
                          {candidate.saved ? <Bookmark className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                        </Button>
                        <Button onClick={() => deleteCandidate(candidate.id)} variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* AI Relevancy Analysis Section - Collapsible */}
                    {(candidate.overall_relevancy_score !== undefined || 
                      candidate.job_title_relevancy_score !== undefined || 
                      candidate.industry_relevancy_score !== undefined ||
                      candidate.years_relevant_experience !== undefined) && (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="ai-analysis" className="border-none">
                          <AccordionTrigger className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 hover:no-underline hover:bg-primary/10">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-base">تحليل الذكاء الاصطناعي</h3>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {candidate.overall_relevancy_score !== undefined && (
                                  <div className="text-center p-3 bg-background rounded-md border">
                                    <p className="text-2xl font-bold text-primary">{candidate.overall_relevancy_score}%</p>
                                    <p className="text-xs text-muted-foreground mt-1">نسبة التطابق الإجمالية</p>
                                  </div>
                                )}
                                
                                {candidate.job_title_relevancy_score !== undefined && (
                                  <div className="text-center p-3 bg-background rounded-md border">
                                    <p className="text-2xl font-bold text-primary">{candidate.job_title_relevancy_score}%</p>
                                    <p className="text-xs text-muted-foreground mt-1">ملاءمة المسمى الوظيفي</p>
                                  </div>
                                )}
                                
                                {candidate.industry_relevancy_score !== undefined && (
                                  <div className="text-center p-3 bg-background rounded-md border">
                                    <p className="text-2xl font-bold text-primary">{candidate.industry_relevancy_score}%</p>
                                    <p className="text-xs text-muted-foreground mt-1">ملاءمة الصناعة</p>
                                  </div>
                                )}
                                
                                {candidate.years_relevant_experience !== undefined && (
                                  <div className="text-center p-3 bg-background rounded-md border">
                                    <p className="text-2xl font-bold text-primary">{candidate.years_relevant_experience}</p>
                                    <p className="text-xs text-muted-foreground mt-1">سنوات الخبرة ذات الصلة</p>
                                  </div>
                                )}
                              </div>
                              
                              {candidate.ai_relevancy_analysis?.explanation && (
                                <div className="p-3 bg-background rounded-md border">
                                  <p className="text-sm font-semibold mb-2">الشرح التفصيلي:</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{candidate.ai_relevancy_analysis.explanation}</p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => updateCandidateStatus(candidate.id, 'qualified')}
                        variant={candidate.status === 'qualified' ? 'default' : 'outline'}
                        size="sm"
                        disabled={savingStatus[candidate.id]}
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        مؤهل
                      </Button>
                      <Button
                        onClick={() => updateCandidateStatus(candidate.id, 'not_qualified')}
                        variant={candidate.status === 'not_qualified' ? 'default' : 'outline'}
                        size="sm"
                        disabled={savingStatus[candidate.id]}
                      >
                        <XCircle className="h-4 w-4 ml-2" />
                        غير مؤهل
                      </Button>
                      <Button
                        onClick={() => updateCandidateStatus(candidate.id, 'under_review')}
                        variant={candidate.status === 'under_review' ? 'default' : 'outline'}
                        size="sm"
                        disabled={savingStatus[candidate.id]}
                      >
                        <MessageSquare className="h-4 w-4 ml-2" />
                        قيد المراجعة
                      </Button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">التقييم:</p>
                      <p className="text-sm text-muted-foreground">{candidate.ai_analysis.assessment}</p>
                    </div>

                    {candidate.ai_analysis.strengths.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">نقاط القوة:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {candidate.ai_analysis.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {candidate.ai_analysis.gaps.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">الفجوات:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {candidate.ai_analysis.gaps.map((gap, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <p className="text-sm font-semibold">ملاحظات:</p>
                      </div>
                      {editingComment[candidate.id] !== undefined ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingComment[candidate.id]}
                            onChange={(e) => setEditingComment(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                            placeholder="أضف ملاحظاتك هنا..."
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateCandidateComment(candidate.id)}
                              size="sm"
                              disabled={savingStatus[candidate.id]}
                            >
                              <Save className="h-4 w-4 ml-2" />
                              حفظ
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingComment(prev => {
                                  const newState = { ...prev };
                                  delete newState[candidate.id];
                                  return newState;
                                });
                              }}
                              size="sm"
                              variant="outline"
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {candidate.comment ? (
                            <p className="text-sm text-muted-foreground mb-2">{candidate.comment}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-2">لا توجد ملاحظات</p>
                          )}
                          <Button
                            onClick={() => setEditingComment(prev => ({ ...prev, [candidate.id]: candidate.comment || '' }))}
                            size="sm"
                            variant="outline"
                          >
                            {candidate.comment ? 'تعديل' : 'إضافة ملاحظات'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {candidate.enriched_profile && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-between">
                            <span>عرض الملف الكامل من LinkedIn</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 mt-4">
                          {candidate.enriched_profile.about && (
                            <div className="bg-muted/30 p-4 rounded-md">
                              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                نبذة عن المرشح:
                              </p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{candidate.enriched_profile.about}</p>
                            </div>
                          )}

                          {candidate.enriched_profile.experiences && candidate.enriched_profile.experiences.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-3">الخبرات المهنية:</p>
                              <div className="space-y-3">
                                {candidate.enriched_profile.experiences.map((exp, idx) => {
                                  const startDate = exp.jobStartedOn ? new Date(exp.jobStartedOn).toLocaleDateString('en-US') : 'غير محدد';
                                  const endDate = exp.jobStillWorking ? 'حتى الآن' : (exp.jobEndedOn ? new Date(exp.jobEndedOn).toLocaleDateString('en-US') : 'غير محدد');
                                  
                                  return (
                                    <div key={idx} className="border-r-2 border-primary pr-3 pb-2">
                                      <p className="text-sm font-medium">{exp.title}</p>
                                      <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                                      {exp.jobLocation && (
                                        <p className="text-xs text-muted-foreground">📍 {exp.jobLocation}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-1">
                                        📅 {startDate} - {endDate}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {candidate.enriched_profile.skills && candidate.enriched_profile.skills.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">المهارات:</p>
                              <div className="flex flex-wrap gap-2">
                                {candidate.enriched_profile.skills.map((skill, idx) => (
                                  <Badge key={idx} variant="secondary">{skill.title}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {candidate.enriched_profile.educations && candidate.enriched_profile.educations.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">التعليم:</p>
                              <div className="space-y-2">
                                {candidate.enriched_profile.educations.map((edu, idx) => (
                                  <div key={idx} className="border-b pb-2 last:border-b-0">
                                    <p className="text-sm font-medium">{edu.title}</p>
                                    {edu.subtitle && (
                                      <p className="text-sm text-muted-foreground">{edu.subtitle}</p>
                                    )}
                                    {edu.period && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {edu.period.startedOn?.year || ''} - {edu.period.endedOn?.year || 'حتى الآن'}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {candidates.filter(c => c.saved).length === 0 ? (
              <Card className="border-2">
                <CardContent className="py-12 text-center">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">لا توجد مرشحين محفوظين</p>
                  <p className="text-sm text-muted-foreground">استخدم زر الحفظ على بطاقات المرشحين لحفظهم هنا</p>
                </CardContent>
              </Card>
            ) : (
              candidates.filter(c => c.saved).map((candidate) => (
                <Card key={candidate.id} className="border-2 border-primary/50" dir="rtl">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <ExpandableImage 
                        src={candidate.enriched_profile?.profilePic}
                        alt={candidate.name}
                        fallback={candidate.name[0]}
                        className="h-24 w-24 shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl">{candidate.name}</CardTitle>
                          <Badge className={getStatusColor(candidate.status)}>
                            {getStatusText(candidate.status)}
                          </Badge>
                          
                          {candidate.qualification_status && (
                            <Badge className={getQualificationColor(candidate.qualification_status)}>
                              {getQualificationText(candidate.qualification_status)}
                            </Badge>
                          )}
                          
                          <Badge variant="outline" className="text-lg font-bold">
                            ملائمة المسمى: {candidate.job_title_relevancy_score || 'N/A'}%
                          </Badge>
                          
                          {candidate.enriched_profile ? (
                            <Badge variant="default" className="bg-thmanyah-green">
                              ✓ مُثرى
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-thmanyah-amber">
                              غير مُثرى
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary">
                            <ExternalLink className="h-4 w-4 ml-1" />
                            LinkedIn Profile
                          </a>
                          <span>•</span>
                          <span>{format(new Date(candidate.created_at), 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                        
                        {candidate.enriched_profile && (
                          <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-md">
                            {candidate.enriched_profile.headline && (
                              <p className="text-sm font-medium text-foreground">
                                📌 {candidate.enriched_profile.headline}
                              </p>
                            )}
                            
                            {(candidate.years_relevant_experience !== undefined || candidate.total_years_experience !== undefined) && (
                              <div className="flex gap-4 text-xs">
                                {candidate.years_relevant_experience !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-green-600">خبرة ذات صلة:</span>
                                    <span>{candidate.years_relevant_experience} سنة</span>
                                  </div>
                                )}
                                {candidate.total_years_experience !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-blue-600">إجمالي الخبرة:</span>
                                    <span>{candidate.total_years_experience} سنة</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {candidate.enriched_profile.experiences && candidate.enriched_profile.experiences.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                💼 {candidate.enriched_profile.experiences[0].title} في {candidate.enriched_profile.experiences[0].companyName}
                                {candidate.enriched_profile.experiences[0].jobStillWorking && " (حالياً)"}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => toggleSaveCandidate(candidate.id, true)} 
                          variant="default"
                          size="icon"
                          disabled={savingCandidate[candidate.id]}
                          title="إلغاء الحفظ"
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteCandidate(candidate.id)} variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="searches" className="space-y-4">
            {searches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">لا توجد عمليات بحث</p>
                  <Button onClick={() => navigate("/candidate-hunter")} className="mt-4">
                    بدء بحث جديد
                  </Button>
                </CardContent>
              </Card>
            ) : (
              searches.map((search) => {
                const searchCandidates = candidates.filter(c => c.search_id === search.id);
                return (
                  <Card 
                    key={search.id} 
                    dir="rtl" 
                    className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                      selectedSearchId === search.id ? 'border-2 border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSearchClick(search.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle>{search.job_title}</CardTitle>
                            {selectedSearchId === search.id && (
                              <Badge variant="default" className="text-xs">نشط</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(search.created_at), 'yyyy-MM-dd HH:mm')}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge>{searchCandidates.length} مرشح</Badge>
                            {search.cities.length > 0 && (
                              <Badge variant="outline">{search.cities.join(', ')}</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSearch(search.id);
                          }}
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="mb-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        💡 انقر على البطاقة لعرض مرشحي هذا البحث فقط
                      </div>
                      
                      <Collapsible
                        open={expandedSearches.has(search.id)}
                        onOpenChange={(isOpen) => {
                          if (isOpen) {
                            toggleSearchExpansion(search.id);
                          }
                        }}
                      >
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-between"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>عرض التفاصيل</span>
                            {expandedSearches.has(search.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 mt-4">
                          {search.companies.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">الشركات:</p>
                              <div className="flex flex-wrap gap-2">
                                {search.companies.map((company, idx) => (
                                  <Badge key={idx} variant="secondary">{company}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {search.skills.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">المهارات:</p>
                              <div className="flex flex-wrap gap-2">
                                {search.skills.map((skill, idx) => (
                                  <Badge key={idx} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {search.job_titles.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">المسميات الوظيفية:</p>
                              <div className="flex flex-wrap gap-2">
                                {search.job_titles.map((title, idx) => (
                                  <Badge key={idx} variant="secondary">{title}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {search.education.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">التعليم:</p>
                              <div className="flex flex-wrap gap-2">
                                {search.education.map((edu, idx) => (
                                  <Badge key={idx} variant="secondary">{edu}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {search.experience_level.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">مستوى الخبرة:</p>
                              <div className="flex flex-wrap gap-2">
                                {search.experience_level.map((exp, idx) => (
                                  <Badge key={idx} variant="secondary">{exp}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">ثمانية — سجل البحث عن مرشحين</p>
        </div>
      </footer>
    </div>
  );
}
