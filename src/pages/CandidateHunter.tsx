import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ExternalLink, ChevronDown, ChevronUp, Briefcase, History, Plus, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import TagInput from "@/components/TagInput";

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
  languages?: Array<{
    name: string;
    proficiency?: string;
  }>;
}

interface Candidate {
  id: string;
  name: string;
  linkedin_url: string;
  profile_summary: string;
  ai_analysis: AIAnalysis;
  status: string;
  comment: string | null;
  enriched_profile?: EnrichedProfile | null;
}

export default function CandidateHunter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<string[]>([]);
  const [experienceLevelInput, setExperienceLevelInput] = useState("");
  const [education, setEducation] = useState<string[]>([]);
  const [educationInput, setEducationInput] = useState("");
  const [excludeTerms, setExcludeTerms] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [queryPreview, setQueryPreview] = useState("");
  const [previousCompanies, setPreviousCompanies] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<string, boolean>>>({});
  const [previousSearches, setPreviousSearches] = useState<any[]>([]);
  
  // Companies management state
  const [managedCompanies, setManagedCompanies] = useState<Array<{id: string, name: string, group_name: string}>>([]);
  const [companyGroups, setCompanyGroups] = useState<string[]>([]);
  const [newCompaniesInput, setNewCompaniesInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupInput, setNewGroupInput] = useState("");
  const [isAddingCompanies, setIsAddingCompanies] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState<string | null>(null);

  useEffect(() => {
    loadPreviousCompanies();
    loadPreviousSearches();
    loadManagedCompanies();
  }, []);

  const loadPreviousCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_searches')
        .select('companies')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique companies from all searches
      const allCompanies = new Set<string>();
      data?.forEach(search => {
        search.companies?.forEach((company: string) => {
          if (company && company.trim()) {
            allCompanies.add(company.trim());
          }
        });
      });

      setPreviousCompanies(Array.from(allCompanies).sort());
    } catch (error) {
      console.error('Error loading previous companies:', error);
    }
  };

  const loadPreviousSearches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('candidate_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPreviousSearches(data || []);
    } catch (error) {
      console.error('Error loading previous searches:', error);
    }
  };

  const loadManagedCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found when loading companies');
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('group_name', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error loading companies:', error);
        throw error;
      }

      setManagedCompanies(data || []);
      
      // Extract unique groups
      const groups = [...new Set(data?.map(c => c.group_name) || [])];
      setCompanyGroups(groups.sort());
    } catch (error: any) {
      console.error('Error loading managed companies:', error);
      toast({
        title: "Error Loading Companies",
        description: error.message || "An error occurred while loading the company list",
        variant: "destructive"
      });
    }
  };

  const addManagedCompanies = async () => {
    if (!newCompaniesInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one company name",
        variant: "destructive"
      });
      return;
    }

    const groupName = selectedGroup === 'new' ? newGroupInput.trim() : selectedGroup;
    
    if (!groupName) {
      toast({
        title: "Error",
        description: "Please select or create a group",
        variant: "destructive"
      });
      return;
    }

    setIsAddingCompanies(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add companies');
      }

      // Parse companies (newlines, commas, or semicolons)
      const companyNames = newCompaniesInput
        .split(/[\n,;]+/)
        .map(c => c.trim())
        .filter(c => c);

      if (companyNames.length === 0) {
        throw new Error('No valid company names found');
      }

      // Check for duplicates
      const existingNames = new Set(managedCompanies.map(c => c.name.toLowerCase()));
      const newCompanies = companyNames.filter(name => !existingNames.has(name.toLowerCase()));
      const duplicates = companyNames.filter(name => existingNames.has(name.toLowerCase()));

      if (newCompanies.length === 0) {
        toast({
          title: "Warning",
          description: "All entered companies already exist",
          variant: "destructive"
        });
        return;
      }

      // Insert companies
      const { data, error } = await supabase
        .from('companies')
        .insert(
          newCompanies.map(name => ({
            name,
            group_name: groupName,
            user_id: user.id
          }))
        )
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      // Reload companies
      await loadManagedCompanies();

      // Clear inputs
      setNewCompaniesInput("");
      setNewGroupInput("");
      if (selectedGroup === 'new') {
        setSelectedGroup(groupName);
      }

      const successMessage = duplicates.length > 0
        ? `Added ${newCompanies.length} companies. ${duplicates.length} companies already existed`
        : `Successfully added ${newCompanies.length} companies`;

      toast({
        title: "Added Successfully",
        description: successMessage
      });
    } catch (error: any) {
      console.error('Error adding companies:', error);
      toast({
        title: "Error Adding",
        description: error.message || "An error occurred while adding companies",
        variant: "destructive"
      });
    } finally {
      setIsAddingCompanies(false);
    }
  };

  const deleteCompany = async (companyId: string, companyName: string) => {
    setIsDeletingCompany(companyId);
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      // Update local state
      setManagedCompanies(prev => prev.filter(c => c.id !== companyId));
      
      // Update groups list
      const remainingCompanies = managedCompanies.filter(c => c.id !== companyId);
      const groups = [...new Set(remainingCompanies.map(c => c.group_name))];
      setCompanyGroups(groups.sort());

      toast({
        title: "Deleted",
        description: `Successfully deleted ${companyName}`
      });
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error Deleting",
        description: error.message || "An error occurred while deleting the company",
        variant: "destructive"
      });
    } finally {
      setIsDeletingCompany(null);
    }
  };

  const addCompaniesFromGroup = (groupName: string) => {
    try {
      const groupCompanies = managedCompanies
        .filter(c => c.group_name === groupName)
        .map(c => c.name);

      const newCompanies = [...companies];
      let addedCount = 0;

      groupCompanies.forEach(company => {
        if (!newCompanies.includes(company)) {
          newCompanies.push(company);
          addedCount++;
        }
      });

      if (addedCount === 0) {
        toast({
          title: "Nothing New",
          description: "All companies from this group are already added",
        });
        return;
      }

      setCompanies(newCompanies);
      setTimeout(updateQueryPreview, 0);

      toast({
        title: "Added",
        description: `Added ${addedCount} companies from ${groupName}`
      });
    } catch (error: any) {
      console.error('Error adding companies from group:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding companies",
        variant: "destructive"
      });
    }
  };

  const loadSearchTemplate = (search: any) => {
    // Handle both old format (job_title, city as strings) and new format (arrays)
    const jobTitlesData = search.job_titles && search.job_titles.length > 0 
      ? search.job_titles 
      : (search.job_title ? search.job_title.split(' OR ').map((t: string) => t.replace(/[("')]/g, '').trim()) : []);
    
    const citiesData = search.cities && search.cities.length > 0 
      ? search.cities 
      : (search.city ? search.city.split(' OR ').map((c: string) => c.replace(/[("')]/g, '').trim()) : []);
    
    setJobTitles(jobTitlesData);
    setCities(citiesData);
    setCompanies(search.companies || []);
    setSkills(search.skills || []);
    setExperienceLevel(search.experience_level || []);
    setEducation(search.education || []);
    setExcludeTerms(search.exclude_terms || []);
    
    setTimeout(updateQueryPreview, 0);
    
    console.log('Loaded template:', { 
      jobTitles: jobTitlesData, 
      cities: citiesData, 
      companies: search.companies,
      skills: search.skills,
      experienceLevel: search.experience_level,
      education: search.education,
      excludeTerms: search.exclude_terms
    });
    
    toast({
      title: "Loaded",
      description: "Previous search template loaded"
    });
  };

  const addAllPreviousCompanies = () => {
    const newCompanies = [...companies];
    previousCompanies.forEach(company => {
      if (!newCompanies.includes(company)) {
        newCompanies.push(company);
      }
    });
    setCompanies(newCompanies);
    setTimeout(updateQueryPreview, 0);
    
    toast({
      title: "Added",
      description: `Added ${newCompanies.length - companies.length} companies`
    });
  };

  const addJobTitle = () => {
    if (jobTitleInput.trim() && !jobTitles.includes(jobTitleInput.trim())) {
      setJobTitles([...jobTitles, jobTitleInput.trim()]);
      setJobTitleInput("");
      setTimeout(updateQueryPreview, 0);
    }
  };

  const removeJobTitle = (title: string) => {
    setJobTitles(jobTitles.filter(t => t !== title));
    setTimeout(updateQueryPreview, 0);
  };

  const addCity = () => {
    if (cityInput.trim() && !cities.includes(cityInput.trim())) {
      setCities([...cities, cityInput.trim()]);
      setCityInput("");
      setTimeout(updateQueryPreview, 0);
    }
  };

  const removeCity = (city: string) => {
    setCities(cities.filter(c => c !== city));
    setTimeout(updateQueryPreview, 0);
  };

  const addCompany = () => {
    const input = companyInput.trim();
    if (!input) return;
    
    // Parse multiple companies separated by spaces, commas, newlines, or semicolons
    const newCompanies = input
      .split(/[\s,;\n]+/)
      .map(c => c.trim())
      .filter(c => c && !companies.includes(c));
    
    if (newCompanies.length > 0) {
      setCompanies([...companies, ...newCompanies]);
      setCompanyInput("");
      setTimeout(updateQueryPreview, 0);
    }
  };

  const removeCompany = (company: string) => {
    setCompanies(companies.filter(c => c !== company));
    setTimeout(updateQueryPreview, 0);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
      setTimeout(updateQueryPreview, 0);
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
    setTimeout(updateQueryPreview, 0);
  };

  const addExperienceLevel = () => {
    if (experienceLevelInput.trim() && !experienceLevel.includes(experienceLevelInput.trim())) {
      setExperienceLevel([...experienceLevel, experienceLevelInput.trim()]);
      setExperienceLevelInput("");
      setTimeout(updateQueryPreview, 0);
    }
  };

  const removeExperienceLevel = (level: string) => {
    setExperienceLevel(experienceLevel.filter(e => e !== level));
    setTimeout(updateQueryPreview, 0);
  };

  const addEducation = () => {
    if (educationInput.trim() && !education.includes(educationInput.trim())) {
      setEducation([...education, educationInput.trim()]);
      setEducationInput("");
      setTimeout(updateQueryPreview, 0);
    }
  };

  const removeEducation = (edu: string) => {
    setEducation(education.filter(e => e !== edu));
    setTimeout(updateQueryPreview, 0);
  };

  const addExcludeTerm = () => {
    if (excludeInput.trim() && !excludeTerms.includes(excludeInput.trim())) {
      setExcludeTerms([...excludeTerms, excludeInput.trim()]);
      setExcludeInput("");
      setTimeout(updateQueryPreview, 0);
    }
  };

  const removeExcludeTerm = (term: string) => {
    setExcludeTerms(excludeTerms.filter(t => t !== term));
    setTimeout(updateQueryPreview, 0);
  };

  // Update query preview whenever inputs change
  const updateQueryPreview = () => {
    if (jobTitles.length === 0 && cities.length === 0) {
      setQueryPreview("");
      return;
    }

    let preview = 'site:linkedin.com/in/';
    
    // Job titles with OR
    if (jobTitles.length > 0) {
      if (jobTitles.length === 1) {
        preview += ` "${jobTitles[0]}"`;
      } else {
        const titlesQuery = jobTitles.map(t => `"${t}"`).join(' OR ');
        preview += ` (${titlesQuery})`;
      }
    }
    
    // Cities with OR
    if (cities.length > 0) {
      if (cities.length === 1) {
        preview += ` "${cities[0]}"`;
      } else {
        const citiesQuery = cities.map(c => `"${c}"`).join(' OR ');
        preview += ` (${citiesQuery})`;
      }
    }
    
    // Companies with OR
    if (companies.length > 0) {
      if (companies.length === 1) {
        preview += ` "${companies[0]}"`;
      } else {
        const companiesQuery = companies.map(c => `"${c}"`).join(' OR ');
        preview += ` (${companiesQuery})`;
      }
    }
    
    // Skills (AND - all required)
    if (skills.length > 0) {
      skills.forEach(skill => {
        preview += ` "${skill}"`;
      });
    }
    
    // Experience level with OR
    if (experienceLevel.length > 0) {
      if (experienceLevel.length === 1) {
        preview += ` "${experienceLevel[0]}"`;
      } else {
        const expQuery = experienceLevel.map(e => `"${e}"`).join(' OR ');
        preview += ` (${expQuery})`;
      }
    }
    
    // Education with OR
    if (education.length > 0) {
      if (education.length === 1) {
        preview += ` "${education[0]}"`;
      } else {
        const eduQuery = education.map(e => `"${e}"`).join(' OR ');
        preview += ` (${eduQuery})`;
      }
    }
    
    // Exclude terms (NOT operator)
    if (excludeTerms.length > 0) {
      excludeTerms.forEach(term => {
        preview += ` -"${term}"`;
      });
    }
    
    setQueryPreview(preview);
  };

  const handleSearch = async () => {
    if (jobTitles.length === 0 || cities.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one job title and one city",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setCandidates([]);
    setSearchId(null);
    setSearchProgress(10);
    setSearchStage("Searching LinkedIn...");
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev < 20) return prev + 2;
        if (prev < 40) return prev + 1;
        if (prev < 80) return prev + 0.5;
        return prev;
      });
    }, 500);

    try {
      setSearchProgress(20);
      setSearchStage("Analyzing candidates...");
      
      console.log('🔍 Initiating search...');
      const { data, error } = await supabase.functions.invoke('search-linkedin-candidates', {
        body: {
          jobTitle: jobTitles.join(' OR '),
          city: cities.join(' OR '),
          companies: companies.length > 0 ? companies : null,
          skills: skills.length > 0 ? skills : null,
          experienceLevel: experienceLevel.length > 0 ? experienceLevel : null,
          education: education.length > 0 ? education : null,
          excludeTerms: excludeTerms.length > 0 ? excludeTerms : null,
          startIndex: 0
        }
      });

      if (error) {
        console.error('❌ Edge function returned error:', error);
        throw error;
      }
      
      // Check if data contains an error property (from edge function)
      if (data?.error) {
        console.error('❌ Edge function returned error in data:', data);
        const errorMsg = data.stage 
          ? `${data.error} (Stage: ${data.stage})${data.details ? `\n${data.details}` : ''}`
          : data.error;
        throw new Error(errorMsg);
      }
      
      setSearchProgress(60);
      setSearchStage("Enriching profiles with LinkedIn data...");
      
      // Wait a bit for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSearchProgress(90);
      setSearchStage("Finalizing results...");

      if (data?.candidates && data.candidates.length > 0) {
        setSearchProgress(100);
        setSearchStage("Complete!");
        setCandidates(data.candidates);
        setSearchId(data.searchId);
        setTotalResults(data.totalResults);
        setNextPage(data.nextPage);
        
        console.log('✅ Search completed:', {
          candidates: data.candidates.length,
          total: data.totalResults,
          enriched: data.enrichmentStats?.enriched || 'N/A'
        });
        
        setTimeout(() => {
          const enrichmentMsg = data.enrichmentStats 
            ? ` (${data.enrichmentStats.enriched} enriched profiles)` 
            : '';
          toast({
            title: "✅ Search Complete",
            description: `Found ${data.candidates.length} candidates out of ${data.totalResults} total results${enrichmentMsg}`
          });
        }, 500);
      } else {
        console.log('⚠️ No results found');
        toast({
          title: "No Results Found",
          description: "No candidates matching the search criteria. Try adjusting your search filters.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      clearInterval(progressInterval);
      setSearchProgress(0);
      setSearchStage("");
      
      // Parse error message for better user feedback
      let errorTitle = "Search Error";
      let errorDescription = "An unexpected error occurred during the search";
      
      if (error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorTitle = "Connection Error";
          errorDescription = "Unable to connect to the search service. Please check your internet connection and try again.";
        } else if (error.message.includes('Authentication')) {
          errorTitle = "Authentication Error";
          errorDescription = "Your session has expired. Please refresh the page and try again.";
        } else if (error.message.includes('timeout')) {
          errorTitle = "Request Timeout";
          errorDescription = "The search took too long to complete. Try narrowing your search criteria.";
        } else if (error.message.includes('Stage:')) {
          errorTitle = "Search Failed";
          errorDescription = error.message;
        } else {
          errorDescription = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsSearching(false);
        setSearchProgress(0);
        setSearchStage("");
      }, 1000);
    }
  };

  const loadMoreResults = async () => {
    if (!nextPage || !searchId) return;

    setIsLoadingMore(true);
    try {
      // Extract start index from nextPage
      const urlParams = new URLSearchParams(nextPage.split('?')[1]);
      const startIndex = parseInt(urlParams.get('start') || '0');

      const { data, error } = await supabase.functions.invoke('search-linkedin-candidates', {
        body: {
          jobTitle: jobTitles.join(' OR '),
          city: cities.join(' OR '),
          companies: companies.length > 0 ? companies : null,
          skills: skills.length > 0 ? skills : null,
          experienceLevel: experienceLevel.length > 0 ? experienceLevel : null,
          education: education.length > 0 ? education : null,
          excludeTerms: excludeTerms.length > 0 ? excludeTerms : null,
          startIndex
        }
      });

      if (error) throw error;

      if (data.candidates && data.candidates.length > 0) {
        setCandidates(prev => [...prev, ...data.candidates]);
        setNextPage(data.nextPage);
        toast({
          title: "Loaded More",
          description: `Added ${data.candidates.length} candidates`
        });
      }
    } catch (error: any) {
      console.error('Load more error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while loading more",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const updateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status })
        .eq('id', candidateId);

      if (error) throw error;

      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, status } : c)
      );

      toast({
        title: "Updated",
        description: "Candidate status updated"
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateCandidateComment = async (candidateId: string, comment: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ comment })
        .eq('id', candidateId);

      if (error) throw error;

      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, comment } : c)
      );

      toast({
        title: "Saved",
        description: "Comment saved"
      });
    } catch (error: any) {
      console.error('Comment error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified': return 'bg-green-500';
      case 'not_qualified': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'qualified': return 'Qualified';
      case 'not_qualified': return 'Not Qualified';
      default: return 'Under Review';
    }
  };

  const toggleSection = (candidateId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        [section]: !prev[candidateId]?.[section]
      }
    }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-foreground text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/candidate-history')}
                variant="ghost"
                size="sm"
                className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full"
              >
                <History className="h-4 w-4" />
                السجل
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-full"
              >
                الرئيسية
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">البحث عن مرشحين</h1>
              <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-8 w-8" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Card className="max-w-4xl mx-auto shadow-md mb-8">
          <Tabs defaultValue="new-search" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="new-search" className="gap-2 data-[state=active]:bg-card">
                <Search className="h-4 w-4" />
                New Search
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-card">
                <History className="h-4 w-4" />
                Templates ({previousSearches.length})
              </TabsTrigger>
              <TabsTrigger value="companies" className="gap-2 data-[state=active]:bg-card">
                <Briefcase className="h-4 w-4" />
                Companies ({managedCompanies.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-6">
              {previousSearches.length === 0 ? (
                <div className="text-center py-16">
                  <History className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">No search templates yet</p>
                  <p className="text-sm text-muted-foreground">Your previous searches will appear here for quick reuse</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="px-6 pt-2">
                    <CardDescription className="text-sm">
                      Select a template to load search criteria
                    </CardDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-6 pb-6">
                    {previousSearches.map((search) => (
                      <Card 
                        key={search.id}
                        className="cursor-pointer hover:border-primary hover:shadow-sm transition-all bg-card"
                        onClick={() => loadSearchTemplate(search)}
                      >
                        <CardHeader className="pb-2 pt-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <CardTitle className="text-sm font-medium mb-1">
                                {search.job_titles?.join(' · ') || search.job_title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {search.cities?.join(' · ') || search.city}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {search.total_results || 0}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2 pb-3">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {search.companies && search.companies.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {search.companies.length} companies
                              </Badge>
                            )}
                            {search.skills && search.skills.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {search.skills.length} skills
                              </Badge>
                            )}
                            {search.experience_level && search.experience_level.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {search.experience_level.length} exp
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(search.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="companies" className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Company Management</CardTitle>
                <CardDescription className="text-sm">
                  Organize companies into groups for faster searching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Companies Section */}
                <div className="bg-muted/50 p-5 rounded-2xl space-y-4 border border-border">
                  <h3 className="font-medium text-sm">Add Companies</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Company Names</Label>
                    <Textarea
                      value={newCompaniesInput}
                      onChange={(e) => setNewCompaniesInput(e.target.value)}
                      placeholder="Enter company names (one per line)&#10;&#10;Google&#10;Microsoft&#10;Apple"
                      rows={4}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Group</Label>
                    <div className="flex gap-2">
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select a group</option>
                        {companyGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                        <option value="new">+ Create New Group</option>
                      </select>
                    </div>
                    
                    {selectedGroup === 'new' && (
                      <div className="space-y-2 animate-in fade-in-50 duration-200">
                        <Label className="text-sm">New Group Name</Label>
                        <input
                          type="text"
                          value={newGroupInput}
                          onChange={(e) => setNewGroupInput(e.target.value)}
                          placeholder="e.g., Tech Companies, Financial Services"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={addManagedCompanies}
                    disabled={isAddingCompanies || !newCompaniesInput.trim()}
                    className="w-full"
                  >
                    {isAddingCompanies ? "Adding..." : "Add Companies"}
                  </Button>
                </div>

                {/* Companies List */}
                {companyGroups.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">Your Companies</h3>
                      <Badge variant="secondary" className="text-xs">{managedCompanies.length}</Badge>
                    </div>

                    {companyGroups.map(group => {
                      const groupCompanies = managedCompanies.filter(c => c.group_name === group);
                      return (
                        <Card key={group} className="shadow-sm">
                          <CardHeader className="pb-3 pt-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-medium">{group}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">{groupCompanies.length}</Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addCompaniesFromGroup(group)}
                                  className="text-xs h-7 text-primary hover:text-primary hover:bg-accent"
                                >
                                  Add All
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-2">
                              {groupCompanies.map(company => (
                                <Badge
                                  key={company.id}
                                  variant="secondary"
                                  className="text-xs px-2.5 py-1 flex items-center gap-1.5"
                                >
                                  {company.name}
                                  <button
                                    onClick={() => deleteCompany(company.id, company.name)}
                                    disabled={isDeletingCompany === company.id}
                                    className="hover:text-destructive disabled:opacity-50"
                                    title="Remove"
                                  >
                                    {isDeletingCompany === company.id ? (
                                      <div className="animate-spin h-2.5 w-2.5 border-2 border-current border-t-transparent rounded-full" />
                                    ) : (
                                      "×"
                                    )}
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
                    <Briefcase className="h-14 w-14 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="font-medium text-foreground">No companies saved</p>
                    <p className="text-sm text-muted-foreground mt-1">Add companies above to build your search library</p>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="new-search" className="mt-0">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Search Criteria</CardTitle>
            <CardDescription className="text-sm">
              Define your search parameters to find ideal candidates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-accent/50 p-4 rounded-2xl border border-primary/20 space-y-2">
              <h3 className="font-medium text-sm text-primary mb-3">Search Tips</h3>
              <ul className="text-xs space-y-2 text-foreground">
                <li className="flex gap-2"><span className="text-primary">•</span><span><strong>Job Title:</strong> Add one title or variations (e.g., Software Engineer, Senior Software Engineer)</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><strong>Location:</strong> Add cities to search in (uses OR logic)</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><strong>Companies:</strong> Target specific employers</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><strong>Skills:</strong> All skills are required (uses AND logic)</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><strong>Exclude:</strong> Remove unwanted results (e.g., recruiter, intern)</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <TagInput
                tags={jobTitles}
                onAddTag={addJobTitle}
                onRemoveTag={removeJobTitle}
                inputValue={jobTitleInput}
                onInputChange={setJobTitleInput}
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Location <span className="text-destructive">*</span>
              </Label>
              <TagInput
                tags={cities}
                onAddTag={addCity}
                onRemoveTag={removeCity}
                inputValue={cityInput}
                onInputChange={setCityInput}
                placeholder="e.g., Riyadh, Jeddah, Dubai"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">
                  Companies <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  {companyGroups.length > 0 && (
                    <Select onValueChange={(value) => addCompaniesFromGroup(value)}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Add group" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border z-50">
                        {companyGroups.map(group => {
                          const count = managedCompanies.filter(c => c.group_name === group).length;
                          return (
                            <SelectItem key={group} value={group} className="text-xs">
                              {group} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  {previousCompanies.length > 0 && (
                    <Button
                      onClick={addAllPreviousCompanies}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-primary"
                    >
                      All previous
                    </Button>
                  )}
                </div>
              </div>
              <TagInput
                tags={companies}
                onAddTag={addCompany}
                onRemoveTag={removeCompany}
                inputValue={companyInput}
                onInputChange={setCompanyInput}
                placeholder="e.g., Google, Microsoft, Amazon"
              />
              {previousCompanies.length > 0 && companies.length === 0 && (
                <div className="bg-muted/50 p-3 rounded-md border border-border">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Recently used:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previousCompanies.slice(0, 8).map((company) => (
                      <Badge
                        key={company}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                        onClick={() => {
                          if (!companies.includes(company)) {
                            setCompanies([...companies, company]);
                            setTimeout(updateQueryPreview, 0);
                          }
                        }}
                      >
                        {company}
                      </Badge>
                    ))}
                    {previousCompanies.length > 8 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{previousCompanies.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Required Skills <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <TagInput
                tags={skills}
                onAddTag={addSkill}
                onRemoveTag={removeSkill}
                inputValue={skillInput}
                onInputChange={setSkillInput}
                placeholder="e.g., Python, React, AWS"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Experience Level <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <TagInput
                tags={experienceLevel}
                onAddTag={addExperienceLevel}
                onRemoveTag={removeExperienceLevel}
                inputValue={experienceLevelInput}
                onInputChange={setExperienceLevelInput}
                placeholder="e.g., Senior, Lead, Principal"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Education <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <TagInput
                tags={education}
                onAddTag={addEducation}
                onRemoveTag={removeEducation}
                inputValue={educationInput}
                onInputChange={setEducationInput}
                placeholder="e.g., Stanford, MIT, Harvard"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Exclude Terms <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <TagInput
                tags={excludeTerms}
                onAddTag={addExcludeTerm}
                onRemoveTag={removeExcludeTerm}
                inputValue={excludeInput}
                onInputChange={setExcludeInput}
                placeholder="e.g., recruiter, intern, junior"
              />
            </div>

            {queryPreview && (
              <div className="bg-accent/50 border border-primary/20 p-4 rounded-2xl">
                <h4 className="font-medium text-sm mb-2 text-primary">Search Query Preview</h4>
                <code className="text-xs bg-card p-3 rounded block overflow-x-auto border border-border" dir="ltr">
                  {queryPreview}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  This query will be used for LinkedIn search
                </p>
              </div>
            )}

            {isSearching && (
              <Card className="border-primary/30 bg-accent/30">
                <CardContent className="pt-5 pb-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{searchStage}</h4>
                      <Badge variant="secondary" className="animate-pulse text-xs">
                        {searchProgress < 100 ? "Processing" : "Complete"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Progress value={searchProgress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground text-right">
                        {Math.round(searchProgress)}%
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-2">
                      <p className="flex items-center gap-2">
                        <span className={searchProgress > 20 ? "text-success" : "text-muted-foreground"}>
                          {searchProgress > 20 ? "✓" : "○"}
                        </span>
                        Searching LinkedIn profiles
                      </p>
                      <p className="flex items-center gap-2">
                        <span className={searchProgress > 40 ? "text-success" : "text-muted-foreground"}>
                          {searchProgress > 40 ? "✓" : "○"}
                        </span>
                        Analyzing candidate profiles
                      </p>
                      <p className="flex items-center gap-2">
                        <span className={searchProgress > 70 ? "text-success" : "text-muted-foreground"}>
                          {searchProgress > 70 ? "✓" : "○"}
                        </span>
                        Enriching with detailed data
                      </p>
                      <p className="flex items-center gap-2">
                        <span className={searchProgress > 90 ? "text-success" : "text-muted-foreground"}>
                          {searchProgress > 90 ? "✓" : "○"}
                        </span>
                        Finalizing results
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleSearch}
              disabled={isSearching || jobTitles.length === 0 || cities.length === 0}
              className="w-full text-sm py-5"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Candidates
                </>
              )}
            </Button>
          </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {candidates.length > 0 && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-medium text-foreground">
                Search Results <span className="text-muted-foreground text-base">({candidates.length} of {totalResults})</span>
              </h2>
            </div>

            {candidates.map((candidate) => (
              <Card key={candidate.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {candidate.enriched_profile?.profilePic && (
                        <Avatar className="h-16 w-16 ring-2 ring-border">
                          <AvatarImage src={candidate.enriched_profile.profilePic} alt={candidate.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                          <CardTitle className="text-lg font-medium">{candidate.name}</CardTitle>
                          <Badge className={`${getStatusColor(candidate.status)} text-white text-xs`}>
                            {getStatusText(candidate.status)}
                          </Badge>
                          <Badge variant="outline" className="text-sm font-semibold border-primary text-primary">
                            {candidate.ai_analysis.score.toFixed(1)}/10
                          </Badge>
                        </div>
                        <a
                          href={candidate.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
                        >
                          View LinkedIn Profile <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">{/* ... keep existing code ... */}
                  {candidate.enriched_profile ? (
                    <>
                      {candidate.enriched_profile.headline && (
                        <div className="bg-muted/30 p-3 rounded-md">
                          <h4 className="font-medium text-xs text-muted-foreground mb-1">Current Role</h4>
                          <p className="text-sm text-foreground">{candidate.enriched_profile.headline}</p>
                        </div>
                      )}

                      {candidate.enriched_profile.about && (
                        <div>
                          <h4 className="font-medium text-sm mb-1.5">About</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{candidate.enriched_profile.about}</p>
                        </div>
                      )}

                      {candidate.enriched_profile.experiences && candidate.enriched_profile.experiences.length > 0 && (
                        <Collapsible
                          open={expandedSections[candidate.id]?.experiences}
                          onOpenChange={() => toggleSection(candidate.id, 'experiences')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">Experience ({candidate.enriched_profile.experiences.length})</h4>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7">
                                {expandedSections[candidate.id]?.experiences ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          
                          <div className="space-y-2">
                            {candidate.enriched_profile.experiences.slice(0, 2).map((exp, idx) => (
                              <div key={idx} className="text-sm bg-muted/30 p-3 rounded-md border border-border">
                                <div className="flex items-start gap-2">
                                  <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">{exp.title}</p>
                                    <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                                    {exp.jobLocation && <p className="text-xs text-muted-foreground mt-0.5">{exp.jobLocation}</p>}
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(exp.jobStartedOn)} - {exp.jobStillWorking ? 'Present' : formatDate(exp.jobEndedOn)}
                                      </p>
                                      {exp.jobStillWorking && (
                                        <Badge variant="secondary" className="text-xs h-5">Current</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            <CollapsibleContent className="space-y-2">
                              {candidate.enriched_profile.experiences.slice(2).map((exp, idx) => (
                                <div key={idx + 2} className="text-sm bg-muted/30 p-3 rounded-md border border-border">
                                  <div className="flex items-start gap-2">
                                    <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                    <div className="flex-1">
                                      <p className="font-medium text-foreground">{exp.title}</p>
                                      <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                                      {exp.jobLocation && <p className="text-xs text-muted-foreground mt-0.5">{exp.jobLocation}</p>}
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <p className="text-xs text-muted-foreground">
                                          {formatDate(exp.jobStartedOn)} - {exp.jobStillWorking ? 'Present' : formatDate(exp.jobEndedOn)}
                                        </p>
                                        {exp.jobStillWorking && (
                                          <Badge variant="secondary" className="text-xs h-5">Current</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      )}

                      {candidate.enriched_profile.skills && candidate.enriched_profile.skills.length > 0 && (
                        <Collapsible
                          open={expandedSections[candidate.id]?.skills}
                          onOpenChange={() => toggleSection(candidate.id, 'skills')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">Skills ({candidate.enriched_profile.skills.length})</h4>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7">
                                {expandedSections[candidate.id]?.skills ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.enriched_profile.skills.slice(0, 10).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill.title}
                              </Badge>
                            ))}
                            
                            <CollapsibleContent className="flex flex-wrap gap-1.5">
                              {candidate.enriched_profile.skills.slice(10).map((skill, idx) => (
                                <Badge key={idx + 10} variant="secondary" className="text-xs">
                                  {skill.title}
                                </Badge>
                              ))}
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      )}

                      {candidate.enriched_profile.educations && candidate.enriched_profile.educations.length > 0 && (
                        <Collapsible
                          open={expandedSections[candidate.id]?.education}
                          onOpenChange={() => toggleSection(candidate.id, 'education')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">Education ({candidate.enriched_profile.educations.length})</h4>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7">
                                {expandedSections[candidate.id]?.education ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          
                          <div className="space-y-2">
                            {candidate.enriched_profile.educations.map((edu, idx) => (
                              <div key={idx} className="text-sm bg-muted/30 p-3 rounded-md border border-border">
                                <p className="font-medium text-foreground">{edu.title}</p>
                                {edu.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{edu.subtitle}</p>}
                                {edu.period && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {edu.period.startedOn?.year} - {edu.period.endedOn?.year || 'Present'}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </Collapsible>
                      )}
                    </>
                  ) : (
                    <div>
                      <h4 className="font-medium text-sm mb-1.5">Profile Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{candidate.profile_summary}</p>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium text-sm mb-2.5">AI Assessment</h4>
                    <p className="text-sm mb-4 leading-relaxed text-muted-foreground">{candidate.ai_analysis.assessment}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-success/5 p-3 rounded-md border border-success/20">
                        <h5 className="font-medium text-sm text-success mb-2">Strengths</h5>
                        <ul className="text-xs space-y-1.5 text-foreground">
                          {candidate.ai_analysis.strengths.map((strength, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-success mt-0.5">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-warning/5 p-3 rounded-md border border-warning/20">
                        <h5 className="font-medium text-sm text-warning mb-2">Development Areas</h5>
                        <ul className="text-xs space-y-1.5 text-foreground">
                          {candidate.ai_analysis.gaps.map((gap, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-warning mt-0.5">→</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <Label htmlFor={`comment-${candidate.id}`} className="text-sm font-medium">
                      Internal Notes
                    </Label>
                    <Textarea
                      id={`comment-${candidate.id}`}
                      placeholder="Add your evaluation notes..."
                      value={candidate.comment || ''}
                      onChange={(e) => updateCandidateComment(candidate.id, e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => updateCandidateStatus(candidate.id, 'qualified')}
                      variant={candidate.status === 'qualified' ? 'default' : 'outline'}
                      className="flex-1"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Qualified
                    </Button>
                    <Button
                      onClick={() => updateCandidateStatus(candidate.id, 'not_qualified')}
                      variant={candidate.status === 'not_qualified' ? 'default' : 'outline'}
                      className="flex-1"
                      size="sm"
                    >
                      Not Qualified
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {nextPage && (
              <div className="text-center pt-2">
                <Button
                  onClick={loadMoreResults}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="lg"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More Candidates"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-auto py-6">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            ثمانية — البحث عن مرشحين
          </p>
        </div>
      </footer>
    </div>
  );
}