"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { Search, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaExclamationCircle, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter, FaChartLine } from 'react-icons/fa';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { supabase } from "@/lib/supabase";

// Quick test page to debug the issue
export default function EditPageTest() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Provider Alerts
    const { data: providerAlerts, error: providerError } = await supabase
      .from("provider_alerts")
      .select("*")
      .order("announcement_date", { ascending: false });
    
    if (providerError) {
      console.error("Error fetching provider alerts:", providerError);
      setAlerts([]);
    } else {
      setAlerts(providerAlerts || []);
      console.log("🔍 Provider alerts loaded:", providerAlerts?.length || 0);
      console.log("🎯 New provider alerts:", providerAlerts?.filter(a => a.is_new === 'yes').length || 0);
    }

    // Fetch Legislative Updates
    const { data: billsData, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*");
    
    if (billsError) {
      console.error("Error fetching bills:", billsError);
      setBills([]);
    } else {
      setBills(billsData || []);
      console.log("🔍 Bills loaded:", billsData?.length || 0);
      console.log("🎯 New bills:", billsData?.filter(b => b.is_new === 'yes').length || 0);
      
      // Find the new entries
      const newBills = billsData?.filter(b => b.is_new === 'yes') || [];
      if (newBills.length > 0) {
        console.log("🎯 NEW BILLS FOUND:", newBills);
        newBills.forEach(bill => {
          console.log(`- URL: ${bill.url}, is_new: ${bill.is_new}, state: ${bill.state}, bill_number: ${bill.bill_number}`);
        });
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout activeTab="rateDevelopments">
        <div className="p-8">
          <h1 className="text-2xl mb-4">Loading...</h1>
        </div>
      </AppLayout>
    );
  }

  const newAlerts = alerts.filter(a => a.is_new === 'yes');
  const newBills = bills.filter(b => b.is_new === 'yes');

  return (
    <AppLayout activeTab="rateDevelopments">
      <div className="p-8">
        <h1 className="text-2xl mb-4">Debug: Rate Developments Edit</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Provider Alerts</h2>
            <p>Total: {alerts.length}</p>
            <p>New: {newAlerts.length}</p>
            {newAlerts.length > 0 && (
              <div className="mt-2">
                <h3 className="font-medium">New Alerts:</h3>
                {newAlerts.map(alert => (
                  <div key={alert.id} className="text-sm bg-green-100 p-2 mt-1 rounded">
                    State: {alert.state}, Subject: {alert.subject}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Legislative Bills</h2>
            <p>Total: {bills.length}</p>
            <p>New: {newBills.length}</p>
            {newBills.length > 0 && (
              <div className="mt-2">
                <h3 className="font-medium">New Bills:</h3>
                {newBills.map(bill => (
                  <div key={bill.url} className="text-sm bg-green-100 p-2 mt-1 rounded">
                    <p>State: {bill.state}</p>
                    <p>Bill: {bill.bill_number}</p>
                    <p>Name: {bill.name}</p>
                    <p>is_new: {bill.is_new}</p>
                    <p>URL: {bill.url}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">All Bills (First 10)</h2>
          <div className="space-y-2">
            {bills.slice(0, 10).map(bill => (
              <div key={bill.url} className={`p-2 rounded text-sm ${bill.is_new === 'yes' ? 'bg-green-100' : 'bg-gray-50'}`}>
                <p><strong>{bill.state} - {bill.bill_number}</strong> (is_new: {bill.is_new})</p>
                <p>{bill.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
