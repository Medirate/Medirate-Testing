"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SideNavContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SideNavContext = createContext<SideNavContextType | undefined>(undefined);

export function SideNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("isSidebarCollapsed") || "true");
    }
    return true;
  });

  // Update active tab based on pathname without causing re-renders
  useEffect(() => {
    const tabMapping: { [key: string]: string } = {
      "/state-profiles": "home",
      "/home": "home",
      "/recent-rate-changes": "home",
      "/dashboard": "dashboard",
      "/rate-developments": "rateDevelopments",
      "/email-preferences": "emailPreferences",
      "/state-rate-comparison": "stateRateComparison",
      "/settings": "settings",
      "/historical-rates": "historicalRates",
      "/admin-dashboard": "adminDashboard",
      "/data-export": "dataExport",
      "/documents": "documents",
      "/support": "support",
    };

    const matchedTab = Object.keys(tabMapping).find(
      (key) => pathname === key || pathname.startsWith(`${key}/`)
    );

    if (matchedTab && tabMapping[matchedTab]) {
      setActiveTab(tabMapping[matchedTab]);
    }
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("isSidebarCollapsed", JSON.stringify(newState));
      }
      return newState;
    });
  };

  return (
    <SideNavContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SideNavContext.Provider>
  );
}

export function useSideNav() {
  const context = useContext(SideNavContext);
  if (context === undefined) {
    throw new Error("useSideNav must be used within a SideNavProvider");
  }
  return context;
}

