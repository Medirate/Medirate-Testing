"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SideNavContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isToggling: boolean;
}

const SideNavContext = createContext<SideNavContextType | undefined>(undefined);

// Read collapsed state synchronously before component renders
const getInitialCollapsedState = (): boolean => {
  if (typeof window === "undefined") {
    return true; // Default to collapsed on server
  }
  try {
    const stored = localStorage.getItem("isSidebarCollapsed");
    return stored ? JSON.parse(stored) : true;
  } catch {
    return true; // Default to collapsed on error
  }
};

export function SideNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  // Use a ref to ensure we always use the same initial value
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(getInitialCollapsedState);

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

  const [isToggling, setIsToggling] = useState(false);
  
  const toggleSidebar = () => {
    setIsToggling(true);
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("isSidebarCollapsed", JSON.stringify(newState));
      }
      // Reset toggling flag after animation
      setTimeout(() => setIsToggling(false), 550);
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
        isToggling,
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

