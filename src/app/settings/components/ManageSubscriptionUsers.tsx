"use client";

import { useState, useEffect } from "react";
import { useRequireSubscription } from "@/hooks/useRequireAuth";

interface SubscriptionUser {
  email: string;
}

export default function ManageSubscriptionUsers() {
  const auth = useRequireSubscription();
  const [subscriptionUsers, setSubscriptionUsers] = useState<SubscriptionUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAddUserConfirmation, setShowAddUserConfirmation] = useState(false);
  const [userToAdd, setUserToAdd] = useState<string>("");
  const [showRemoveUserConfirmation, setShowRemoveUserConfirmation] = useState(false);
  const [userToRemove, setUserToRemove] = useState<string>("");

  const fetchSubscriptionUsers = async () => {
    try {
      const response = await fetch("/api/subscription-users");
      if (response.ok) {
        const data = await response.json();
        // Convert array of email strings to array of objects with email property
        const users = (data.subUsers || []).map((email: string) => ({ email }));
        setSubscriptionUsers(users);
      }
    } catch (error) {
      console.error("Error fetching subscription users:", error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user-role");
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  useEffect(() => {
    fetchSubscriptionUsers();
    fetchUserRole();
    
    // Debug: Log auth state
    console.log("🔍 ManageSubscriptionUsers: Auth state:", {
      isWireTransferUser: auth.isWireTransferUser,
      isPrimaryUser: auth.isPrimaryUser,
      hasActiveSubscription: auth.hasActiveSubscription,
      userEmail: auth.userEmail
    });
  }, [auth]);

  const addUserToSubscription = async () => {
    if (!newUserEmail.trim()) return;
    
    // Show confirmation dialog first
    setUserToAdd(newUserEmail.trim());
    setShowAddUserConfirmation(true);
  };

  const confirmAddUser = async () => {
    if (!userToAdd.trim()) return;
    
    setIsAddingUser(true);
    try {
      // Use the regular subscription users API
      const apiEndpoint = "/api/subscription-users";
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userToAdd.trim() })
      });
      
      if (response.ok) {
        setNewUserEmail("");
        setUserToAdd("");
        setShowAddUserConfirmation(false);
        
        // Show success message
        alert(`✅ Sub user ${userToAdd.trim()} has been successfully added to your subscription!`);
        
        // Refresh the subscription users list
        await fetchSubscriptionUsers();
        
        // Send email notifications
        try {
          await fetch('/api/send-user-addition-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: userToAdd.trim(),
              primaryUserEmail: auth.userEmail,
              action: 'user_added'
            })
          });
          console.log('✅ Email notifications sent successfully');
        } catch (emailError) {
          console.error('Error sending email notifications:', emailError);
          // Don't fail the user addition if emails fail
        }
        
        // Auto-refresh the page after 2 seconds to show updated user list
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        const error = await response.json();
        alert(`❌ Failed to add sub user: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("❌ Failed to add sub user. Please try again.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const cancelAddUser = () => {
    setShowAddUserConfirmation(false);
    setUserToAdd("");
  };

  const removeUserFromSubscription = async (email: string) => {
    // Show confirmation dialog first
    setUserToRemove(email);
    setShowRemoveUserConfirmation(true);
  };

  const confirmRemoveUser = async () => {
    if (!userToRemove) return;
    
    setIsRemovingUser(userToRemove);
    try {
      // Use the regular subscription users API
      const apiEndpoint = "/api/subscription-users";
      
      const response = await fetch(apiEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userToRemove })
      });
      
      if (response.ok) {
        setUserToRemove("");
        setShowRemoveUserConfirmation(false);
        
        // Show success message
        alert(`✅ Sub user ${userToRemove} has been successfully removed from your subscription!`);
        
        // Refresh the subscription users list
        await fetchSubscriptionUsers();
        
        // Send removal email notification
        try {
          await fetch('/api/send-user-addition-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: userToRemove,
              primaryUserEmail: auth.userEmail,
              action: 'user_removed'
            })
          });
          console.log('✅ Removal email notification sent successfully');
        } catch (emailError) {
          console.error('Error sending removal email notification:', emailError);
          // Don't fail the user removal if email fails
        }
        
        // Auto-refresh the page after 2 seconds to show updated user list
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        const error = await response.json();
        alert(`❌ Failed to remove sub user: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error removing user:", error);
      alert("❌ Failed to remove sub user. Please try again.");
    } finally {
      setIsRemovingUser(null);
    }
  };

  const cancelRemoveUser = () => {
    setShowRemoveUserConfirmation(false);
    setUserToRemove("");
  };

  // Allow user management if user has active subscription and is not a sub_user
  const canAddUsers = auth.hasActiveSubscription && userRole !== 'sub_user';
  
  // Determine slot limits based on user role
  const getSlotLimit = () => {
    switch (userRole) {
      case 'admin':
        return 6; // 6 slots for admins
      case 'subscription_manager':
        return 3;
      case 'user':
        return 2;
      case 'sub_user':
        return 0; // Read-only for sub users
      default:
        return 0;
    }
  };
  
  const slotLimit = getSlotLimit();
  const availableSlots = Math.max(0, slotLimit - subscriptionUsers.length);
  const isAtSlotLimit = subscriptionUsers.length >= slotLimit;

  // Debug logging
  console.log("🔍 ManageSubscriptionUsers Debug:", {
    userRole,
    isWireTransferUser: auth.isWireTransferUser,
    isPrimaryUser: auth.isPrimaryUser,
    canAddUsers,
    userEmail: auth.userEmail,
    slotLimit,
    availableSlots,
    currentUsers: subscriptionUsers.length,
    isAtSlotLimit
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Manage Subscription Users</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Add and manage sub users for your subscription
          </p>
          
          {/* Debug Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Debug Information</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>User Email:</strong> {auth.userEmail}</p>
              <p><strong>User Role:</strong> {userRole || 'Loading...'}</p>
              <p><strong>Can Add Users:</strong> {canAddUsers ? 'Yes' : 'No'}</p>
              <p><strong>Slot Limit:</strong> {slotLimit}</p>
              <p><strong>Available Slots:</strong> {availableSlots}</p>
              <p><strong>Current Users:</strong> {subscriptionUsers.length}</p>
              <p><strong>Is At Slot Limit:</strong> {isAtSlotLimit ? 'Yes' : 'No'}</p>
              <p><strong>Is Wire Transfer User:</strong> {auth.isWireTransferUser ? 'Yes' : 'No'}</p>
              <p><strong>Is Primary User:</strong> {auth.isPrimaryUser ? 'Yes' : 'No'}</p>
              <p><strong>Has Active Subscription:</strong> {auth.hasActiveSubscription ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Current Users Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Current Sub Users</h3>
              
              {subscriptionUsers.length > 0 ? (
                <div className="space-y-4">
                  {subscriptionUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">Sub User</p>
                        </div>
                      </div>
                      {canAddUsers && (
                        <button
                          onClick={() => removeUserFromSubscription(user.email)}
                          disabled={isRemovingUser === user.email}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isRemovingUser === user.email ? "Removing..." : "Remove"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No other sub users in this subscription.</p>
                </div>
              )}
            </div>

            {/* Add User Section */}
            {canAddUsers ? (
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Add New Sub User</h3>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{availableSlots}</span> of <span className="font-medium">{slotLimit}</span> slots available
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start mb-4">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Can add sub users</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        You can add sub users to your subscription. They will have read-only access to subscription information.
                      </p>
                    </div>
                  </div>
                  
                  {isAtSlotLimit ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Slot Limit Reached</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            You have reached your maximum of {slotLimit} sub users. Remove a user to add a new one.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-4">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={addUserToSubscription}
                        disabled={!newUserEmail.trim() || isAddingUser}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAddingUser ? "Adding..." : "Add Sub User"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">Read-only access</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        You only have access to view subscription users. Contact your subscription manager to add or remove users.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add User Confirmation Modal */}
        {showAddUserConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Add Sub User</h3>
                <button
                  onClick={cancelAddUser}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Confirm Sub User Addition</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Are you sure you want to add <strong>{userToAdd}</strong> as a sub user for the subscription?
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-blue-800 mb-2">What happens next?</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• The sub user will receive an email notification</li>
                    <li>• They'll be able to log in and access the application</li>
                    <li>• They'll have read-only access to subscription information</li>
                    <li>• You can remove them at any time from the user management section</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={cancelAddUser}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAddUser}
                    disabled={isAddingUser}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isAddingUser ? "Adding..." : "Add Sub User"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove User Confirmation Modal */}
        {showRemoveUserConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Remove Sub User</h3>
                <button
                  onClick={cancelRemoveUser}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Confirm User Removal</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Are you sure you want to remove <strong>{userToRemove}</strong> from your subscription?
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-red-800 mb-2">What happens next?</h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• The user will lose access to the application immediately</li>
                    <li>• They will receive an email notification about the removal</li>
                    <li>• They can re-register as a sub user if needed</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={cancelRemoveUser}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemoveUser}
                    disabled={isRemovingUser === userToRemove}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isRemovingUser === userToRemove ? "Removing..." : "Remove Sub User"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
