import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useEffect, useState } from "react";

export default function AppLayout() {
  const location = useLocation();
  const [pageKey, setPageKey] = useState(location.pathname);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AppSidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between px-8 py-4">
            <PageTitle />
            <div className="text-[11px] font-bold text-muted-foreground/40 tracking-wide">الإصدار 2.0</div>
          </div>
        </header>
        <div key={pageKey} className="page-enter px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function PageTitle() {
  const location = useLocation();
  const path = location.pathname;

  const titles: Record<string, string> = {
    "/": "لوحة المعلومات",
    "/tweet-analysis": "تحليل التغريدات",
    "/history": "سجل التحليلات",
    "/data-analysis": "تحليل البيانات",
    "/monitoring/x": "رصد X / تويتر",
    "/monitoring/tiktok": "رصد TikTok",
    "/monitoring/instagram": "رصد Instagram",
    "/monitoring/youtube": "رصد YouTube",
    "/explore": "استكشاف البيانات",
    "/meltwater-report": "تقارير Meltwater",
    "/settings": "الإعدادات والإدارة",
  };

  return (
    <h1 className="text-lg font-display font-bold text-foreground/90">
      {titles[path] || "الصفحة"}
    </h1>
  );
}
