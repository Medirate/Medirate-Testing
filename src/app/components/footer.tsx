import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer
      className="py-6 text-white border-t flex flex-row items-center justify-between px-6"
      style={{
        backgroundColor: "rgb(1, 44, 97)",
        borderColor: "#E5E7EB", // Matches navbar border
        position: "relative", // Ensures proper stacking
        zIndex: 100, // Keep this lower than modal and icon
      }}
    >
      {/* Wordmark on the Left */}
      <div className="flex-shrink-0">
        <Image
          src="/top-black-just-word.png"
          alt="MediRate Wordmark"
          width={200}
          height={80}
          priority
        />
      </div>

      {/* Centered Content (Social Icons & Text) */}
      <div className="flex flex-col items-center text-center flex-grow">
        {/* Social Icons */}
        {/* <Link href="https://linkedin.com" target="_blank" rel="noreferrer">
          <Linkedin className="w-8 h-8 text-white hover:text-blue-400 transition-colors mb-2" />
        </Link> */}

        {/* Copyright Text */}
        <p className="text-lg text-gray-300 cursor-pointer">
          CPT Copyright © 2025 American Medical Association. All rights reserved.
        </p>
      </div>

      {/* Logo on the Right */}
      <div className="flex-shrink-0">
        <Image
          src="/top-black-just-logo.png"
          alt="MediRate Logo"
          width={80}
          height={80}
          priority
          style={{ width: '80px', height: 'auto' }}
        />
      </div>
    </footer>
  );
};

export default Footer;
