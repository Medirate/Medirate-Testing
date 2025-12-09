"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/components/applayout";
import { FaShieldAlt } from 'react-icons/fa';

interface AdminUser {
  id: number;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const auth = useRequireAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingBillTrack, setIsUpdatingBillTrack] = useState(false);

  // Check if user is admin
  const checkAdminAccess = async () => {
    const userEmail = auth.userEmail ?? "";
    if (!userEmail) return;

    try {
      setLoading(true);
      setError(null);

      // Use admin API endpoint to bypass RLS
      const response = await fetch('/api/admin/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to check admin access');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data.isAdmin);
        setAdminUser(data.adminUser);
      }

      // Remove isAdminCheckComplete state since centralized auth handles this
    } catch (error) {
      setError("Failed to verify admin access");
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Check admin access once auth is ready
  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading && auth.userEmail) {
      checkAdminAccess();
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.userEmail]);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin && auth.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, auth.isAuthenticated, router]);

  if (auth.isLoading || loading) {
    return (
      <div className="loader-overlay">
        <div className="cssloader">
          <div className="sh1"></div>
          <div className="sh2"></div>
          <h4 className="lt">loading</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AppLayout activeTab="adminDashboard">
        <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Format date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <FaShieldAlt className="h-8 w-8 text-[#012C61] mr-3" />
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
            Admin Dashboard
          </h1>
        </div>

        {/* Admin Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-medium text-gray-900">{adminUser?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-lg font-medium text-gray-900">{adminUser?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admin Since</p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(adminUser?.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(adminUser?.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Rate Developments Card */}
        <div
          className="bg-blue-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl cursor-pointer hover:bg-blue-100 transition"
          onClick={() => router.push("/admin-dashboard/rate-developments")}
        >
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Rate Developments</h2>
          <p className="text-gray-700">Administer, update, and send alerts for rate developments.</p>
        </div>

        {/* Marketing Emails Card */}
        <div
          className="bg-pink-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl cursor-pointer hover:bg-pink-100 transition"
          onClick={() => router.push("/admin-dashboard/marketing-emails")}
        >
          <h2 className="text-xl font-semibold text-pink-900 mb-2">Marketing Emails</h2>
          <p className="text-gray-700">Create and manage marketing campaigns with AI-powered templates.</p>
        </div>

        {/* Document Library Card */}
        <div
          className="bg-green-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl cursor-pointer hover:bg-green-100 transition"
          onClick={() => router.push("/admin-dashboard/document-library")}
        >
          <h2 className="text-xl font-semibold text-green-900 mb-2">Document Library</h2>
          <p className="text-gray-700">Manage documents, folders, and files with cut/copy/paste functionality.</p>
        </div>

      </div>
    </AppLayout>
  );
} 