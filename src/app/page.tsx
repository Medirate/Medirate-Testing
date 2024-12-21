import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Facebook, Linkedin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative w-full h-screen">
        {/* Background Image */}
        <Image
          src="/images/lady-looking-at-screen.jpg"
          alt="Lady Looking at Screen"
          layout="fill"
          objectFit="cover"
          priority
        />

        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 bg-black/40">
          {/* Heading */}
          <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-lemonMilkRegular leading-tight font-lightBold">
            <span className="block">Medicaid Provider</span>
            <span className="block">Payment Information at</span>
            <span className="block">Your Fingertips</span>
          </h1>

          {/* Get Started Button */}
          <div className="mt-8">
            <Link
              href="/dashboard"
              className={buttonVariants({
                className:
                  "bg-[#012C61] text-white px-6 py-3 rounded-md border border-transparent transition-colors duration-300 hover:bg-transparent hover:border-white hover:text-white",
              })}
            >
              <span>Get Started</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* About MediRate Section */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#012C61]/30 to-transparent opacity-50 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 lg:flex lg:items-center lg:justify-between">
          {/* Text Content */}
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-lemonMilkRegular text-[#012C61] mb-6 font-lightBold">
              ABOUT MEDIRATE TEST-1
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              MediRate is the nation’s only comprehensive database of Medicaid
              fee schedule data, enabling users to search and monitor
              fee-for-service payment rates by state, service, billing code, and
              date.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              MediRate’s solution is designed to support Medicaid provider
              organizations and other stakeholders in tracking payment rate
              trends for key service lines and to inform market and product
              expansion opportunities.
            </p>
            <p className="text-gray-700 leading-relaxed mb-8">
              We take the mystery out of finding and tracking state Medicaid
              reimbursement information.
            </p>

            {/* Buttons */}
            <div className="flex space-x-4">
              <a
                href="/subscribe"
                className="bg-[#012C61] text-white px-6 py-3 rounded-md transition-colors duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
              >
                Subscribe Today
              </a>
              <a
                href="/read-more"
                className="bg-[#012C61] text-white px-6 py-3 rounded-md transition-colors duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
              >
                Read More
              </a>
            </div>
          </div>

          {/* Image Section */}
          <div className="mt-10 lg:mt-0 lg:w-1/2 lg:flex lg:justify-end">
            <Image
              src="/images/doctor-hand-on-laptop.png"
              alt="Doctor working on laptop"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* New Section: Cards as Buttons */}
      <section className="bg-[#012C61] py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Our Solution */}
          <Link href="/our-solution" passHref>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform transform hover:scale-105">
              <Image
                src="/images/doctor-looking-at-screen.png"
                alt="Our Solution"
                width={600}
                height={400}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 text-center">
                <h3 className="text-[#012C61] font-lemonMilkRegular text-lg">
                  OUR SOLUTION
                </h3>
              </div>
            </div>
          </Link>

          {/* Card 2: Our Customers */}
          <Link href="/ourcustomers" passHref>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform transform hover:scale-105">
              <Image
                src="/images/nurse-looking-into-screen.png"
                alt="Our Customers"
                width={600}
                height={400}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 text-center">
                <h3 className="text-[#012C61] font-lemonMilkRegular text-lg">
                  OUR CUSTOMERS
                </h3>
              </div>
            </div>
          </Link>

          {/* Card 3: Subscribe */}
          <Link href="/subscribe" passHref>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform transform hover:scale-105">
              <Image
                src="/images/Files-thing.png"
                alt="Subscribe"
                width={600}
                height={400}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 text-center">
                <h3 className="text-[#012C61] font-lemonMilkRegular text-lg">
                  SUBSCRIBE
                </h3>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-black py-12 text-center text-white">
        <div className="flex flex-col items-center">
          <Image
            src="/top-black.png"
            alt="Medirate Logo"
            width={100}
            height={50}
          />
          <div className="mt-4 flex space-x-6">
            {/* Facebook */}
            <Link href="https://facebook.com" target="_blank" rel="noreferrer">
              <Facebook className="w-8 h-8 text-white hover:text-blue-600 transition-colors" />
            </Link>
            {/* LinkedIn */}
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin className="w-8 h-8 text-white hover:text-blue-400 transition-colors" />
            </Link>
          </div>
          <p className="mt-6 max-w-2xl text-gray-300 text-sm">
            Praesent sit amet nulla a libero luctus dictum eu vitae risus.
            Nullam efficitur at lorem vitae tristique. Nunc malesuada accumsan
            convallis. Praesent eros sem, imperdiet ac ante vitae, ultricies
            fringilla justo.
          </p>
        </div>
      </footer>
    </div>
  );
}
