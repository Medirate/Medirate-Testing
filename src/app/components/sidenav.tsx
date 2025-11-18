"use client";

import { useEffect, useState, memo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useAuth } from "@/context/AuthContext";
import { useSideNav } from "@/context/SideNavContext";
import {
  Menu,
  X,
  User,
  Settings,
  ChartNoAxesCombined,
  Megaphone,
  ChartColumnStacked,
  ChartLine,
  Table2,
  Shield,
  ChevronDown,
  ChevronRight,
  Pencil,
  Database,
  Mail,
  Home,
  Users,
  FileText,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Admin Rate Developments submenu links
const adminRateDevLinks: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/admin-dashboard/rate-developments/edit", label: "Edit Rate Developments", icon: <Pencil size={16} className="mr-2" /> },
  { href: "/admin-dashboard/rate-developments/update-database", label: "Update Database", icon: <Database size={16} className="mr-2" /> },
  { href: "/admin-dashboard/rate-developments/send-email-alerts", label: "Send Email Alerts", icon: <Mail size={16} className="mr-2" /> },
];


const SideNav = memo(() => {
  const { activeTab, setActiveTab, isSidebarCollapsed, toggleSidebar, isToggling } = useSideNav();
  const pathname = usePathname();
  const { user } = useKindeBrowserClient();
  const auth = useAuth(); // Add auth context to check subscription status
  
  // Only show sidenav on authenticated pages (same logic as navbar)
  const authenticatedPages = [
    "/dashboard",
    "/historical-rates",
    "/rate-developments",
    "/state-rate-comparison",
    "/state-rate-comparison/all",
    "/state-rate-comparison/individual",
    "/email-preferences",
    "/settings",
    "/profile",
    "/documents",
    // "/data-export", // TEMPORARILY HIDDEN
    "/admin-dashboard",
    "/support",
    "/state-profiles",
    "/home",
    "/recent-rate-changes",
  ];
  
  const shouldShowSideNav = auth.isAuthenticated && authenticatedPages.some(page => 
    pathname === page || pathname.startsWith(`${page}/`)
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [rateDevMenuOpen, setRateDevMenuOpen] = useState(false);
  const [rateComparisonMenuOpen, setRateComparisonMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);

  // Check if subscription manager should have restricted access
  // Subscription managers should ONLY have access to Settings and Support
  // regardless of subscription status
  const shouldRestrictSubscriptionManager = userRole === 'subscription_manager' && auth.isCheckComplete;

  // Check admin access
  const checkAdminAccess = async () => {
    const userEmail = user?.email ?? "";
    console.log("🔍 Checking admin access for:", userEmail);
    
    if (!userEmail) {
      console.log("❌ No user email found");
      return;
    }

    try {
      console.log("🔍 Using API endpoint to check admin status...");
      
      // Use the existing API endpoint to check admin status
      const response = await fetch("/api/admin-users");
      const result = await response.json();
      
      console.log("🔍 API response:", result);
      
      if (result.isAdmin) {
        console.log("✅ User is admin");
        setIsAdmin(true);
        setAdminCheckComplete(true);
      } else {
        console.log("❌ User is not admin");
        setIsAdmin(false);
        setAdminCheckComplete(true);
      }
    } catch (error) {
      console.log("❌ Unexpected error:", error);
      setIsAdmin(false);
      setAdminCheckComplete(true);
    }
  };

  // Check user role
  const checkUserRole = async () => {
    if (!user?.email) {
      setRoleCheckComplete(true);
      return;
    }

    try {
      console.log("🔍 Checking user role for:", user.email);
      const response = await fetch("/api/user-role");
      const result = await response.json();
      
      if (response.ok) {
        console.log("✅ User role retrieved:", result.role);
        setUserRole(result.role);
      } else {
        console.log("❌ Failed to get user role:", result.error);
        setUserRole(null);
      }
    } catch (error) {
      console.log("❌ Error checking user role:", error);
      setUserRole(null);
    } finally {
      setRoleCheckComplete(true);
    }
  };

  // Check admin access when user changes
  useEffect(() => {
    if (user?.email) {
      checkAdminAccess();
      checkUserRole();
    }
  }, [user]);

  // Tab mapping is now handled in SideNavContext

  // Auto-expand admin submenu if on an admin page
  useEffect(() => {
    if (pathname.startsWith("/admin-dashboard")) {
      setAdminMenuOpen(true);
    }
    if (pathname.startsWith("/admin-dashboard/rate-developments")) {
      setRateDevMenuOpen(true);
    }
  }, [pathname]);

  // Auto-expand submenu if on a subpage
  useEffect(() => {
    if (pathname.startsWith("/state-rate-comparison/all") || pathname.startsWith("/state-rate-comparison/individual")) {
      setRateComparisonMenuOpen(true);
    }
  }, [pathname]);

  // Don't render on non-authenticated pages
  if (!shouldShowSideNav) {
    return null;
  }

  return (
    <aside
      className="shadow-lg"
      style={{
        width: isSidebarCollapsed ? "4rem" : "20rem",
        transition: isToggling ? "width 0.5s ease-in-out" : "none",
        backgroundColor: "rgb(1, 44, 97)",
        color: "white",
        position: "fixed", // Keeps it fixed
        top: "5.5rem", // Height of the Navbar
        bottom: "0", // Extend to the bottom of the viewport
        left: 0, // Aligns to the left of the viewport
        height: "calc(100vh - 5.5rem)", // Full height minus navbar
        zIndex: 50, // Ensures it stays above the content
        overflowY: "auto", // Allow scrolling when content overflows
        overflowX: "hidden", // Hide horizontal scroll
      }}
    >
      {/* Sidebar Toggle Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-white hover:bg-gray-800 rounded-md"
        >
          {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

          {/* Navigation Links */}
          <nav className="mt-6 pb-20">
            <ul className="space-y-2">
              <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <Table2 size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Dashboard
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/dashboard"
                    onClick={(e) => {
                      setActiveTab("dashboard");
                      // Prevent any expansion when clicking in collapsed state
                      if (isSidebarCollapsed) {
                        e.stopPropagation();
                      }
                    }}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === "dashboard" ? "bg-gray-200/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Table2 size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Dashboard
                    </span>
                  </Link>
                )}
              </li>
              {/* State Rate Comparison with submenu */}
              <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center w-full p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <ChartColumnStacked size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      State Rate Comparison
                    </span>
                    <span className="ml-auto">
                      <ChevronRight size={18} />
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/state-rate-comparison"
                    onClick={(e) => {
                      // Only toggle submenu if sidebar is expanded, otherwise just navigate
                      if (!isSidebarCollapsed) {
                        setRateComparisonMenuOpen(open => !open);
                      }
                    }}
                    className={`flex items-center w-full p-4 hover:bg-gray-200/20 transition-colors cursor-pointer focus:outline-none ${
                      pathname.startsWith("/state-rate-comparison") ? "bg-gray-200/20" : ""
                    }`}
                    aria-expanded={rateComparisonMenuOpen}
                    aria-controls="state-rate-comparison-submenu"
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <ChartColumnStacked size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      State Rate Comparison
                    </span>
                    <span className="ml-auto">
                      {rateComparisonMenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </Link>
                )}
                {rateComparisonMenuOpen && !isSidebarCollapsed && (
                  <ul id="state-rate-comparison-submenu" className="ml-8 mt-1 space-y-1 bg-blue-900/80 rounded-lg py-2 shadow-lg">
                    <li>
                      <Link
                        href="/state-rate-comparison/all"
                        onClick={() => setActiveTab("stateRateComparison")}
                        className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 text-sm ${
                          pathname === "/state-rate-comparison/all"
                            ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow"
                            : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                        }`}
                      >
                        Compare All States
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/state-rate-comparison/individual"
                        onClick={() => setActiveTab("stateRateComparison")}
                        className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 text-sm ${
                          pathname === "/state-rate-comparison/individual"
                            ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow"
                            : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                        }`}
                      >
                        Compare Individual States
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <ChartLine size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Rate History
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/historical-rates"
                    onClick={() => setActiveTab("historicalRates")}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === "historicalRates" ? "bg-gray-200/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <ChartLine size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Rate History
                    </span>
                  </Link>
                )}
              </li>
              {/* Rate Developments */}
              <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <Megaphone size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Rate Developments
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/rate-developments"
                    onClick={() => setActiveTab("rateDevelopments")}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === "rateDevelopments" ? "bg-gray-200/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Megaphone size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Rate Developments
                    </span>
                  </Link>
                )}
              </li>
              
              {/* State Profiles */}
              <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <Home size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      State Profiles
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/state-profiles"
                    onClick={() => setActiveTab("home")}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === "home" ? "bg-gray-200/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Home size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      State Profiles
                    </span>
                  </Link>
                )}
              </li>
              
              {/* Email Preferences */}
              <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <Mail size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Email Preferences
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/email-preferences"
                    onClick={() => setActiveTab("emailPreferences")}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === "emailPreferences" ? "bg-gray-200/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Mail size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Email Preferences
                    </span>
                  </Link>
                )}
              </li>
              
              {/* Documents */}
              <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <FileText size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Documents
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/documents"
                    onClick={() => setActiveTab("documents")}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === "documents" ? "bg-gray-200/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <FileText size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Documents
                    </span>
                  </Link>
                )}
              </li>
              
              {/* Data Export - TEMPORARILY HIDDEN */}
              {/* <li className={isSidebarCollapsed ? "" : "group"}>
                {shouldRestrictSubscriptionManager ? (
                  <div className="flex items-center p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-center w-6 h-6">
                      <Database size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Data Export
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/data-export"
                    onClick={() => setActiveTab("dataExport")}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === "dataExport" ? "bg-gray-200/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Database size={20} />
                    </div>
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      Data Export
                    </span>
                  </Link>
                )}
              </li> */}
              
              {/* Settings */}
              <li className={isSidebarCollapsed ? "" : "group"}>
                <Link
                  href="/settings"
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                    activeTab === "settings" ? "bg-gray-200/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <Settings size={20} />
                  </div>
                  <span
                    className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                      isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                    }`}
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    Settings
                  </span>
                </Link>
              </li>
              
              {/* Admin Dashboard - Only show if user is admin */}
              {(() => {
                return adminCheckComplete && isAdmin;
              })() && (
                <li className={isSidebarCollapsed ? "" : "group"}>
                  <div className="flex items-center w-full p-4 hover:bg-gray-200/20 transition-colors cursor-pointer">
                    {/* Shield icon and label as a link */}
                    <Link
                      href="/admin-dashboard"
                      onClick={() => setActiveTab("adminDashboard")}
                      className={`flex items-center flex-grow min-w-0 ${
                        pathname === "/admin-dashboard" ? "font-bold text-white" : ""
                      }`}
                      style={{ textDecoration: "none" }}
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <Shield size={20} />
                      </div>
                      <span
                        className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                          isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                        }`}
                        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        Admin Dashboard
                      </span>
                    </Link>
                    {/* Chevron toggles submenu - only works when sidebar is expanded */}
                    {!isSidebarCollapsed && (
                      <button
                        type="button"
                        onClick={() => setAdminMenuOpen((open) => !open)}
                        className="ml-2 p-1 focus:outline-none bg-transparent text-white hover:text-blue-200"
                        tabIndex={0}
                        aria-label="Toggle Admin Dashboard submenu"
                      >
                        {adminMenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    )}
                  </div>
                  {/* Rate Developments Submenu */}
                  {adminMenuOpen && !isSidebarCollapsed && (
                    <ul className="ml-8 mt-1 space-y-1 bg-blue-900/80 rounded-lg py-2 shadow-lg">
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            // Only toggle submenu if sidebar is expanded
                            if (!isSidebarCollapsed) {
                              setRateDevMenuOpen((open) => !open);
                            }
                          }}
                          className={`flex items-center w-full px-4 py-2 rounded-md transition-all duration-200 focus:outline-none mb-1 ${
                            pathname.startsWith("/admin-dashboard/rate-developments")
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow"
                              : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                          }`}
                        >
                          <Megaphone size={18} className="mr-2" />
                          <span className="ml-1">Rate Developments</span>
                          <span className="ml-auto">
                            {rateDevMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        </button>
                        {/* Third-level submenu */}
                        {rateDevMenuOpen && (
                          <ul className="ml-4 mt-1 space-y-1">
                            {adminRateDevLinks.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={() => setActiveTab("adminDashboard")}
                                  className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ml-2 text-sm ${
                                    pathname === link.href
                                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold shadow"
                                      : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                                  }`}
                                >
                                  {link.icon}
                                  <span className="ml-2">{link.label}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                      <li>
                        <Link
                          href="/admin-dashboard/marketing-emails"
                          onClick={() => setActiveTab("adminDashboard")}
                          className={`flex items-center w-full px-4 py-2 rounded-md transition-all duration-200 focus:outline-none ${
                            pathname.startsWith("/admin-dashboard/marketing-emails")
                              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold shadow"
                              : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                          }`}
                        >
                          <Mail size={18} className="mr-2" />
                          <span className="ml-1">Marketing Emails</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )}

              <li className={isSidebarCollapsed ? "" : "group"}>
                <Link
                  href="/support"
                  onClick={() => setActiveTab("support")}
                  className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                    activeTab === "support" ? "bg-gray-200/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <HelpCircle size={20} />
                  </div>
                  <span
                    className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                      isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                    }`}
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    Support
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
    </aside>
  );
});

SideNav.displayName = "SideNav";

export default SideNav;
