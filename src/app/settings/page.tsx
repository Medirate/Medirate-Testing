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
  scheduledUpgrade?: {
    upgradeEffectiveDate: string;
    newPlan: string;
    newAmount: number;
    newInterval: string;
  } | null;
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
  const [planChangeCalculation, setPlanChangeCalculation] = useState<{
    currentPlan: { name: string; amount: number; interval: string };
    newPlan: { name: string; amount: number; interval: string };
    refundAmount: number;
    chargeAmount: number;
    netAmount: number;
    daysRemaining: number;
    effectiveDate: string;
  } | null>(null);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [planChangeSuccess, setPlanChangeSuccess] = useState(false);
  const [subscriptionReactivated, setSubscriptionReactivated] = useState(false);
  const [scheduledUpgrade, setScheduledUpgrade] = useState<{
    upgradeEffectiveDate: string;
    newPlan: string;
    newAmount: number;
    newInterval: string;
  } | null>(null);

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

  const calculatePlanChange = (newPriceId: string) => {
    if (!subscriptionData || !availablePlans.length) return;

    const currentPlan = availablePlans.find(p => p.interval === subscriptionData.billingInterval);
    const newPlan = availablePlans.find(p => p.id === newPriceId);
    
    if (!currentPlan || !newPlan) return;

    const daysRemaining = getDaysRemaining() || 0;
    const currentPeriodEnd = subscriptionData.currentPeriodEnd || 0;
    const effectiveDate = new Date(currentPeriodEnd * 1000).toLocaleDateString();
    
    // For scheduled upgrades, no immediate charges or refunds
    const refundAmount = 0; // No refund for scheduled upgrades
    const chargeAmount = 0; // No immediate charge for scheduled upgrades
    const netAmount = 0; // No immediate net change
    
    setPlanChangeCalculation({
      currentPlan: {
        name: `${currentPlan.interval.charAt(0).toUpperCase() + currentPlan.interval.slice(1)} Billing`,
        amount: currentPlan.amount,
        interval: currentPlan.interval
      },
      newPlan: {
        name: `${newPlan.interval.charAt(0).toUpperCase() + newPlan.interval.slice(1)} Billing`,
        amount: newPlan.amount,
        interval: newPlan.interval
      },
      refundAmount,
      chargeAmount,
      netAmount,
      daysRemaining,
      effectiveDate
    });
    
    setShowCalculationModal(true);
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
          newPriceId: newPriceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change subscription plan");
      }

      const result = await response.json();
      
      // Check if subscription was reactivated
      if (result.reactivated) {
        console.log('✅ Subscription reactivated and plan changed');
        setSubscriptionReactivated(true);
      }
      
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
        setScheduledUpgrade(null);
      } else {
        setSubscriptionData(data);
        setScheduledUpgrade(data.scheduledUpgrade || null);
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
                            No other sub users in this subscription.
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
                                  <div className="text-xs text-gray-500">Sub User</div>
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

                  {/* Add Sub User Form - Only for managers and primary users */}
                  {(userRole === 'subscription_manager' || userRole === 'user') && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Add Sub User to Subscription</h4>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Enter sub user email address"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addUserToSubscription}
                          disabled={!newUserEmail.trim() || isAddingUser}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingUser ? "Adding..." : "Add Sub User"}
                        </button>
                      </div>
                    </div>
                  )}


                  {/* Read-only notice for sub users */}
                  {userRole === 'sub_user' && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          As a sub user, you can view subscription information but cannot add or remove users. 
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
                               userRole === 'user' ? 'Primary User' : 'Sub User'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">You</div>
                      </div>

                      {/* Show other users */}
                      {subscriptionUsers.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">
                          {userRole === 'subscription_manager' 
                            ? "No sub users added yet." 
                            : "No other sub users in this subscription."}
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
                                <div className="text-xs text-gray-500">Sub User</div>
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
                      {scheduledUpgrade && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-blue-800">Scheduled Upgrade</p>
                          </div>
                          <p className="text-sm text-blue-700">
                            <strong>{scheduledUpgrade.newPlan}</strong> will start on{' '}
                            <strong>{new Date(scheduledUpgrade.upgradeEffectiveDate).toLocaleDateString()}</strong>
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            ${scheduledUpgrade.newAmount} / {scheduledUpgrade.newInterval}
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

                  {/* Add Sub User Form - Only for managers and primary users */}
                  {(userRole === 'subscription_manager' || userRole === 'user') && (
                    <div className="mb-6">
                      <h5 className="font-semibold text-gray-900 mb-3">Add Sub User to Subscription</h5>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Enter sub user email address"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addUserToSubscription}
                          disabled={!newUserEmail.trim() || isAddingUser}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingUser ? "Adding..." : "Add Sub User"}
                        </button>
                      </div>
                    </div>
                  )}


                  {/* Read-only notice for sub users */}
                  {userRole === 'sub_user' && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        <p className="text-sm text-gray-600">
                          As a sub user, you can view subscription information but cannot add or remove users. 
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
                               userRole === 'user' ? 'Primary User' : 'Sub User'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">You</div>
                      </div>

                      {/* Show other users */}
                      {subscriptionUsers.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">
                          {userRole === 'subscription_manager' 
                            ? "No sub users added yet." 
                            : "No other sub users in this subscription."}
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
                                <div className="text-xs text-gray-500">Sub User</div>
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

                {/* Plan Change Section - Only show for monthly users */}
                {subscriptionData?.billingInterval !== 'year' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-blue-800">Upgrade to Annual Plan</h4>
                        <p className="mt-1 text-sm text-blue-700">
                          {subscriptionData?.cancelAtPeriodEnd 
                            ? "Reactivate your subscription by upgrading to annual billing. The annual plan will start after your current period ends."
                            : "Upgrade to annual billing and save 10%. Your annual plan will start after your current monthly period ends."
                          }
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={() => setShowPlanChangeModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            {subscriptionData?.cancelAtPeriodEnd ? "Reactivate & Upgrade to Annual" : "Upgrade to Annual Plan"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                        {subscriptionData?.cancelAtPeriodEnd 
                          ? "Your subscription is already scheduled for cancellation. You'll retain access until the end of your current billing period."
                          : "If you need to cancel your subscription, you can do so here. You'll retain access until the end of your current billing period."
                        }
                      </p>
                      <div className="mt-4">
                        {subscriptionData?.cancelAtPeriodEnd ? (
                          <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Already Cancelled
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Subscription
                          </button>
                        )}
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">Upgrade to Annual Plan</h3>
                    <button
                      onClick={() => setShowPlanChangeModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800">Scheduled Upgrade</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Your annual plan will start after your current monthly period ends. You'll continue to have access until then, and no immediate charges will occur.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {availablePlans.length > 0 ? (
                      <div className="space-y-3">
                        {availablePlans
                          .filter(plan => plan.interval === 'year') // Only show annual plans
                          .map((plan) => (
                          <div
                            key={plan.id}
                            className="border-2 border-[#012C61] bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => calculatePlanChange(plan.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-4 h-4 rounded-full border-2 border-[#012C61] bg-[#012C61]">
                                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      Annual Billing
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {plan.product.name}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900">
                                  ${(plan.amount / 100).toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">per year</div>
                                <div className="text-xs text-green-600 font-medium">Save 10%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {availablePlans.filter(plan => plan.interval === 'year').length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>No annual plans available</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#012C61] mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading plans...</p>
                      </div>
                    )}
                    
                    {planChangeError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{planChangeError}</p>
                      </div>
                    )}
                    
                    {changingPlan && (
                      <div className="mt-4 flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#012C61]"></div>
                        <span className="text-sm text-gray-600">Updating plan...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <p className="text-xs text-gray-500 text-center">
                      Changes are processed immediately with automatic proration
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Change Calculation Modal */}
            {showCalculationModal && planChangeCalculation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">Confirm Scheduled Upgrade</h3>
                    <button
                      onClick={() => setShowCalculationModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Current Plan */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Current Plan</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">{planChangeCalculation.currentPlan.name}</span>
                          <span className="font-semibold">${(planChangeCalculation.currentPlan.amount / 100).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>

                      {/* New Plan */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">New Plan</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">{planChangeCalculation.newPlan.name}</span>
                          <span className="font-semibold">${(planChangeCalculation.newPlan.amount / 100).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Calculation Details */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Scheduled Upgrade Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Days remaining in current period:</span>
                            <span className="font-medium">{planChangeCalculation.daysRemaining} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Annual plan starts on:</span>
                            <span className="font-medium">{planChangeCalculation.effectiveDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Immediate charges:</span>
                            <span className="font-medium text-green-600">$0.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Immediate refunds:</span>
                            <span className="font-medium text-green-600">$0.00</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                        <p className="text-sm text-gray-600">
                          Your annual plan will start automatically on <strong>{planChangeCalculation.effectiveDate}</strong>. 
                          You'll continue to have access until then with no immediate charges or refunds. 
                          The annual billing will begin at the end of your current monthly period.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          This is a scheduled upgrade - no immediate billing changes occur.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCalculationModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowCalculationModal(false);
                        // Find the new plan ID from availablePlans
                        const newPlanId = availablePlans.find(p => 
                          p.interval === planChangeCalculation.newPlan.interval.toLowerCase()
                        )?.id;
                        if (newPlanId) {
                          handlePlanChange(newPlanId);
                        }
                      }}
                      className="px-6 py-2 bg-[#012C61] text-white rounded-lg hover:bg-[#012C61]/90 transition-colors"
                    >
                      Schedule Annual Upgrade
                    </button>
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

        {/* Plan Change Success Message */}
        {planChangeSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  {subscriptionReactivated ? "Subscription Reactivated & Annual Upgrade Scheduled!" : "Annual Upgrade Scheduled Successfully!"}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {subscriptionReactivated 
                    ? "Your subscription has been reactivated and your annual upgrade has been scheduled. You'll continue to have access to all features."
                    : "Your annual upgrade has been scheduled successfully. The annual plan will start after your current monthly period ends."
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setPlanChangeSuccess(false);
                  setSubscriptionReactivated(false);
                }}
                className="ml-auto text-green-400 hover:text-green-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
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
  const [showAddUserConfirmation, setShowAddUserConfirmation] = useState(false);
  const [userToAdd, setUserToAdd] = useState<string>("");

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
    
    // Show confirmation dialog first
    setUserToAdd(newUserEmail.trim());
    setShowAddUserConfirmation(true);
  };

  const confirmAddUser = async () => {
    if (!userToAdd.trim()) return;
    
    setIsAddingUser(true);
    try {
      const response = await fetch("/api/subscription-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userToAdd.trim() })
      });
      
      if (response.ok) {
        setNewUserEmail("");
        setUserToAdd("");
        setShowAddUserConfirmation(false);
        
        // Show success message
        alert(`✅ Sub user ${userToAdd.trim()} has been successfully added to your subscription!`);
        
        // Refresh the subscription users list
        await fetchSubscriptionUsers();
        
        // Send email notifications
        try {
          await fetch('/api/send-user-addition-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: userToAdd.trim(),
              primaryUserEmail: auth.userEmail,
              action: 'user_added'
            })
          });
          console.log('✅ Email notifications sent successfully');
        } catch (emailError) {
          console.error('Error sending email notifications:', emailError);
          // Don't fail the user addition if emails fail
        }
        
        // Auto-refresh the page after 2 seconds to show updated user list
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        const error = await response.json();
        alert(`❌ Failed to add sub user: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("❌ Failed to add sub user. Please try again.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const cancelAddUser = () => {
    setShowAddUserConfirmation(false);
    setUserToAdd("");
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

      {/* Add Sub User Confirmation Modal */}
      {showAddUserConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add Sub User</h3>
              <button
                onClick={cancelAddUser}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Confirm User Addition</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to add <strong>{userToAdd}</strong> as a sub user for the subscription?
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h5 className="font-medium text-blue-800 mb-2">What happens next?</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The user will receive an email notification</li>
                  <li>• They'll be able to log in and access the application</li>
                  <li>• They'll have read-only access to subscription information</li>
                  <li>• You can remove them at any time from the user management section</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelAddUser}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddUser}
                  disabled={isAddingUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isAddingUser ? "Adding..." : "Add Sub User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Agreement Modal - Removed since ServiceAgreementModal was deleted */}
    </AppLayout>
  );
}
