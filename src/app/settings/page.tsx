"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/applayout";
import EmailPreferences from "@/app/email-preferences/page";
import Profile from "@/app/profile/page";
import Subscription from "@/app/subscription/page";
import { useRequireSubscription } from "@/hooks/useRequireAuth";

interface SubscriptionData {
  plan: string;
  amount: number;
  currency: string;
  billingInterval: string;
  status: string;
  startDate: string;
  endDate: string;
  trialEndDate: string | null;
  latestInvoice: string;
  paymentMethod: string;
}

// Sub-user aware subscription component for settings
function SettingsSubscription() {
  const auth = useRequireSubscription();
  const [isSubUser, setIsSubUser] = useState(false);
  const [primaryUserEmail, setPrimaryUserEmail] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const fetchSubscriptionData = async (email: string) => {
    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const data = await response.json();
      if (data.error) {
        setSubscriptionData(null);
        setError("No active subscription found");
      } else {
        setSubscriptionData(data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Failed to load subscription data");
      setSubscriptionData(null);
    }
  };

  useEffect(() => {
    const checkSubUserStatusAndFetchSubscription = async () => {
      if (!auth.isAuthenticated || !auth.userEmail) return;

      try {
        const response = await fetch("/api/subscription-users");
        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Settings: Sub-user check data:", data);
          
          if (data.isSubUser) {
            setIsSubUser(true);
            setPrimaryUserEmail(data.primaryUser);
            // Fetch subscription data for the primary user
            await fetchSubscriptionData(data.primaryUser);
          } else {
            setIsSubUser(false);
            setPrimaryUserEmail(null);
            // Fetch subscription data for the current user (primary user)
            await fetchSubscriptionData(auth.userEmail);
          }
        }
      } catch (error) {
        console.error("Error checking sub-user status:", error);
        setError("Failed to load subscription information");
      } finally {
        setLoading(false);
      }
    };

    checkSubUserStatusAndFetchSubscription();
  }, [auth.isAuthenticated, auth.userEmail]);

  const handleCancelSubscription = async () => {
    if (!auth.userEmail) return;
    
    setCanceling(true);
    setCancelError(null);
    
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: auth.userEmail,
          cancelAtPeriodEnd: true // Cancel at end of billing period
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel subscription");
      }

      const result = await response.json();
      setCancelSuccess(true);
      setShowCancelModal(false);
      
      // Refresh subscription data to show updated status
      await fetchSubscriptionData(auth.userEmail);
      
    } catch (err) {
      console.error("Error canceling subscription:", err);
      setCancelError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading subscription information...</div>
      </div>
    );
  }

  if (isSubUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full mb-4">
              <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-700">Sub-User Account</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Overview</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You're accessing this subscription through the primary account: <span className="font-semibold text-[#012C61]">{primaryUserEmail}</span>
            </p>
          </div>

          {error ? (
            <div className="bg-white border border-red-200 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Data Unavailable</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Good News:</strong> As a sub-user, you still have full access to all premium features through the primary account.
                  </p>
                </div>
              </div>
            </div>
          ) : subscriptionData ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
              {/* Account Info Header */}
              <div className="bg-gradient-to-r from-[#012C61] to-blue-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Account Information</h2>
                    <p className="text-blue-100">Primary subscription details</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 bg-blue-600 bg-opacity-50 rounded-full">
                      <span className="text-sm font-medium">Sub-User Access</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* User Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Information</label>
                      <div className="mt-2 space-y-2">
                        <p className="text-lg font-medium text-gray-900">
                          {auth.user?.given_name && auth.user?.family_name 
                            ? `${auth.user.given_name} ${auth.user.family_name}` 
                            : auth.user?.given_name || auth.user?.family_name || "User"}
                        </p>
                        <p className="text-gray-600 flex items-center">
                          <span>{auth.userEmail}</span>
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Sub-User
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Primary Account</label>
                      <div className="mt-2">
                        <p className="text-lg font-medium text-gray-900">{primaryUserEmail}</p>
                        <p className="text-gray-600">Subscription Manager</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Subscription Details</h3>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-green-700 capitalize">{subscriptionData.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Plan Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{subscriptionData.plan}</h4>
                        <div className="text-3xl font-bold text-[#012C61] mb-1">
                          ${subscriptionData.amount}
                        </div>
                        <p className="text-sm text-gray-600">
                          {subscriptionData.currency.toUpperCase()} / {subscriptionData.billingInterval}
                        </p>
                      </div>
                    </div>

                    {/* Billing Dates */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Billing Period</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="font-medium text-gray-900">{subscriptionData.startDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Date</p>
                          <p className="font-medium text-gray-900">{subscriptionData.endDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Method</p>
                          <p className="font-medium text-gray-900 capitalize">{subscriptionData.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Latest Invoice</p>
                          <p className="font-mono text-xs text-gray-700 break-all">{subscriptionData.latestInvoice}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-amber-800">Important Information</h4>
                        <p className="mt-1 text-sm text-amber-700">
                          This subscription is managed by <strong>{primaryUserEmail}</strong>. For billing inquiries, 
                          subscription modifications, or to add additional users, please contact the primary account holder directly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Data</h3>
              <p className="text-gray-600 mb-4">Unable to retrieve subscription information at this time.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  As a sub-user, you have access to all premium features through the primary account.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
              <a href="/support" className="hover:text-[#012C61] transition-colors duration-200">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Need Help?
                </span>
              </a>
              <span className="text-gray-300">•</span>
              <a href="/terms" className="hover:text-[#012C61] transition-colors duration-200">Terms of Service</a>
              <span className="text-gray-300">•</span>
              <a href="/privacy" className="hover:text-[#012C61] transition-colors duration-200">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For primary users, show the modern professional design
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-200 rounded-full mb-4">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-700">Primary Account</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Subscription</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your subscription, billing details, and sub-user accounts
          </p>
        </div>

        {error ? (
          <div className="bg-white border border-red-200 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Data Unavailable</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Please try refreshing the page or contact support if the issue persists.
                </p>
              </div>
            </div>
          </div>
        ) : subscriptionData ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
            {/* Account Info Header */}
            <div className="bg-gradient-to-r from-[#012C61] to-blue-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Account Information</h2>
                  <p className="text-blue-100">Primary subscription holder</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 bg-green-600 bg-opacity-50 rounded-full">
                    <span className="text-sm font-medium">Primary Account</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* User Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Holder</label>
                    <div className="mt-2 space-y-2">
                      <p className="text-lg font-medium text-gray-900">
                        {auth.user?.given_name && auth.user?.family_name 
                          ? `${auth.user.given_name} ${auth.user.family_name}` 
                          : auth.user?.given_name || auth.user?.family_name || "User"}
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <span>{auth.userEmail}</span>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Primary
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Type</label>
                    <div className="mt-2">
                      <p className="text-lg font-medium text-gray-900">Primary Subscription</p>
                      <p className="text-gray-600">Full management access</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Subscription Details</h3>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-green-700 capitalize">{subscriptionData.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {/* Plan Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{subscriptionData.plan}</h4>
                      <div className="text-3xl font-bold text-[#012C61] mb-1">
                        ${subscriptionData.amount}
                      </div>
                      <p className="text-sm text-gray-600">
                        {subscriptionData.currency.toUpperCase()} / {subscriptionData.billingInterval}
                      </p>
                    </div>
                  </div>

                  {/* Billing Dates */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Billing Period</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium text-gray-900">{subscriptionData.startDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium text-gray-900">{subscriptionData.endDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Method</p>
                        <p className="font-medium text-gray-900 capitalize">{subscriptionData.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Latest Invoice</p>
                        <p className="font-mono text-xs text-gray-700 break-all">{subscriptionData.latestInvoice}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Management Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Subscription Management</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        As the primary account holder, you have full access to manage this subscription, including billing settings, 
                        adding or removing sub-users, and updating payment methods. Visit the full subscription page for advanced management options.
                      </p>
                      <div className="mt-3">
                        <a 
                          href="/subscription" 
                          className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Manage Subscription
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Cancellation Section */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-red-800">Cancel Subscription</h4>
                      <p className="mt-1 text-sm text-red-700">
                        If you need to cancel your subscription, you can do so here. You'll retain access until the end of your current billing period.
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Subscription
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Modal */}
            {showCancelModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="mt-2 text-center">
                      <h3 className="text-lg font-medium text-gray-900">Cancel Subscription</h3>
                      <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to cancel your subscription? You'll retain access to all features until the end of your current billing period ({subscriptionData?.endDate}).
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          This action cannot be undone. You can resubscribe at any time.
                        </p>
                      </div>
                    </div>
                    <div className="items-center px-4 py-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowCancelModal(false)}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                          Keep Subscription
                        </button>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={canceling}
                          className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {canceling ? "Canceling..." : "Yes, Cancel"}
                        </button>
                      </div>
                    </div>
                    {cancelError && (
                      <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{cancelError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {cancelSuccess && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="mt-2 text-center">
                      <h3 className="text-lg font-medium text-gray-900">Subscription Canceled</h3>
                      <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500">
                          Your subscription has been successfully canceled. You'll retain access until the end of your current billing period.
                        </p>
                      </div>
                    </div>
                    <div className="items-center px-4 py-3">
                      <button
                        onClick={() => setCancelSuccess(false)}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Data</h3>
            <p className="text-gray-600 mb-4">Unable to retrieve subscription information at this time.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Please try refreshing the page or contact support for assistance.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
            <a href="/support" className="hover:text-[#012C61] transition-colors duration-200">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Need Help?
              </span>
            </a>
            <span className="text-gray-300">•</span>
            <a href="/terms" className="hover:text-[#012C61] transition-colors duration-200">Terms of Service</a>
            <span className="text-gray-300">•</span>
            <a href="/privacy" className="hover:text-[#012C61] transition-colors duration-200">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const auth = useRequireSubscription();

  const [activeTab, setActiveTab] = useState("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile />;
      case "email-preferences":
        return <EmailPreferences />;
      case "subscription":
        return <SettingsSubscription />;
      default:
        return <Profile />;
    }
  };

  if (auth.isLoading || auth.shouldRedirect) {
    return null; // or a loading spinner
  }

  return (
    <AppLayout activeTab="settings">
              <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-8 text-center">
        Settings
      </h1>

      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "profile"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("email-preferences")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "email-preferences"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Email Alerts
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "subscription"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Subscription
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {renderTabContent()}
        </div>
      </div>
    </AppLayout>
  );
}
