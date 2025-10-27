"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import Footer from "@/app/components/footer";
import { CreditCard, CheckCircle, Mail, Shield, ArrowLeft } from "lucide-react"; // Added new icons
import SubscriptionTermsModal from '@/app/components/SubscriptionTermsModal';
import RoleConfirmationModal from '@/app/components/RoleConfirmationModal';
import MockStripeCard from '@/app/components/MockStripeCard';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const StripePricingTableWithFooter = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showServiceAgreement, setShowServiceAgreement] = useState(false);
  const [serviceAgreementAccepted, setServiceAgreementAccepted] = useState(false);
  const [showRoleConfirmation, setShowRoleConfirmation] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const [showStripeTable, setShowStripeTable] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showRedirectBanner, setShowRedirectBanner] = useState(false);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  
  // Email verification states
  const [emailToVerify, setEmailToVerify] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'email' | 'code' | 'complete'>('email');
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState("");
  const [cooldownTimer, setCooldownTimer] = useState<number>(0);
  // resend cooldown UI
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (cooldownTimer <= 0) return;
    const t = setInterval(() => setCooldownTimer((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldownTimer]);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    companyType: "",
    providerType: "",
    howDidYouHear: "",
    interest: "",
    demoRequest: "No",
    accountRole: "",
    primaryUserEmail: "",
  });
  const [selectedRole, setSelectedRole] = useState<'user' | 'subscription_manager' | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formFilled, setFormFilled] = useState(false);
  const [isFormPreFilled, setIsFormPreFilled] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isSubUser, setIsSubUser] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Authenticated users can proceed with form pre-filling and email verification
  useEffect(() => {
    if (auth.isAuthenticated && auth.userEmail) {
      fetchFormData(auth.userEmail);
      // If user is authenticated, mark email as verified for convenience
      setIsEmailVerified(true);
      setVerificationStep('complete');
    }
  }, [auth.isAuthenticated, auth.userEmail]);

  // Fix - remove blocking classes and React Hot Toast toaster
  useEffect(() => {
    // Remove blocking classes from body
    document.body.classList.remove('no-right-click');
    document.body.classList.add('debug-mode');
    
    // Remove the React Hot Toast toaster that's blocking clicks
    const removeToaster = () => {
      const toaster = document.querySelector('[data-rht-toaster]');
      if (toaster) {
        console.log('🔥 Removing React Hot Toast toaster that blocks clicks');
        toaster.remove();
      }
    };
    
    // Run multiple times to ensure it's removed
    removeToaster();
    setTimeout(removeToaster, 100);
    setTimeout(removeToaster, 500);
    setTimeout(removeToaster, 1000);
    
    // Watch for it being added back
    const observer = new MutationObserver(removeToaster);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    // Dynamically load the Stripe Pricing Table script
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Remove purchase restrictions - allow all users to access Stripe table
  const canProceedToPurchase = true;
  const disablePurchase = false;



  // Fetch existing form data when the page loads or when the user's email changes
  useEffect(() => {
    if (auth.userEmail) {
      fetchFormData(auth.userEmail);
      checkRedirectReason();
    }
  }, [auth.userEmail]);

  const fetchFormData = async (email: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/registrationform?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status !== 404) {
          console.error("Error fetching form data:", result.error);
        }
      } else if (result.data) {
        // If form data exists, mark the form as filled
        setFormFilled(true);
        setIsFormPreFilled(true); // Mark that form was pre-filled
        setFormData({
          firstName: result.data.firstname || "",
          lastName: result.data.lastname || "",
          companyName: result.data.companyname || "",
          companyType: result.data.companytype || "",
          providerType: result.data.providertype || "",
          howDidYouHear: result.data.howdidyouhear || "",
          interest: result.data.interest || "",
          demoRequest: result.data.demorequest || "No",
          accountRole: result.data.account_role || "",
          primaryUserEmail: result.data.primary_user_email || "",
        });
      } else {
        // If no data is found, mark the form as not filled
        setFormFilled(false);
        setIsFormPreFilled(false);
      }
    } catch (err) {
      console.error("Unexpected error during form data fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModalVisibility = () => {
    console.log('🔴 Terms and Conditions button clicked!');
    setShowTerms(!showTerms); // Toggle modal visibility
  };

  const handleMockSubscribeClick = () => {
    toast.error("Please complete the registration form above to proceed with payment", {
      duration: 4000,
      position: "top-center",
    });
  };

  // Check user subscription status and set redirect reason
  const checkRedirectReason = async () => {
    if (!auth.isAuthenticated || !auth.userEmail) return;

    try {
      // Check if user has active subscription
      const subscriptionResponse = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.userEmail }),
      });

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        if (subscriptionData.status === 'active') {
          // User has active subscription, no redirect reason
          return;
        }
      }

      // Check user role and subscription status
      const roleResponse = await fetch("/api/user-role");
      if (roleResponse.ok) {
        const { role } = await roleResponse.json();
        
        if (role === 'subscription_manager') {
          setRedirectReason('subscription_manager_no_subscription');
        } else if (role === 'sub_user') {
          // Check subscription_users table for primary user info
          const subUserResponse = await fetch("/api/subscription-users");
          if (subUserResponse.ok) {
            const subUserData = await subUserResponse.json();
            if (subUserData.primaryUser) {
              setRedirectReason('sub_user_no_primary_subscription');
              setRedirectReason(`sub_user_no_primary_subscription:${subUserData.primaryUser}`);
            } else {
              setRedirectReason('sub_user_no_primary');
            }
          }
        } else {
          setRedirectReason('primary_user_no_subscription');
        }
      }
    } catch (error) {
      console.error("Error checking redirect reason:", error);
    }
  };

  const scrollToElementById = (elementId: string) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(elementId);
    if (el && 'scrollIntoView' in el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If redirected with must_complete_form=1, show banner and guide to next step
  useEffect(() => {
    const flag = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('must_complete_form') : null;
    const formCompleted = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('form_completed') : null;
    
    if (flag === '1') {
      setShowRedirectBanner(true);
      // Guide user to the appropriate step
      setTimeout(() => {
        if (!auth.isAuthenticated) {
          if (!isEmailVerified) {
            setVerificationStep('email');
            scrollToElementById('email-verification');
          } else if (!formFilled) {
            setVerificationStep('complete');
            scrollToElementById('registration-form');
          }
        } else if (!formFilled) {
          scrollToElementById('registration-form');
        }
      }, 150);
    }

    // Handle form_completed=1 parameter - pre-fill form with existing data
    if (formCompleted === '1' && auth.isAuthenticated && auth.userEmail) {
      loadExistingFormData();
    }
  }, [auth.isAuthenticated, isEmailVerified, formFilled, auth.userEmail]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Load existing form data when user is redirected with form_completed=1
  const loadExistingFormData = async () => {
    if (!auth.userEmail) return;
    
    try {
      const response = await fetch(`/api/registrationform?email=${encodeURIComponent(auth.userEmail)}`);
      const result = await response.json();

      if (!response.ok) {
        console.log("No existing form data found:", result.error);
        return;
      }

      if (result.data) {
        console.log("✅ Loading existing form data:", result.data);
        // Pre-fill the form with existing data
        setFormData({
          firstName: result.data.firstname || "",
          lastName: result.data.lastname || "",
          companyName: result.data.companyname || "",
          companyType: result.data.companytype || "",
          providerType: result.data.providertype || "",
          howDidYouHear: result.data.howdidyouhear || "",
          interest: result.data.interest || "",
          demoRequest: result.data.demorequest || "No",
          accountRole: result.data.account_role || "",
          primaryUserEmail: result.data.primary_user_email || "",
        });
        setFormFilled(true); // Mark form as already filled
        setIsFormPreFilled(true); // Mark that form was pre-filled
        toast.success("Form data loaded from previous submission");
        
        // Show a banner that form was pre-filled
        setShowRedirectBanner(true);
      }
    } catch (err) {
      console.error("Error loading existing form data:", err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Show role confirmation dialog for first-time submission
      if (!formSubmitted && formData.accountRole) {
        // Close any other modals first and wait for DOM to settle
        setShowTerms(false);
        setShowServiceAgreement(false);
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setShowRoleConfirmation(true);
          });
        });
        return;
      }
      
      // Proceed with actual form submission
      await submitForm();
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle error gracefully
    }
  };

  const submitForm = async () => {
    // Determine which email to use for saving the form
    const targetEmail = auth.isAuthenticated && auth.userEmail
      ? auth.userEmail
      : (isEmailVerified && emailToVerify ? emailToVerify : null);

    if (!targetEmail) {
      toast.error("Please verify your email to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/registrationform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          firstname: formData.firstName,
          lastname: formData.lastName,
          companyname: formData.companyName,
          companytype: formData.companyType,
          providertype: formData.providerType,
          howdidyouhear: formData.howDidYouHear,
          interest: formData.interest,
          demorequest: formData.demoRequest,
          account_role: formData.accountRole,
          primary_user_email: formData.primaryUserEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error saving form data:", result.error);
        toast.error("Failed to save form data. Please try again.");
        return;
      }

      console.log(`✅ Form ${result.action}:`, result.data);

      // Success - form saved/updated
      setFormFilled(true);
      setFormSubmitted(true);
      
      if (!auth.isAuthenticated) {
        toast.success("Form submitted. Please create your account to continue.");
        try {
          document.cookie = `mr_form_complete=1; path=/; max-age=${60 * 60}; samesite=Lax`;
          sessionStorage.setItem('mr_form_complete', '1');
        } catch {}
        router.push("/api/auth/register");
        return;
      }
      
      // Store the selected role and proceed to subscription
      if (formData.accountRole) {
        try {
          localStorage.setItem('mr_selected_role', formData.accountRole);
          sessionStorage.setItem('mr_selected_role', formData.accountRole);
        } catch (error) {
          console.warn('Could not store selected role:', error);
        }
        setShowStripeTable(true);
        scrollToElementById('pricing-table');
        toast.success("Form submitted! Proceeding to subscription.");
      } else {
        toast.error("Please select an account role.");
      }
    } catch (err) {
      console.error("Unexpected error during form submission:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRole = async () => {
    try {
      // Close modal first
      setShowRoleConfirmation(false);
      
      // Wait for DOM to settle before form submission
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await submitForm();
    } catch (error) {
      console.error('Error confirming role:', error);
      setShowRoleConfirmation(false);
    }
  };

  const handleCancelRole = () => {
    setShowRoleConfirmation(false);
  };

  useEffect(() => {
    const testTableDetection = async () => {
      try {
        const response = await fetch('/api/registrationform?email=test@example.com');
        const result = await response.json();

        if (response.ok || response.status === 404) {
          console.log("Table detected. API working.");
        } else {
          console.error("Error testing registrationform API:", result.error);
        }
      } catch (err) {
        console.error("Unexpected error during table detection:", err);
      }
    };

    testTableDetection();
  }, []);

  // Cleanup effect to ensure modals are closed on unmount
  useEffect(() => {
    return () => {
      setShowTerms(false);
      setShowServiceAgreement(false);
      setShowRoleConfirmation(false);
    };
  }, []);

  // Prevent multiple modals from being open at the same time
  useEffect(() => {
    if (showTerms) {
      setShowServiceAgreement(false);
      setShowRoleConfirmation(false);
    }
  }, [showTerms]);

  useEffect(() => {
    if (showServiceAgreement) {
      setShowTerms(false);
      setShowRoleConfirmation(false);
    }
  }, [showServiceAgreement]);

  useEffect(() => {
    if (showRoleConfirmation) {
      setShowTerms(false);
      setShowServiceAgreement(false);
    }
  }, [showRoleConfirmation]);

  // Removed global error handler to prevent interference with normal page interactions

  // Removed subscription checking - allow all users to subscribe

  // Removed sub-user checking - allow all users to subscribe

  // Email verification functions (real via Brevo-backed API)
  const handleSendVerificationCode = async () => {
    if (!emailToVerify) {
      setVerificationError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToVerify)) {
      setVerificationError("Please enter a valid email address");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      console.log("🚀 Sending verification email to:", emailToVerify);
      
      const res = await fetch('/api/email-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify })
      });
      
      console.log("📡 API Response Status:", res.status);
      
      const data = await res.json();
      console.log("📦 API Response Data:", data);
      
      if (!res.ok || !data.success) {
        // Handle rate limiting with a more user-friendly message
        if (res.status === 429 && data.error?.includes('Please wait')) {
          setVerificationError(data.error);
          console.log("⏰ Rate limited:", data.error);
          // Extract cooldown time from error message
          const match = data.error.match(/(\d+)s/);
          if (match) {
            setCooldownTimer(parseInt(match[1]));
          }
        } else {
          console.log("❌ API Error:", data.error);
          throw new Error(data.error || 'Failed to send verification');
        }
        return;
      }
      
      console.log("✅ API call successful");
      
      if (data.messageId) {
        console.log("📨 Brevo Message ID:", data.messageId);
      }
      
      setVerificationStep('code');
      setVerificationSuccess("Verification code sent! Check your email.");
      setTimeout(() => setVerificationSuccess(""), 3000);
      setResendCooldown(60);
    } catch (error) {
      console.error("Error sending verification code:", error);
      setVerificationError("Failed to send verification code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    try {
      const res = await fetch('/api/email-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, code: verificationCode })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }
      setIsEmailVerified(true);
      setVerificationStep('complete');
      setVerificationSuccess("Email verified successfully!");
      setTimeout(() => setVerificationSuccess(""), 3000);
    } catch (error) {
      console.error("Error verifying code:", error);
      setVerificationError("Invalid or expired verification code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setEmailToVerify("");
    setVerificationCode("");
    setVerificationStep('email');
    setIsEmailVerified(false);
    setVerificationError("");
    setVerificationSuccess("");
  };

  // Function to handle subscription button click - simplified to allow all clicks
  const handleSubscribeClick = async () => {
    console.log('🔴 Subscribe button clicked!');
    // Simply scroll to pricing table - remove all restrictions
    scrollToElementById('pricing-table');
  };

  // Function to handle subscription button click for non-authenticated users - simplified
  const handleNonAuthSubscribeClick = () => {
    // Simply scroll to pricing table - remove all restrictions
    scrollToElementById('pricing-table');
  };

  // Clean, targeted CSS to fix only the blocking issues
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide ONLY loader overlays that block the page */
      .loader-overlay {
        display: none !important;
      }
      
      /* Override no-right-click class for interactive elements */
      .no-right-click button,
      .no-right-click input,
      .no-right-click a,
      .no-right-click select,
      .no-right-click textarea {
        pointer-events: auto !important;
        user-select: auto !important;
      }
      
      /* Enable debug mode interactions */
      .debug-mode button,
      .debug-mode input,
      .debug-mode a,
      .debug-mode select,
      .debug-mode textarea {
        pointer-events: auto !important;
        user-select: auto !important;
      }
    `;
    document.head.appendChild(style);
    
      // Clean up blocking elements silently
      setTimeout(() => {
        // Remove any loader overlays
        const loaderOverlays = document.querySelectorAll('.loader-overlay');
        loaderOverlays.forEach(overlay => overlay.remove());
        
        // Check and fix React Hot Toast toaster
        const toaster = document.getElementById('_rht_toaster');
        if (toaster) {
          toaster.style.pointerEvents = 'none';
          toaster.style.zIndex = '-1';
        }
      }, 1000);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <>
      <div className="subscribe-page flex flex-col min-h-screen" style={{
        pointerEvents: "auto",
        userSelect: "auto",
        WebkitUserSelect: "auto",
        MozUserSelect: "auto",
        zIndex: 1,
        position: "relative"
      } as React.CSSProperties}>
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-24" style={{
        pointerEvents: "auto",
        userSelect: "auto",
        zIndex: 1,
        position: "relative"
      } as React.CSSProperties}>
        <Toaster position="top-center" />
        
        {/* Logout Button - Only visible when authenticated */}
        {auth.isAuthenticated && (
          <div className="w-full max-w-4xl mb-4 flex justify-end">
            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 border border-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Log Out
            </a>
          </div>
        )}

        {/* Redirect Reason Banner */}
        {redirectReason && (
          <div className="w-full max-w-4xl mx-auto mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  {redirectReason === 'primary_user_no_subscription' && "No Active Subscription Found"}
                  {redirectReason === 'subscription_manager_no_subscription' && "Subscription Manager - No Active Subscription"}
                  {redirectReason.startsWith('sub_user_no_primary_subscription') && "Sub User - Primary User Has No Active Subscription"}
                  {redirectReason === 'sub_user_no_primary' && "Sub User - No Primary User Associated"}
                </h3>
                <div className="text-amber-700 space-y-2">
                  {redirectReason === 'primary_user_no_subscription' && (
                    <p>Currently you don't have a subscription for your email address. Please complete the registration form <button onClick={() => scrollToElementById('pricing-table')} className="text-amber-800 underline hover:text-amber-900 font-medium">below</button> to create a new subscription.</p>
                  )}
                  {redirectReason === 'subscription_manager_no_subscription' && (
                    <p>As a Subscription Manager, you currently don't have an active subscription. Please create a new subscription <button onClick={() => scrollToElementById('pricing-table')} className="text-amber-800 underline hover:text-amber-900 font-medium">below</button>.</p>
                  )}
                  {redirectReason.startsWith('sub_user_no_primary_subscription') && (
                    <p>The primary user associated with your account ({redirectReason.split(':')[1]}) doesn't have an active subscription. Please contact them to renew their subscription or create a new subscription <button onClick={() => scrollToElementById('pricing-table')} className="text-amber-800 underline hover:text-amber-900 font-medium">below</button>.</p>
                  )}
                  {redirectReason === 'sub_user_no_primary' && (
                    <p>You are registered as a sub user but no primary user is associated with your account. Please contact support or create a new subscription <button onClick={() => scrollToElementById('pricing-table')} className="text-amber-800 underline hover:text-amber-900 font-medium">below</button>.</p>
                  )}
                  <p className="text-sm mt-3">
                    <strong>Need assistance?</strong> If you have any questions or need support, please email us at{' '}
                    <a href="mailto:contact@medirate.net" className="text-amber-800 underline hover:text-amber-900">
                      contact@medirate.net
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRedirectBanner && (
          <div className="w-full max-w-4xl mb-6 p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-yellow-900 font-semibold">
                  {isFormPreFilled 
                    ? "✅ Form data loaded from previous submission" 
                    : "Please finish these steps before creating your account"
                  }
                </p>
                {!isFormPreFilled && (
                  <ul className="mt-2 list-disc ml-6 text-yellow-900 text-sm space-y-1">
                    <li>Verify your email address</li>
                    <li>Complete the short registration form</li>
                    <li>Then you'll create your account and proceed to payment</li>
                  </ul>
                )}
                {isFormPreFilled && (
                  <p className="mt-2 text-yellow-900 text-sm">
                    Your previous form submission has been loaded. You can review and update the information if needed, or proceed to subscription.
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowRedirectBanner(false)}
                className="text-yellow-900 text-sm underline"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {!auth.isAuthenticated && !isEmailVerified && (
                <button
                  onClick={() => { setVerificationStep('email'); scrollToElementById('email-verification'); }}
                  className="bg-[#012C61] text-white px-4 py-2 rounded-md"
                >
                  Go to email verification
                </button>
              )}
              {((!auth.isAuthenticated && isEmailVerified && !formFilled) || (auth.isAuthenticated && !formFilled)) && (
                <button
                  onClick={() => { setVerificationStep('complete'); scrollToElementById('registration-form'); }}
                  className="bg-[#012C61] text-white px-4 py-2 rounded-md"
                >
                  Go to registration form
                </button>
              )}
              {isFormPreFilled && formFilled && (
                <button
                  onClick={() => scrollToElementById('registration-form')}
                  className="bg-[#012C61] text-white px-4 py-2 rounded-md"
                >
                  Review/Edit Form
                </button>
              )}
            </div>
          </div>
        )}
        {/* Subscription Status Banner - Removed restrictions, show for all users if they want to see it */}

        {/* Subscription Details - Always Visible */}
        <div className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-[#012C61] text-center font-lemonMilkRegular">Subscription Models</h2>
          <p className="text-lg mb-10 text-gray-600 text-center">
            MediRate offers a comprehensive subscription plan designed to meet your company's needs:
          </p>
          <div className="max-w-xl mx-auto">
            <div className="p-8 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-6 text-[#012C61] font-lemonMilkRegular tracking-wide text-center">Professional Plan</h3>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  <strong>Annual Payment Discount:</strong> Save 10% when you pay for a full year upfront - <strong>$8,100</strong>
                </p>
              </div>
              <ul className="space-y-5 w-full max-w-md">
                <li className="flex items-start gap-3 text-base text-gray-800">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Three user accounts included (Subscription Manager role does not count toward this limit)</span>
                </li>
                <li className="flex items-start gap-3 text-base text-gray-800">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Access to payment rate data for 50 states and the District of Columbia</span>
                </li>
                <li className="flex items-start gap-3 text-base text-gray-800">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-left">
                    Access to MediRate's comprehensive reimbursement rate database and tracking tools including:
                    <ul className="list-disc ml-8 mt-2 space-y-1 text-gray-700 text-base">
                      <li>Historical payment rate data</li>
                      <li>Multi-state rate comparisons</li>
                      <li>Provider bulletins and other payment rate-related communications</li>
                      <li>Reimbursement-related legislative activity</li>
                    </ul>
                  </span>
                </li>
                <li className="flex items-start gap-3 text-base text-gray-800">
                    <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-left">
                    Customizable email alerts for real-time updates on topics and states of your choice
                    </span>
                </li>
              </ul>
              
              {/* User Types and Subscription Structure Explanation */}
              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800 mb-4">MediRate User Types & Subscription Structure</h4>
                
                <div className="text-sm text-blue-700 space-y-4">
                  <div>
                    <p className="font-semibold mb-2">MediRate offers three user types:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li><strong>Subscription Manager:</strong> Manages billing and user access only (cannot use application features)</li>
                      <li><strong>Primary User:</strong> Full access to application features and can manage users</li>
                      <li><strong>Secondary User:</strong> Full access to application features (managed by Subscription Manager or Primary User)</li>
              </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Subscription Slot Allocation (3 users maximum per subscription):</p>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="mb-2"><strong>Option 1: With Subscription Manager</strong></p>
                      <ul className="list-disc ml-4 space-y-1 text-xs">
                        <li>1 Subscription Manager (does not count toward user limit)</li>
                        <li>3 Secondary Users (full application access)</li>
                        <li><strong>Total: 3 application users + 1 manager</strong></li>
                      </ul>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-blue-200 mt-3">
                      <p className="mb-2"><strong>Option 2: With Primary User</strong></p>
                      <ul className="list-disc ml-4 space-y-1 text-xs">
                        <li>1 Primary User (uses 1 slot, can manage others)</li>
                        <li>2 Secondary Users (full application access)</li>
                        <li><strong>Total: 3 application users</strong></li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700">
                      <strong>💡 Recommendation:</strong> If you need a dedicated billing manager who won't use the application, choose Subscription Manager. If you want to use the application yourself and manage others, choose Primary User. And if you want to be a Secondary User under an active subscription, contact your Subscription Manager/Primary User and ask them to add your email in the slot under Settings and then you can directly log into the application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 flex space-x-4 justify-center">
              <button
                onClick={handleSubscribeClick}
                className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
              style={{ pointerEvents: "auto", userSelect: "auto" }}
              >
                Subscribe Now
              </button>
            <a
              href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1QOXygd6Dpekn_BDsmrizOLq3D9aX8iq_aopMjF5o4Z2_APztYi8VXo5QMn2ab0sDZ5rTX18ii"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
              style={{ pointerEvents: "auto", userSelect: "auto" }}
            >
              Schedule a Live Presentation
            </a>
          </div>
        </div>

        {/* Email Verification Section - Show for all users who want to verify email */}
        {verificationStep === 'email' && (
          <div id="email-verification" className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#012C61] font-lemonMilkRegular">Verify Your Email</h2>
              <p className="text-gray-600">
                Please verify your email address to proceed with the subscription process
              </p>
              {/* Info note */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  We will email you a verification code to continue.
                </p>
              </div>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={emailToVerify}
                  onChange={(e) => setEmailToVerify(e.target.value)}
                  disabled={formSubmitted}
                  placeholder="Enter your email address"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
              
              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{verificationError}</p>
                </div>
              )}

              
              <button
                onClick={handleSendVerificationCode}
                disabled={isVerifying || !emailToVerify || cooldownTimer > 0}
                className="w-full bg-[#012C61] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "Sending..." : cooldownTimer > 0 ? `Wait ${cooldownTimer}s` : "Send Verification Code"}
              </button>
            </div>
          </div>
        )}

        {/* Verification Code Input Section */}
        {verificationStep === 'code' && (
          <div className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#012C61] font-lemonMilkRegular">Enter Verification Code</h2>
              <p className="text-gray-600">
                We've sent a 6-digit verification code to <strong>{emailToVerify}</strong>
              </p>
              <div className="mt-2 text-sm text-gray-600 text-center">
                Enter the 6-digit code we sent to your email.
              </div>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={formSubmitted}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all text-center text-lg tracking-widest"
                  required
                />
              </div>
              
              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{verificationError}</p>
                </div>
              )}
              
              {verificationSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">{verificationSuccess}</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={resetVerification}
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-gray-600 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={isVerifying || !verificationCode}
                  className="flex-1 bg-[#012C61] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Verify Code"}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => resendCooldown === 0 && handleSendVerificationCode()}
                  disabled={resendCooldown > 0}
                  className="text-blue-600 text-sm hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification code'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form - Show for all users after email verification */}
        {verificationStep === 'complete' && !showStripeTable && (
          <div id="registration-form" className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#012C61] font-lemonMilkRegular">
                {isFormPreFilled ? "✅ Form Previously Submitted" : "Email Verified!"}
              </h2>
              <p className="text-gray-600">
                {isFormPreFilled 
                  ? "Your previous form data has been loaded. Review and update if needed, then submit to proceed."
                  : "Please complete the registration form to proceed with your subscription"
                }
              </p>
            </div>
            
            {isFormPreFilled && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 text-center">
                  <strong>✓ Form Previously Submitted:</strong> Your previous submission has been loaded. You can review and update the information below.
                </p>
              </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select Company Type</option>
                  <option value="Medicaid provider">Medicaid provider</option>
                  <option value="Healthcare IT">Healthcare IT</option>
                  <option value="Consulting firm">Consulting firm</option>
                  <option value="Law firm">Law firm</option>
                  <option value="Advocacy organization">Advocacy organization</option>
                  <option value="Foundation/research organization">Foundation/research organization</option>
                  <option value="Investment firm/investment advisory">Investment firm/investment advisory</option>
                  <option value="Governmental agency - state">Governmental agency - state</option>
                  <option value="Governmental agency - federal">Governmental agency - federal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.companyType === "Medicaid provider" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                  <input
                    type="text"
                    name="providerType"
                    value={formData.providerType}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about MediRate?</label>
                <select
                  name="howDidYouHear"
                  value={formData.howDidYouHear}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select how you heard about MediRate</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Word of Mouth">Word of Mouth</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What Medicaid rate information are you most interested in searching/tracking?</label>
                <textarea
                  name="interest"
                  value={formData.interest}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Would you like to set up a demo to learn more about MediRate?</label>
                <select
                  name="demoRequest"
                  value={formData.demoRequest}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Role</label>
                <select
                  name="accountRole"
                  value={formData.accountRole}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select your account role</option>
                  <option value="subscription_manager">Subscription Manager - Manage subscription and users only</option>
                  <option value="user">User Account - Full access to application and subscription</option>
                  <option value="sub_user">Sub User - Join someone else's subscription</option>
                </select>
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <p><strong>Subscription Manager:</strong> Choose this if you only wish to manage the subscription and be able to add/delete users while giving your company members access to the application itself. You will not have access to application data.</p>
                  <p><strong>User Account:</strong> Choose this if you don't wish for a subscription manager to be tied to a subscription. You will be able to add/delete users and also use the application, but one of the slots in the subscription will be used by you.</p>
                  <p><strong>Sub User:</strong> Choose this if you just wish to use someone else's subscription and they have added you as a sub user.</p>
                </div>
              </div>
              
              {/* Primary User Email Input - Only show for Sub User role */}
              {formData.accountRole === 'sub_user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary User Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="primaryUserEmail"
                    value={formData.primaryUserEmail}
                    onChange={handleFormChange}
                    placeholder="Enter the email of the subscription manager or primary user"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the email address of the main user or subscription manager of the subscription you wish to join.
                  </p>
                </div>
              )}
              {/* Service Agreement Checkbox */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="serviceAgreement"
                    checked={serviceAgreementAccepted}
                    onChange={(e) => setServiceAgreementAccepted(e.target.checked)}
                    disabled={formSubmitted}
                    className="mt-1 h-4 w-4 text-[#012C61] border-gray-300 rounded focus:ring-[#012C61]"
                    required
                  />
                  <div className="flex-1">
                    <label htmlFor="serviceAgreement" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowServiceAgreement(true)}
                        className="text-[#012C61] underline hover:text-blue-800"
                      >
                        MediRate Service Agreement
                      </button>
                      {' '}and understand the terms of my subscription.
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!serviceAgreementAccepted || formSubmitted}
                  className={`px-8 py-3 rounded-lg transition-all duration-300 ${
                    serviceAgreementAccepted && !formSubmitted
                      ? 'bg-[#012C61] text-white hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {formSubmitted ? "Form Submitted ✓" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registration Form - Show for authenticated users who haven't filled form OR when form is pre-filled (but not if already shown above) */}
        {auth.isAuthenticated && (!formFilled || isFormPreFilled) && !showStripeTable && verificationStep !== 'complete' && (
          <div id="registration-form" className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold mb-8 text-[#012C61] text-center font-lemonMilkRegular">
              {isFormPreFilled ? "✅ Form Previously Submitted - Review & Submit" : "Please Complete the Form to Proceed"}
            </h2>
            
            {isFormPreFilled && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 text-center">
                  <strong>✓ Form Previously Submitted:</strong> Your previous submission has been loaded. You can review and update the information below.
                </p>
              </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select Company Type</option>
                  <option value="Medicaid provider">Medicaid provider</option>
                  <option value="Healthcare IT">Healthcare IT</option>
                  <option value="Consulting firm">Consulting firm</option>
                  <option value="Law firm">Law firm</option>
                  <option value="Advocacy organization">Advocacy organization</option>
                  <option value="Foundation/research organization">Foundation/research organization</option>
                  <option value="Investment firm/investment advisory">Investment firm/investment advisory</option>
                  <option value="Governmental agency - state">Governmental agency - state</option>
                  <option value="Governmental agency - federal">Governmental agency - federal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.companyType === "Medicaid provider" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                  <input
                    type="text"
                    name="providerType"
                    value={formData.providerType}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about MediRate?</label>
                <select
                  name="howDidYouHear"
                  value={formData.howDidYouHear}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select how you heard about MediRate</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Word of Mouth">Word of Mouth</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What Medicaid rate information are you most interested in searching/tracking?</label>
                <textarea
                  name="interest"
                  value={formData.interest}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Would you like to set up a demo to learn more about MediRate?</label>
                <select
                  name="demoRequest"
                  value={formData.demoRequest}
                  onChange={handleFormChange}
                    disabled={formSubmitted}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Role</label>
                <select
                  name="accountRole"
                  value={formData.accountRole}
                    onChange={handleFormChange}
                    disabled={formSubmitted}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select your account role</option>
                  <option value="subscription_manager">Subscription Manager - Manage subscription and users only</option>
                  <option value="user">User Account - Full access to application and subscription</option>
                  <option value="sub_user">Sub User - Join someone else's subscription</option>
                </select>
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <p><strong>Subscription Manager:</strong> Choose this if you only wish to manage the subscription and be able to add/delete users while giving your company members access to the application itself. You will not have access to application data.</p>
                  <p><strong>User Account:</strong> Choose this if you don't wish for a subscription manager to be tied to a subscription. You will be able to add/delete users and also use the application, but one of the slots in the subscription will be used by you.</p>
                  <p><strong>Sub User:</strong> Choose this if you just wish to use someone else's subscription and they have added you as a sub user.</p>
                </div>
              </div>
              
              {/* Primary User Email Input - Only show for Sub User role */}
              {formData.accountRole === 'sub_user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary User Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="primaryUserEmail"
                    value={formData.primaryUserEmail}
                    onChange={handleFormChange}
                    placeholder="Enter the email of the subscription manager or primary user"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the email address of the main user or subscription manager of the subscription you wish to join.
                  </p>
                </div>
              )}
              {/* Service Agreement Checkbox */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="serviceAgreement2"
                    checked={serviceAgreementAccepted}
                    onChange={(e) => setServiceAgreementAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#012C61] border-gray-300 rounded focus:ring-[#012C61]"
                    required
                  />
                  <div className="flex-1">
                    <label htmlFor="serviceAgreement2" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowServiceAgreement(true)}
                        className="text-[#012C61] underline hover:text-blue-800"
                      >
                        MediRate Service Agreement
                      </button>
                      {' '}and understand the terms of my subscription.
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!serviceAgreementAccepted || formSubmitted}
                  className={`px-8 py-3 rounded-lg transition-all duration-300 ${
                    serviceAgreementAccepted && !formSubmitted
                      ? 'bg-[#012C61] text-white hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {formSubmitted ? "Form Submitted ✓" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Role Selection Step - REMOVED - Now handled in form */}
        {false && showRoleSelection && (
          <div className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#012C61] font-lemonMilkRegular">Choose Your Account Role</h2>
              <p className="text-gray-600">
                Please select the type of account you want to create for this subscription
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              {/* User Account Option */}
              <div 
                className={`p-6 border-2 rounded-lg transition-all ${
                  formSubmitted 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'cursor-pointer'
                } ${
                  selectedRole === 'user' 
                    ? 'border-[#012C61] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={formSubmitted ? undefined : () => setSelectedRole('user')}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === 'user' ? 'border-[#012C61] bg-[#012C61]' : 'border-gray-300'
                  }`}>
                    {selectedRole === 'user' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">User Account</h3>
                    <p className="text-gray-600 mb-3">
                      Full access to all MediRate features and data
                    </p>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>You will be able to:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Access dashboard and analytics</li>
                        <li>View payment rates and data</li>
                        <li>Use all core application features</li>
                        <li>Set up email alerts</li>
                        <li>Export data and reports</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Manager Option */}
              <div 
                className={`p-6 border-2 rounded-lg transition-all ${
                  formSubmitted 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'cursor-pointer'
                } ${
                  selectedRole === 'subscription_manager' 
                    ? 'border-[#012C61] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={formSubmitted ? undefined : () => setSelectedRole('subscription_manager')}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === 'subscription_manager' ? 'border-[#012C61] bg-[#012C61]' : 'border-gray-300'
                  }`}>
                    {selectedRole === 'subscription_manager' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Manager Account</h3>
                    <p className="text-gray-600 mb-3">
                      Manage users and subscription settings (cannot access application data)
                    </p>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>You will be able to:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Add and remove users from the subscription</li>
                        <li>Manage user roles and permissions</li>
                        <li>View subscription details and billing</li>
                        <li>Update subscription settings</li>
                      </ul>
                      <p className="mt-2 text-amber-600"><strong>You will NOT be able to:</strong></p>
                      <ul className="list-disc ml-4 space-y-1 text-amber-600">
                        <li>Access dashboard or analytics</li>
                        <li>View payment rates or data</li>
                        <li>Use core application features</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700">
                        <strong>💡 Recommendation:</strong> If you want a Subscription Manager, it's best if they purchase the subscription themselves to avoid confusion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    if (selectedRole) {
                      // Store the selected role for the webhook to use
                      try {
                        localStorage.setItem('mr_selected_role', selectedRole);
                        sessionStorage.setItem('mr_selected_role', selectedRole);
                      } catch (error) {
                        console.warn('Could not store selected role:', error);
                      }
                      
                      setShowRoleSelection(false);
                      setShowStripeTable(true);
                      scrollToElementById('pricing-table');
                    }
                  }}
                  disabled={!selectedRole}
                  className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conditional Pricing Display */}
        {formSubmitted || (auth.isAuthenticated && formFilled) ? (
          /* Real Stripe Pricing Table - Only for users who completed the form */
        <div 
          id="pricing-table" 
          className="w-full max-w-4xl transform scale-110 relative"
          style={{ 
            transformOrigin: "center", 
            zIndex: 9999,
            position: "relative",
            pointerEvents: "auto",
            userSelect: "auto"
          }}
        >
          <div style={{
            pointerEvents: "auto",
            userSelect: "auto",
            WebkitUserSelect: "auto",
            MozUserSelect: "auto"
          }}>
          {React.createElement("stripe-pricing-table", {
              "pricing-table-id": "prctbl_1SKcum2NeWrBDfGsTeavkMMT",
              "publishable-key": "pk_test_51QXT6G2NeWrBDfGs1x7v1DgpvI2XDgWhGMH3nmSH5njuB69GHp7yGL7251F7X5TDB2VFZbEdVzf95GNqX0sRKrkF007PMhgJXG",
          })}
          </div>
        </div>
        ) : (
          /* Mock Stripe Card - For users who haven't completed the form */
          <MockStripeCard onSubscribeClick={handleMockSubscribeClick} />
        )}

        {/* Role Update Script - Hidden */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Listen for successful subscription completion
              document.addEventListener('DOMContentLoaded', function() {
                // Check if we have a stored role and user is authenticated
                const checkAndUpdateRole = async () => {
                  try {
                    const storedRole = localStorage.getItem('mr_selected_role') || sessionStorage.getItem('mr_selected_role');
                    if (storedRole && (storedRole === 'user' || storedRole === 'subscription_manager')) {
                      console.log('🎭 Found stored role:', storedRole);
                      console.log('ℹ️ This is from previous testing - clearing stored role');
                      // Clear the stored role to prevent confusion
                      localStorage.removeItem('mr_selected_role');
                      sessionStorage.removeItem('mr_selected_role');
                      return; // Don't proceed with role update
                      
                      // Get current user email (you may need to adjust this based on your auth setup)
                      const userEmail = window.location.search.includes('email=') 
                        ? new URLSearchParams(window.location.search).get('email')
                        : null;
                        
                      if (userEmail) {
                        console.log('📧 Updating role for user:', userEmail);
                        
                        const response = await fetch('/api/update-user-role', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: userEmail, role: storedRole })
                        });
                        
                        if (response.ok) {
                          console.log('✅ Role updated successfully');
                          // Clean up stored role
                          localStorage.removeItem('mr_selected_role');
                          sessionStorage.removeItem('mr_selected_role');
                        } else {
                          console.error('❌ Failed to update role:', await response.text());
                        }
                      }
                    }
                  } catch (error) {
                    console.error('❌ Error updating role:', error);
                  }
                };
                
                // Check immediately and also set up periodic checking
                checkAndUpdateRole();
                setInterval(checkAndUpdateRole, 5000); // Check every 5 seconds
              });
            `
          }}
        />





        {/* Accepted Payment Methods - Always visible */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-md flex items-center space-x-2">
          <span className="text-lg font-semibold">Accepted Payment Methods:</span>
          <CreditCard className="w-6 h-6 text-blue-600" />
          <span className="text-lg">Card</span>
        </div>

        {/* Terms and Conditions Link - Always Visible */}
        <div className="mt-6 text-center">
          <button 
            onClick={formSubmitted ? undefined : toggleModalVisibility} 
            className={`${formSubmitted ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 underline hover:text-blue-800'}`}
            disabled={formSubmitted}
          >
            Terms and Conditions
          </button>
        </div>


      </main>

      {/* Subscription Terms and Conditions Modal */}
      <SubscriptionTermsModal 
        key="terms-modal"
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
      />

      <SubscriptionTermsModal 
        key="service-agreement-modal"
        isOpen={showServiceAgreement} 
        onClose={() => setShowServiceAgreement(false)}
      />

      {/* Role Confirmation Modal */}
      <RoleConfirmationModal
        isOpen={showRoleConfirmation}
        onClose={handleCancelRole}
        onConfirm={handleConfirmRole}
        accountRole={formData.accountRole || ''}
      />

      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
    </>
  );
};

export default StripePricingTableWithFooter;

