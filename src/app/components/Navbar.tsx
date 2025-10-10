"use client";

import { LogOut, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const auth = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; picture?: string }>({
    name: "User",
    email: "",
    picture: undefined,
  });

  // ✅ Sync user to Supabase after login and fetch user data
  useEffect(() => {
    if (auth.isAuthenticated && auth.userEmail) {
      syncUserToSupabase(auth.userEmail, auth.user?.given_name || "", auth.user?.family_name || "", auth.user?.id || "");
      // fetchUserFromSupabase is now called after sync completes
    }
  }, [auth.isAuthenticated, auth.userEmail, auth.user]);

  // ✅ Sub-user status is now handled by centralized auth context

  // Sub-user status checking removed - handled by centralized auth context

  const fetchUserFromSupabase = async (email: string) => {
    try {
      console.log("🔍 Fetching user data for email:", email);
      
      const { data, error } = await supabase
        .from("User")
        .select("FirstName, LastName, Email, Picture")
        .eq("Email", email)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) {
        console.log("❌ Error fetching user data:", error.message);
        return;
      }

      if (!data) {
        console.log("⚠️ No user data found for email:", email);
        return;
      }

      console.log("✅ User data found:", data);
      setUserInfo({
        name: data.FirstName || data.LastName || "User",
        email: data.Email,
        picture: data.Picture || undefined,
      });
    } catch (err) {
      console.log("💥 Exception in fetchUserFromSupabase:", err);
    }
  };

  const syncUserToSupabase = async (email: string, firstName: string, lastName: string, kindeId: string) => {
    try {
      console.log("🔄 Syncing user to Supabase:", { email, firstName, lastName });
      
      const response = await fetch("/api/sync-kinde-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, kindeId }),
      });

      const data = await response.json();
      console.log("🔄 Sync API response:", data);
      
      if (data.error) {
        console.log("❌ Error syncing user to Supabase:", data.error);
      } else {
        console.log("✅ User synced to Supabase successfully");
        
        // Use the user data from the sync response instead of fetching separately
        if (data.user) {
          console.log("✅ User data from sync:", data.user);
          setUserInfo({
            name: data.user.FirstName || data.user.LastName || "User",
            email: data.user.Email,
            picture: data.user.Picture || undefined,
          });
        } else {
          console.log("⚠️ No user data in sync response, trying to fetch...");
          // Fallback: try to fetch user data
          setTimeout(() => {
            fetchUserFromSupabase(email);
          }, 1000);
        }
      }
    } catch (err) {
      console.log("💥 Exception in syncUserToSupabase:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navbarStyle = {
    backgroundColor: "rgb(1, 44, 97)",
    height: "5.5rem",
  };

  const authenticatedPages = [
    "/dashboard",
    "/home",
    "/recent-rate-changes",
    "/profile",
    "/settings",
    "/provider-alerts",
    "/subscription",
    "/legislative-updates",
    "/rate-developments",
    "/email-preferences",
    "/state-rate-comparison",
    "/state-rate-comparison/all",
    "/state-rate-comparison/individual",
    "/historical-rates",
    "/admin-dashboard",
    "/admin-dashboard/rate-developments",
    "/admin-dashboard/rate-developments/edit",
    "/admin-dashboard/rate-developments/update-database",
    "/admin-dashboard/rate-developments/send-email-alerts",
    "/admin-dashboard/marketing-emails",
    "/rate-developments/email-alerts",
    "/support",
  ];

  // Debug logging - temporarily disabled
  // console.log("Navbar state:", { isLoading, isAuthenticated, isAuthCheckComplete, pathname });

  if (auth.isLoading) {
    return (
      <nav className="sticky inset-x-0 top-0 z-[1000] w-full border-b backdrop-blur-lg transition-all" style={navbarStyle}>
        <div className="flex h-[5.5rem] items-center justify-center">
          <span className="text-white">Loading...</span>
        </div>
      </nav>
    );
  }

  // Show authenticated navbar for users with valid subscriptions OR sub-users
  if (auth.isAuthenticated && authenticatedPages.includes(pathname)) {
    return (
      <nav className="sticky inset-x-0 top-0 z-[1000] w-full border-b backdrop-blur-lg transition-all pointer-events-auto" style={navbarStyle}>
        <div className="flex h-[5.5rem] items-center justify-between px-8">
          {/* Wordmark on the Left */}
          <div className="flex-shrink-0 transform -translate-x-4">
            <Link href="/" className="flex items-center pointer-events-auto" onClick={() => console.log("Home link clicked")}>
              <Image src="/top-black-just-word.png" alt="MediRate Wordmark" width={200} height={80} priority />
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <div className="absolute right-[200px]" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                {userInfo.picture ? (
                  <img 
                    src={userInfo.picture} 
                    alt="User Avatar" 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">
                      {userInfo.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-4">
                  <div className="px-4 pb-4 border-b">
                    <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                    <p className="text-xs text-gray-500">{userInfo.email}</p>
                  </div>
                  <div className="py-2 border-t">
                    <LogoutLink
                      postLogoutRedirectURL="/"
                      className="w-full flex items-center px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        sessionStorage.clear();
                      }}
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      Sign Out
                    </LogoutLink>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logo on the Right */}
          <div className="flex-shrink-0 transform -translate-x-4">
            <Image src="/top-black-just-logo.png" alt="MediRate Logo" width={80} height={80} priority />
          </div>
        </div>
      </nav>
    );
  }

  // Show authenticated navbar for authenticated users on public pages (like /subscribe)
  if (auth.isAuthenticated) {
    return (
      <nav className="sticky inset-x-0 top-0 z-[99999] w-full border-b backdrop-blur-lg transition-all pointer-events-auto" style={{...navbarStyle, position: 'fixed', zIndex: 99999}}>
        <div className="flex h-[5.5rem] items-center justify-between px-8">
          {/* Wordmark on the Left */}
          <div className="flex-shrink-0 transform -translate-x-4">
            <Link href="/" className="flex items-center pointer-events-auto">
              <Image src="/top-black-just-word.png" alt="MediRate Wordmark" width={200} height={80} priority />
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/oursolution" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
              Our Solution
            </Link>
            <Link href="/aboutus" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
              About Us
            </Link>
            <Link href="/contactus" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
              Contact Us
            </Link>
            <Link href="/subscribe" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
              Subscribe
            </Link>

            {/* Only show Home if user has subscription access */}
            {(auth.isPrimaryUser || auth.isSubUser || auth.hasActiveSubscription) ? (
              <Link href="/home" className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#000000] font-semibold transition-colors hover:bg-transparent hover:text-white pointer-events-auto">
                Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <Link href="/subscribe" className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#000000] font-semibold transition-colors hover:bg-transparent hover:text-white pointer-events-auto">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Logo on the Right */}
          <div className="flex-shrink-0 transform -translate-x-4">
            <Image src="/top-black-just-logo.png" alt="MediRate Logo" width={80} height={80} priority />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky inset-x-0 top-0 z-[1000] w-full border-b backdrop-blur-lg transition-all pointer-events-auto" style={navbarStyle}>
      <div className="flex h-[5.5rem] items-center justify-between px-8">
        {/* Wordmark on the Left */}
        <div className="flex-shrink-0 transform -translate-x-4">
          <Link href="/" className="flex items-center">
            <Image src="/top-black-just-word.png" alt="MediRate Wordmark" width={200} height={80} priority />
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link href="/oursolution" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
            Our Solution
          </Link>
          <Link href="/aboutus" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
            About Us
          </Link>
          <Link href="/contactus" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
            Contact Us
          </Link>
          <Link href="/subscribe" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
            Subscribe
          </Link>

          {auth.isAuthenticated ? (
            // Only show Home if user has subscription access
            (auth.isPrimaryUser || auth.isSubUser || auth.hasActiveSubscription) ? (
              <Link href="/home" className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#000000] font-semibold transition-colors hover:bg-transparent hover:text-white">
                Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <Link href="/subscribe" className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#000000] font-semibold transition-colors hover:bg-transparent hover:text-white">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )
          ) : (
            <Link
              href="/api/auth/login"
              className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#000000] font-semibold transition-colors hover:bg-transparent hover:text-white pointer-events-auto"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Logo on the Right */}
        <div className="flex-shrink-0 transform -translate-x-4">
          <Image src="/top-black-just-logo.png" alt="MediRate Logo" width={80} height={80} priority />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;