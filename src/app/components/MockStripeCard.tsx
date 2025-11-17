"use client";

import { useState } from 'react';
import { CreditCard, CheckCircle, Lock } from 'lucide-react';

interface MockStripeCardProps {
  onSubscribeClick: () => void;
}

export default function MockStripeCard({ onSubscribeClick }: MockStripeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#012C61] to-blue-700 text-white p-6">
          <h2 className="text-2xl font-bold text-center font-lemonMilkRegular">
            Choose Your Plan
          </h2>
          <p className="text-center text-blue-100 mt-2">
            Professional Medicaid Rate Analysis Platform
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Monthly Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[#012C61]">$749</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Full platform access
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Up to 3 users
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Real-time rate updates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Email alerts
                  </li>
                </ul>
                <button
                  onClick={onSubscribeClick}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                    isHovered
                      ? 'bg-[#012C61] text-white transform scale-105'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Complete Form First
                </button>
              </div>
            </div>

            {/* Annual Plan */}
            <div className="border-2 border-[#012C61] rounded-lg p-6 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#012C61] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Annual Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[#012C61]">$8,100</span>
                  <span className="text-gray-600">/year</span>
                </div>
                <div className="mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Save 10% ($900/year)
                  </span>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Full platform access
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Up to 3 users
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Real-time rate updates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Email alerts
                  </li>
                </ul>
                <button
                  onClick={onSubscribeClick}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                    isHovered
                      ? 'bg-[#012C61] text-white transform scale-105'
                      : 'bg-[#012C61] text-white'
                  }`}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Complete Form First
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>Cancel anytime</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Please complete the registration form above to proceed with payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
