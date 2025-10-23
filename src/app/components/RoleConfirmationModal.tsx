"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield } from 'lucide-react';

interface RoleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountRole: string;
}

export default function RoleConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  accountRole 
}: RoleConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, mounted]);

  if (!isOpen || !mounted) return null;

  // Ensure document.body exists before creating portal
  if (typeof window === 'undefined' || !document.body) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'subscription_manager': return 'Subscription Manager';
      case 'user': return 'User Account';
      case 'sub_user': return 'Sub User';
      default: return role;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
      >
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="ml-3 text-lg font-semibold text-gray-900">
            Confirm Your Account Role
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            You have selected <strong>{getRoleDisplayName(accountRole)}</strong> as your account type.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Important:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {accountRole === 'subscription_manager' && (
                <>
                  <li>• You will only manage billing and user access</li>
                  <li>• You cannot use application features</li>
                  <li>• You can add/remove users from your subscription</li>
                </>
              )}
              {accountRole === 'user' && (
                <>
                  <li>• You will have full access to all application features</li>
                  <li>• You can manage other users in your subscription</li>
                  <li>• You will use one slot in your subscription</li>
                </>
              )}
              {accountRole === 'sub_user' && (
                <>
                  <li>• You will have access to application features</li>
                  <li>• You cannot manage other users</li>
                  <li>• You will use one slot in your subscription</li>
                </>
              )}
            </ul>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            This choice affects your login functionality and cannot be changed after submission.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
