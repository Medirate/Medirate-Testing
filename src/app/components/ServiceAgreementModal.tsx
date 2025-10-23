"use client";

import { useState, useEffect } from 'react';
import PortalModal from './PortalModal';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

interface ServiceAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  customerName?: string;
  subscriptionType?: 'annual' | 'monthly';
}

export default function ServiceAgreementModal({ 
  isOpen, 
  onClose, 
  onAccept, 
  customerName = "[Customer Name]",
  subscriptionType = "annual"
}: ServiceAgreementModalProps) {
  const { isAuthenticated, isLoading } = useKindeBrowserClient();

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  const getSubscriptionPeriod = () => {
    return subscriptionType === 'annual' ? '12 months' : '1 month';
  };

  const getRenewalPeriod = () => {
    return subscriptionType === 'annual' ? '12-month' : '1-month';
  };

  return (
    <PortalModal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-h-[90vh]"
    >
      <div className="p-6 flex flex-col h-[80vh]">
            <h2 className="text-xl font-bold text-[#012C61] uppercase font-lemonMilkRegular text-center mb-4">
              MediRate Service Agreement
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-4 text-sm text-gray-700">
              <p className="mb-4">
                This Service Agreement ("Agreement") is entered into between <strong>{customerName}</strong> ("Customer") and MediRate, LLC ("MediRate"), effective as of the date Customer accepts this Agreement (the "Effective Date").
              </p>

              <h3 className="font-semibold mt-4">1. Services</h3>
              <p className="mb-4">
                MediRate will provide Customer with access to its web-based software platform ("Services"), which enables users to search, track, and analyze Medicaid provider payment rates and related policy information.
              </p>

              <h3 className="font-semibold mt-4">2. Subscription and Fees</h3>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>Customer shall pay subscription fees as set forth in the applicable order form, invoice, or online checkout ("Order").</li>
                <li>Fees are non-refundable except as expressly stated herein.</li>
                <li>MediRate may update fees upon renewal with at least thirty (30) days' notice.</li>
              </ul>

              <h3 className="font-semibold mt-4">3. Term and Termination</h3>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>The initial subscription term is {getSubscriptionPeriod()} unless otherwise specified in the Order.</li>
                <li>The Agreement automatically renews for successive {getRenewalPeriod()} periods unless Customer provides written notice of non-renewal prior to the renewal date by emailing MediRate at contact@medirate.net.</li>
              </ul>

              <h3 className="font-semibold mt-4">4. Customer Obligations</h3>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>Customer is responsible for maintaining secure login credentials.</li>
                <li>Customer shall not share access credentials outside of its authorized employees or contractors.</li>
                <li>Customer shall not copy, scrape, or redistribute MediRate content except as permitted in writing.</li>
                <li>Additional terms are described in MediRate's Terms and Conditions.</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> By accepting this Service Agreement, you acknowledge that you have read, understood, and agree to be bound by the terms and conditions set forth herein, as well as MediRate's Terms and Conditions and Privacy Policy.
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
    </PortalModal>
  );
}
