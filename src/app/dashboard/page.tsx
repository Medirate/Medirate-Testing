"use client";

import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import md5 from "md5";
import SideNav from "@/app/components/sidenav";
import Footer from "@/app/components/footer";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Image from "next/image";

type KindeUser = {
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  [key: string]: any;
};

export default function Dashboard() {
  const { getUser, isAuthenticated } = useKindeBrowserClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<KindeUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      const rawUserData = getUser();
      setUser({
        given_name: rawUserData?.given_name || "N/A",
        family_name: rawUserData?.family_name || "N/A",
        email: rawUserData?.email || "N/A",
        picture: rawUserData?.picture || "",
      });
    }
  }, [isAuthenticated]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getProfilePicture = () => {
    if (user?.picture) return user.picture;
    if (user?.email)
      return `https://www.gravatar.com/avatar/${md5(user.email)}?d=retro`;
    return "/default-avatar.png";
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen flex flex-col">
        <div className="reusable-gradient-bg absolute inset-0 z-[-1]"></div>

        <div className="flex flex-grow">
          <SideNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />

          <main className="flex-grow container mx-auto px-4 py-6">
            {activeTab === "dashboard" && (
              <div>
                <h1 className="text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
                  MediRate Dashboard
                </h1>
                <h2 className="text-lg font-semibold mb-4">
                  Embedded Looker Studio Report
                </h2>
                <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg border">
                  <iframe
                    src="https://lookerstudio.google.com/embed/reporting/63c9ff09-019b-4855-a466-4d0116936105/page/zRnXE"
                    title="Looker Studio Report"
                    width="100%"
                    height="100%"
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
                <div className="flex items-center justify-center mb-6">
                  <Image
                    src={getProfilePicture()}
                    alt="Profile Picture"
                    width={100}
                    height={100}
                    className="rounded-full border"
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    <strong>First Name:</strong> {user?.given_name}
                  </p>
                  <p className="text-gray-700">
                    <strong>Last Name:</strong> {user?.family_name}
                  </p>
                  <p className="text-gray-700">
                    <strong>Email:</strong> {user?.email}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p>Settings content goes here.</p>
              </div>
            )}
          </main>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
