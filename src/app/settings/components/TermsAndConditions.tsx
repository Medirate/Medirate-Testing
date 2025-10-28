"use client";

import { useState } from "react";
import SubscriptionTermsModal from "@/app/components/SubscriptionTermsModal";
import TermsModal from "@/app/components/TermsModal";

export default function TermsAndConditions() {
  const [showServiceAgreement, setShowServiceAgreement] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review our service agreement and terms of use
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Terms Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Service Agreement Card */}
              <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Service Agreement</h3>
                    <p className="text-sm text-gray-600">Subscription terms and conditions</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Review the comprehensive terms and conditions for your MediRate subscription, including billing, usage rights, and service provisions.
                </p>
                <button
                  onClick={() => setShowServiceAgreement(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Service Agreement
                </button>
              </div>

              {/* Terms of Use Card */}
              <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Terms of Use</h3>
                    <p className="text-sm text-gray-600">Platform usage guidelines</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Review the terms of use for the MediRate platform, including data usage policies, CPT licensing terms, and user responsibilities.
                </p>
                <button
                  onClick={() => setShowTermsOfUse(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Terms of Use
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Service Agreement Modal */}
        {showServiceAgreement && (
          <SubscriptionTermsModal 
            isOpen={showServiceAgreement}
            onClose={() => setShowServiceAgreement(false)}
          />
        )}

        {/* Terms of Use Modal */}
        {showTermsOfUse && (
          <TermsModal 
            isOpen={showTermsOfUse}
            onClose={() => setShowTermsOfUse(false)}
            autoShow={false}
          />
        )}
      </div>
    </div>
  );
}
