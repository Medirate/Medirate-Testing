import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Facebook, Linkedin, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Footer from "@/app/components/footer"; // Import the Footer component

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative w-full h-screen">
        {/* Background Image */}
        <Image
          src="/images/Lady looking at screens.png"
          alt="Lady Looking at Screen"
          layout="fill"
          objectFit="cover"
          priority
        />

        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 bg-black/40">
          {/* Heading */}
          <h1 className="text-white text-2xl sm:text-3xl md:text-5xl font-lemonMilkRegular leading-tight font-lightBold">
            <span className="block leading-snug whitespace-normal break-words">
              Medicaid Rate Tracking Made Easy
            </span>
            <span className="block text-[0.5em] leading-snug whitespace-normal break-words px-4">
              Monitor and search Medicaid provider payment rates with MediRate
            </span>
          </h1>

          {/* Get Started Button */}
          <div className="mt-8">
            <Link
              href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1QOXygd6Dpekn_BDsmrizOLq3D9aX8iq_aopMjF5o4Z2_APztYi8VXo5QMn2ab0sDZ5rTX18ii"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                className:
                  "bg-[#012C61] text-white px-6 py-3 rounded-md border border-transparent transition-colors duration-300 hover:bg-transparent hover:border-white hover:text-white",
              })}
            >
              <span>Schedule a Live Presentation</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

