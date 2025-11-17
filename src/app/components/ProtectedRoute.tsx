"use client";

import { ReactNode } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useRequireAuth();

  // Check if we should show loading spinner
  if (auth.isLoading || !auth.isCheckComplete) {
    // Show a loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // If auth check is complete and user is not authenticated, useRequireAuth will handle redirect
  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return <>{children}</>;
}
