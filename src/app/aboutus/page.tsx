import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin } from "lucide-react";
import Footer from "@/app/components/footer"; // Import the Footer component

export default function AboutUs() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[500px]">
        <Image
          src="/images/business-adviser-analyzing-financial-figures-denoting-progress_1418-2907.jpg" // First Banner Image
          alt="About Us Banner"
          layout="fill"
          objectFit="cover"
          className="brightness-75"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl text-white font-lemonMilkRegular uppercase tracking-wide">
            ABOUT US
          </h1>
        </div>
      </section>

      {/* About Us Content with Gradient */}
      <section className="relative py-12 px-6 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10 reusable-gradient-bg"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:space-x-12">
          {/* Greg's Image */}
          <div className="w-full lg:w-1/3 flex justify-center mb-8 lg:mb-0">
            <Image
              src="/images/greg.png"
              alt="Greg Nersessian"
              width={300}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>

          {/* Text Content */}
          <div className="w-full lg:w-2/3">
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Greg Nersessian</strong> is President and Founder of
              MediRate, LLC. Prior to founding MediRate, Greg spent 14 years as
              a healthcare consultant for Health Management Associates (HMA),
              the nation’s largest consulting firm focused on
              government-sponsored healthcare programs.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Greg’s work at HMA involved supporting healthcare providers,
              investors, and other stakeholders in their evaluation of capital
              allocation opportunities within government-funded businesses. In
              this role, Greg recognized the key role that reimbursement rate
              dynamics play in private sector partnerships.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Greg founded MediRate with the goal of improving cost transparency
              and data comparability across programs. Prior to joining HMA, Greg
              spent a decade on Wall Street as a sell-side equity research
              analyst covering the managed care sector. In this role, Greg was
              known for his groundbreaking research into the Medicaid managed
              care sector.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer /> {/* Replace the inline footer with the Footer component */}
    </div>
  );
}
