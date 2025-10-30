"use client";

import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import AppLayout from "@/app/components/applayout";
import EChartsWrapper from "@/components/EChartsWrapper";
import type { EChartsOption } from "echarts";

interface EmailRow {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  company_name?: string;
}

interface EmailAnalytics {
  summary: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  dailyStats: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  }>;
  recentEmails: Array<{
    event: string;
    email: string;
    subject: string;
    date: string;
    ts: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export default function MarketingEmailsAdminPage() {
  const { user } = useKindeBrowserClient();
  const [testEmailList, setTestEmailList] = useState<EmailRow[]>([]);
  const [marketingEmailList, setMarketingEmailList] = useState<EmailRow[]>([]);
  const [emailTemplate, setEmailTemplate] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [individualEmail, setIndividualEmail] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendingTo, setSendingTo] = useState<"test" | "marketing" | "individual" | null>(null);
  const [sendingLogs, setSendingLogs] = useState<Array<{
    type: "info" | "success" | "error";
    message: string;
    timestamp: number;
  }>>([]);
  const [sendingProgress, setSendingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [isPromptMode, setIsPromptMode] = useState<boolean>(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  
  // Pagination state for email activity
  const [showAllEmails, setShowAllEmails] = useState<boolean>(false);
  const [emailsPerPage, setEmailsPerPage] = useState<number>(50);
  const [currentEmailPage, setCurrentEmailPage] = useState<number>(1);
  const [allEmails, setAllEmails] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Bounced emails state
  const [bouncedEmails, setBouncedEmails] = useState<any[]>([]);
  const [bouncedLoading, setBouncedLoading] = useState<boolean>(false);
  const [bouncedError, setBouncedError] = useState<string | null>(null);

  // Contact statistics state
  const [contactStats, setContactStats] = useState<any[]>([]);
  const [contactStatsLoading, setContactStatsLoading] = useState<boolean>(false);
  const [contactStatsError, setContactStatsError] = useState<string | null>(null);
  const [contactStatsSearch, setContactStatsSearch] = useState<string>("");

  // Search state for both lists
  const [testEmailSearch, setTestEmailSearch] = useState<string>("");
  const [marketingEmailSearch, setMarketingEmailSearch] = useState<string>("");

  // State for adding new emails
  const [newTestEmail, setNewTestEmail] = useState({
    email: "",
    firstname: "",
    lastname: "",
    company_name: ""
  });
  const [newMarketingEmail, setNewMarketingEmail] = useState({
    email: "",
    firstname: "",
    lastname: "",
    company_name: ""
  });

  // State for editing emails
  const [editingEmail, setEditingEmail] = useState<{
    table: "test_email_list" | "marketing_email_list";
    email: string;
    data: { email: string; firstname: string; lastname: string; company_name?: string };
  } | null>(null);

  // Sample HTML email template for testing
  const sampleHtmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketing Email</title>
    <style>
        @media only screen and (max-width: 600px) {
            .main-content { padding: 0 !important; }
            .content-card { padding: 16px 4% !important; font-size: 15px !important; margin: 16px 2% !important; }
            .button { padding: 12px 20px !important; font-size: 14px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif;">
    <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td>
                <!-- Header -->
                <div style="background:#0F3557; padding:30px 0 20px 0; border-radius:0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left" style="padding-left:30px;">
                                <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-word.png" alt="MediRate Wordmark" style="max-width:200px; width:90%; display:block;">
                            </td>
                            <td align="right" style="padding-right:30px;">
                                <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-logo.png" alt="MediRate Logo" style="max-width:80px; width:80px; display:block;">
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Main Content -->
                <div class="main-content" style="padding:0; margin:0;">
                    <h2 style="color:#0F3557; font-size:22px; margin:30px 0 10px 0; text-align:center;">Marketing Campaign</h2>
                    <p style="color:#555; text-align:center; margin:0 0 20px 0;">Your custom marketing message goes here.</p>

                    <!-- Main Content Card -->
                    <div class="content-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
                        <div style="font-size:18px; font-weight:bold; margin-bottom:16px; color:#0F3557;">
                            🎯 Campaign Highlights
                        </div>
                        <div style="font-size:14px; margin-bottom:16px; color:#334155; line-height:1.6;">
                            This is a sample marketing email template that you can customize for your campaigns. It includes the professional MediRate branding and responsive design.
                        </div>
                        
                        <div style="font-size:14px; margin-bottom:20px; color:#334155; line-height:1.6;">
                            <strong>Key Features:</strong>
                            <ul style="margin:8px 0; padding-left:20px;">
                                <li>Professional MediRate branding</li>
                                <li>Responsive email design</li>
                                <li>Easy to customize content</li>
                                <li>Mobile-friendly layout</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Call to Action Card -->
                    <div class="content-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
                        <div style="font-size:16px; font-weight:bold; margin-bottom:12px; color:#0F3557;">
                            🚀 Take Action
                        </div>
                        <div style="font-size:14px; margin-bottom:16px; color:#334155; line-height:1.6;">
                            Customize this template with your specific marketing content, calls to action, and branding elements.
                        </div>
                        
                        <div style="text-align:center; margin:20px 0;">
                            <a href="#" style="background:#0F3557; color:#fff; text-decoration:none; padding:14px 28px; border-radius:5px; font-weight:bold; font-size:16px; display:inline-block;">Learn More</a>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background:#0F3557; color:#fff; font-size:13px; padding:12px; border-radius:0; text-align:center;">
                    © 2025 MediRate. All rights reserved.
                </div>
            </td>
        </tr>
    </table>
</body>
</html>`;

  // Function to generate AI template
  const generateAITemplate = async () => {
    if (!aiPrompt.trim()) {
      setAiStatus({ type: "error", message: "Please describe the email you want to create" });
      return;
    }

    setIsGenerating(true);
    setAiStatus({ type: "info", message: "Generating your email template..." });

    try {
      const response = await fetch("/api/admin/marketing-emails/generate-ai-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await response.json();
      
      // Log the full response for debugging
      console.log('AI Template Generation Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      if (response.ok && data.htmlContent) {
        setEmailTemplate(data.htmlContent);
        setAiStatus({ 
          type: "success", 
          message: "✨ Template generated successfully! You can now preview and customize it." 
        });
        // Switch back to code mode after successful generation
        setIsPromptMode(false);
      } else {
        let errorMessage = "Failed to generate template";
        
        if (data.error) {
          errorMessage = data.error;
        } else if (data.details) {
          errorMessage = data.details;
        }
        
        // Add HTTP status code for better debugging
        const statusText = response.statusText || `HTTP ${response.status}`;
        setAiStatus({ 
          type: "error", 
          message: `❌ ${statusText}: ${errorMessage}` 
        });
      }
    } catch (error) {
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      setAiStatus({ 
        type: "error", 
        message: `❌ Network Error: ${errorMessage}` 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to send email campaign
  const sendEmailCampaign = async (target: "test" | "marketing" | "individual") => {
    if (!emailTemplate.trim() || !emailSubject.trim()) {
      addLog("error", "Please provide both email template and subject");
      return;
    }

    // For individual emails, validate the email address
    if (target === "individual") {
      if (!individualEmail.trim()) {
        addLog("error", "Please provide an email address to send to");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(individualEmail.trim())) {
        addLog("error", "Please provide a valid email address");
        return;
      }
    }

    setIsSending(true);
    setSendingTo(target);
    setSendingLogs([]);
    setSendingProgress({ current: 0, total: 0 });

    try {
      if (target === "individual") {
        addLog("info", `Starting email campaign to individual email: ${individualEmail}`);
      } else {
        addLog("info", `Starting email campaign to ${target === "test" ? "test users" : "marketing list"}...`);
      }
      
      let targetList: EmailRow[] = [];
      if (target === "individual") {
        // For individual emails, create a single-item list
        targetList = [{
          id: 0,
          email: individualEmail.trim(),
          firstname: "Individual",
          lastname: "Recipient",
          company_name: ""
        }];
      } else {
        targetList = target === "test" ? testEmailList : marketingEmailList;
      }
      
      if (targetList.length === 0) {
        addLog("error", `No emails found in ${target === "test" ? "test" : "marketing"} list`);
        setIsSending(false);
        setSendingTo(null);
        return;
      }

      setSendingProgress({ current: 0, total: targetList.length });
      addLog("info", `Found ${targetList.length} emails to send to`);

      const batchSize = 10;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < targetList.length; i += batchSize) {
        const batch = targetList.slice(i, i + batchSize);
        
        try {
          const response = await fetch("/api/admin/marketing-emails/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emails: batch.map(row => row.email),
              subject: emailSubject,
              htmlContent: emailTemplate,
              target: target
            }),
          });

          if (response.ok) {
            const responseData = await response.json();
            successCount += responseData.emailsSent || 0;
            errorCount += (batch.length - (responseData.emailsSent || 0));
            
            if (responseData.logs && Array.isArray(responseData.logs)) {
              responseData.logs.forEach((log: string) => {
                if (log.includes("✅")) {
                  addLog("success", log);
                } else if (log.includes("❌")) {
                  addLog("error", log);
                } else {
                  addLog("info", log);
                }
              });
            }
            
            addLog("success", `Successfully sent batch ${Math.floor(i / batchSize) + 1} (${responseData.emailsSent || 0}/${batch.length} emails)`);
          } else {
            const errorData = await response.json();
            errorCount += batch.length;
            addLog("error", `Failed to send batch ${Math.floor(i / batchSize) + 1}: ${errorData.error || "Unknown error"}`);
          }
        } catch (error) {
          errorCount += batch.length;
          addLog("error", `Network error sending batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        setSendingProgress({ current: Math.min(i + batchSize, targetList.length), total: targetList.length });
        if (i + batchSize < targetList.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      if (errorCount === 0) {
        if (target === "individual") {
          addLog("success", `🎉 Email sent successfully to ${individualEmail}!`);
        } else {
          addLog("success", `🎉 Campaign completed successfully! Sent ${successCount} emails to ${target === "test" ? "test users" : "marketing list"}`);
        }
      } else {
        addLog("error", `Campaign completed with errors. Success: ${successCount}, Errors: ${errorCount}`);
      }
    } catch (error) {
      addLog("error", `Campaign failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSending(false);
      setSendingTo(null);
      setSendingProgress({ current: 0, total: 0 });
      
      // Clear individual email field if campaign was successful
      if (target === "individual") {
        setIndividualEmail("");
      }
    }
  };

  const addLog = (type: "info" | "success" | "error", message: string) => {
    setSendingLogs(prev => [...prev, {
      type,
      message,
      timestamp: Date.now()
    }]);
  };

  // Function to reset all form fields
  const resetAllForms = () => {
    setEmailTemplate("");
    setEmailSubject("");
    setIndividualEmail("");
    setNewTestEmail({ email: "", firstname: "", lastname: "", company_name: "" });
    setNewMarketingEmail({ email: "", firstname: "", lastname: "", company_name: "" });
    setSendingLogs([]);
    setSendingProgress({ current: 0, total: 0 });
  };

  // Function to add new email
  const handleAddEmail = async (table: "test_email_list" | "marketing_email_list", emailData: {email: string, firstname: string, lastname: string, company_name: string}) => {
    if (!emailData.email.trim()) return;

    // Basic email validation
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
          table,
          email: emailData.email.trim(),
          firstname: emailData.firstname.trim(),
          lastname: emailData.lastname.trim(),
          company_name: emailData.company_name?.trim() || ""
        }),
      });

      if (response.ok) {
        // Refresh the lists
        await loadEmailLists();
        
        // Clear the form
        if (table === "test_email_list") {
          setNewTestEmail({ email: "", firstname: "", lastname: "", company_name: "" });
        } else {
          setNewMarketingEmail({ email: "", firstname: "", lastname: "", company_name: "" });
        }
        
        // Clear individual email field
        setIndividualEmail("");
        
        console.log(`✅ Added email to ${table}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to add email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error adding email:", error);
      alert("Failed to add email. Please try again.");
    }
  };

  // Function to delete email
  const handleDeleteEmail = async (table: "test_email_list" | "marketing_email_list", email: string) => {
    if (!confirm(`Are you sure you want to delete ${email} from the ${table === "test_email_list" ? "test" : "marketing"} list?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/marketing-emails/rows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table,
          email
        }),
      });

      if (response.ok) {
        // Refresh the lists
        await loadEmailLists();
        console.log(`✅ Deleted email from ${table}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error deleting email:", error);
      alert("Failed to delete email. Please try again.");
    }
  };

  // Function to start editing an email
  const handleEditEmail = (table: "test_email_list" | "marketing_email_list", item: EmailRow) => {
    setEditingEmail({
      table,
      email: item.email,
      data: { ...item }
    });
  };

  // Function to save edited email
  const handleSaveEdit = async () => {
    if (!editingEmail) return;

    // Basic email validation
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
        // Refresh the lists
        await loadEmailLists();
        setEditingEmail(null);
        console.log(`✅ Updated email in ${editingEmail.table}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error updating email:", error);
      alert("Failed to update email. Please try again.");
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingEmail(null);
  };

  // Load email lists on component mount
  useEffect(() => {
    loadEmailLists();
  }, []);

  const loadEmailLists = async () => {
    try {
      console.log("🔍 Loading email lists...");
      setAnalyticsLoading(true);
      
      const response = await fetch("/api/admin/marketing-emails/list");
      
      console.log("📡 API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", response.status, errorText);
        setAnalyticsLoading(false);
        return false;
      }
      
      const json = await response.json();
      console.log("📊 API Response data:", json);
      
      setTestEmailList(json.testEmailList || []);
      setMarketingEmailList(json.marketingEmailList || []);
      
      console.log("✅ Email lists loaded successfully");
      setAnalyticsLoading(false);
      return true;
    } catch (error) {
      console.error("❌ Failed to load email lists:", error);
      setAnalyticsLoading(false);
      return false;
    }
  };

  // Search filtering functions
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

  const getFilteredMarketingEmails = () => {
    if (!marketingEmailSearch.trim()) return marketingEmailList;
    
    const searchTerm = marketingEmailSearch.toLowerCase();
    return marketingEmailList.filter(item => 
      item.email.toLowerCase().includes(searchTerm) ||
      item.firstname.toLowerCase().includes(searchTerm) ||
      item.lastname.toLowerCase().includes(searchTerm) ||
      (item.company_name && item.company_name.toLowerCase().includes(searchTerm))
    );
  };

  // Clear search functions
  const clearTestEmailSearch = () => setTestEmailSearch("");
  const clearMarketingEmailSearch = () => setMarketingEmailSearch("");

  // Analytics functions - fetch real data from Brevo
  const fetchAnalytics = async (days: number = 30) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    
    try {
      console.log('🔍 Fetching real analytics from Brevo...');
      
      // Call our backend API route which securely calls Brevo
      const response = await fetch('/api/admin/email-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: days
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Real analytics data received:', data.data);
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
      
    } catch (error) {
      console.error('Analytics error:', error);
      setAnalyticsError(error instanceof Error ? error.message : 'Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Bounced emails functions
  const fetchBouncedEmails = async (days: number = 30) => {
    setBouncedLoading(true);
    setBouncedError(null);
    
    try {
      const response = await fetch('/api/admin/marketing-emails/bounced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: days,
          limit: 300,
          offset: 0
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch bounced emails: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBouncedEmails(data.data.bouncedEmails);
      } else {
        throw new Error(data.error || 'Failed to fetch bounced emails');
      }
    } catch (error) {
      console.error('Bounced emails error:', error);
      setBouncedError(error instanceof Error ? error.message : 'Failed to fetch bounced emails');
    } finally {
      setBouncedLoading(false);
    }
  };

  const fetchContactStats = async (days: number = 30) => {
    setContactStatsLoading(true);
    setContactStatsError(null);
    
    try {
      const response = await fetch('/api/admin/marketing-emails/contact-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch contact stats: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setContactStats(data.contacts || []);
      } else {
        throw new Error(data.error || 'Failed to fetch contact stats');
      }
    } catch (error) {
      console.error('Contact stats error:', error);
      setContactStatsError(error instanceof Error ? error.message : 'Failed to fetch contact stats');
    } finally {
      setContactStatsLoading(false);
    }
  };

  // Load analytics when days change
  useEffect(() => {
    fetchAnalytics(analyticsDays);
    fetchBouncedEmails(analyticsDays);
    fetchContactStats(analyticsDays);
  }, [analyticsDays]);

  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-2">
          Marketing Emails Admin
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Create and manage marketing campaigns separate from rate developments.
        </p>

        {/* Email Lists Management Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[#012C61]">Manage Email Lists</h3>
            {(testEmailSearch || marketingEmailSearch) && (
              <button
                onClick={() => {
                  clearTestEmailSearch();
                  clearMarketingEmailSearch();
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                🗑️ Clear All Searches
              </button>
            )}
          </div>
          
          {/* Test Email List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-700">
                Test Email List ({testEmailSearch ? `${getFilteredTestEmails().length}/${testEmailList.length}` : testEmailList.length} emails)
              </h4>
              <div className="text-sm text-gray-500">Click on any field to edit</div>
            </div>
            
            {/* Add New Email Form - Top */}
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
                  className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-blue-500"
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
                  onClick={() => handleAddEmail("test_email_list", newTestEmail)}
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
                    onClick={clearTestEmailSearch}
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
            {analyticsLoading ? (
              <div className="flex flex-col justify-center items-center h-32 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 mt-2">Loading email lists...</span>
                <span className="text-xs text-gray-400 mt-1">Fetching data in batches for better performance</span>
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
                  {getFilteredTestEmails().map((item, index) => (
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
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail("test_email_list", item)}>{item.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail("test_email_list", item)}>{item.firstname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail("test_email_list", item)}>{item.lastname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail("test_email_list", item)}>{item.company_name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEditEmail("test_email_list", item)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEmail("test_email_list", item.email)}
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

          {/* Marketing Email List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-700">
                Marketing Email List ({marketingEmailSearch ? `${getFilteredMarketingEmails().length}/${marketingEmailList.length}` : marketingEmailList.length} emails)
              </h4>
              <div className="text-sm text-gray-500">Click on any field to edit</div>
            </div>
            
            {/* Add New Email Form - Top */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
              <h5 className="text-sm font-medium text-green-800 mb-3">➕ Add New Marketing Email</h5>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newMarketingEmail.email}
                  onChange={(e) => setNewMarketingEmail({...newMarketingEmail, email: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="First name"
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newMarketingEmail.firstname}
                  onChange={(e) => setNewMarketingEmail({...newMarketingEmail, firstname: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newMarketingEmail.lastname}
                  onChange={(e) => setNewMarketingEmail({...newMarketingEmail, lastname: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Company name"
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newMarketingEmail.company_name}
                  onChange={(e) => setNewMarketingEmail({...newMarketingEmail, company_name: e.target.value})}
                />
                <button
                  onClick={() => handleAddEmail("marketing_email_list", newMarketingEmail)}
                  disabled={!newMarketingEmail.email}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    newMarketingEmail.email
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Add Email
                </button>
              </div>
            </div>

            {/* Search Marketing Email List */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search marketing emails by email, first name, last name, or company name..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={marketingEmailSearch}
                  onChange={(e) => setMarketingEmailSearch(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {marketingEmailSearch && (
                  <button
                    onClick={clearMarketingEmailSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {marketingEmailSearch && (
                <div className="mt-2 text-sm text-gray-600">
                  Showing {getFilteredMarketingEmails().length} of {marketingEmailList.length} marketing emails
                </div>
              )}
            </div>

            {/* Marketing Email List Table */}
            {analyticsLoading ? (
              <div className="flex flex-col justify-center items-center h-32 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600 mt-2">Loading email lists...</span>
                <span className="text-xs text-gray-400 mt-1">Fetching data in batches for better performance</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full bg-white">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredMarketingEmails().map((item, index) => (
                    <tr key={item.email} className="hover:bg-gray-50">
                      {editingEmail?.table === "marketing_email_list" && editingEmail?.email === item.email ? (
                        // Edit mode
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="email"
                              value={editingEmail.data.email}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, email: e.target.value}})}
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingEmail.data.firstname}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, firstname: e.target.value}})}
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingEmail.data.lastname}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, lastname: e.target.value}})}
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingEmail.data.company_name || ""}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, company_name: e.target.value}})}
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-green-50" onClick={() => handleEditEmail("marketing_email_list", item)}>{item.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-green-50" onClick={() => handleEditEmail("marketing_email_list", item)}>{item.firstname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-green-50" onClick={() => handleEditEmail("marketing_email_list", item)}>{item.lastname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-green-50" onClick={() => handleEditEmail("marketing_email_list", item)}>{item.company_name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEditEmail("marketing_email_list", item)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEmail("marketing_email_list", item.email)}
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
                  {getFilteredMarketingEmails().length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        {marketingEmailSearch ? `No marketing emails found matching "${marketingEmailSearch}"` : "No marketing emails yet. Add one using the form above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>

        {/* Email Template Editor */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <h3 className="text-xl font-semibold text-[#012C61] mb-4">Email Template Editor</h3>
          
          {/* Email Preview - Full Width */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Preview</label>
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
                  dangerouslySetInnerHTML={{ __html: emailTemplate }}
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Preview updates in real-time as you type
            </div>
          </div>
          
          {/* Dynamic Input Section - Switches between Prompt and HTML Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {isPromptMode ? "AI Prompt" : "HTML Code"}
              </label>
              {isPromptMode && (
                <button
                  onClick={() => setIsPromptMode(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  ← Back to HTML Code
                </button>
              )}
            </div>
            
            {isPromptMode ? (
              // AI Prompt Input Mode
              <div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your email in detail for AI generation (e.g., 'A sophisticated welcome email for healthcare professionals, highlighting our advanced rate tracking dashboard, featuring social proof from industry leaders, with compelling CTAs for immediate engagement')"
                  className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <p className="text-sm text-purple-800">
                    <strong>💡 Pro Tip:</strong> Be specific about your audience, tone, and goals. Include details about industry context, target demographics, and desired outcomes for the best results.
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    <strong>🔧 Troubleshooting:</strong> If you encounter errors, check the console for detailed information. Common issues include API rate limits or quota limits.
                  </p>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button
                    onClick={generateAITemplate}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      !aiPrompt.trim() || isGenerating
                        ? "bg-purple-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    <span className="flex items-center">
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Template...
                        </>
                      ) : (
                        <>
                          <span className="mr-1">✨</span>
                          Generate Template
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setAiPrompt("");
                      setIsPromptMode(false);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // HTML Code Input Mode
              <div>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Paste your HTML email code here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEmailTemplate(sampleHtmlTemplate)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Load Sample Template
                  </button>
                  <button
                    onClick={() => setEmailTemplate("")}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsPromptMode(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    <span className="flex items-center">
                      <span className="mr-1">✨</span>
                      Generate with AI
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Status Display */}
          {aiStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              aiStatus.type === "success" 
                ? "bg-green-100 text-green-800 border border-green-200"
                : aiStatus.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200 font-mono"
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {aiStatus.message}
              {aiStatus.type === "error" && (
                <div className="mt-2 text-xs text-red-600">
                  💡 Check the browser console for detailed error information
                  {aiStatus.message.includes("rate limit") && (
                    <div className="mt-1">
                      ⏱️ <strong>Solution:</strong> You've hit the API rate limit. Wait a bit longer before trying again.
                    </div>
                  )}
                  {aiStatus.message.includes("quota") && (
                    <div className="mt-1">
                      💳 <strong>Solution:</strong> API quota exceeded. Contact support if this persists.
                    </div>
                  )}
                  {aiStatus.message.includes("insufficient_quota") && (
                    <div className="mt-1">
                      💳 <strong>Solution:</strong> OpenAI quota exceeded. Contact support to upgrade your plan.
                    </div>
                  )}
                  {aiStatus.message.includes("model_not_found") && (
                    <div className="mt-1">
                      🔧 <strong>Solution:</strong> Model configuration issue. Contact support immediately.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* AI Generation Status - Only show when in prompt mode */}
          {isGenerating && isPromptMode && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center text-purple-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                <span className="text-sm font-medium">AI is generating your email template...</span>
              </div>
            </div>
          )}
        </div>

        {/* Email Sending Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-[#012C61] mb-4">Send Email Campaign</h4>
          
          {/* Email Subject Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject line..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Individual Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send to Specific Email (Optional)
              {individualEmail.trim() && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  🎯 Individual Mode
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={individualEmail}
                onChange={(e) => setIndividualEmail(e.target.value)}
                placeholder="Enter specific email address..."
                className={`flex-1 p-3 border rounded-md focus:outline-none focus:ring-2 ${
                  individualEmail.trim() 
                    ? "border-purple-300 focus:ring-purple-500 bg-purple-50" 
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <button
                onClick={() => setIndividualEmail("")}
                className="px-3 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                title="Clear email address"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {individualEmail.trim() 
                ? `Will send email to: ${individualEmail}` 
                : "Leave empty to send to lists, or enter a specific email address to send individually"
              }
            </p>
          </div>

          {/* Send Buttons */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => sendEmailCampaign("test")}
              disabled={!emailTemplate.trim() || !emailSubject.trim() || isSending || !!individualEmail.trim()}
              className={`px-6 py-3 rounded-md text-white font-medium ${
                !emailTemplate.trim() || !emailSubject.trim() || isSending || !!individualEmail.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              title={individualEmail.trim() ? "Clear individual email to enable list sending" : ""}
            >
              {isSending && sendingTo === "test" ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Test Users...
                </span>
              ) : (
                "📧 Send to Test Users"
              )}
            </button>
            
            <button
              onClick={() => sendEmailCampaign("marketing")}
              disabled={!emailTemplate.trim() || !emailSubject.trim() || isSending || !!individualEmail.trim()}
              className={`px-6 py-3 rounded-md text-white font-medium ${
                !emailTemplate.trim() || !emailSubject.trim() || isSending || !!individualEmail.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              title={individualEmail.trim() ? "Clear individual email to enable list sending" : ""}
            >
              {isSending && sendingTo === "marketing" ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Marketing List...
                </span>
              ) : (
                "📢 Send to Marketing List"
              )}
            </button>

            <button
              onClick={() => sendEmailCampaign("individual")}
              disabled={!emailTemplate.trim() || !emailSubject.trim() || !individualEmail.trim() || isSending}
              className={`px-6 py-3 rounded-md text-white font-medium ${
                !emailTemplate.trim() || !emailSubject.trim() || !individualEmail.trim() || isSending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isSending && sendingTo === "individual" ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Individual...
                </span>
              ) : (
                "📮 Send to Individual"
              )}
            </button>

            <button
              onClick={resetAllForms}
              disabled={isSending}
              className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Reset All Forms
            </button>
          </div>

          {/* Info message when individual email is entered */}
          {individualEmail.trim() && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center">
                <span className="text-purple-600 mr-2">ℹ️</span>
                <span className="text-sm text-purple-700">
                  <strong>Individual Mode Active:</strong> When an individual email is entered, only the "Send to Individual" button is enabled. 
                  Clear the email field to send to lists instead.
                </span>
              </div>
            </div>
          )}

          {/* Sending Logs */}
          {sendingLogs.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Sending Logs</h5>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {sendingLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm p-2 rounded ${
                      log.type === "success"
                        ? "bg-green-100 text-green-800"
                        : log.type === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <span className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {" - "}
                    {log.message}
                  </div>
                ))}
              </div>
              {isSending && (
                <div className="mt-2 text-sm text-gray-600">
                  Sending in progress... {sendingProgress.current}/{sendingProgress.total} emails sent
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Analytics Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#012C61]">📊 Email Analytics</h3>
            <div className="flex items-center space-x-4">
              <select
                value={analyticsDays}
                onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={() => fetchAnalytics(analyticsDays)}
                disabled={analyticsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
              >
                {analyticsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {analyticsError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                <span className="text-red-700">{analyticsError}</span>
              </div>
              <p className="text-sm text-red-600 mt-2">
                Make sure your Brevo API key is configured and your account has access to email statistics.
              </p>
            </div>
          )}

          {analytics && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Sent</p>
                      <p className="text-2xl font-bold text-blue-900">{(analytics.summary.totalSent || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-blue-500">📧</div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Opened</p>
                      <p className="text-2xl font-bold text-green-900">{(analytics.summary.totalOpened || 0).toLocaleString()}</p>
                      <p className="text-sm text-green-600">{(analytics.summary.openRate || 0).toFixed(1)}% rate</p>
                    </div>
                    <div className="text-green-500">📖</div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Clicked</p>
                      <p className="text-2xl font-bold text-purple-900">{(analytics.summary.totalClicked || 0).toLocaleString()}</p>
                      <p className="text-sm text-purple-600">{(analytics.summary.clickRate || 0).toFixed(1)}% rate</p>
                    </div>
                    <div className="text-purple-500">🖱️</div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Bounced</p>
                      <p className="text-2xl font-bold text-red-900">{(analytics.summary.totalBounced || 0).toLocaleString()}</p>
                      <p className="text-sm text-red-600">{(analytics.summary.bounceRate || 0).toFixed(1)}% rate</p>
                    </div>
                    <div className="text-red-500">⚠️</div>
                  </div>
                </div>
              </div>

              {/* Real Engagement Activity */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-800">📈 Performance Overview</h4>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Real data from Brevo</span>
                </div>
                
                {/* Email Engagement Pie Chart */}
                {(() => {
                  const total = analytics.summary.totalSent || 0;
                  const opened = analytics.summary.totalOpened || 0;
                  const clicked = analytics.summary.totalClicked || 0;
                  const bounced = analytics.summary.totalBounced || 0;
                  
                  // Check if we have any real data to show
                  if (total === 0 && opened === 0 && clicked === 0 && bounced === 0) {
                    // No data available - show empty state
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="flex flex-col">
                          <h5 className="text-md font-medium text-gray-700 mb-4">📊 Email Engagement Breakdown</h5>
                          <div className="bg-white rounded-lg p-8 shadow-sm border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <div className="text-gray-400 text-6xl mb-4">📊</div>
                              <h6 className="text-lg font-medium text-gray-600 mb-2">No Email Activity</h6>
                              <p className="text-sm text-gray-500 mb-4">
                                No emails were sent or tracked in the last {analyticsDays} days.
                              </p>
                              <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                                <strong>Note:</strong> This dashboard shows real-time data from Brevo. 
                                Send some emails to see analytics here.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Calculate all engagement states properly
                  const delivered = total - bounced; // Actually delivered emails
                  const openedNotClicked = Math.max(0, opened - clicked);
                  const notOpened = delivered - Math.max(opened, clicked); // Delivered but not opened
                  
                  const pieOptions: EChartsOption = {
                    tooltip: {
                      trigger: 'item',
                      formatter: '{b}: {c} emails ({d}%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      borderColor: 'transparent',
                      textStyle: {
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 500
                      },
                      borderRadius: 8,
                      padding: [8, 12]
                    },
                    legend: {
                      orient: 'horizontal',
                      bottom: '0%',
                      left: 'center',
                      textStyle: {
                        fontSize: 12,
                        color: '#4b5563',
                        fontWeight: 500
                      },
                      itemGap: 20,
                      itemWidth: 12,
                      itemHeight: 12
                    },
                    series: [
                      {
                        name: 'Email Status',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['50%', '45%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                          borderRadius: 5,
                          borderColor: '#fff',
                          borderWidth: 2
                        },
                        label: {
                          show: false,
                          position: 'center'
                        },
                        emphasis: {
                          label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold',
                            formatter: '{d}%'
                          }
                        },
                        labelLine: {
                          show: false
                        },
                        data: [
                          {
                            value: clicked,
                            name: `Clicked (${clicked}) - ${(analytics.summary.clickRate || 0).toFixed(1)}%`,
                            itemStyle: { 
                              color: '#10b981',
                              borderColor: '#ffffff',
                              borderWidth: 2
                            }
                          },
                          ...(openedNotClicked > 0 ? [{
                            value: openedNotClicked,
                            name: `Opened Only (${openedNotClicked}) - ${total > 0 ? ((openedNotClicked / total) * 100).toFixed(1) : '0.0'}%`,
                            itemStyle: { 
                              color: '#6b7280',
                              borderColor: '#ffffff',
                              borderWidth: 2
                            }
                          }] : []),
                          {
                            value: notOpened,
                            name: `Not Opened (${notOpened}) - ${total > 0 ? ((notOpened / total) * 100).toFixed(1) : '0.0'}%`,
                            itemStyle: { 
                              color: '#f59e0b',
                              borderColor: '#ffffff',
                              borderWidth: 2
                            }
                          },
                          {
                            value: bounced,
                            name: `Bounced (${bounced}) - ${(analytics.summary.bounceRate || 0).toFixed(1)}%`,
                            itemStyle: { 
                              color: '#dc2626',
                              borderColor: '#ffffff',
                              borderWidth: 2
                            }
                          }
                        ].filter(item => item.value > 0)
                      }
                    ]
                  };

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      {/* ECharts Pie Chart */}
                      <div className="flex flex-col">
                        <h5 className="text-md font-medium text-gray-700 mb-4">📊 Email Engagement Breakdown</h5>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <EChartsWrapper 
                            options={pieOptions} 
                            style={{ height: '300px' }} 
                          />
                        </div>
                        
                        {/* Professional Summary Cards */}
                        <div className="mt-6">
                          <h6 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Engagement Breakdown</h6>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-4" style={{ borderLeftColor: '#10b981' }}>
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                                <span className="text-sm font-medium text-gray-700">Clicked</span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold" style={{ color: '#10b981' }}>{clicked > 0 ? (analytics.summary.clickRate || 0).toFixed(1) : '0.0'}%</div>
                                <div className="text-xs text-gray-500">{clicked} emails</div>
                              </div>
                            </div>
                            
                            {openedNotClicked > 0 && (
                              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border-l-4" style={{ borderLeftColor: '#6b7280' }}>
                                <div className="flex items-center space-x-3">
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6b7280' }}></div>
                                  <span className="text-sm font-medium text-gray-700">Opened Only</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold" style={{ color: '#6b7280' }}>{total > 0 ? ((openedNotClicked / total) * 100).toFixed(1) : '0.0'}%</div>
                                  <div className="text-xs text-gray-500">{openedNotClicked} emails</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                                <span className="text-sm font-medium text-gray-700">Not Opened</span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{total > 0 ? ((notOpened / total) * 100).toFixed(1) : '0.0'}%</div>
                                <div className="text-xs text-gray-500">{notOpened} emails</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border-l-4" style={{ borderLeftColor: '#dc2626' }}>
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
                                <span className="text-sm font-medium text-gray-700">Bounced</span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold" style={{ color: '#dc2626' }}>{bounced > 0 ? (analytics.summary.bounceRate || 0).toFixed(1) : '0.0'}%</div>
                                <div className="text-xs text-gray-500">{bounced} emails</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-semibold text-blue-800">Analytics Insight</span>
                            </div>
                            <div className="text-xs text-blue-700 leading-relaxed">
                              {total === 0 ? 
                                `📊 No email activity detected in the last ${analyticsDays} days. Send some emails to start tracking engagement metrics.` :
                                clicked > opened ? 
                                `📈 Exceptional engagement: ${clicked} clicks from ${opened} opens. This indicates high link engagement even when tracking pixels are blocked.` :
                                `📊 Standard engagement pattern: ${opened} opens generated ${clicked} clicks, resulting in a ${(analytics.summary.clickRate || 0).toFixed(1)}% click rate.`
                              }
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Engagement Metrics removed per request */}
                  </div>
                );
              })()}

                {/* Real Recent Activity by Date */}
                {analytics.dailyStats.length > 0 && (
                  <div>
                    <h5 className="text-md font-medium text-gray-700 mb-3">📅 Recent Activity (Real Events)</h5>
                    <div className="space-y-2">
                      {analytics.dailyStats.filter(day => day.opened > 0 || day.clicked > 0).slice(-5).map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(day.date).toLocaleDateString(undefined, { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <div className="flex space-x-4">
                            {day.opened > 0 && (
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-xs text-gray-600">{day.opened} opens</span>
                              </div>
                            )}
                            {day.clicked > 0 && (
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                <span className="text-xs text-gray-600">{day.clicked} clicks</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {analytics.dailyStats.filter(day => day.opened > 0 || day.clicked > 0).length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No recent engagement events found in the selected date range
                      </div>
                    )}
                  </div>
                )}

                {/* Data Source Disclaimer */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <div className="text-xs text-gray-500 text-center">
                    📊 Summary totals from Brevo aggregated data ({analytics.dateRange.startDate} to {analytics.dateRange.endDate})
                    <br />
                    📅 Daily breakdown from individual events (limited to recent activities)
                  </div>
                </div>
              </div>

                            {/* Recent Email Activity */}
              {analytics.recentEmails.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-800">🕐 Recent Email Activity</h4>
                    <div className="flex items-center space-x-3">
                      <select
                        value={emailsPerPage}
                        onChange={(e) => {
                          setEmailsPerPage(Number(e.target.value));
                          setCurrentEmailPage(1);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                        <option value={200}>200 per page</option>
                      </select>
                      <button
                        onClick={() => setShowAllEmails(!showAllEmails)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          showAllEmails 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        {showAllEmails ? 'Show Recent Only' : 'Show All Emails'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Event</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Email</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Subject</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const emailsToShow = showAllEmails 
                            ? analytics.recentEmails 
                            : analytics.recentEmails.slice(0, 10);
                          
                          const startIndex = (currentEmailPage - 1) * emailsPerPage;
                          const endIndex = startIndex + emailsPerPage;
                          const paginatedEmails = showAllEmails 
                            ? emailsToShow.slice(startIndex, endIndex)
                            : emailsToShow;
                          
                          return paginatedEmails.map((email, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-white">
                              <td className="py-2 px-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  email.event === 'opened' ? 'bg-green-100 text-green-800' :
                                  email.event === 'clicked' ? 'bg-purple-100 text-purple-800' :
                                  email.event === 'sent' ? 'bg-blue-100 text-blue-800' :
                                  email.event === 'delivered' ? 'bg-teal-100 text-teal-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {email.event}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-gray-700 truncate max-w-48">{email.email}</td>
                              <td className="py-2 px-3 text-gray-700 truncate max-w-64">{email.subject || 'N/A'}</td>
                              <td className="py-2 px-3 text-gray-500">
                                {(() => {
                                  if (email.ts && typeof email.ts === 'number') {
                                    return new Date(email.ts * 1000).toLocaleString();
                                  } else if (email.date) {
                                    return new Date(email.date).toLocaleString();
                                  } else {
                                    return 'No timestamp';
                                  }
                                })()}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls - Only show when viewing all emails */}
                  {showAllEmails && analytics.recentEmails.length > emailsPerPage && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((currentEmailPage - 1) * emailsPerPage) + 1}-{Math.min(currentEmailPage * emailsPerPage, analytics.recentEmails.length)} of {analytics.recentEmails.length} emails
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentEmailPage(Math.max(1, currentEmailPage - 1))}
                          disabled={currentEmailPage === 1}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentEmailPage === 1
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-600">
                          Page {currentEmailPage} of {Math.ceil(analytics.recentEmails.length / emailsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentEmailPage(Math.min(Math.ceil(analytics.recentEmails.length / emailsPerPage), currentEmailPage + 1))}
                          disabled={currentEmailPage >= Math.ceil(analytics.recentEmails.length / emailsPerPage)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentEmailPage >= Math.ceil(analytics.recentEmails.length / emailsPerPage)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Summary Info */}
                  <div className="mt-3 text-sm text-gray-600">
                    {showAllEmails 
                      ? `Showing all ${analytics.recentEmails.length} email events from the selected date range`
                      : `Showing recent 10 of ${analytics.recentEmails.length} total email events. Click "Show All Emails" to see the complete list.`
                    }
                  </div>
                </div>
              )}

              {/* Date Range Info */}
              <div className="text-center text-sm text-gray-500">
                📅 Showing data from {new Date(analytics.dateRange.startDate).toLocaleDateString()} to {new Date(analytics.dateRange.endDate).toLocaleDateString()}
                <br />
                📊 Total events: {analytics.recentEmails.length} | Daily breakdown: {analytics.dailyStats.length} days
              </div>
            </div>
          )}

          {analyticsLoading && !analytics && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading email analytics...</p>
            </div>
          )}

          {!analyticsLoading && !analytics && !analyticsError && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No analytics data available</p>
              <button
                onClick={() => fetchAnalytics(analyticsDays)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Load Analytics
              </button>
            </div>
          )}
        </div>

        {/* Bounced Emails Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#012C61]">🚫 Bounced Emails</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchBouncedEmails(analyticsDays)}
                disabled={bouncedLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center space-x-2"
              >
                {bouncedLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh Bounced</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {bouncedError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                <span className="text-red-700">{bouncedError}</span>
              </div>
              <p className="text-sm text-red-600 mt-2">
                Failed to fetch bounced emails from Brevo. Check your API configuration.
              </p>
            </div>
          )}

          {bouncedEmails.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-red-800 mb-2">⚠️ Bounced Email Summary</h4>
                    <p className="text-sm text-red-700">
                      Found <strong>{bouncedEmails.length}</strong> unique email addresses that bounced in the last {analyticsDays} days.
                      These emails should be removed from your mailing lists to maintain good deliverability.
                    </p>
                  </div>
                  <div className="text-red-500 text-4xl">📧</div>
                </div>
              </div>

              {/* Bounced Emails Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Email Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Bounce Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Count</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Latest Bounce</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bouncedEmails.slice(0, 50).map((bounce: any, index: number) => (
                      <tr key={index} className="hover:bg-red-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{bounce.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            bounce.bounceTypes.includes('Hard Bounce') 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bounce.bounceTypes.join(', ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{bounce.bounceCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(bounce.latestBounce.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={bounce.reasons.join(', ')}>
                          {bounce.reasons.join(', ')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteEmail("test_email_list", bounce.email)}
                              className="text-red-600 hover:text-red-800 text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                              title="Remove from test list"
                            >
                              Remove from Test
                            </button>
                            <button
                              onClick={() => handleDeleteEmail("marketing_email_list", bounce.email)}
                              className="text-red-600 hover:text-red-800 text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                              title="Remove from marketing list"
                            >
                              Remove from Marketing
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bouncedEmails.length > 50 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Showing first 50 of {bouncedEmails.length} bounced emails
                </div>
              )}

              {/* Bounce Types Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">📋 Bounce Types Explained</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-red-700">Hard Bounce:</strong>
                    <p className="text-gray-600">Permanent delivery failure. Email address doesn't exist or domain is invalid. Remove immediately.</p>
                  </div>
                  <div>
                    <strong className="text-yellow-700">Soft Bounce:</strong>
                    <p className="text-gray-600">Temporary delivery failure. Mailbox full, server down, etc. Monitor and remove if it persists.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bouncedLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bounced emails...</p>
            </div>
          )}

          {!bouncedLoading && bouncedEmails.length === 0 && !bouncedError && (
            <div className="text-center py-12">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <p className="text-gray-600 mb-4">No bounced emails found in the last {analyticsDays} days!</p>
              <p className="text-sm text-gray-500">This is good - it means your email list is clean and your deliverability is healthy.</p>
            </div>
          )}
        </div>

        {/* Contact Statistics Section */}
        <div className="bg-white shadow-xl rounded-lg p-8 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              👥 Contact Statistics
              <span className="text-sm font-normal text-gray-500">({contactStats.length} contacts)</span>
            </h3>
            {contactStatsError && (
              <span className="text-red-600 text-sm">⚠️ {contactStatsError}</span>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by email address..."
              value={contactStatsSearch}
              onChange={(e) => setContactStatsSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {contactStatsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">⚠️ {contactStatsError}</p>
            </div>
          )}

          {!contactStatsError && contactStats.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">📊 Contact Performance Summary</h4>
                    <p className="text-sm text-blue-700">
                      Showing email engagement data for <strong>{contactStats.length}</strong> unique contacts in the last {analyticsDays} days.
                    </p>
                  </div>
                  <div className="text-blue-500 text-4xl">📈</div>
                </div>
              </div>

              {/* Contact Stats Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Opened</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Clicked</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Bounced</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Spam</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Unsub</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contactStats
                      .filter(contact => 
                        contactStatsSearch === "" || 
                        contact.email.toLowerCase().includes(contactStatsSearch.toLowerCase())
                      )
                      .map((contact: any, index: number) => {
                        const openRate = contact.sent > 0 ? ((contact.opened / contact.sent) * 100).toFixed(1) : '0.0';
                        const clickRate = contact.sent > 0 ? ((contact.clicked / contact.sent) * 100).toFixed(1) : '0.0';
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{contact.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{contact.sent}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className={contact.opened > 0 ? 'text-green-700 font-medium' : 'text-gray-500'}>
                                  {contact.opened}
                                </span>
                                <span className="text-xs text-gray-500">({openRate}%)</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className={contact.clicked > 0 ? 'text-blue-700 font-medium' : 'text-gray-500'}>
                                  {contact.clicked}
                                </span>
                                <span className="text-xs text-gray-500">({clickRate}%)</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={contact.bounced > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                {contact.bounced}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={contact.spam > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                                {contact.spam}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={contact.unsubscribed > 0 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                                {contact.unsubscribed}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {contact.lastActivity ? new Date(contact.lastActivity).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>


              {/* Stats Legend */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">📋 Metrics Explained</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong className="text-green-700">Opened:</strong>
                    <p className="text-gray-600">Number and percentage of emails the contact opened.</p>
                  </div>
                  <div>
                    <strong className="text-blue-700">Clicked:</strong>
                    <p className="text-gray-600">Number and percentage of emails where the contact clicked a link.</p>
                  </div>
                  <div>
                    <strong className="text-red-700">Bounced:</strong>
                    <p className="text-gray-600">Emails that failed to deliver to this contact.</p>
                  </div>
                  <div>
                    <strong className="text-orange-700">Spam:</strong>
                    <p className="text-gray-600">Number of times the contact marked emails as spam.</p>
                  </div>
                  <div>
                    <strong className="text-purple-700">Unsub:</strong>
                    <p className="text-gray-600">Number of times the contact unsubscribed.</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">Last Activity:</strong>
                    <p className="text-gray-600">Most recent email interaction date.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {contactStatsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading contact statistics...</p>
            </div>
          )}

          {!contactStatsLoading && contactStats.length === 0 && !contactStatsError && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <p className="text-gray-600 mb-4">No contact data found in the last {analyticsDays} days.</p>
              <p className="text-sm text-gray-500">Send some emails to start tracking contact engagement.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
