"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  userEmail: string;
  isPrimaryUser: boolean;
  isSubUser: boolean;
  hasActiveSubscription: boolean;
  hasFormData: boolean;
  isCheckComplete: boolean;
  subscriptionData: any;
  primaryUserEmail?: string | null;
  checkStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const router = useRouter();

  const [authState, setAuthState] = useState<{
    isPrimaryUser: boolean;
    isSubUser: boolean;
    hasActiveSubscription: boolean;
    hasFormData: boolean;
    isCheckComplete: boolean;
    subscriptionData: any;
    primaryUserEmail?: string | null;
  }>({
    isPrimaryUser: false,
    isSubUser: false,
    hasActiveSubscription: false,
    hasFormData: false,
    isCheckComplete: false,
    subscriptionData: null,
    primaryUserEmail: null,
  });

  const userEmail = user?.email || "";

  const checkSubscriptionAndUserStatus = async () => {
    if (!isAuthenticated || !userEmail) {
      setAuthState(prev => ({ ...prev, isCheckComplete: true }));
      return;
    }

    console.log("🔍 AuthContext: Checking user status for:", userEmail);

    try {
      // FIRST: Check registration form to get user role
      console.log("🔍 AuthContext: Checking registration form for role...");
      const formResponse = await fetch(`/api/registrationform?email=${encodeURIComponent(userEmail)}`);
      let userRole = null;
      let hasFormData = false;
      
      if (formResponse.ok) {
        const formData = await formResponse.json();
        if (formData.data) {
          userRole = formData.data.account_role;
          hasFormData = true;
          console.log("✅ AuthContext: Found user role in registration form:", userRole);
        }
      }

      // SECOND: Check Stripe subscription
      console.log("🔍 AuthContext: Checking Stripe subscription...");
      const stripeResponse = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const stripeData = await stripeResponse.json();
      const hasActiveSubscription = stripeData.status === 'active';

      if (hasActiveSubscription) {
        console.log("✅ AuthContext: User has active Stripe subscription - GRANTED ACCESS");
        
        setAuthState({
          isPrimaryUser: true, // Treat as primary user if they have active subscription
          isSubUser: false,
          hasActiveSubscription: true,
          hasFormData: hasFormData,
          isCheckComplete: true,
          subscriptionData: stripeData
        });
        return;
      }

      // THIRD: If no Stripe subscription, check if user is a sub user
      console.log("❌ AuthContext: No active Stripe subscription found, checking if user is a sub user...");
      
      const subUserResponse = await fetch("/api/subscription-users");
      let isSubUser = false;
      let primaryUserEmail = null;
      
      if (subUserResponse.ok) {
        const subUserData = await subUserResponse.json();
        isSubUser = subUserData.isSubUser;
        primaryUserEmail = subUserData.primaryUser;
        console.log("🔍 AuthContext: Sub user check result:", { isSubUser, primaryUserEmail });
        
        // If user is a sub user, check if their primary user has an active subscription
        if (isSubUser && primaryUserEmail) {
          console.log("🔍 AuthContext: Checking primary user's subscription status...");
          const primaryUserStripeResponse = await fetch("/api/stripe/subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: primaryUserEmail }),
          });
          
          if (primaryUserStripeResponse.ok) {
            const primaryUserStripeData = await primaryUserStripeResponse.json();
            const primaryUserHasActiveSubscription = primaryUserStripeData.status === 'active';
            
            console.log("🔍 AuthContext: Primary user subscription status:", { 
              primaryUserEmail, 
              hasActiveSubscription: primaryUserHasActiveSubscription 
            });
            
            if (primaryUserHasActiveSubscription) {
              console.log("✅ AuthContext: Sub user has access through primary user's active subscription");
              setAuthState({
                isPrimaryUser: false,
                isSubUser: true,
                hasActiveSubscription: false, // Sub user doesn't have their own subscription
                hasFormData: hasFormData,
                isCheckComplete: true,
                subscriptionData: primaryUserStripeData,
                primaryUserEmail: primaryUserEmail
              });
              return;
            } else {
              console.log("❌ AuthContext: Primary user does not have active subscription");
              // Will fall through to show appropriate message
            }
          }
        }
      }

      // FINAL: Set state based on findings
      setAuthState({
        isPrimaryUser: false,
        isSubUser: isSubUser,
        hasActiveSubscription: false,
        hasFormData: hasFormData,
        isCheckComplete: true,
        subscriptionData: stripeData,
        primaryUserEmail: primaryUserEmail
      });

    } catch (error) {
      console.error("❌ AuthContext: Error during auth check:", error);
      setAuthState(prev => ({ ...prev, isCheckComplete: true }));
    }
  };

  // Run check when authentication state changes
  useEffect(() => {
    if (!isLoading) {
      checkStatus();
    }
  }, [isAuthenticated, isLoading, userEmail]);

  const checkStatus = async () => {
    await checkSubscriptionAndUserStatus();
  };

  const contextValue: AuthState = {
    isLoading: !!isLoading,
    isAuthenticated: !!isAuthenticated,
    user,
    userEmail,
    isPrimaryUser: authState.isPrimaryUser,
    isSubUser: authState.isSubUser,
    hasActiveSubscription: authState.hasActiveSubscription,
    hasFormData: authState.hasFormData,
    isCheckComplete: authState.isCheckComplete,
    subscriptionData: authState.subscriptionData,
    primaryUserEmail: authState.primaryUserEmail,
    checkStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for protected pages that need subscription access
export function useProtectedPage() {
  const auth = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && auth.isCheckComplete) {
      console.log("🔍 ProtectedPage: Auth check complete:", {
        isAuthenticated: auth.isAuthenticated,
        hasActiveSubscription: auth.hasActiveSubscription,
        isSubUser: auth.isSubUser,
        hasFormData: auth.hasFormData
      });

      if (!auth.isAuthenticated) {
        console.log("❌ ProtectedPage: Not authenticated, redirecting to login");
        router.push("/api/auth/login");
        return;
      }

      // Check if user has access (either through their own subscription OR as a sub user)
      const hasAccess = auth.hasActiveSubscription || auth.isSubUser;
      
      if (!hasAccess) {
        console.log("❌ ProtectedPage: No access (no subscription and not a sub user)");
        if (!auth.hasFormData) {
          console.log("❌ ProtectedPage: No form data, redirecting to subscribe");
          router.push("/subscribe");
        } else {
          console.log("❌ ProtectedPage: Has form data but no access, redirecting to subscribe");
          router.push("/subscribe?form_completed=1");
        }
        setShouldRedirect(true);
      } else {
        console.log("✅ ProtectedPage: Access granted -", 
          auth.hasActiveSubscription ? "Primary user with subscription" : "Sub user with access");
      }
    }
  }, [auth, router]);

  return {
    ...auth,
    shouldRedirect,
    isLoading: auth.isLoading || !auth.isCheckComplete,
  };
}
