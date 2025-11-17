import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Facebook, Linkedin, Video, Mail } from "lucide-react";
import Footer from "@/app/components/footer"; // Import the Footer component

export default function OurCustomers() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[500px]">
        <Image
          src="/images/our customers pic.jpeg" // First Banner Image
          alt="Our Customers Banner"
          layout="fill"
          objectFit="cover"
          className="brightness-75"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-3xl md:text-4xl text-white font-lemonMilkRegular uppercase tracking-wide">
            OUR CUSTOMERS
          </h1>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="relative py-12 px-6 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10 reusable-gradient-bg"></div>

        <div className="max-w-7xl mx-auto text-lg text-gray-700">
          <p className="font-semibold mb-8 leading-relaxed text-left ml-4">
            MediRate’s Medicaid reimbursement tracking service is designed to support a
            broad array of Medicaid stakeholders including:
          </p>

          <div className="flex flex-col lg:flex-row items-center lg:space-x-8">
            {/* Left Image */}
            <div className="w-full lg:w-1/2">
              <Image
                src="/images/dashboard-screenshot.png" // Second Image
                alt="Medical Expert with Patient"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>

            {/* Points List */}
            <ul className="w-full lg:w-1/2 space-y-4 mt-8 lg:mt-0 text-left ml-4">
              {[
                "Long term services and supports providers",
                "Behavioral health providers",
                "Organizations serving individuals living with addiction",
                "Organizations serving individuals living with intellectual and developmental disabilities",
                "Organizations serving children with complex medical needs",
                "Dental services organizations",
                "Managed care organizations",
                "Trade associations",
                "Investment firms and other financial services organizations",
                "Healthcare consulting firms",
                "Healthcare law firms",
              ].map((point, index) => (
                <li
                  key={index}
                  className="flex items-center space-x-2"
                >
                  <ChevronRight className="text-[#012C61] w-5 h-5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Information */}
          <div className="mt-12 text-left ml-4">
            <p className="leading-relaxed">
              Having worked directly with these organizations as consulting
              clients, MediRate’s leadership is aware of the complexity involved
              in finding and tracking Medicaid payment rates and the frustration
              created by unexpected reimbursement changes. Our goal is to improve
              Medicaid payment rate transparency and support strategic
              decision-making by provider organizations and other stakeholders.
            </p>
            
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer /> {/* Replace the inline footer with the Footer component */}
    </div>
  );
}