"use client";
import AppLayout from "@/app/components/applayout";
import { useState } from "react";

export default function UpdateDatabase() {
  const [isUpdatingBillTrack, setIsUpdatingBillTrack] = useState(false);
  const [logs, setLogs] = useState<{ message: string; type: string; phase: string }[]>([]);
  const [isUpdatingProviderAlerts, setIsUpdatingProviderAlerts] = useState(false);
  const [providerLogs, setProviderLogs] = useState<{ message: string; type: string; phase: string }[]>([]);
  const [isUpdatingStatePlanAmendments, setIsUpdatingStatePlanAmendments] = useState(false);
  const [spaLogs, setSpaLogs] = useState<{ message: string; type: string; phase: string }[]>([]);
  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          Update Database
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          Here you can upload or update the rate developments database.
        </p>
        {/* Update Buttons Row */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Update Bill Track Button */}
          <div className="bg-green-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl flex-1">
            <h2 className="text-xl font-semibold text-green-900 mb-2">Update Bill Track</h2>
            <button
              onClick={async () => {
                setIsUpdatingBillTrack(true);
                setLogs([]);
                try {
                  const response = await fetch('/api/admin/update-database?type=billtrack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const result = await response.json();
                  if (result.logs) setLogs(result.logs);
                  if (result.success) {
                    alert(`✅ Success!\nInserted: ${result.insertedCount}\nUpdated: ${result.updatedCount}`);
                  } else {
                    alert(`❌ Error: ${result.error || result.message}`);
                  }
                } catch (error) {
                  setLogs([{ message: String(error), type: 'error', phase: 'network' }]);
                  alert(`❌ Network Error: ${error}`);
                } finally {
                  setIsUpdatingBillTrack(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              disabled={isUpdatingBillTrack}
            >
              {isUpdatingBillTrack ? 'Updating...' : 'Update Bill Track'}
            </button>
            {/* Logs Display */}
            {logs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Logs</h3>
                <ul className="space-y-1 text-sm">
                  {logs.map((log, idx) => (
                    <li key={idx} className={
                      log.type === 'success' ? 'text-green-700' :
                      log.type === 'error' ? 'text-red-600' :
                      'text-blue-800'
                    }>
                      <span className="font-mono">[{log.phase}]</span> {log.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Update Provider Alerts Button */}
          <div className="bg-blue-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl flex-1">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Update Provider Alerts</h2>
            <button
              onClick={async () => {
                setIsUpdatingProviderAlerts(true);
                setProviderLogs([]);
                try {
                  const response = await fetch('/api/admin/update-database?type=provider_alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const result = await response.json();
                  if (result.logs) setProviderLogs(result.logs);
                  if (result.success) {
                    alert(`✅ Success!\nInserted: ${result.insertedCount}\nUpdated: ${result.updatedCount}`);
                  } else {
                    alert(`❌ Error: ${result.error || result.message}`);
                  }
                } catch (error) {
                  setProviderLogs([{ message: String(error), type: 'error', phase: 'network' }]);
                  alert(`❌ Network Error: ${error}`);
                } finally {
                  setIsUpdatingProviderAlerts(false);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              disabled={isUpdatingProviderAlerts}
            >
              {isUpdatingProviderAlerts ? 'Updating...' : 'Update Provider Alerts'}
            </button>
            {/* Provider Alerts Logs Display */}
            {providerLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Logs</h3>
                <ul className="space-y-1 text-sm">
                  {providerLogs.map((log, idx) => (
                    <li key={idx} className={
                      log.type === 'success' ? 'text-blue-700' :
                      log.type === 'error' ? 'text-red-600' :
                      'text-blue-800'
                    }>
                      <span className="font-mono">[{log.phase}]</span> {log.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Update State Plan Amendments Button */}
          <div className="bg-purple-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl flex-1">
            <h2 className="text-xl font-semibold text-purple-900 mb-2">Update State Plan Amendments</h2>
            <button
              onClick={async () => {
                setIsUpdatingStatePlanAmendments(true);
                setSpaLogs([]);
                try {
                  const response = await fetch('/api/admin/update-database?type=state_plan_amendments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const result = await response.json();
                  if (result.logs) setSpaLogs(result.logs);
                  if (result.success) {
                    alert(`✅ Success!\nInserted: ${result.insertedCount}\nUpdated: ${result.updatedCount}`);
                  } else {
                    alert(`❌ Error: ${result.error || result.message}`);
                  }
                } catch (error) {
                  setSpaLogs([{ message: String(error), type: 'error', phase: 'network' }]);
                  alert(`❌ Network Error: ${error}`);
                } finally {
                  setIsUpdatingStatePlanAmendments(false);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition"
              disabled={isUpdatingStatePlanAmendments}
            >
              {isUpdatingStatePlanAmendments ? 'Updating...' : 'Update State Plan Amendments'}
            </button>
            {/* State Plan Amendments Logs Display */}
            {spaLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Logs</h3>
                <ul className="space-y-1 text-sm">
                  {spaLogs.map((log, idx) => (
                    <li key={idx} className={
                      log.type === 'success' ? 'text-purple-700' :
                      log.type === 'error' ? 'text-red-600' :
                      'text-purple-800'
                    }>
                      <span className="font-mono">[{log.phase}]</span> {log.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 