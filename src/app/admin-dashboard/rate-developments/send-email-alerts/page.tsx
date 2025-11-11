"use client";
import { useState } from "react";
import AppLayout from "@/app/components/applayout";

export default function SendEmailAlertsPage() {
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<"test" | "production" | "preview" | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<{
    emailsSent: number;
    usersWithAlerts: number;
    totalUsers: number;
  } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    setSendingTo("preview");
    setLoading(true);
    setLogs([]);
    setSuccess(null);
    setSummary(null);
    setPreviewHtml(null);
    setPreviewSubject(null);
    setPreviewUser(null);
    
    try {
      const response = await fetch("/api/admin/send-email-alerts", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview" })
      });
      const data = await response.json();
      
      setLogs(data.logs || []);
      setSuccess(data.success);
      
      if (data.success && data.mode === 'preview' && data.previewHtml) {
        setPreviewHtml(data.previewHtml);
        setPreviewSubject(data.previewSubject);
        setPreviewUser(data.previewUser);
      }
    } catch (error: any) {
      setLogs([`❌ Error: ${error.message}`]);
      setSuccess(false);
    } finally {
      setLoading(false);
      setSendingTo(null);
    }
  };

  const handleSendEmails = async (mode: "test" | "production") => {
    setSendingTo(mode);
    setLoading(true);
    setLogs([]);
    setSuccess(null);
    setSummary(null);
    
    try {
      const response = await fetch("/api/admin/send-email-alerts", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      const data = await response.json();
      
      setLogs(data.logs || []);
      setSuccess(data.success);
      
      if (data.success) {
        setSummary({
          emailsSent: data.emailsSent || 0,
          usersWithAlerts: data.usersWithAlerts || 0,
          totalUsers: data.totalUsers || 0
        });
      }
    } catch (error: any) {
      setLogs([`❌ Error: ${error.message}`]);
      setSuccess(false);
    } finally {
      setLoading(false);
      setSendingTo(null);
    }
  };

  return (
    <AppLayout activeTab="adminDashboard">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          Send Email Notifications
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <p className="text-gray-700 mb-4">
            This will send personalized email notifications to users based on their preferences 
            and the new alerts (is_new = 'yes') in the database.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleGeneratePreview}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transform hover:scale-105'
              }`}
            >
              {loading && sendingTo === "preview" ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Preview...
                </div>
              ) : (
                '👁️ Generate Email Preview'
              )}
            </button>
            
            <button
              onClick={() => handleSendEmails("test")}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transform hover:scale-105'
              }`}
            >
              {loading && sendingTo === "test" ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Test Users...
                </div>
              ) : (
                '📧 Send to Test Users'
              )}
            </button>
            
            <button
              onClick={() => handleSendEmails("production")}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105'
              }`}
            >
              {loading && sendingTo === "production" ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to All Users...
                </div>
              ) : (
                '📢 Send to All Users'
              )}
            </button>
          </div>
        </div>

        {/* Email Preview Section */}
        {previewHtml && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#012C61] mb-4 flex items-center">
              👁️ Email Preview
              {previewUser && (
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  (Sample for: {previewUser})
                </span>
              )}
            </h2>
            {previewSubject && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-semibold text-blue-800 mb-1">Subject Line:</div>
                <div className="text-blue-900">{previewSubject}</div>
              </div>
            )}
            <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-lg">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Email Preview</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="p-8 min-h-[500px] overflow-auto">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {summary && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Email Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalUsers}</div>
                <div className="text-sm text-green-700">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.usersWithAlerts}</div>
                <div className="text-sm text-blue-700">Users with Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.emailsSent}</div>
                <div className="text-sm text-purple-700">Emails Sent</div>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {success === true && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-600 mr-2">✅</div>
              <span className="text-green-800 font-semibold">
                {previewHtml 
                  ? "Email preview generated successfully! No emails were sent." 
                  : "Email notifications sent successfully!"}
              </span>
            </div>
          </div>
        )}
        
        {success === false && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">❌</div>
              <span className="text-red-800 font-semibold">
                Error sending email notifications.
              </span>
            </div>
          </div>
        )}

        {/* Logs Section */}
        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#012C61] mb-4 flex items-center">
              📝 Processing Logs
              <span className="ml-2 text-sm text-gray-500">({logs.length} entries)</span>
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto font-mono text-sm">
              {/* Group logs by user (look for lines starting with '👤') */}
              {(() => {
                const userSections: { user: string; logs: string[] }[] = [];
                let currentUser: string | null = null;
                let currentLogs: string[] = [];
                logs.forEach((log: string, idx: number) => {
                  if (log.startsWith('👤')) {
                    if (currentUser) {
                      userSections.push({ user: currentUser, logs: currentLogs });
                    }
                    currentUser = log;
                    currentLogs = [];
                  } else if (currentUser) {
                    currentLogs.push(log);
                  }
                });
                if (currentUser) {
                  userSections.push({ user: currentUser, logs: currentLogs });
                }
                if (userSections.length === 0) {
                  // fallback: show all logs as before
                  return logs.map((log: string, index: number) => <div key={index}>{log}</div>);
                }
                return userSections.map((section, idx) => (
                  <details key={idx} className="mb-4 border-b border-gray-200" open={idx === 0}>
                    <summary className="cursor-pointer font-semibold text-blue-900 py-2">
                      {section.user.replace('👤', '').trim()}
                    </summary>
                    <div className="pl-4">
                      {section.logs.map((log, i) => {
                        if (log.startsWith('ℹ️ Alerts for')) {
                          return <div key={i} className="mt-2 mb-1 text-blue-700 font-bold">{log.replace('ℹ️ ', '')}</div>;
                        }
                        if (log.startsWith('✅')) {
                          return <div key={i} className="text-green-700 font-semibold">{log}</div>;
                        }
                        if (log.startsWith('❌')) {
                          return <div key={i} className="text-red-700 font-semibold">{log}</div>;
                        }
                        if (log.includes('Relevant')) {
                          return <div key={i} className="text-green-600 ml-2">{log}</div>;
                        }
                        if (log.includes('Not relevant')) {
                          return <div key={i} className="text-gray-500 ml-2">{log}</div>;
                        }
                        if (log.startsWith('⚠️')) {
                          return <div key={i} className="text-yellow-700 font-semibold">{log}</div>;
                        }
                        if (log.startsWith('ℹ️')) {
                          return <div key={i} className="text-blue-700">{log}</div>;
                        }
                        return <div key={i} className="ml-2">{log}</div>;
                      })}
                    </div>
                  </details>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 