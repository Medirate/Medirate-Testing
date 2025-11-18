"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/applayout";
import SettingsProfile from "./components/SettingsProfile";
import ManageSubscription from "./components/ManageSubscription";
import ManageSubscriptionUsers from "./components/ManageSubscriptionUsers";
import TermsAndConditions from "./components/TermsAndConditions";
import LoaderOverlay from "@/app/components/LoaderOverlay";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user-role");
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setIsLoadingRole(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "manage-subscription", label: "Manage Subscription" },
    { id: "manage-subscription-users", label: "Manage Subscription Users" },
    { id: "terms-and-conditions", label: "Terms and Conditions" },
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
      default:
        return <SettingsProfile />;
    }
  };

  if (isLoadingRole) {
    return <LoaderOverlay />;
  }

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
            
            {/* Role-specific message */}
            {!isLoadingRole && userRole === 'subscription_manager' && (
              <div className="mt-6 max-w-4xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 text-left">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        Subscription Manager Access
                      </h3>
                      <p className="text-blue-700 mb-3">
                        As a subscription manager, you have access to settings and subscription management features. 
                        You can manage your account preferences, view subscription details, and add/remove sub-users.
                      </p>
                      <div className="text-sm text-blue-600">
                        <p className="font-medium mb-1">Available features:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Account profile management</li>
                          <li>Subscription details and billing information</li>
                          <li>Sub-user management (add/remove users)</li>
                          <li>Terms and conditions access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoadingRole && userRole === 'sub_user' && (
              <div className="mt-6 max-w-4xl mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 text-left">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Sub-User Access
                      </h3>
                      <p className="text-green-700 mb-3">
                        As a sub-user, you have read-only access to settings and subscription information. 
                        You can view your account profile and subscription details, but cannot modify subscription settings.
                      </p>
                      <div className="text-sm text-green-600">
                        <p className="font-medium mb-1">Available features:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>View account profile information</li>
                          <li>View subscription details (read-only)</li>
                          <li>Access terms and conditions</li>
                          <li>View other sub-users in the subscription</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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