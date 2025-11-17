"use client";

import { useState, useEffect } from "react";
import { useRequireSubscription } from "@/hooks/useRequireAuth";
import SubscriptionTermsModal from "@/app/components/SubscriptionTermsModal";

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

interface WireTransferSubscriptionData {
  userEmail: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  status: string;
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

export default function ManageSubscription() {
  const auth = useRequireSubscription();
  const [isSubUser, setIsSubUser] = useState(false);
  const [primaryUserEmail, setPrimaryUserEmail] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [wireTransferData, setWireTransferData] = useState<WireTransferSubscriptionData | null>(null);
  const [isWireTransferUser, setIsWireTransferUser] = useState(false);
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

  const checkWireTransferSubscription = async () => {
    try {
      const response = await fetch("/api/wire-transfer-subscriptions");
      if (response.ok) {
        const data = await response.json();
        if (data.isWireTransferUser) {
          setIsWireTransferUser(true);
          setWireTransferData(data.wireTransferData);
          console.log("✅ User is a wire transfer user:", data.wireTransferData);
          return true; // User is wire transfer, don't fetch Stripe data
        }
      }
    } catch (error) {
      console.error("Error checking wire transfer subscription:", error);
    }
    return false; // User is not transferred, proceed with Stripe
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

  const handlePlanChange = async () => {
    if (!planChangeCalculation) return;
    
    setChangingPlan(true);
    setPlanChangeError(null);
    
    try {
      const response = await fetch("/api/stripe/modify-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.userEmail,
          newPriceId: availablePlans.find(p => p.interval === 'year')?.id
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
      setPlanChangeError(err instanceof Error ? err.message : "Failed to change plan");
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
      // First check if user is in wire transfer subscriptions
      const isWireTransfer = await checkWireTransferSubscription();
      if (isWireTransfer) {
        setLoading(false);
        return; // Don't fetch Stripe data for wire transfer users
      }

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
            // User is primary user or subscription manager, fetch their own subscription
            await fetchSubscriptionData(auth.userEmail);
          }
        }
      } catch (error) {
        console.error("Error checking sub-user status:", error);
        // Fallback: try to fetch subscription for current user
        await fetchSubscriptionData(auth.userEmail);
      } finally {
        setLoading(false);
      }
    };

    checkSubUserStatusAndFetchSubscription();
    fetchAvailablePlans();
  }, [auth.isAuthenticated, auth.userEmail]);

  const handleCancelSubscription = async () => {
    setCanceling(true);
    setCancelError(null);
    
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.userEmail
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscription Management</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              View your subscription details and manage your account settings
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                {isWireTransferUser && wireTransferData ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Transferred Subscription Details</h3>
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-blue-700 capitalize">{wireTransferData.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      {/* Transfer Info Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">Transferred Access</h4>
                          <div className="text-sm text-gray-600 mb-2">
                            User Email: <span className="font-medium">{wireTransferData.userEmail}</span>
                          </div>
                          <p className="text-xs text-gray-500">You have access through a transferred subscription</p>
                        </div>
                      </div>

                      {/* Subscription Dates */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Subscription Period</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                            <p className="font-medium text-gray-900">{new Date(wireTransferData.subscriptionStartDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">End Date</p>
                            <p className="font-medium text-gray-900">
                              {wireTransferData.subscriptionEndDate 
                                ? new Date(wireTransferData.subscriptionEndDate).toLocaleDateString()
                                : 'No end date'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Transfer Date</p>
                            <p className="font-medium text-gray-900">N/A</p>
                          </div>
                        </div>
                      </div>

                      {/* Status Info */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Access Status</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium text-gray-900 capitalize">{wireTransferData.status}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Access Type</p>
                            <p className="font-medium text-gray-900">Transferred User</p>
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">
                              📋 You have read-only access to subscription information
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Note about transferred subscription */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Transferred Subscription</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            You are accessing MediRate through a wire transfer subscription. 
                            Contact support for any subscription changes or billing questions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : subscriptionData && subscriptionData.plan ? (
                  <>
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
                  </>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Data</h3>
                    <p className="text-gray-600 mb-4">Unable to retrieve subscription information at this time.</p>
                    {error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">
                          <strong>Error:</strong> {error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular user view (primary user or subscription manager)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscription Management</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your subscription, billing, and account settings
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                    <p className="text-gray-600">{auth.userEmail}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Type</label>
                  <div className="mt-2">
                    <p className="text-lg font-medium text-gray-900">Primary Account</p>
                    <p className="text-gray-600">Full Access</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="border-t border-gray-200 pt-8">
              {isWireTransferUser && wireTransferData ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Transferred Subscription Details</h3>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-blue-700 capitalize">{wireTransferData.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Transfer Info Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Transferred Access</h4>
                        <div className="text-sm text-gray-600 mb-2">
                          User Email: <span className="font-medium">{wireTransferData.userEmail}</span>
                        </div>
                        <p className="text-xs text-gray-500">You have access through a transferred subscription</p>
                      </div>
                    </div>

                    {/* Subscription Dates */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Subscription Period</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="font-medium text-gray-900">{new Date(wireTransferData.subscriptionStartDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Date</p>
                          <p className="font-medium text-gray-900">
                            {wireTransferData.subscriptionEndDate 
                              ? new Date(wireTransferData.subscriptionEndDate).toLocaleDateString()
                              : 'No end date'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Transfer Date</p>
                          <p className="font-medium text-gray-900">N/A</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Access Status</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="font-medium text-gray-900 capitalize">{wireTransferData.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Access Type</p>
                          <p className="font-medium text-gray-900">Transferred User</p>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">
                            📋 You have read-only access to subscription information
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note about transferred subscription */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Transferred Subscription</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          You are accessing MediRate through a wire transfer subscription. 
                          Contact support for any subscription changes or billing questions.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : subscriptionData && subscriptionData.plan ? (
                <>
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
                            <button
                              disabled
                              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Already Cancelled
                            </button>
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
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Data</h3>
                  <p className="text-gray-600 mb-4">Unable to retrieve subscription information at this time.</p>
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">
                        <strong>Error:</strong> {error}
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                  </div>
                  <div className="flex space-x-3 px-4 py-3">
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
                  {cancelError && (
                    <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{cancelError}</p>
                    </div>
                  )}
                </div>
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

                <div className="space-y-4">
                  {availablePlans.filter(plan => plan.interval === 'year').map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{plan.product.name}</h4>
                          <p className="text-sm text-gray-600">Annual billing</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">${plan.amount / 100}</p>
                          <p className="text-sm text-gray-600">per year</p>
                        </div>
                      </div>
                      <button
                        onClick={() => calculatePlanChange(plan.id)}
                        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Select Annual Plan
                      </button>
                    </div>
                  ))}
                </div>

                {planChangeError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{planChangeError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plan Change Calculation Modal */}
        {showCalculationModal && planChangeCalculation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
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
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Scheduled Upgrade Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Days remaining in current period:</span>
                      <span className="text-sm font-medium text-gray-900">{planChangeCalculation.daysRemaining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Annual plan starts on:</span>
                      <span className="text-sm font-medium text-gray-900">{planChangeCalculation.effectiveDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Immediate charges:</span>
                      <span className="text-sm font-medium text-gray-900">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Immediate refunds:</span>
                      <span className="text-sm font-medium text-gray-900">$0.00</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    Your annual plan will start automatically on <strong>{planChangeCalculation.effectiveDate}</strong>. 
                    You'll continue to have access until then with no immediate charges or refunds. 
                    The annual billing will begin at the end of your current monthly period.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This is a scheduled upgrade - no immediate billing changes occur.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCalculationModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlanChange}
                    disabled={changingPlan}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {changingPlan ? "Scheduling..." : "Schedule Annual Upgrade"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
