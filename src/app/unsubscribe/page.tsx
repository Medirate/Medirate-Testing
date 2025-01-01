"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = (e) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter a valid email address.");
      return;
    }

    // Simulate API call for unsubscribing
    setTimeout(() => {
      setMessage("You have successfully unsubscribed from our emails.");
      setEmail("");
    }, 1000);
  };

  return (
    <div className="gradient-wrapper min-h-screen flex flex-col items-center justify-center">
      {/* Reusable Gradient Background */}
      <div className="reusable-gradient-bg absolute inset-0 z-[-1]"></div>

      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/top-white.png"
            alt="MediRate Logo"
            width={100}
            height={50}
            priority
          />
          <h1 className="text-3xl font-bold text-[#012C61] mt-4">Unsubscribe</h1>
          <p className="text-gray-600 mt-2 text-center">
            We're sorry to see you go! Please confirm your email address to
            unsubscribe from our emails.
          </p>
        </div>

        <form onSubmit={handleUnsubscribe} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#012C61] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#012C61] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#004080] transition"
          >
            Unsubscribe
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm font-semibold text-green-600">
            {message}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[#012C61] hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
