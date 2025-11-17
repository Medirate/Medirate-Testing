"use client";

import Image from "next/image";
import Footer from "@/app/components/footer";
import {
  Cross,
  DollarSign,
  FileText,
  TrendingUp,
  MapPin,
  ThumbsUp,
  Briefcase,
  Mail,
  Search,
  Check,
  ClipboardList,
  Calendar,
} from "lucide-react";

export default function OurSolution() {
  return (
    <div className="text-center">
      {/* Main Content */}
      <section className="py-12 px-6 bg-gradient-to-r from-[#f0f4f8] to-[#e0e6ed] text-lg">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-3xl text-[#012C61] font-lemonMilkRegular uppercase tracking-wide mb-4">
              The MediRate Platform
            </h1>
          </div>

          {/* Introductory Content */}
          <div className="text-left ml-4 mb-8 space-y-8">
            {/* Section: MediRate's Mission */}
            <div className="bg-white/90 p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-lemonMilkRegular text-[#012C61] mb-6">MediRate's Mission</h2>
              <div className="space-y-6 leading-relaxed">
                <p>MediRate makes access to Medicaid payment data easy. Our simple intuitive platform enables quick answers to your Medicaid rate questions and easy monitoring so that you can stay on top of changes when they happen.</p>
                <p>With over 80 million Americans enrolled, and approaching $1 trillion in annual expenditures, Medicaid is the largest government-funded health care program in the United States.</p>
                <p>Despite the size and growth of the market, state-specific program designs and the lack of standardization and comparability in data collection present challenges for policy-setters and business interests.</p>
              </div>
            </div>

            {/* Section: How MediRate Helps You */}
            <div className="bg-white/90 p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-lemonMilkRegular text-[#012C61] mb-6">How MediRate Helps You</h2>
              <div className="space-y-6 leading-relaxed">
                <p>MediRate aggregates fee schedule data for key service lines across all 50 states to enable on-demand rate look-up, trend identification and cross-state comparisons.</p>
                <p>Payment rates are updated real-time, and are searchable by state, service line, billing code, program and date.</p>
                <p>MediRate monitors payment rate developments by state and service line and offers daily, customizable alerts, enabling users to track potential changes as they emerge.</p>
              </div>
            </div>

            {/* Section: Key Questions We Answer */}
            <div className="bg-white/90 p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-lemonMilkRegular text-[#012C61] mb-6">MediRate Answers Your Key Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Are we being reimbursed accurately for the services we offer and populations we serve?",
                  "How do the payment rates in our market compare to those in other geographies/programs? Is there an opportunity to advocate for higher payment amounts?",
                  "How do our managed care payment rates compare to fee-for-service reimbursement?",
                  "Can we design value-based contracting models with our managed care payers to drive improved outcomes?",
                  "Are there other service lines we can offer to broaden the array of treatment options we offer to patients?",
                  "Which expansion markets may be attractive for our organization to consider, either organically or through acquisitions?",
                  "How frequently are reimbursement rates adjusted and what has been the historical trend?",
                  "When considering acquisitions, how do we assess the stability of the Target's reimbursement and are there opportunities for future growth in financially viable markets?"
                ].map((question, index) => (
                  <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <Check className="w-8 h-8 text-[#012C61] mr-4 flex-shrink-0" />
                    <span className="text-gray-700">{question}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Aggregation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Service Screenshot */}
              <div className="flex justify-center lg:justify-start">
                <Image
                  src="/images/our solution screenshot.png"
                  alt="Service Screenshot"
                  width={600}
                  height={450}
                  className="rounded-lg shadow-lg border border-gray-200 object-cover"
                />
              </div>
              <div className="bg-white/90 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-lemonMilkRegular text-[#012C61] mb-4 flex items-center">
                  <span className="w-8 h-8 bg-[#012C61] rounded-full flex items-center justify-center mr-3">
                    📊
                  </span>
                  Data Aggregation
                </h3>
                <p className="leading-relaxed mb-4">
                  MediRate aggregates fee-for-service payment amounts by CPT/HCPCS billing code across 50 states and the District of Columbia by curating:
                </p>
                <ul className="space-y-2">
                  {[
                    "State Medicaid and related agency fee schedules",
                    "Provider manuals",
                    "Provider bulletins",
                    "Legislative and appropriations' documents",
                    "Regulatory actions",
                    "Other sources"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-6 h-6 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-3 mt-1">
                        <Check className="w-4 h-4 text-[#012C61]" />
                      </span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Payment Rate Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* Historical Screenshot */}
              <div className="flex justify-center lg:justify-start">
                <Image
                  src="/images/Historical_rates_2.png"
                  alt="Historical Screenshot"
                  width={600}
                  height={450}
                  className="rounded-lg shadow-lg border border-gray-200 object-cover"
                />
              </div>
              <div className="bg-white/90 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-lemonMilkRegular text-[#012C61] mb-4 flex items-center">
                  <span className="w-8 h-8 bg-[#012C61] rounded-full flex items-center justify-center mr-3">
                    📈
                  </span>
                  Payment Rate Analysis
                </h3>
                <p className="leading-relaxed mb-4">
                  Subscribers can:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-3 mt-1">
                      <Search className="w-4 h-4 text-[#012C61]" />
                    </span>
                    <span className="text-gray-700">
                      Search for payment rates by:
                      <ul className="pl-6 mt-1 space-y-1">
                        <li className="flex items-start">
                          <span className="w-5 h-5 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-2 mt-1">
                            <Briefcase className="w-3 h-3 text-[#012C61]" />
                          </span>
                          <span>Service line category</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-5 h-5 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-2 mt-1">
                            <FileText className="w-3 h-3 text-[#012C61]" />
                          </span>
                          <span>Billing code</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-5 h-5 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-2 mt-1">
                            <MapPin className="w-3 h-3 text-[#012C61]" />
                          </span>
                          <span>State</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-5 h-5 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-2 mt-1">
                            <ClipboardList className="w-3 h-3 text-[#012C61]" />
                          </span>
                          <span>Program</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-5 h-5 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-2 mt-1">
                            <Calendar className="w-3 h-3 text-[#012C61]" />
                          </span>
                          <span>Date</span>
                        </li>
                      </ul>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-3 mt-1">
                      <TrendingUp className="w-4 h-4 text-[#012C61]" />
                    </span>
                    <span className="text-gray-700">Track trends by analyzing payment rates over time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-3 mt-1">
                      <MapPin className="w-4 h-4 text-[#012C61]" />
                    </span>
                    <span className="text-gray-700">Compare rates to payment amounts in other states and national averages</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Policy Monitoring Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* Rate Screenshot */}
              <div className="flex justify-center lg:justify-start">
                <Image
                  src="/images/Screenshot Rate Developements.png"
                  alt="Rate Screenshot"
                  width={600}
                  height={450}
                  className="rounded-lg shadow-lg border border-gray-200 object-cover"
                />
              </div>
              <div className="bg-white/90 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-lemonMilkRegular text-[#012C61] mb-4 flex items-center">
                  <span className="w-8 h-8 bg-[#012C61] rounded-full flex items-center justify-center mr-3">
                    🔍
                  </span>
                  Policy Monitoring
                </h3>
                <p className="leading-relaxed mb-4">
                  Subscribers can:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-3 mt-1">
                      <FileText className="w-4 h-4 text-[#012C61]" />
                    </span>
                    <span className="text-gray-700">Monitor real-time policy developments related to Medicaid payment rates nationally and on a state-by-state basis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 bg-[#012C61]/10 rounded-full flex items-center justify-center mr-3 mt-1">
                      <Mail className="w-4 h-4 text-[#012C61]" />
                    </span>
                    <span className="text-gray-700">Sign up for customizable email alerts for real-time notification of policy developments in the service lines and markets that matter to you</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Video Section */}
          <div className="mt-12">
            <div className="w-full bg-white/90 p-8 rounded-lg shadow-sm">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-lemonMilkRegular text-[#012C61] mb-4">
                  See MediRate in Action
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
                  Watch our comprehensive demo to see how MediRate makes Medicaid payment rate tracking simple, 
                  efficient, and insightful for healthcare providers and stakeholders.
                </p>
              </div>
              
              {/* YouTube Video Embed */}
              <div className="relative w-full max-w-4xl mx-auto">
                              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src="https://www.youtube.com/embed/i_agfm1GaK8"
                  title="MediRate Platform Demo"
                  className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Learn how to search, compare, and monitor Medicaid payment rates across all 50 states
                </p>
              </div>
            </div>
          </div>

          {/* Video and Table Section */}
          <div className="mt-12">
            <div className="w-full bg-white/90 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-lemonMilkRegular mb-4">
                MediRate tracks reimbursement data for the following service lines
              </h3>
              <table className="w-full border border-gray-300 text-left">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 font-bold border">Service Line/Provider Type</th>
                    <th className="p-2 font-bold border">MediRate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border">Applied Behavior Analysis (ABA) and Early Intervention (EI) Services</td>
                    <td className="p-2 border flex justify-center"><Check className="text-green-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-2 border">Home and Community Based Services including Personal Care</td>
                    <td className="p-2 border flex justify-center"><Check className="text-green-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-2 border">Behavior Health services</td>
                    <td className="p-2 border flex justify-center"><Check className="text-green-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-2 border">Substance Use Disorder services</td>
                    <td className="p-2 border flex justify-center"><Check className="text-green-600" /></td>
                  </tr>
                  <tr>
                    <td className="p-2 border">Services for Individuals Living with Intellectual and Developmental Disabilities</td>
                    <td className="p-2 border flex justify-center"><Check className="text-green-600" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <a
            href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1QOXygd6Dpekn_BDsmrizOLq3D9aX8iq_aopMjF5o4Z2_APztYi8VXo5QMn2ab0sDZ5rTX18ii"
            target="_blank"
            rel="noopener noreferrer"
            className="relative bg-[#012C61] text-white px-6 py-3 rounded-lg overflow-hidden group transition-all duration-500 ease-in-out w-64 mx-auto flex items-center justify-center space-x-2"
            style={{ transform: 'translateZ(0)' }}
          >
            {/* Animated background layer */}
            <div className="absolute inset-0 bg-white w-0 group-hover:w-full transition-all duration-500 ease-in-out origin-left"></div>
            
            {/* Text and icon */}
            <div className="relative z-10 flex items-center space-x-2">
              <Mail className="w-6 h-6 group-hover:text-[#012C61] transition-colors duration-300" />
              <span className="group-hover:text-[#012C61] transition-colors duration-300">
                Schedule a Live Presentation
              </span>
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -inset-12 bg-gradient-to-r from-white/20 via-white/50 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shine"></div>
            </div>
          </a>
        </div>
      </section>
      <Footer />
    </div>
  );
}