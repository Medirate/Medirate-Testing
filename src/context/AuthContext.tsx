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
  }>({
    isPrimaryUser: false,
    isSubUser: false,
    hasActiveSubscription: false,
    hasFormData: false,
    isCheckComplete: false,
    subscriptionData: null,
  });

  const userEmail = user?.email || "";

  const checkSubscriptionAndUserStatus = async () => {
    if (!isAuthenticated || !userEmail) {
      setAuthState(prev => ({ ...prev, isCheckComplete: true }));
      return;
    }

    console.log("🔍 AuthContext: Checking Stripe subscription for:", userEmail);

    try {
      // SIMPLIFIED: Only check Stripe subscription status for the logged-in email
      console.log("🔍 AuthContext: Making Stripe API call to /api/stripe/subscription");
      const stripeResponse = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      console.log("🔍 AuthContext: Stripe API response status:", stripeResponse.status);
      console.log("🔍 AuthContext: Stripe API response headers:", stripeResponse.headers);
      
      const stripeData = await stripeResponse.json();
      console.log("🔍 AuthContext: Stripe response:", stripeData);
      console.log("🔍 AuthContext: Stripe response type:", typeof stripeData);
      console.log("🔍 AuthContext: Stripe response keys:", Object.keys(stripeData));

      const hasActiveSubscription = stripeData.status === 'active';

      if (hasActiveSubscription) {
        console.log("✅ AuthContext: User has active Stripe subscription - GRANTED ACCESS");
        
        // Check for first-time login and send welcome email
        await checkAndSendFirstLoginWelcome(userEmail);
        
        setAuthState({
          isPrimaryUser: true, // Treat as primary user if they have active subscription
          isSubUser: false,
          hasActiveSubscription: true,
          hasFormData: true,
          isCheckComplete: true,
          subscriptionData: stripeData
        });
        return;
      }

      // No active subscription found
      console.log("❌ AuthContext: No active Stripe subscription found");
      
      // Check if they have form data (for better redirect UX)
      const formResponse = await fetch(`/api/registrationform?email=${encodeURIComponent(userEmail)}`);
      const hasFormData = formResponse.ok && (await formResponse.json()).data;

      setAuthState({
        isPrimaryUser: false,
        isSubUser: false,
        hasActiveSubscription: false,
        hasFormData: !!hasFormData,
        isCheckComplete: true,
        subscriptionData: stripeData
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
    checkStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ **Check and Send First Login Welcome Email**
async function checkAndSendFirstLoginWelcome(userEmail: string) {
  try {
    // Check if this is the user's first login by looking at their login history
    const response = await fetch('/api/user', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const userData = await response.json();
      
      // Check if user has never logged in before (no LastSignedIn or TotalSignIns is 0)
      if (userData.user && (!userData.user.LastSignedIn || userData.user.TotalSignIns === 0)) {
        console.log(`🎉 First login detected for: ${userEmail}`);
        
        // Send first login welcome email
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            firstName: userData.user.FirstName,
            lastName: userData.user.LastName,
            isFirstLogin: true
          })
        });
        
        console.log(`📧 First login welcome email sent to: ${userEmail}`);
      }
    }
  } catch (error) {
    console.error('Error checking first login:', error);
    // Don't fail the auth process if this fails
  }
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
        hasFormData: auth.hasFormData
      });

      if (!auth.isAuthenticated) {
        console.log("❌ ProtectedPage: Not authenticated, redirecting to login");
        router.push("/api/auth/login");
        return;
      }

      // SIMPLIFIED: Only check if they have active Stripe subscription
      if (!auth.hasActiveSubscription) {
        console.log("❌ ProtectedPage: No active Stripe subscription");
        if (!auth.hasFormData) {
          console.log("❌ ProtectedPage: No form data, redirecting to subscribe");
          router.push("/subscribe");
        } else {
          console.log("❌ ProtectedPage: Has form data but no subscription, redirecting to subscribe");
          router.push("/subscribe?form_completed=1");
        }
        setShouldRedirect(true);
      } else {
        console.log("✅ ProtectedPage: Active subscription found - ACCESS GRANTED");
      }
    }
  }, [auth, router]);

  return {
    ...auth,
    shouldRedirect,
    isLoading: auth.isLoading || !auth.isCheckComplete,
  };
}
