"use client";

import { useState } from "react";
import AppLayout from "@/app/components/applayout";
import SettingsProfile from "./components/SettingsProfile";
import ManageSubscription from "./components/ManageSubscription";
import ManageSubscriptionUsers from "./components/ManageSubscriptionUsers";
import TermsAndConditions from "./components/TermsAndConditions";
import SettingsEmailPreferences from "./components/SettingsEmailPreferences";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "manage-subscription", label: "Manage Subscription", icon: "💳" },
    { id: "manage-subscription-users", label: "Manage Subscription Users", icon: "👥" },
    { id: "terms-and-conditions", label: "Terms and Conditions", icon: "📋" },
    { id: "email-preferences", label: "Email Preferences", icon: "📧" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <SettingsProfile />;
      case "manage-subscription":
        return <ManageSubscription />;
      case "manage-subscription-users":
        return <ManageSubscriptionUsers />;
      case "terms-and-conditions":
        return <TermsAndConditions />;
      case "email-preferences":
        return <SettingsEmailPreferences />;
      default:
        return <SettingsProfile />;
    }
  };

  return (
    <AppLayout activeTab="settings">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Manage your account settings, subscription, and preferences
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </AppLayout>
  );
}