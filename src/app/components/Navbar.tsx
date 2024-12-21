import { ArrowRight } from "lucide-react"; // Import the arrow icon
import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import Image from "next/image";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/server";

const Navbar = () => {
  return (
    <nav
      className="sticky inset-x-0 top-0 z-30 w-full border-b backdrop-blur-lg transition-all"
      style={{ backgroundColor: "#012C61", height: "5.5rem" }} // Navbar height
    >
      <MaxWidthWrapper>
        <div className="flex h-[5.5rem] items-center justify-start px-4 lg:px-6">
          {/* Logo/Brand moved all the way to the left */}
          <div className="flex-shrink-0 mr-auto">
            <Link href="/" className="flex items-center">
              <Image
                src="/top-black.png"
                alt="MediRate Logo"
                width={150}
                height={70}
                priority
              />
            </Link>
          </div>

          {/* Navbar Links aligned to the far right */}
          <div className="flex items-center space-x-6">
            <Link
              href="/oursolution"
              className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent"
            >
              Our Solution
            </Link>
            <Link
              href="/ourcustomers"
              className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent"
            >
              Our Customers
            </Link>
            <Link
              href="/aboutus"
              className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent"
            >
              About Us
            </Link>
            <Link
              href="/contactus"
              className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent"
            >
              Contact Us
            </Link>
            <Link
              href="/subscribe"
              className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent"
            >
              Subscribe
            </Link>

            {/* Sign In Button with Arrow */}
            <LoginLink
              className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#012C61] font-semibold transition-colors hover:bg-transparent hover:text-white"
            >
              <span>Sign In</span>
              <ArrowRight className="ml-2 h-4 w-4" /> {/* Arrow icon */}
            </LoginLink>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
