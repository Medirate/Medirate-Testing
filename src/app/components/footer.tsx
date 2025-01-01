// components/footer.tsx

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 text-center text-white bg-black">
      <div className="flex flex-col items-center">
        <Image src="/top-black.png" alt="MediRate Logo" width={100} height={50} />
        <div className="mt-4 flex space-x-6">
          <Link href="https://facebook.com" target="_blank" rel="noreferrer">
            <Facebook className="w-8 h-8 text-white hover:text-blue-600 transition-colors" />
          </Link>
          <Link href="https://linkedin.com" target="_blank" rel="noreferrer">
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
  );
};

export default Footer;
