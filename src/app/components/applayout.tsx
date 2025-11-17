"use client";

import { useState, useEffect } from "react";
import SideNav from "@/app/components/sidenav";
import Footer from "@/app/components/footer";
import CodeDefinitionsIcon from "@/app/components/CodeDefinitionsIcon";
import TermsModal from "@/app/components/TermsModal";
import { Analytics } from "@vercel/analytics/next";
import { useSideNav } from "@/context/SideNavContext";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

const AppLayout = ({ children, activeTab }: AppLayoutProps) => {
  const { isSidebarCollapsed } = useSideNav();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content Container */}
      <div className="flex flex-grow">
        {/* Side Navigation is now in root layout for persistence */}

        {/* Page Content */}
        {isClient && (
          <main
            className={`flex-grow transition-all duration-300 ease-in-out px-6 py-8 ${
              isSidebarCollapsed ? "ml-16" : "ml-64"
            }`} // Adjust margin dynamically based on sidebar state
          >
            <div
              className="w-full max-w-[1400px] mx-auto" // Adjust width dynamically and center content
            >
              {children}
            </div>
          </main>
        )}
      </div>

      {/* Code Definitions Icon */}
      <CodeDefinitionsIcon />

      {/* Terms and Conditions Modal */}
      <TermsModal />

      {/* Footer */}
      <Footer />

      <div id="datepicker-portal" style={{ zIndex: 3000 }} />
      <Analytics />
    </div>
  );
};

export default AppLayout;
