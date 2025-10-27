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
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number;
}

interface AvailablePlan {
  id: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  product: {
    id: string;
    name: string;
    description: string | null;
  };
}

// Sub-user aware subscription component for settings
function SettingsSubscription({ 
  subscriptionUsers, 
  newUserEmail, 
  setNewUserEmail, 
  isAddingUser, 
  isRemovingUser, 
  addUserToSubscription, 
  removeUserFromSubscription,
  userRole,
  showUserManagement = false
}: {
  subscriptionUsers: any[];
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
  isAddingUser: boolean;
  isRemovingUser: string | null;
  addUserToSubscription: () => void;
  removeUserFromSubscription: (email: string) => void;
  userRole: string | null;
  showUserManagement?: boolean;
}) {
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
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [planChangeError, setPlanChangeError] = useState<string | null>(null);
  const [planChangeSuccess, setPlanChangeSuccess] = useState(false);

  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch("/api/stripe/modify-subscription");
      if (response.ok) {
        const data = await response.json();
        setAvailablePlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error fetching available plans:", error);
    }
  };

  const handlePlanChange = async (newPriceId: string) => {
    if (!auth.userEmail) return;
    
    setChangingPlan(true);
    setPlanChangeError(null);
    
    try {
      const response = await fetch("/api/stripe/modify-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: auth.userEmail,
          newPriceId: newPriceId,
          prorationBehavior: 'create_prorations'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change subscription plan");
      }

      const result = await response.json();
      setPlanChangeSuccess(true);
      setShowPlanChangeModal(false);
      
      // Refresh subscription data to show updated plan
      await fetchSubscriptionData(auth.userEmail);
      
    } catch (err) {
      console.error("Error changing plan:", err);
      setPlanChangeError(err instanceof Error ? err.message : "Failed to change subscription plan");
    } finally {
      setChangingPlan(false);
    }
  };

  const getDaysRemaining = () => {
    if (!subscriptionData?.currentPeriodEnd) return null;
    const now = new Date();
    const endDate = new Date(subscriptionData.currentPeriodEnd * 1000);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

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

  // Fetch available plans when component mounts
  useEffect(() => {
    if (auth.isAuthenticated && !showUserManagement) {
      fetchAvailablePlans();
    }
  }, [auth.isAuthenticated, showUserManagement]);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showUserManagement ? "Subscription Users" : "Subscription Overview"}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {showUserManagement 
                ? "View users attached to this subscription" 
                : `You're accessing this subscription through the primary account: ${primaryUserEmail}`}
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
                    <h2 className="text-2xl font-bold mb-1">
                      {showUserManagement ? "Subscription Users" : "Account Information"}
                    </h2>
                    <p className="text-blue-100">
                      {showUserManagement ? "View subscription users" : "Primary subscription details"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 bg-blue-600 bg-opacity-50 rounded-full">
                      <span className="text-sm font-medium">Sub-User Access</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {showUserManagement ? (
                  // Sub-user User Management View (Read-only)
                  <div>
                    {/* User Management Header */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Subscription Users</h3>
                      <p className="text-gray-600">
                        View users who have access to this subscription. As a sub-user, you can only view this information.
                      </p>
                    </div>

                    {/* Read-only notice */}
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          As a sub-user, you can view subscription information but cannot add or remove users. 
                          Contact your subscription manager or primary user for user management.
                        </p>
                      </div>
                    </div>

                    {/* Current Users List */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Current Users</h4>
                      <div className="space-y-2">
                        {/* Show current user first */}
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{auth.userEmail}</div>
                              <div className="text-xs text-gray-500">Sub-User</div>
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">You</div>
                        </div>

                        {/* Show other users */}
                        {subscriptionUsers.length === 0 ? (
                          <div className="text-gray-500 text-sm text-center py-4">
                            No other users in this subscription.
                          </div>
                        ) : (
                          subscriptionUsers.map((user, index) => (
                            <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                  <div className="text-xs text-gray-500">Secondary User</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-400">View Only</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Sub-user Subscription Details View
                  <div>
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
                        {getDaysRemaining() !== null && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">
                              {subscriptionData.cancelAtPeriodEnd ? (
                                <>⏰ Subscription ends in <span className="font-bold">{getDaysRemaining()} days</span></>
                              ) : (
                                <>📅 <span className="font-bold">{getDaysRemaining()} days</span> remaining in current period</>
                              )}
                            </p>
                          </div>
                        )}
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
                )}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {showUserManagement ? "Subscription Users" : "Your Subscription"}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {showUserManagement 
              ? "Manage users attached to your subscription" 
              : "Manage your subscription, billing details, and sub-user accounts"}
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
                  <h2 className="text-2xl font-bold mb-1">
                    {showUserManagement ? "Subscription Users" : "Account Information"}
                  </h2>
                  <p className="text-blue-100">
                    {showUserManagement ? "Manage subscription users" : "Primary subscription holder"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 bg-green-600 bg-opacity-50 rounded-full">
                    <span className="text-sm font-medium">Primary Account</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {showUserManagement ? (
                // User Management View
                <div>
                  {/* User Management Header */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Subscription Users</h3>
                    <p className="text-gray-600">
                      Manage users who have access to your subscription. You can add or remove users as needed.
                    </p>
                  </div>

                  {/* Subscription Slots Info */}
                  <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Subscription Slots</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">3</div>
                          <div className="text-sm text-gray-600">Total Slots</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {userRole === 'subscription_manager' 
                              ? subscriptionUsers.length 
                              : userRole === 'user' 
                                ? subscriptionUsers.length + 1 // +1 for themselves
                                : subscriptionUsers.length + 1 // +1 for primary user
                            }
                          </div>
                          <div className="text-sm text-gray-600">Used Slots</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">
                            {userRole === 'subscription_manager' 
                              ? 3 - subscriptionUsers.length 
                              : userRole === 'user' 
                                ? 3 - (subscriptionUsers.length + 1)
                                : 3 - (subscriptionUsers.length + 1)
                            }
                          </div>
                          <div className="text-sm text-gray-600">Available Slots</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add User Form - Only for managers and primary users */}
                  {(userRole === 'subscription_manager' || userRole === 'user') && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Add User to Subscription</h4>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Enter user email address"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addUserToSubscription}
                          disabled={!newUserEmail.trim() || isAddingUser}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingUser ? "Adding..." : "Add User"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Read-only notice for secondary users */}
                  {userRole === 'sub_user' && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          As a secondary user, you can view subscription information but cannot add or remove users. 
                          Contact your subscription manager or primary user for user management.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Users List */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Current Users</h4>
                    <div className="space-y-2">
                      {/* Show current user first */}
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{auth.userEmail}</div>
                            <div className="text-xs text-gray-500">
                              {userRole === 'subscription_manager' ? 'Subscription Manager' : 
                               userRole === 'user' ? 'Primary User' : 'Secondary User'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">You</div>
                      </div>

                      {/* Show other users */}
                      {subscriptionUsers.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">
                          {userRole === 'subscription_manager' 
                            ? "No secondary users added yet." 
                            : "No other users in this subscription."}
                        </div>
                      ) : (
                        subscriptionUsers.map((user, index) => (
                          <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-xs text-gray-500">Secondary User</div>
                              </div>
                            </div>
                            {(userRole === 'subscription_manager' || userRole === 'user') ? (
                              <button
                                onClick={() => removeUserFromSubscription(user.email)}
                                disabled={isRemovingUser === user.email}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50"
                              >
                                {isRemovingUser === user.email ? "Removing..." : "Remove"}
                              </button>
                            ) : (
                              <div className="text-xs text-gray-400">View Only</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Subscription Details View
                <div>
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

                {/* Subscription Management */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Subscription Management</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        Manage your subscription users and slots. You can add or remove users from your subscription.
                      </p>
                    </div>
                  </div>

                  {/* Subscription Slots Info */}
                  <div className="mb-6">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h5 className="font-semibold text-gray-900 mb-2">Subscription Slots</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">3</div>
                          <div className="text-sm text-gray-600">Total Slots</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {userRole === 'subscription_manager' 
                              ? subscriptionUsers.length 
                              : userRole === 'user' 
                                ? subscriptionUsers.length + 1 // +1 for themselves
                                : subscriptionUsers.length + 1 // +1 for primary user
                            }
                          </div>
                          <div className="text-sm text-gray-600">Used Slots</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">
                            {userRole === 'subscription_manager' 
                              ? 3 - subscriptionUsers.length 
                              : userRole === 'user' 
                                ? 3 - (subscriptionUsers.length + 1)
                                : 3 - (subscriptionUsers.length + 1)
                            }
                          </div>
                          <div className="text-sm text-gray-600">Available Slots</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add User Form - Only for managers and primary users */}
                  {(userRole === 'subscription_manager' || userRole === 'user') && (
                    <div className="mb-6">
                      <h5 className="font-semibold text-gray-900 mb-3">Add User to Subscription</h5>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Enter user email address"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addUserToSubscription}
                          disabled={!newUserEmail.trim() || isAddingUser}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingUser ? "Adding..." : "Add User"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Read-only notice for secondary users */}
                  {userRole === 'sub_user' && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        <p className="text-sm text-gray-600">
                          As a secondary user, you can view subscription information but cannot add or remove users. 
                          Contact your subscription manager or primary user for user management.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Users List */}
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Current Users</h5>
                    <div className="space-y-2">
                      {/* Show current user first */}
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{auth.userEmail}</div>
                            <div className="text-xs text-gray-500">
                              {userRole === 'subscription_manager' ? 'Subscription Manager' : 
                               userRole === 'user' ? 'Primary User' : 'Secondary User'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">You</div>
                      </div>

                      {/* Show other users */}
                      {subscriptionUsers.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">
                          {userRole === 'subscription_manager' 
                            ? "No secondary users added yet." 
                            : "No other users in this subscription."}
                        </div>
                      ) : (
                        subscriptionUsers.map((user, index) => (
                          <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-xs text-gray-500">Secondary User</div>
                              </div>
                            </div>
                            {(userRole === 'subscription_manager' || userRole === 'user') ? (
                              <button
                                onClick={() => removeUserFromSubscription(user.email)}
                                disabled={isRemovingUser === user.email}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50"
                              >
                                {isRemovingUser === user.email ? "Removing..." : "Remove"}
                              </button>
                            ) : (
                              <div className="text-xs text-gray-400">View Only</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Change Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-blue-800">Change Subscription Plan</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        Switch between monthly and yearly billing or change your plan. Changes take effect immediately with prorated billing.
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={() => setShowPlanChangeModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Change Plan
                        </button>
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
              )}
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

            {/* Plan Change Modal */}
            {showPlanChangeModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Change Subscription Plan</h3>
                      <button
                        onClick={() => setShowPlanChangeModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Choose a new subscription plan. Changes take effect immediately with prorated billing.
                      </p>
                      
                      {availablePlans.length > 0 ? (
                        <div className="grid gap-4">
                          {availablePlans.map((plan) => (
                            <div
                              key={plan.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                subscriptionData?.billingInterval === plan.interval
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                              onClick={() => handlePlanChange(plan.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium text-gray-900">{plan.product.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    ${(plan.amount / 100).toFixed(2)} / {plan.interval}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {subscriptionData?.billingInterval === plan.interval && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Current Plan
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Loading available plans...</p>
                        </div>
                      )}
                    </div>
                    
                    {planChangeError && (
                      <div className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{planChangeError}</p>
                      </div>
                    )}
                    
                    {changingPlan && (
                      <div className="mt-4 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Changing plan...</span>
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");
  const [showServiceAgreement, setShowServiceAgreement] = useState(false); // Removed - ServiceAgreementModal deleted
  
  // Subscription management state
  const [subscriptionUsers, setSubscriptionUsers] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!auth.userEmail) {
        setRoleCheckComplete(true);
        return;
      }

      try {
        const response = await fetch("/api/user-role");
        const result = await response.json();
        
        if (response.ok) {
          setUserRole(result.role);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole(null);
      } finally {
        setRoleCheckComplete(true);
      }
    };

    checkUserRole();
  }, [auth.userEmail]);

  // Fetch subscription users
  const fetchSubscriptionUsers = async () => {
    try {
      const response = await fetch("/api/subscription-users");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionUsers(data.subUsers || []);
      }
    } catch (error) {
      console.error("Error fetching subscription users:", error);
    }
  };

  // Add user to subscription
  const addUserToSubscription = async () => {
    if (!newUserEmail.trim()) return;
    
    setIsAddingUser(true);
    try {
      const response = await fetch("/api/subscription-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail.trim() })
      });
      
      if (response.ok) {
        setNewUserEmail("");
        fetchSubscriptionUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user");
    } finally {
      setIsAddingUser(false);
    }
  };

  // Remove user from subscription
  const removeUserFromSubscription = async (email: string) => {
    setIsRemovingUser(email);
    try {
      const response = await fetch("/api/subscription-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        fetchSubscriptionUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user");
    } finally {
      setIsRemovingUser(null);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    if (auth.userEmail && (userRole === 'subscription_manager' || userRole === 'user')) {
      fetchSubscriptionUsers();
    }
  }, [auth.userEmail, userRole]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile />;
      case "email-preferences":
        return <EmailPreferences />;
      case "manage-subscription":
        return (
          <SettingsSubscription 
            subscriptionUsers={subscriptionUsers}
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
            isAddingUser={isAddingUser}
            isRemovingUser={isRemovingUser}
            addUserToSubscription={addUserToSubscription}
            removeUserFromSubscription={removeUserFromSubscription}
            userRole={userRole}
            showUserManagement={false}
          />
        );
      case "manage-subscription-users":
        return (
          <SettingsSubscription 
            subscriptionUsers={subscriptionUsers}
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
            isAddingUser={isAddingUser}
            isRemovingUser={isRemovingUser}
            addUserToSubscription={addUserToSubscription}
            removeUserFromSubscription={removeUserFromSubscription}
            userRole={userRole}
            showUserManagement={true}
          />
        );
      case "service-agreement":
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-[#012C61] mb-4">Service Agreement</h3>
              <p className="text-gray-600 mb-4">
                View your current Service Agreement and understand the terms of your subscription.
              </p>
              <button
                onClick={() => setShowServiceAgreement(true)}
                className="bg-[#012C61] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                View Service Agreement
              </button>
            </div>
          </div>
        );
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

      {/* Subscription Manager Notice */}
      {roleCheckComplete && userRole === 'subscription_manager' && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-amber-800 mb-2">
                  Subscription Manager Access
                </h3>
                <p className="text-amber-700">
                  Since you are logged in as a <strong>Subscription Manager</strong>, you only have access to the settings page of the application. 
                  You have been redirected here because subscription managers are restricted to account management functions only.
                </p>
                <div className="mt-3 text-sm text-amber-600">
                  <p><strong>What you can do:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Manage user accounts and permissions</li>
                    <li>View subscription details and billing</li>
                    <li>Add or remove users from the subscription</li>
                    <li>Update account settings</li>
                  </ul>
                  <p className="mt-2"><strong>What you cannot access:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Dashboard data and analytics</li>
                    <li>Rate information and reports</li>
                    <li>Application features and tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => setActiveTab("manage-subscription")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "manage-subscription"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Manage Subscription
          </button>
          {/* Show subscription users tab for all users, but with different access levels */}
          <button
            onClick={() => setActiveTab("manage-subscription-users")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "manage-subscription-users"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Manage Subscription Users
          </button>
          <button
            onClick={() => setActiveTab("service-agreement")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "service-agreement"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Service Agreement
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Service Agreement Modal - Removed since ServiceAgreementModal was deleted */}
    </AppLayout>
  );
}
