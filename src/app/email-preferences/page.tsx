"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/applayout";
import { useRequireSubscription } from "@/hooks/useRequireAuth";
import { useSubscriptionManagerRedirect } from "@/hooks/useSubscriptionManagerRedirect";

export default function EmailPreferencesPage() {
  const auth = useRequireSubscription();
  const { isSubscriptionManager, isChecking } = useSubscriptionManagerRedirect();

  // Show loading while checking role
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // If subscription manager, they'll be redirected by the hook
  if (isSubscriptionManager) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <AppLayout activeTab="emailPreferences">
      <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-8 text-center">
        Email Preferences
      </h1>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600 text-center">
            Email preferences functionality will be implemented here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}