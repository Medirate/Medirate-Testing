// components/sidenav.tsx

"use client";

import { useState } from "react";
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  CircleDollarSign, 
  ChartNoAxesCombined, 
  Bell 
} from "lucide-react";

interface SideNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SideNav = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  toggleSidebar,
}: SideNavProps) => {
  return (
    <aside
      className={`transition-all duration-500 ease-in-out shadow-lg ${
        isSidebarCollapsed ? "w-16" : "w-64"
      }`}
      style={{ backgroundColor: "rgb(1, 44, 97)", color: "white" }}
    >
      <div className="flex justify-end p-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-white hover:bg-gray-800 rounded-md"
        >
          {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2">
          {[
            { tab: "dashboard", icon: <ChartNoAxesCombined size={20} />, label: "Dashboard" },
            { tab: "profile", icon: <User size={20} />, label: "Profile" },
            { tab: "subscription", icon: <CircleDollarSign size={20} />, label: "Subscription" },
            { tab: "providerAlerts", icon: <Bell size={20} />, label: "Provider Alerts" },
            { tab: "settings", icon: <Settings size={20} />, label: "Settings" },
          ].map(({ tab, icon, label }) => (
            <li
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center p-4 hover:bg-gray-200/20 cursor-pointer ${
                activeTab === tab ? "bg-gray-200/20" : ""
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6">{icon}</div>
              <span
                className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out ${
                  isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                }`}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default SideNav;
