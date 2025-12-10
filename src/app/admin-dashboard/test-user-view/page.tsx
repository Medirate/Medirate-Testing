"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaSpinner, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";

function TestUserViewContent() {
  const searchParams = useSearchParams();
  const [testEmail, setTestEmail] = useState(searchParams?.get("email") || "csegner@blueprinthcre.com");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [dataResults, setDataResults] = useState<any>(null);

  const runTest = async () => {
    setLoading(true);
    setResults(null);
    setDataResults(null);

    try {
      // Step 1: Check user access status
      const accessResponse = await fetch(`/api/test-user-access?email=${encodeURIComponent(testEmail)}`);
      const accessData = await accessResponse.json();
      setResults(accessData);

      // Step 2: If user has access, fetch the actual data (simulating what the page does)
      if (accessData.canSeeData) {
        console.log("✅ User has access, fetching data...");
        
        const data: any = {
          providerAlerts: null,
          bills: null,
          statePlanAmendments: null,
        };

        // Fetch Provider Alerts
        const { data: providerAlerts, error: providerError } = await supabase
          .from("provider_alerts")
          .select("*")
          .order("announcement_date", { ascending: false })
          .limit(100);

        data.providerAlerts = {
          data: providerAlerts,
          error: providerError,
          count: providerAlerts?.length || 0,
        };

        // Fetch Bills
        const { data: bills, error: billsError } = await supabase
          .from("bill_track_50")
          .select("*")
          .limit(100);

        data.bills = {
          data: bills,
          error: billsError,
          count: bills?.length || 0,
        };

        // Fetch State Plan Amendments
        const { data: spa, error: spaError } = await supabase
          .from("state_plan_amendments")
          .select("*")
          .limit(100);

        data.statePlanAmendments = {
          data: spa,
          error: spaError,
          count: spa?.length || 0,
        };

        setDataResults(data);
      }
    } catch (error) {
      console.error("Error running test:", error);
      setResults({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testEmail) {
      runTest();
    }
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#012C61] mb-6">Test User View - Simulate User Experience</h1>

      {/* Email Input */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test User Email:
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter user email to test"
          />
          <button
            onClick={runTest}
            disabled={loading || !testEmail}
            className="px-6 py-2 bg-[#012C61] text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? <FaSpinner className="animate-spin" /> : "Run Test"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Testing user access and fetching data...</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Access Check Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#012C61] mb-4">Access Check Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Final Access Decision</div>
                <div className="text-lg font-semibold text-[#012C61]">
                  {results.finalAccessDecision || "Unknown"}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Can See Data?</div>
                <div className={`text-lg font-semibold ${results.canSeeData ? "text-green-600" : "text-red-600"}`}>
                  {results.canSeeData ? "✅ YES" : "❌ NO"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="font-medium text-blue-900 mb-1">Admin Status</div>
                <div className="text-sm text-blue-700">
                  {results.accessChecks?.isAdmin?.result ? "✅ Is Admin" : "❌ Not Admin"}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="font-medium text-blue-900 mb-1">Stripe Subscription</div>
                <div className="text-sm text-blue-700">
                  {results.accessChecks?.stripeSubscription?.result
                    ? `✅ Active (${results.accessChecks.stripeSubscription.status})`
                    : `❌ ${results.accessChecks?.stripeSubscription?.status || "No subscription"}`}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="font-medium text-blue-900 mb-1">Sub-User Status</div>
                <div className="text-sm text-blue-700">
                  {results.accessChecks?.isSubUser?.result ? (
                    <>
                      ✅ Is Sub-User under {results.accessChecks.isSubUser.primaryUserEmail}
                      <br />
                      {results.accessChecks?.primaryUserSubscription?.hasAccess
                        ? "✅ Primary user has active subscription"
                        : "❌ Primary user has no active subscription"}
                    </>
                  ) : (
                    "❌ Not a Sub-User"
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="font-medium text-blue-900 mb-1">Wire Transfer Subscription</div>
                <div className="text-sm text-blue-700">
                  {results.accessChecks?.wireTransferSubscription?.result
                    ? "✅ Has Wire Transfer Subscription"
                    : "❌ No Wire Transfer Subscription"}
                </div>
              </div>
            </div>
          </div>

          {/* Data Access Results */}
          {results.dataAccess && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-[#012C61] mb-4">RLS Data Access Test</h2>
              
              <div className="space-y-4">
                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Provider Alerts</span>
                    {results.dataAccess.providerAlerts?.canAccess ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaExclamationCircle className="text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.dataAccess.providerAlerts?.canAccess
                      ? `✅ Can access (${results.dataAccess.providerAlerts.rowCount} rows)`
                      : `❌ Cannot access: ${results.dataAccess.providerAlerts?.error}`}
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Bill Track 50</span>
                    {results.dataAccess.billTrack50?.canAccess ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaExclamationCircle className="text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.dataAccess.billTrack50?.canAccess
                      ? `✅ Can access (${results.dataAccess.billTrack50.rowCount} rows)`
                      : `❌ Cannot access: ${results.dataAccess.billTrack50?.error}`}
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">State Plan Amendments</span>
                    {results.dataAccess.statePlanAmendments?.canAccess ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaExclamationCircle className="text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.dataAccess.statePlanAmendments?.canAccess
                      ? `✅ Can access (${results.dataAccess.statePlanAmendments.rowCount} rows)`
                      : `❌ Cannot access: ${results.dataAccess.statePlanAmendments?.error}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actual Data Results */}
          {dataResults && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-[#012C61] mb-4">
                Actual Data That Would Be Displayed
              </h2>

              <div className="space-y-6">
                {/* Provider Alerts */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Provider Alerts{" "}
                    {dataResults.providerAlerts?.error ? (
                      <span className="text-red-600 text-sm">
                        (Error: {dataResults.providerAlerts.error.message})
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        ({dataResults.providerAlerts?.count || 0} rows)
                      </span>
                    )}
                  </h3>
                  {dataResults.providerAlerts?.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-700">
                        ❌ Error: {dataResults.providerAlerts.error.message}
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        Code: {dataResults.providerAlerts.error.code}
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              State
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Subject
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(dataResults.providerAlerts?.data || []).slice(0, 10).map((alert: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">{alert.state || "N/A"}</td>
                              <td className="px-4 py-2 text-sm">
                                {alert.subject?.substring(0, 60) || "N/A"}...
                              </td>
                              <td className="px-4 py-2 text-sm">{alert.announcement_date || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {dataResults.providerAlerts?.count > 10 && (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          ... and {dataResults.providerAlerts.count - 10} more rows
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bills */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Legislative Updates (Bill Track 50){" "}
                    {dataResults.bills?.error ? (
                      <span className="text-red-600 text-sm">
                        (Error: {dataResults.bills.error.message})
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        ({dataResults.bills?.count || 0} rows)
                      </span>
                    )}
                  </h3>
                  {dataResults.bills?.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-700">
                        ❌ Error: {dataResults.bills.error.message}
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        Code: {dataResults.bills.error.code}
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              State
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Bill Number
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(dataResults.bills?.data || []).slice(0, 10).map((bill: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">{bill.state || "N/A"}</td>
                              <td className="px-4 py-2 text-sm">{bill.bill_number || "N/A"}</td>
                              <td className="px-4 py-2 text-sm">
                                {bill.name?.substring(0, 60) || "N/A"}...
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {dataResults.bills?.count > 10 && (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          ... and {dataResults.bills.count - 10} more rows
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* State Plan Amendments */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    State Plan Amendments{" "}
                    {dataResults.statePlanAmendments?.error ? (
                      <span className="text-red-600 text-sm">
                        (Error: {dataResults.statePlanAmendments.error.message})
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        ({dataResults.statePlanAmendments?.count || 0} rows)
                      </span>
                    )}
                  </h3>
                  {dataResults.statePlanAmendments?.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-700">
                        ❌ Error: {dataResults.statePlanAmendments.error.message}
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        Code: {dataResults.statePlanAmendments.error.code}
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              State
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Subject
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Transmittal Number
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(dataResults.statePlanAmendments?.data || []).slice(0, 10).map((spa: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">{spa.state || "N/A"}</td>
                              <td className="px-4 py-2 text-sm">
                                {spa.subject?.substring(0, 60) || "N/A"}...
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {spa["Transmittal Number"] || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {dataResults.statePlanAmendments?.count > 10 && (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          ... and {dataResults.statePlanAmendments.count - 10} more rows
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestUserView() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    }>
      <TestUserViewContent />
    </Suspense>
  );
}

