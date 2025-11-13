"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/app/components/applayout";

interface EmailRow {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  company_name?: string;
}

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
  
  // Test email list state
  const [testEmailList, setTestEmailList] = useState<EmailRow[]>([]);
  const [testEmailSearch, setTestEmailSearch] = useState<string>("");
  const [newTestEmail, setNewTestEmail] = useState({
    email: "",
    firstname: "",
    lastname: "",
    company_name: ""
  });
  const [editingEmail, setEditingEmail] = useState<{
    table: "test_email_list";
    email: string;
    data: { email: string; firstname: string; lastname: string; company_name?: string };
  } | null>(null);
  const [loadingEmailList, setLoadingEmailList] = useState(false);

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

  // Load test email list
  useEffect(() => {
    loadEmailLists();
  }, []);

  const loadEmailLists = async () => {
    try {
      setLoadingEmailList(true);
      const response = await fetch("/api/admin/marketing-emails/list");
      
      if (!response.ok) {
        console.error("Failed to load email lists");
        setLoadingEmailList(false);
        return;
      }
      
      const json = await response.json();
      setTestEmailList(json.testEmailList || []);
      setLoadingEmailList(false);
    } catch (error) {
      console.error("Failed to load email lists:", error);
      setLoadingEmailList(false);
    }
  };

  // Search filtering
  const getFilteredTestEmails = () => {
    if (!testEmailSearch.trim()) return testEmailList;
    
    const searchTerm = testEmailSearch.toLowerCase();
    return testEmailList.filter(item => 
      item.email.toLowerCase().includes(searchTerm) ||
      item.firstname.toLowerCase().includes(searchTerm) ||
      item.lastname.toLowerCase().includes(searchTerm) ||
      (item.company_name && item.company_name.toLowerCase().includes(searchTerm))
    );
  };

  // Add email
  const handleAddEmail = async (emailData: {email: string, firstname: string, lastname: string, company_name: string}) => {
    if (!emailData.email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/admin/marketing-emails/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "test_email_list",
          email: emailData.email.trim(),
          firstname: emailData.firstname.trim(),
          lastname: emailData.lastname.trim(),
          company_name: emailData.company_name?.trim() || ""
        }),
      });

      if (response.ok) {
        await loadEmailLists();
        setNewTestEmail({ email: "", firstname: "", lastname: "", company_name: "" });
      } else {
        const errorData = await response.json();
        alert(`Failed to add email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding email:", error);
      alert("Failed to add email. Please try again.");
    }
  };

  // Delete email
  const handleDeleteEmail = async (email: string) => {
    if (!confirm(`Are you sure you want to delete ${email} from the test list?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/marketing-emails/rows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "test_email_list",
          email
        }),
      });

      if (response.ok) {
        await loadEmailLists();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting email:", error);
      alert("Failed to delete email. Please try again.");
    }
  };

  // Edit email
  const handleEditEmail = (item: EmailRow) => {
    setEditingEmail({
      table: "test_email_list",
      email: item.email,
      data: { ...item }
    });
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingEmail.data.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/admin/marketing-emails/rows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: editingEmail.table,
          email: editingEmail.data.email.trim(),
          firstname: editingEmail.data.firstname.trim(),
          lastname: editingEmail.data.lastname.trim(),
          company_name: editingEmail.data.company_name?.trim() || ""
        }),
      });

      if (response.ok) {
        await loadEmailLists();
        setEditingEmail(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to update email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating email:", error);
      alert("Failed to update email. Please try again.");
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingEmail(null);
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
              className={`px-8 py-3 rounded-md font-semibold text-sm text-white transition-all duration-200 shadow-md ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#012C61] hover:bg-[#014085] hover:shadow-lg active:scale-95'
              }`}
            >
              {loading && sendingTo === "preview" ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Preview...
                </div>
              ) : (
                'Generate Email Preview'
              )}
            </button>
            
            <button
              onClick={() => handleSendEmails("test")}
              disabled={loading}
              className={`px-8 py-3 rounded-md font-semibold text-sm text-white transition-all duration-200 shadow-md ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-95'
              }`}
            >
              {loading && sendingTo === "test" ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Test Users...
                </div>
              ) : (
                'Send to Test Users'
              )}
            </button>
            
            <button
              onClick={() => handleSendEmails("production")}
              disabled={loading}
              className={`px-8 py-3 rounded-md font-semibold text-sm text-white transition-all duration-200 shadow-md ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
              }`}
            >
              {loading && sendingTo === "production" ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to All Users...
                </div>
              ) : (
                'Send to All Users'
              )}
            </button>
          </div>
        </div>

        {/* Test Email List Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#012C61] mb-4">
            Test Email List ({testEmailSearch ? `${getFilteredTestEmails().length}/${testEmailList.length}` : testEmailList.length} emails)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            These emails will receive alerts when you click "Send to Test Users". Click on any field to edit.
          </p>
          
          {/* Add New Email Form */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-blue-800 mb-3">➕ Add New Test Email</h5>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="email"
                placeholder="Enter email address"
                className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTestEmail.email}
                onChange={(e) => setNewTestEmail({...newTestEmail, email: e.target.value})}
              />
              <input
                type="text"
                placeholder="First name"
                className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTestEmail.firstname}
                onChange={(e) => setNewTestEmail({...newTestEmail, firstname: e.target.value})}
              />
              <input
                type="text"
                placeholder="Last name"
                className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTestEmail.lastname}
                onChange={(e) => setNewTestEmail({...newTestEmail, lastname: e.target.value})}
              />
              <input
                type="text"
                placeholder="Company name"
                className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTestEmail.company_name}
                onChange={(e) => setNewTestEmail({...newTestEmail, company_name: e.target.value})}
              />
              <button
                onClick={() => handleAddEmail(newTestEmail)}
                disabled={!newTestEmail.email}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  newTestEmail.email
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Add Email
              </button>
            </div>
          </div>

          {/* Search Test Email List */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search test emails by email, first name, last name, or company name..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={testEmailSearch}
                onChange={(e) => setTestEmailSearch(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {testEmailSearch && (
                <button
                  onClick={() => setTestEmailSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {testEmailSearch && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {getFilteredTestEmails().length} of {testEmailList.length} test emails
              </div>
            )}
          </div>

          {/* Test Email List Table */}
          {loadingEmailList ? (
            <div className="flex flex-col justify-center items-center h-32 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 mt-2">Loading email list...</span>
            </div>
          ) : (
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredTestEmails().map((item) => (
                  <tr key={item.email} className="hover:bg-gray-50">
                    {editingEmail?.table === "test_email_list" && editingEmail?.email === item.email ? (
                      // Edit mode
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="email"
                            value={editingEmail.data.email}
                            onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, email: e.target.value}})}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingEmail.data.firstname}
                            onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, firstname: e.target.value}})}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingEmail.data.lastname}
                            onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, lastname: e.target.value}})}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingEmail.data.company_name || ""}
                            onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, company_name: e.target.value}})}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail(item)}>{item.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail(item)}>{item.firstname}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail(item)}>{item.lastname}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail(item)}>{item.company_name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditEmail(item)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmail(item.email)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {getFilteredTestEmails().length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {testEmailSearch ? `No test emails found matching "${testEmailSearch}"` : "No test emails yet. Add one using the form above."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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

        {/* Summary Card - Only show when emails were actually sent (not preview) */}
        {summary && !previewHtml && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Email Sent Summary</h3>
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
                  ? "Email preview generated successfully. No emails have been sent yet." 
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