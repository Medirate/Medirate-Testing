"use client";

import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import Footer from "@/app/components/footer";
import { CreditCard, CheckCircle, Mail, Shield, ArrowLeft } from "lucide-react"; // Added new icons
import SubscriptionTermsModal from '@/app/components/SubscriptionTermsModal';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const StripePricingTableWithFooter = () => {
  const [showTerms, setShowTerms] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const [showStripeTable, setShowStripeTable] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showRedirectBanner, setShowRedirectBanner] = useState(false);
  
  // Email verification states
  const [emailToVerify, setEmailToVerify] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'email' | 'code' | 'complete'>('email');
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState("");
  // resend cooldown UI
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    companyType: "",
    providerType: "",
    howDidYouHear: "",
    interest: "",
    demoRequest: "No",
  });
  const [selectedRole, setSelectedRole] = useState<'user' | 'subscription_manager' | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isTestMode, setIsTestMode] = useState(process.env.NODE_ENV === 'development');
  const [loading, setLoading] = useState(false);
  const [formFilled, setFormFilled] = useState(false);
  const [isFormPreFilled, setIsFormPreFilled] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isSubUser, setIsSubUser] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

  // Authenticated users can proceed with form pre-filling and email verification
  useEffect(() => {
    if (auth.isAuthenticated && auth.userEmail) {
      fetchFormData(auth.userEmail);
      // If user is authenticated, mark email as verified for convenience
      setIsEmailVerified(true);
      setVerificationStep('complete');
    }
  }, [auth.isAuthenticated, auth.userEmail]);

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
          demoRequest: result.data.demorequest || false,
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
      
      // Show role selection step for authenticated users
      setShowRoleSelection(true);
      toast.success("Form submitted! Please select your account role.");
    } catch (err) {
      console.error("Unexpected error during form submission:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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

  // Removed subscription checking - allow all users to subscribe

  // Removed sub-user checking - allow all users to subscribe

  // Email verification functions (real via Brevo-backed API)
  const handleSendVerificationCode = async () => {
    if (!emailToVerify) {
      setVerificationError("Please enter an email address");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const res = await fetch('/api/email-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification');
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

  // Add global style overrides to ensure everything is clickable and debug overlays
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .subscribe-page * {
        pointer-events: auto !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
      }
      .subscribe-page button, 
      .subscribe-page a, 
      .subscribe-page input, 
      .subscribe-page textarea, 
      .subscribe-page select {
        pointer-events: auto !important;
        cursor: pointer !important;
      }
      .subscribe-page button:disabled {
        pointer-events: none !important;
        cursor: not-allowed !important;
      }
      
      /* Force hide any loader overlays */
      .loader-overlay {
        display: none !important;
      }
      
      /* Override any potential blocking overlays but keep below navbar */
      .subscribe-page {
        position: relative !important;
        z-index: 1 !important;
      }
      
      /* Ensure Stripe table is always clickable */
      #pricing-table,
      #pricing-table *,
      stripe-pricing-table,
      stripe-pricing-table * {
        pointer-events: auto !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
        cursor: pointer !important;
        z-index: 9999 !important;
      }
      
      /* Override any global CSS that might block Stripe table */
      stripe-pricing-table {
        all: unset !important;
        display: block !important;
        pointer-events: auto !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
        cursor: pointer !important;
        z-index: 9999 !important;
        position: relative !important;
      }
      
      /* Ensure Stripe table buttons and links are clickable */
      stripe-pricing-table button,
      stripe-pricing-table a,
      stripe-pricing-table [role="button"] {
        pointer-events: auto !important;
        cursor: pointer !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
      }
      
      /* Fix React Hot Toast toaster blocking clicks */
      #_rht_toaster {
        pointer-events: none !important;
        z-index: -1 !important;
      }
      
      /* Fix toaster children to allow clicks */
      #_rht_toaster > * {
        pointer-events: auto !important;
      }
      
      /* Keep toast notifications clickable but not the container */
      [data-testid="toast"] {
        pointer-events: auto !important;
        z-index: 9999 !important;
        position: relative !important;
      }
    `;
    document.head.appendChild(style);
    
    // Debug: Check for blocking elements and remove them
    setTimeout(() => {
      // Remove any loader overlays
      const loaderOverlays = document.querySelectorAll('.loader-overlay');
      loaderOverlays.forEach(overlay => {
        console.log('🔥 Removing loader overlay:', overlay);
        overlay.remove();
      });
      
      // Check and fix React Hot Toast toaster
      const toaster = document.getElementById('_rht_toaster');
      if (toaster) {
        console.log('🔥 Found React Hot Toast toaster blocking clicks:', toaster);
        console.log('🔥 Toaster computed style:', window.getComputedStyle(toaster));
        
        // Force fix the toaster
        toaster.style.pointerEvents = 'none';
        toaster.style.zIndex = '-1';
        console.log('✅ Fixed toaster pointer events');
      }
      
      // Find any modal backgrounds or overlays
      const overlays = document.querySelectorAll('[style*="position: fixed"], .modal-backdrop, [class*="backdrop"]');
      console.log('🔍 Found potential overlay elements:', overlays);
      
      // Check for elements with high z-index that might be blocking
      const allElements = document.querySelectorAll('*');
      const highZElements = Array.from(allElements).filter(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        const position = window.getComputedStyle(el).position;
        return zIndex !== 'auto' && parseInt(zIndex) > 1000 && (position === 'fixed' || position === 'absolute');
      });
      console.log('🔍 Elements with high z-index:', highZElements);
      
      // Log high z-index elements for debugging (but don't remove them)
      if (highZElements.length > 0) {
        console.log('ℹ️ Found elements with high z-index (this is normal for navbar, etc.):', highZElements);
      }
      
      // Add global click listener to detect any clicks
      const clickListener = (e: MouseEvent) => {
        console.log('🖱️ Click detected at:', e.clientX, e.clientY, 'on element:', e.target);
      };
      document.addEventListener('click', clickListener, true);
      
      return () => {
        document.removeEventListener('click', clickListener, true);
      };
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
              
              {/* Subscription Manager Role Explanation */}
              <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-lg font-semibold text-amber-800 mb-3">Subscription Manager Role</h4>
                <p className="text-sm text-amber-700 mb-3">
                  <strong>Optional:</strong> You can designate one person as a Subscription Manager who can add/remove users but cannot access the application data.
                </p>
                <div className="text-sm text-amber-700 space-y-2">
                  <p><strong>Subscription Manager can:</strong></p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Add and remove users from the subscription</li>
                    <li>Manage user roles within the subscription</li>
                    <li>View subscription details and billing</li>
                  </ul>
                  <p className="mt-2"><strong>Subscription Manager cannot:</strong></p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Access dashboard data or analytics</li>
                    <li>View rates or use core application features</li>
                    <li>Count toward the 3-user limit</li>
                  </ul>
                </div>
                <p className="text-xs text-amber-600 mt-3 font-medium">
                  💡 <strong>Recommendation:</strong> If you want a Subscription Manager, it's best if they purchase the subscription themselves.
                </p>
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
                  type="email"
                  value={emailToVerify}
                  onChange={(e) => setEmailToVerify(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
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
                disabled={isVerifying || !emailToVerify}
                className="w-full bg-[#012C61] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "Sending..." : "Send Verification Code"}
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
                {isFormPreFilled ? "✅ Form Pre-filled" : "Email Verified!"}
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
                  <strong>✓ Form Pre-filled:</strong> Your previous submission has been loaded. You can review and update the information below.
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registration Form - Show for authenticated users who haven't filled form */}
        {auth.isAuthenticated && !formFilled && !showStripeTable && (
          <div id="registration-form" className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold mb-8 text-[#012C61] text-center font-lemonMilkRegular">
              {isFormPreFilled ? "✅ Form Pre-filled - Review & Submit" : "Please Complete the Form to Proceed"}
            </h2>
            
            {isFormPreFilled && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 text-center">
                  <strong>✓ Form Pre-filled:</strong> Your previous submission has been loaded. You can review and update the information below.
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Role Selection Step */}
        {showRoleSelection && (
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
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === 'user' 
                    ? 'border-[#012C61] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole('user')}
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
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === 'subscription_manager' 
                    ? 'border-[#012C61] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole('subscription_manager')}
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

        {/* Test Mode Toggle - Only in Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="w-full max-w-4xl mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">🧪 Development Test Mode</h3>
                <p className="text-sm text-yellow-700">
                  Toggle between test and live pricing tables for testing
                </p>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-yellow-800">Test Mode</span>
              </label>
            </div>
            {isTestMode && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Test Cards:</strong> 4242 4242 4242 4242 (success) | 4000 0000 0000 0002 (declined)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stripe Pricing Table - Always accessible */}
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
            "pricing-table-id": (process.env.NODE_ENV === 'development' && isTestMode)
              ? "prctbl_1SKcum2NeWrBDfGsTeavkMMT" // Test pricing table ID
              : "prctbl_1RBMKo2NeWrBDfGslMwYkTKz",
            "publishable-key": (process.env.NODE_ENV === 'development' && isTestMode)
              ? "pk_test_51QXT6G2NeWrBDfGs1x7v1DgpvI2XDgWhGMH3nmSH5njuB69GHp7yGL7251F7X5TDB2VFZbEdVzf95GNqX0sRKrkF007PMhgJXG" // Test publishable key
              : "pk_live_51QXT6G2NeWrBDfGsjthMPwaWhPV7UIzSJjZ3fpmANYKT58UCVSnoHaHKyozK9EptYNbV3Y1y5SX1QQcuI9dK5pZW00VQH9T3Hh",
          })}
          </div>
        </div>

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
          <button onClick={toggleModalVisibility} className="text-blue-600 underline">
            Terms and Conditions
          </button>
        </div>


      </main>

      {/* Subscription Terms and Conditions Modal */}
      <SubscriptionTermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
      />

      {/* Footer */}
      <Footer />
    </div>
    </>
  );
};

export default StripePricingTableWithFooter;

