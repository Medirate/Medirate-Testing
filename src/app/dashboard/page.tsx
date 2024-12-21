import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <h1 className="text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          MediRate Dashboard
        </h1>
        <h2 className="text-lg font-semibold mb-4">
          Embedded Looker Studio Report
        </h2>

        {/* Embedded Report */}
        <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg border">
          <iframe
            src="https://lookerstudio.google.com/embed/reporting/f1837c75-6dd4-4355-9966-ca1785d14302/page/4OrWB"
            title="Looker Studio Report"
            width="100%"
            height="100%"
            allowFullScreen
            frameBorder="0"
          ></iframe>
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
