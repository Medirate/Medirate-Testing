"use client"; // Ensure this is a client component

import { useState } from "react";
import Link from "next/link";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-[#012C61]">MediRate</h2>
        </div>
        <nav className="mt-6">
          <ul>
            <li
              className={`p-4 cursor-pointer ${
                activeTab === "dashboard" ? "bg-gray-200 font-semibold" : ""
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <Link href="/dashboard">Dashboard</Link>
            </li>
            <li
              className={`p-4 cursor-pointer ${
                activeTab === "profile" ? "bg-gray-200 font-semibold" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <Link href="/dashboard/profile">Profile</Link>
            </li>
            <li
              className={`p-4 cursor-pointer ${
                activeTab === "settings" ? "bg-gray-200 font-semibold" : ""
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <Link href="/dashboard/settings">Settings</Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default DashboardLayout;
