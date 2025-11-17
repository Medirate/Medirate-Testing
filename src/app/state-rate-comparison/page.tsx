"use client";

import AppLayout from "@/app/components/applayout";
import Link from "next/link";

export default function StateRateComparisonLanding() {
  return (
    <AppLayout activeTab="stateRateComparison">
      <div className="flex flex-col items-center p-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-4 text-center">
          State Rate Comparison
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
          Choose how you want to compare Medicaid rates across states. You can view a comprehensive comparison of all states, or focus on a detailed comparison between individual states.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl md:divide-x md:divide-blue-100">
          <Link
            href="/state-rate-comparison/all"
            className="group block rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all duration-200 p-10 text-center cursor-pointer transform hover:-translate-y-2 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ minHeight: '260px' }}
          >
            <div className="flex flex-col items-center h-full justify-between">
              <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-5 py-2 mb-6 text-lg font-semibold group-hover:bg-blue-600 group-hover:text-white transition">
                Compare All States
              </span>
              <span className="text-gray-700 text-base mb-6">View a national overview and compare rates across every state at once.</span>
              <svg className="w-14 h-14 text-blue-400 group-hover:text-blue-600 transition mb-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>
            </div>
          </Link>
          <Link
            href="/state-rate-comparison/individual"
            className="group block rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all duration-200 p-10 text-center cursor-pointer transform hover:-translate-y-2 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ minHeight: '260px' }}
          >
            <div className="flex flex-col items-center h-full justify-between">
              <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-5 py-2 mb-6 text-lg font-semibold group-hover:bg-blue-600 group-hover:text-white transition">
                Compare Individual States
              </span>
              <span className="text-gray-700 text-base mb-6">Select specific states for a focused, side-by-side rate comparison.</span>
              <svg className="w-14 h-14 text-blue-400 group-hover:text-blue-600 transition mb-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
