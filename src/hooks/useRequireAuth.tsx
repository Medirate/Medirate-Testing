"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && auth.isCheckComplete && !auth.isAuthenticated) {
      console.log("🔒 Redirecting to login - user not authenticated");
      router.push("/api/auth/login");
    }
  }, [auth.isLoading, auth.isCheckComplete, auth.isAuthenticated, router]);

  return auth;
}

export function useRequireSubscription() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && auth.isCheckComplete) {
      if (!auth.isAuthenticated) {
        console.log("🔒 Redirecting to login - user not authenticated");
        router.push("/api/auth/login");
        return;
      }

      // Include wire transfer users in access check
      const hasAccess = auth.isPrimaryUser || auth.isSubUser || auth.hasActiveSubscription || auth.isWireTransferUser;
      
      if (!hasAccess) {
        console.log("🔒 Redirecting to subscribe - no subscription access");
        if (!auth.hasFormData) {
          router.push("/subscribe");
        } else {
          router.push("/subscribe?form_completed=1");
        }
      }
    }
  }, [auth, router]);

  return {
    ...auth,
    hasAccess: auth.isPrimaryUser || auth.isSubUser || auth.hasActiveSubscription || auth.isWireTransferUser,
    isLoading: auth.isLoading || !auth.isCheckComplete,
    shouldRedirect: !auth.isLoading && auth.isCheckComplete && !auth.isAuthenticated,
  };
}
