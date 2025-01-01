"use client";

import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Image from "next/image";

export default function ProfilePage() {
  const { getUser, isAuthenticated } = useKindeBrowserClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      setUser(getUser());
    }
  }, [isAuthenticated, getUser]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl mx-auto h-full">
          <h2 className="text-2xl font-bold mb-6 text-[#012C61]">Account Settings</h2>

          {/* Profile Picture Upload */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <Image
                src={user?.picture || "/images/default-profile.png"}
                alt="Profile Picture"
                width={80}
                height={80}
                className="rounded-full border"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Photo
                </label>
                <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                  Upload
                </button>
                <p className="text-xs text-gray-500">Accepted file type: .png, less than 1MB</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Title"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email Address"
              />
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="flex items-center justify-end mt-6 space-x-4">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
