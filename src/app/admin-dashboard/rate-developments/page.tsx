"use client";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/components/applayout";
import { Pencil, Database, Mail } from "lucide-react";
import Link from "next/link";

const adminActions = [
  {
    href: "/admin-dashboard/rate-developments/edit",
    title: "Edit Rate Developments",
    description: "Edit and manage rate development entries.",
    icon: <Pencil size={32} className="text-purple-600" />,
    border: "border-purple-500",
  },
  {
    href: "/admin-dashboard/rate-developments/update-database",
    title: "Update Database",
    description: "Upload or update the rate developments database.",
    icon: <Database size={32} className="text-blue-600" />,
    border: "border-blue-500",
  },
  {
    href: "/admin-dashboard/rate-developments/send-email-alerts",
    title: "Send Out Email Alerts",
    description: "Send email alerts to users about rate developments.",
    icon: <Mail size={32} className="text-green-600" />,
    border: "border-green-500",
  },
];

export default function AdminRateDevelopments() {
  const router = useRouter();
  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          Rate Developments Admin
        </h1>
        <p className="text-lg text-gray-600 mb-10">Administer, update, and send alerts for rate developments.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {adminActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center transition-transform hover:-translate-y-2 hover:shadow-2xl border-t-4 border-transparent hover:${action.border}`}
            >
              <div className="mb-4">{action.icon}</div>
              <h2 className="text-xl font-bold text-[#2d217c] mb-2 group-hover:text-purple-700 text-center">{action.title}</h2>
              <p className="text-gray-500 text-center">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
} 