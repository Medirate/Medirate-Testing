import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin } from "lucide-react";

export default function AboutUs() {
  return (
    <div>
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

      {/* About Us Content */}
      <section className="py-12 px-6 bg-white">
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