{/* About MediRate Section */}
<section className="py-16 relative overflow-hidden bg-gradient-to-r from-[#f0f4f8] to-[#e0e6ed]">
  <div className="max-w-7xl mx-auto px-6 lg:flex lg:items-center lg:justify-between">
    {/* Text Content */}
    <div className="lg:w-1/2 text-lg text-left ml-4">
                      <h2 className="text-3xl text-[#012C61] mb-6 font-lemonMilkRegular"> 
        ABOUT MEDIRATE
      </h2>
      <p className="text-gray-700 leading-[1.2] mb-6"> 
        At MediRate, we're on a mission to make Medicaid reimbursement
        information more accessible and transparent for providers and other
        healthcare stakeholders.
      </p>
      <p className="text-gray-700 leading-[1.2] mb-6">
        MediRate is the only platform offering automated access to Medicaid
        fee schedule data, enabling users to search and monitor
        fee-for-service payment rates by state, service, billing code, and
        date.
      </p>
      <p className="text-gray-700 leading-[1.2] mb-6">
        MediRate's trending and comparative tools help surface key insights in the data, 
        informing strategic decision-making.
      </p>
      <p className="text-gray-700 leading-[1.2] mb-6">
        MediRate's solution is designed to support Medicaid provider
        organizations and other stakeholders in tracking payment rate
        trends for key service lines and to inform market and product
        expansion opportunities.
      </p>
      <p className="text-gray-700 leading-[1.2] mb-8">
        MediRate takes the mystery out of finding and tracking state Medicaid
        reimbursement information.
      </p>

      {/* Buttons */}
      <div className="flex space-x-4">
        <a
          href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1QOXygd6Dpekn_BDsmrizOLq3D9aX8iq_aopMjF5o4Z2_APztYi8VXo5QMn2ab0sDZ5rTX18ii"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#012C61] text-white px-6 py-3 rounded-md transition-colors duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
        >
          Schedule a Live Presentation
        </a>
        <a
          href="/oursolution"
          className="bg-[#012C61] text-white px-6 py-3 rounded-md transition-colors duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
        >
          Read More
        </a>
      </div>
    </div>

    {/* Demo Video Section */}
    <div className="mt-10 lg:mt-0 lg:w-1/2 lg:flex lg:justify-end">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-lemonMilkRegular text-[#012C61] mb-3">
            See MediRate in Action
          </h3>
          <p className="text-gray-600 text-base leading-relaxed">
            Watch our comprehensive demo to see how MediRate makes Medicaid payment rate tracking simple, 
            efficient, and insightful for healthcare providers and stakeholders.
          </p>
        </div>
        
        {/* YouTube Video Embed */}
        <div className="relative w-full mb-4">
          <div className="relative w-full rounded-xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src="https://www.youtube.com/embed/i_agfm1GaK8"
              title="MediRate Platform Demo"
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">
            Learn how to search, compare, and monitor Medicaid payment rates across all 50 states
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Our Customers Section */}
      <section className="relative py-12 px-6 overflow-hidden bg-[#012C61] text-white">
        <div className="max-w-7xl mx-auto text-lg">
          {/* Heading */}
          <p className="font-semibold mb-8 leading-relaxed text-center lg:text-left">
            MediRate's Medicaid reimbursement tracking service is designed to support a
            broad array of Medicaid stakeholders including:
          </p>

          {/* Flex Container for Image and Points List */}
          <div className="flex flex-col lg:flex-row items-center lg:space-x-8">
            {/* Image Section */}
            <div className="lg:w-1/2 lg:flex lg:justify-start">
              <Image
                src="/images/Historical_rates_2.png"
                alt="Doctor working on laptop"
                width={1000}
                height={750}
                className="rounded-lg shadow-lg"
              />
            </div>

            {/* Points List */}
            <ul className="w-full lg:w-1/2 space-y-4 mt-8 lg:mt-0">
              {[
                "Long term services and supports providers",
                "Behavioral health providers",
                "Organizations serving individuals living with addiction",
                "Other Medicaid-reimbursed Provider Types",
                "Managed care organizations",
                "Trade associations",
                "Investment firms and other financial services organizations",
                "Healthcare consulting firms and other advisors",
              ].map((point, index) => (
                <li
                  key={index}
                  className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <ChevronRight className="text-white w-5 h-5 flex-shrink-0" />
                  <span className="text-white">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Information Section */}
          <div className="mt-8 text-lg">
            <p className="leading-relaxed text-white text-center">
              MediRate understands the complexity involved
              in finding and tracking Medicaid payment rates and the frustration
              created by unexpected reimbursement changes. Our goal is to improve
              Medicaid payment rate transparency and support strategic
              decision-making by provider organizations and other stakeholders.
            </p>
            {/* Schedule a Demo Button */}
            <div className="mt-4 flex justify-center">
              <Link
                href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1QOXygd6Dpekn_BDsmrizOLq3D9aX8iq_aopMjF5o4Z2_APztYi8VXo5QMn2ab0sDZ5rTX18ii"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  className:
                    "bg-[#1a1a1a] text-white px-6 py-3 rounded-md border border-transparent transition-colors duration-300 hover:bg-transparent hover:border-white hover:text-white",
                })}
              >
                <span>Schedule a Live Presentation</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cards and Newsletter Section */}
      <section className="py-24 bg-gradient-to-r from-[#f0f4f8] to-[#e0e6ed]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          {/* Cards with Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
            {/* Card 1: Our Solution */}
            <Link href="/oursolution" passHref>
              <div className="bg-white rounded-xl overflow-hidden shadow-md cursor-pointer transition-transform transform hover:scale-105 hover:shadow-xl">
                <Image
                  src="/images/our solution screenshot.png"
                  alt="Our Solution"
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 text-center">
                  <h3 className="text-[#012C61] text-lg">
                    OUR SOLUTION
                  </h3>
                </div>
              </div>
            </Link>

            {/* Card 2: Subscribe */}
            <Link href="/subscribe" passHref>
              <div className="bg-white rounded-xl overflow-hidden shadow-md cursor-pointer transition-transform transform hover:scale-105 hover:shadow-xl">
                <Image
                  src="/images/subscribe.jpeg"
                  alt="Subscribe"
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 text-center">
                  <h3 className="text-[#012C61] text-lg">
                    SUBSCRIBE
                  </h3>
                </div>
              </div>
            </Link>
          </div>

          {/* Newsletter */}
          {/* <h2 className="text-[#012C61] text-4xl font-medium mb-8">
            Sign Up for Our Free Newsletter
          </h2>
          <Link
            href="/newsletter"
            className="bg-[#012C61] text-white px-10 py-4 rounded-lg border border-transparent transition-colors duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
          >
            <span>Sign Up for Free</span>
          </Link> */}
        </div>
      </section>

      {/* Footer Section */}
      <Footer /> {/* Replace the inline footer with the Footer component */}
    </div>
  );
}