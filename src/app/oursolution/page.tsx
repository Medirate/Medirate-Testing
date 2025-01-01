import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin, Cross, Video, Mail } from "lucide-react";
import Footer from "@/app/components/footer"; // Import the Footer component

export default function OurSolution() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[500px]">
        <Image
          src="/images/people-looking-at-dashboard.jpg"
          alt="People looking at dashboard"
          layout="fill"
          objectFit="cover"
          className="brightness-75"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl text-white font-lemonMilkRegular uppercase tracking-wide">
            OUR SOLUTION
          </h1>
        </div>
      </section>

      {/* Combined Section with Gradient */}
      <div className="overflow-hidden">
        <section className="py-12 px-6 relative reusable-gradient-bg">
          <div className="max-w-7xl mx-auto text-center text-gray-700">
            {/* Text Content */}
            <p className="text-lg mb-8 leading-relaxed">
              MediRate’s solution is designed to take the mystery out of
              identifying and monitoring fee schedule payment rates for
              Medicaid-reimbursed services.
            </p>
            <p className="leading-relaxed">
              MediRate is a comprehensive, national database of Medicaid
              fee-for-service reimbursement rates for key provider service lines.
              We curate Medicaid fee schedules, provider manuals, provider
              bulletins, legislative and appropriations documents, regulatory
              actions, and other sources to aggregate fee-for-service payment
              amounts by CPT/HCPCS billing code across all 50 states and the
              District of Columbia. Currently, we offer payment rate data for the
              following categories of service with more to follow:
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center justify-center">
                <Cross className="w-6 h-6 text-[#012C61] mr-2" />
                <span>Personal care services</span>
              </li>
              <li className="flex items-center justify-center">
                <Cross className="w-6 h-6 text-[#012C61] mr-2" />
                <span>Autism/applied behavioral analysis (ABA)</span>
              </li>
              <li className="flex items-center justify-center">
                <Cross className="w-6 h-6 text-[#012C61] mr-2" />
                <span>Behavioral health services</span>
              </li>
              <li className="flex items-center justify-center">
                <Cross className="w-6 h-6 text-[#012C61] mr-2" />
                <span>
                  Services for individuals living with addiction/substance use
                  disorders
                </span>
              </li>
            </ul>
            {/* Secondary Content */}
            <div className="mt-12 flex flex-col lg:flex-row items-center">
              <div className="w-full lg:w-1/2 px-6 mb-8 lg:mb-0">
                <Image
                  src="/images/close-up-people-back-office_23-2149097923.jpg"
                  alt="Close up of people in office"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="w-full lg:w-1/2 px-6">
                <p className="leading-relaxed">
                  Subscribers can search for payment rates by service line
                  category, billing code, state, program, and date, track them
                  over time, and compare them to other state payment amounts and
                  national averages.
                </p>
                <p className="leading-relaxed mt-4">
                  MediRate’s reimbursement tracking service offers real-time
                  updates and customizable email alerts that identify pending or
                  actual changes to the fee schedules as they occur.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center">
                    <Video className="w-6 h-6 text-[#012C61] mr-2" />
                    <span>Video presentation walking through the product features</span>
                  </li>
                  <li className="flex items-center">
                    <Mail className="w-6 h-6 text-[#012C61] mr-2" />
                    <span>Email link to request a demo</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Section */}
      <Footer /> {/* Replace the inline footer with the Footer component */}
    </div>
  );
}
