"use client";
import AppLayout from "@/app/components/applayout";
import { useState } from "react";

export default function FixWashingtonADA() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFix = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/documents/fix-washington-ada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix folder');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          Fix Washington ADA Folder
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          This will rename the WASHINGTON/ADA/ folder to WASHINGTON/ABA/ in Vercel Blob storage.
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-2xl">
          <button
            onClick={handleFix}
            disabled={loading}
            className={`px-8 py-3 rounded-md font-semibold text-sm text-white transition-all duration-200 shadow-md ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#012C61] hover:bg-[#014085] hover:shadow-lg active:scale-95'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Fix Washington ADA Folder'
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-semibold mb-2">Result:</p>
              <p className="text-green-700 mb-2">{result.message}</p>
              <div className="text-sm text-green-600">
                <p>Total files: {result.total}</p>
                <p>Successfully moved: {result.moved}</p>
                <p>Errors: {result.errors}</p>
                {result.errorDetails && result.errorDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Error details:</p>
                    <ul className="list-disc list-inside">
                      {result.errorDetails.map((detail: string, idx: number) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

