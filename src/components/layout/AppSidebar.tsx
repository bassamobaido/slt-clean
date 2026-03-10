import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Twitter,
  Radio,
  Compass,
  FileBarChart,
  Settings,
  ChevronDown,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  labelAr: string;
  icon: React.ElementType;
  path?: string;
  children?: { labelAr: string; path: string; icon?: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    labelAr: "لوحة المعلومات",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Tweet Analysis",
    labelAr: "تحليل التغريدات",
    icon: Twitter,
    path: "/tweet-analysis",
    children: [
      { labelAr: "سجل التحليلات", path: "/history", icon: History },
    ],
  },
  {
    label: "Data Analysis",
    labelAr: "تحليل البيانات",
    icon: FileSpreadsheet,
    path: "/data-analysis",
  },
  {
    label: "Monitoring",
    labelAr: "الرصد",
    icon: Radio,
    children: [
      {
        labelAr: "X / تويتر",
        path: "/monitoring/x",
        icon: () => (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
      },
      {
        labelAr: "TikTok",
        path: "/monitoring/tiktok",
        icon: () => (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.28 8.28 0 004.77 1.52V6.91a4.84 4.84 0 01-1-.22z" />
          </svg>
        ),
      },
      {
        labelAr: "Instagram",
        path: "/monitoring/instagram",
        icon: () => (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        ),
      },
      {
        labelAr: "YouTube",
        path: "/monitoring/youtube",
        icon: () => (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Explore",
    labelAr: "استكشاف",
    icon: Compass,
    path: "/explore",
  },
  {
    label: "Reports",
    labelAr: "التقارير",
    icon: FileBarChart,
    path: "/meltwater-report",
  },
  {
    label: "Settings",
    labelAr: "الإعدادات",
    icon: Settings,
    path: "/settings",
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>(["Monitoring", "Tweet Analysis"]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isParentActive = (item: NavItem) => {
    if (item.path && isActive(item.path)) return true;
    return item.children?.some((child) => isActive(child.path)) ?? false;
  };

  return (
    <aside className="w-[260px] min-h-screen bg-foreground text-white flex flex-col border-l border-white/[0.06] custom-scrollbar">
      {/* Logo */}
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-thmanyah-green/15 rounded-xl blur-md" />
          <div className="relative w-10 h-10 bg-white/[0.06] rounded-xl border border-white/10 flex items-center justify-center">
            <img src="/Usable/thamanyah.png" alt="ثمانية" className="w-6 h-6" style={{ imageRendering: "-webkit-optimize-contrast" }} />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white/90 leading-tight">ثمانية</h2>
          <p className="text-[10px] font-bold text-white/30 tracking-wide">الرصد الاجتماعي</p>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/[0.06] mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedSections.includes(item.label);
          const active = isParentActive(item);

          return (
            <div key={item.label} className="card-stagger" style={{ animationDelay: `${index * 0.05}s` }}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleSection(item.label);
                    if (item.path) navigate(item.path);
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right relative group",
                  active ? "bg-white/[0.08] text-white" : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                {active && <span className="sidebar-active-indicator" />}
                <Icon className={cn("w-[18px] h-[18px] flex-shrink-0 transition-colors", active ? "text-thmanyah-green" : "text-white/40 group-hover:text-white/60")} strokeWidth={1.8} />
                <span className="flex-1 text-[13px] font-bold">{item.labelAr}</span>
                {hasChildren && (
                  <ChevronDown className={cn("w-3.5 h-3.5 text-white/20 transition-transform duration-200", isExpanded && "rotate-180")} />
                )}
              </button>

              {hasChildren && (
                <div className={cn("overflow-hidden transition-all duration-300 ease-out", isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                  <div className="mr-5 pr-3 border-r border-white/[0.06] mt-0.5 mb-1 space-y-0.5">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.path);
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-right transition-all duration-200",
                            childActive ? "bg-thmanyah-green/10 text-thmanyah-green" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                          )}
                        >
                          {ChildIcon && <ChildIcon className="w-4 h-4 flex-shrink-0" />}
                          <span className="text-[12px] font-bold">{child.labelAr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-thmanyah-green pulse-ring text-thmanyah-green" />
          <span className="text-[11px] font-bold text-white/30">متصل</span>
        </div>
      </div>
    </aside>
  );
}
