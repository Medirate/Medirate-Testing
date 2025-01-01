"use client"; // Indicate this is a client component
import { LogOut, ArrowRight } from "lucide-react"; // Import icons
import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import Image from "next/image";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navbarStyle = {
    backgroundColor: "rgb(1, 44, 97)",
    height: "5.5rem",
  };

  if (isLoading) {
    return (
      <nav
        className="sticky inset-x-0 top-0 z-30 w-full border-b backdrop-blur-lg transition-all"
        style={navbarStyle}
      >
        <MaxWidthWrapper>
          <div className="flex h-[5.5rem] items-center justify-center">
            <span className="text-white">Loading...</span>
          </div>
        </MaxWidthWrapper>
      </nav>
    );
  }

  // Dashboard-specific Navbar
  if (pathname === "/dashboard" && isAuthenticated) {
    return (
      <nav
        className="sticky inset-x-0 top-0 z-30 w-full border-b backdrop-blur-lg transition-all"
        style={navbarStyle}
      >
        <MaxWidthWrapper>
          <div className="flex h-[5.5rem] items-center justify-between px-4 lg:px-6">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
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

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                {user?.picture ? (
                  <Image
                    src={user.picture}
                    alt="User Avatar"
                    className="object-cover w-full h-full"
                    fill
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-purple-500 text-white font-bold">
                    {user?.given_name?.charAt(0) || user?.email?.charAt(0) || "?"}
                  </div>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-4">
                  <div className="px-4 pb-4 border-b">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.given_name || "User Name"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                  <div className="py-2 border-t">
                    <LogoutLink
                      className="w-full flex items-center px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      Sign Out
                    </LogoutLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </MaxWidthWrapper>
      </nav>
    );
  }

  // Default Navbar for all other pages
  return (
    <nav
      className="sticky inset-x-0 top-0 z-30 w-full border-b backdrop-blur-lg transition-all"
      style={navbarStyle}
    >
      <MaxWidthWrapper>
        <div className="flex h-[5.5rem] items-center justify-start px-4 lg:px-6">
          {/* Logo/Brand */}
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

          {/* Navbar Links */}
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

            {/* Sign In or Dashboard Button */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#000000] font-semibold transition-colors hover:bg-transparent hover:text-white"
              >
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/api/auth/login"
                className="flex items-center border border-white bg-white px-4 py-2 rounded-md text-[#000000] font-semibold transition-colors hover:bg-transparent hover:text-white"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
