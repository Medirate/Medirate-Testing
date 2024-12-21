import Link from "next/link";
import Image from "next/image";
import { Facebook, Linkedin } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content Section */}
      <main className="flex-grow py-12 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Heading and Text */}
          <div>
            <h1 className="text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
              CONTACT US
            </h1>
            <p className="text-gray-700 leading-relaxed mb-6">
              Submit your questions and/or feedback in the text box below. A
              customer service representative will follow up with you shortly.
            </p>
            <p className="text-gray-700 leading-relaxed">
              MediRate’s database utilizes CPT and CDT codes licensed by the AMA
              and ADA. Include language.
            </p>
          </div>

          {/* Right Side: Contact Form */}
          <div>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Company"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
                />
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
              />
              <textarea
                rows={5}
                placeholder="Message"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-[#012C61] text-white py-3 rounded-md hover:bg-[#011B40] transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </main>

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
            <Link href="https://facebook.com" target="_blank" rel="noreferrer">
              <Facebook className="w-8 h-8 text-white hover:text-blue-600 transition-colors" />
            </Link>
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
