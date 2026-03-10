import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import SplashIntro from "@/components/SplashIntro";
import Onboarding from "@/components/Onboarding";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import History from "./pages/History";
import MeltwaterReport from "./pages/MeltwaterReport";
import XMonitoring from "./pages/monitoring/XMonitoring";
import TikTokMonitoring from "./pages/monitoring/TikTokMonitoring";
import InstagramMonitoring from "./pages/monitoring/InstagramMonitoring";
import YouTubeMonitoring from "./pages/monitoring/YouTubeMonitoring";
import DataAnalysis from "./pages/DataAnalysis";
import Explore from "./pages/Explore";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ONBOARDING_KEY = "thmanyah-onboarding-seen";

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashIntro onComplete={handleSplashComplete} />}
        {!showSplash && showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tweet-analysis" element={<Index />} />
              <Route path="/history" element={<History />} />
              <Route path="/data-analysis" element={<DataAnalysis />} />
              <Route path="/meltwater-report" element={<MeltwaterReport />} />
              <Route path="/monitoring/x" element={<XMonitoring />} />
              <Route path="/monitoring/tiktok" element={<TikTokMonitoring />} />
              <Route path="/monitoring/instagram" element={<InstagramMonitoring />} />
              <Route path="/monitoring/youtube" element={<YouTubeMonitoring />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
