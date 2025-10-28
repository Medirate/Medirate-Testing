"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/components/applayout";
import { useAuth } from "@/context/AuthContext";
import { useSubscriptionManagerRedirect } from "@/hooks/useSubscriptionManagerRedirect";

export default function EmailPreferencesPage() {
  const auth = useAuth();
  const { isSubscriptionManager, isChecking } = useSubscriptionManagerRedirect();
  const router = useRouter();

  // State for email preferences
  const [preferences, setPreferences] = useState<{ id: number | null; states: string[]; categories: string[] }>({ 
    id: null, 
    states: [], 
    categories: [] 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Show loading while checking authentication
  if (auth.isLoading || !auth.isCheckComplete) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!auth.isAuthenticated) {
    router.push("/api/auth/login");
    return null;
  }

  // Check if user has access (either through their own subscription OR as a sub user)
  const hasAccess = auth.hasActiveSubscription || auth.isSubUser;
  
  if (!hasAccess) {
    router.push("/subscribe");
    return null;
  }

  // Show loading while checking role
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // If subscription manager, they'll be redirected by the hook
  if (isSubscriptionManager) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // Load email preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch(`/api/user/email-preferences?email=${encodeURIComponent(auth.userEmail)}`);
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences || { states: [], categories: [] });
        }
      } catch (error) {
        console.error('Error loading email preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    if (auth.userEmail) {
      loadPreferences();
    }
  }, [auth.userEmail]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/email-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: preferences.id,
          preferences: preferences
        })
      });

      if (response.ok) {
        alert('Email preferences saved successfully!');
      } else {
        alert('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout activeTab="emailPreferences">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="emailPreferences">
      <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-8 text-center">
        Email Preferences
      </h1>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Alert Preferences</h3>
              <p className="text-gray-600 mb-6">
                Configure which states and categories you want to receive email alerts for.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* States Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  States to Monitor
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'].map(state => (
                    <label key={state} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.states.includes(state)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences(prev => ({
                              ...prev,
                              states: [...prev.states, state]
                            }));
                          } else {
                            setPreferences(prev => ({
                              ...prev,
                              states: prev.states.filter(s => s !== state)
                            }));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Categories
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {['ABA Services', 'Behavioral Health', 'Billing Manuals', 'IDD Services', 'Provider Alerts', 'Legislative Updates'].map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences(prev => ({
                              ...prev,
                              categories: [...prev.categories, category]
                            }));
                          } else {
                            setPreferences(prev => ({
                              ...prev,
                              categories: prev.categories.filter(c => c !== category)
                            }));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}