"use client";

import { ReactNode, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useKindeBrowserClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page if the user is not authenticated
      window.location.href = "/api/auth/login"; // Same as used in Navbar
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    // Show a loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Prevent rendering children while redirecting
    return null;
  }

  return <>{children}</>;
}
