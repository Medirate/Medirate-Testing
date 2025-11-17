"use client";

import { useEffect, useState } from "react";
import { useRequireSubscription } from "@/hooks/useRequireAuth";
import { toast } from "react-hot-toast";

interface Subscription {
  plan: string;
  amount: number;
  currency: string;
  billingInterval: string;
  status: string;
  startDate: string;
  endDate: string;
  trialEndDate: string | null;
  latestInvoice: string;
  paymentMethod: string;
}

export default function SubscriptionPage() {
  const auth = useRequireSubscription();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubUser, setIsSubUser] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);
  const [slots, setSlots] = useState<number>(0);
  const [addedUsers, setAddedUsers] = useState<{ email: string; slot: number }[]>([]);
  const [slotEmails, setSlotEmails] = useState<string[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // ✅ Ensure user is defined before proceeding
  const userEmail = auth.userEmail ?? "";
  const userId = auth.user?.id ?? "";

  // Check if user is admin
  useEffect(() => {
    if (!auth.isAuthenticated || auth.isLoading || !userEmail) return;

    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/admin/check-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });

        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
        setAdminCheckComplete(true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setAdminCheckComplete(true);
      }
    };

    checkAdminStatus();
  }, [auth.isAuthenticated, auth.isLoading, userEmail]);

  useEffect(() => {
    if (!auth.isAuthenticated || auth.isLoading || !userEmail || !adminCheckComplete) return;

    async function checkSubUser() {
      try {
        // Check if the user is a sub-user using the API endpoint
        const response = await fetch("/api/subscription-users");
        if (!response.ok) {
          throw new Error("Failed to check sub-user status");
        }

        const data = await response.json();
        
        // Check if current user is a sub-user
        if (data.isSubUser) {
          setIsSubUser(true);
          // For sub-users, we need to find their primary user
          const primaryUserEmail = data.primaryUser || userEmail;
          setPrimaryEmail(primaryUserEmail);
          // Fetch subscription data for the PRIMARY user, not the sub-user
          await fetchSubscriptionData(primaryUserEmail);
        } else {
          setIsSubUser(false);
          // For primary users, fetch their own subscription data
          await fetchSubscriptionData(userEmail);
        }
      } catch (err) {
        setError("Something went wrong while checking sub-user status.");
        setLoading(false);
      }
    }

    checkSubUser();
  }, [auth.isAuthenticated, auth.isLoading, userEmail, adminCheckComplete, isAdmin]);

  // Fetch subscription data for primary users
  const fetchSubscriptionData = async (email: string) => {
    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const data = await response.json();
      setSubscription(data);
      
      // Set slots based on the subscription plan and admin status
      const slotsForUser = getSlotsForPlan(data.plan, isAdmin);
      setSlots(slotsForUser);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Failed to load subscription data");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated || auth.isLoading || !userEmail || !adminCheckComplete) return;

    const fetchSubUsers = async () => {
      try {
        const response = await fetch("/api/subscription-users", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch sub-users.");
        }

        const data = await response.json();
        
        // Only fetch sub-users if the current user is a primary user (not a sub-user)
        if (!data.isSubUser) {
          const subUsers = data.subUsers || []; // Default to an empty array if subUsers is undefined

          // Map sub-users to the addedUsers state
          setAddedUsers(subUsers.map((email: string, index: number) => ({ email, slot: index })));

          // Initialize slotEmails with the fetched sub-users
          setSlotEmails(subUsers);
        } else {
          // If user is a sub-user, they can't manage sub-users
          setAddedUsers([]);
          setSlotEmails([]);
        }
      } catch (err) {
        toast.error("Failed to fetch sub-users.");
      }
    };

    fetchSubUsers();
  }, [auth.isAuthenticated, auth.isLoading, userEmail, adminCheckComplete, isAdmin]);

  const getRemainingDays = () => {
    if (!subscription) return 0;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleAddSlot = async () => {
    try {
      if (!userEmail) {
        alert("User email is missing. Please log in.");
        return;
      }

      const remainingDays = getRemainingDays();
      const totalDays = 365; // Total days in the year

      // Call your backend API to create the Stripe session
      const response = await fetch("/api/stripe/add-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          remainingDays,
          totalDays,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect the user to the Stripe Checkout page
      window.location.href = data.url; // Redirects to Stripe Checkout
    } catch (error) {
      alert("Something went wrong with payment.");
    }
  };

  const handleAddSlotConfirmation = () => {
    setShowConfirmationModal(true);
  };

  const handleAddSlotConfirmed = async () => {
    setShowConfirmationModal(false);
    setIsAddingSlot(true);
    try {
      await handleAddSlot();
      toast.success("Slot added successfully!");
    } catch (error) {
      toast.error("Failed to add slot. Please try again.");
    } finally {
      setIsAddingSlot(false);
    }
  };

  const handleAssignUserToSlot = async (slotIndex: number) => {
    const newUserEmail = slotEmails[slotIndex]; // Get the email for the specific slot

    if (!newUserEmail || !userEmail) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      // Fetch the existing sub-users
      const response = await fetch("/api/subscription-users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sub-users.");
      }

      const data = await response.json();
      const subUsers = Array.isArray(data.subUsers) ? data.subUsers : []; // Ensure subUsers is an array

      // Replace the email in the specified slot
      subUsers[slotIndex] = newUserEmail;

      // Update the sub-users in the database
      const updateResponse = await fetch("/api/subscription-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subUsers: subUsers }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update sub-users.");
      }

      // Update the local state
      const updatedAddedUsers = [...addedUsers];
      updatedAddedUsers[slotIndex] = { email: newUserEmail, slot: slotIndex };
      setAddedUsers(updatedAddedUsers);
      
      // For unlimited users, expand slots dynamically
      if (slots >= 50 && slotIndex >= slots - 5) {
        // Add more slots when we're near the current limit
        setSlots(Math.min(slots + 5, 50));
      }
      
      toast.success("Sub-user saved successfully!");
    } catch (err) {
      toast.error("Failed to save sub-user.");
    }
  };

  const getSlotsForPlan = (plan: string, isAdminUser?: boolean) => {
    // Admin users get unlimited slots
    if (isAdminUser) {
      return 50; // Effectively unlimited (50 slots)
    }
    
    // For all other users, limit to 2 slots regardless of plan
    if (plan === "MediRate Annual" || plan === "MediRate 3 Months" || plan === "Professional Plan") {
      return 2; // All regular users get 2 slots maximum
    }
    
    return 0; // Default to 0 slots for all other plans
  };

  const handleEditSubUser = (slotIndex: number) => {
    const currentUser = addedUsers.find(user => user.slot === slotIndex);
    if (currentUser) {
      setEditingSlot(slotIndex);
      setEditEmail(currentUser.email);
    }
  };

  const handleSaveEditSubUser = async () => {
    if (editingSlot === null || !editEmail || !userEmail) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      // Fetch current sub-users
      const response = await fetch("/api/subscription-users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sub-users.");
      }

      const data = await response.json();
      const subUsers = Array.isArray(data.subUsers) ? data.subUsers : [];

      // Update the email in the specified slot
      subUsers[editingSlot] = editEmail;

      // Update the sub-users in the database
      const updateResponse = await fetch("/api/subscription-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subUsers: subUsers }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update sub-user.");
      }

      // Update local state
      const updatedAddedUsers = addedUsers.map(user => 
        user.slot === editingSlot ? { ...user, email: editEmail } : user
      );
      setAddedUsers(updatedAddedUsers);
      
      // Reset edit state
      setEditingSlot(null);
      setEditEmail("");
      
      toast.success("Sub-user updated successfully!");
    } catch (err) {
      toast.error("Failed to update sub-user.");
    }
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
    setEditEmail("");
  };

  const handleRemoveSubUser = async (slotIndex: number) => {
    if (!userEmail) return;

    if (!confirm("Are you sure you want to remove this sub-user?")) {
      return;
    }

    try {
      // Fetch current sub-users
      const response = await fetch("/api/subscription-users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sub-users.");
      }

      const data = await response.json();
      const subUsers = Array.isArray(data.subUsers) ? data.subUsers : [];

      // Remove the user from the specified slot (set to empty string or remove from array)
      subUsers[slotIndex] = ""; // Or you could use subUsers.splice(slotIndex, 1) to remove entirely

      // Update the sub-users in the database
      const updateResponse = await fetch("/api/subscription-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subUsers: subUsers }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to remove sub-user.");
      }

      // Update local state
      const updatedAddedUsers = addedUsers.filter(user => user.slot !== slotIndex);
      setAddedUsers(updatedAddedUsers);
      
      toast.success("Sub-user removed successfully!");
    } catch (err) {
      toast.error("Failed to remove sub-user.");
    }
  };

  const fetchSubscription = async (email: string) => {
    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.error) {
        setSubscription(null);
        setError("No active subscription found.");
      } else {
        setSubscription(data);

        // Set slots based on the subscription plan and admin status
        const slotsForUser = getSlotsForPlan(data.plan, isAdmin);
        setSlots(slotsForUser);
      }
    } catch (err) {
      setError("Failed to load subscription.");
    } finally {
      setLoading(false);
    }
  };

  if (auth.isLoading || auth.shouldRedirect) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-8 text-center">
          Subscription
        </h1>
        <p className="text-red-500 text-center text-lg">
          Please log in to view your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl pointer-events-auto">


                <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-8 text-center">
        Subscription
      </h1>

      {isSubUser && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <p className="text-blue-800 text-lg font-semibold">
            This is a sub-user account. Below are the subscription details of the primary account linked to this email.
          </p>
          <p className="text-blue-700 mt-2">
            Primary Account: <strong>{primaryEmail}</strong>
          </p>
        </div>
      )}

      <div className="flex justify-center">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full border border-gray-200 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full border border-gray-100">
            {error ? (
              <p className="text-red-500 text-center text-lg">{error}</p>
            ) : subscription ? (
              <>
                {/* User Information */}
                <div className="mb-6 border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isSubUser ? "Primary Account Subscription" : "Your Subscription"}
                  </h2>
                  {isSubUser && (
                    <p className="text-sm text-blue-600 mb-3">
                      Subscription for primary account: <strong>{primaryEmail}</strong>
                    </p>
                  )}
                  <p className="text-lg text-gray-700">
                    <strong>Your Name:</strong> {auth.user?.given_name || auth.user?.family_name || "N/A"}
                  </p>
                  <p className="text-lg text-gray-700">
                    <strong>Your Email:</strong> {userEmail} {isSubUser && <span className="text-sm text-blue-600">(Sub-user)</span>}
                  </p>
                </div>

                {/* Subscription Details */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{subscription.plan}</h2>
                  <p className="text-lg text-gray-600 mt-2">
                    Status: <strong className="text-blue-600">{subscription.status}</strong>
                  </p>
                  <p className="text-lg text-gray-600">
                    Amount: <strong className="text-green-600">${subscription.amount} {subscription.currency}</strong> / {subscription.billingInterval}
                  </p>
                </div>

                {/* Dates */}
                <div className="mb-6">
                  <p className="text-lg text-gray-600">
                    Start Date: <strong>{subscription.startDate}</strong>
                  </p>
                  <p className="text-lg text-gray-600">
                    End Date: <strong>{subscription.endDate}</strong>
                  </p>
                </div>

                {/* Payment Details */}
                <div>
                  <p className="text-lg text-gray-600">
                    Payment Method: <strong>{subscription.paymentMethod}</strong>
                  </p>
                  <p className="text-lg text-gray-600">
                    Latest Invoice ID: <strong className="text-gray-900">{subscription.latestInvoice}</strong>
                  </p>
                </div>

                {/* Slots Section */}
                {!isSubUser && slots > 0 && (
                  <div id="slots-section" className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Available Slots</h3>
                      {slots >= 50 && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Unlimited Access
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {[...Array(Math.min(slots, 10))].map((_, index) => {
                        const assignedUser = addedUsers.find(user => user.slot === index);
                        const isEditing = editingSlot === index;
                        
                        return (
                      <div
                        key={index}
                            className={`p-4 rounded-lg border ${
                              assignedUser 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-gray-200'
                            } transition-colors`}
                          >
                            {/* CSS Grid Layout for Perfect Alignment */}
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Slot Number - 2 columns */}
                              <div className="col-span-2 flex items-center space-x-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-700">Slot {index + 1}</span>
                              </div>
                              
                              {/* Email Section - 7 columns */}
                              <div className="col-span-7 min-w-0">
                                {assignedUser && !isEditing ? (
                                  // Show assigned user
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate overflow-hidden whitespace-nowrap" title={assignedUser.email}>
                                      {assignedUser.email}
                                    </div>
                                    <div className="text-xs text-gray-500">Active sub-user</div>
                                  </div>
                                ) : isEditing ? (
                                  // Show edit mode
                                  <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-hidden"
                                    placeholder="Enter new email address"
                                  />
                                ) : (
                                  // Show empty slot
                              <input
                                type="email"
                                value={slotEmails[index] || ""}
                                onChange={(e) => {
                                  const updatedSlotEmails = [...slotEmails];
                                  updatedSlotEmails[index] = e.target.value;
                                  setSlotEmails(updatedSlotEmails);
                                }}
                                    placeholder="Enter email to assign user"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-hidden"
                                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                                required
                              />
                                )}
                              </div>
                              
                              {/* Action Buttons - 3 columns, right aligned */}
                              <div className="col-span-3 flex justify-end space-x-2">
                                {assignedUser && !isEditing ? (
                                  // Edit/Remove buttons for assigned users
                                  <>
                                    <button
                                      onClick={() => handleEditSubUser(index)}
                                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleRemoveSubUser(index)}
                                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </>
                                ) : isEditing ? (
                                  // Save/Cancel buttons for editing
                                  <>
                              <button
                                      onClick={handleSaveEditSubUser}
                                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                              >
                                Save
                              </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                      Cancel
                                    </button>
                            </>
                          ) : (
                                  // Assign button for empty slots
                                  <button
                                    onClick={() => handleAssignUserToSlot(index)}
                                    disabled={!slotEmails[index]?.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Assign
                                  </button>
                          )}
                        </div>
                      </div>
                  </div>
                        );
                      })}
                    </div>
                    {slots >= 50 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <strong>Admin Account:</strong> You have unlimited sub-user slots available. 
                          {slots > 10 && " Additional slots will appear automatically as you add users."}
                        </p>
                      </div>
                    )}
                  </div>
                )}


              </>
            ) : (
              <div className="text-center">
                {isSubUser ? (
                  <div>
                    <p className="text-orange-600 text-lg font-semibold mb-2">
                      Unable to load subscription details for primary account
                    </p>
                    <p className="text-gray-600">
                      Primary Account: <strong>{primaryEmail}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      As a sub-user, you have access to all premium features through the primary account.
                    </p>
                  </div>
                ) : (
                  <p className="text-red-500 text-lg">No active subscription found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Need help? <a href="/support" className="text-blue-600 hover:underline">Contact Support</a></p>
        <p>By using this service, you agree to our <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>.</p>
      </div>
    </div>
  );
}
