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
  const [error, setError] = useState<string | null>(null);

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

    // Fetch Legislative Updates - try different approaches to handle potential issues
    console.log("🔍 Attempting to fetch bills from bill_track_50...");
    
    // First try a simple count to test connection
    const { count, error: countError } = await supabase
      .from("bill_track_50")
      .select("*", { count: 'exact', head: true });
    
    if (countError) {
      console.error("❌ Error getting bill count:", countError);
      setError("Failed to connect to database");
      setBills([]);
      setLoading(false);
      return;
    }
    
    console.log(`✅ Bill count: ${count}`);
    
    // Now try to fetch the data - order by URL descending to get newer bills first
    const { data: billsData, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*")
      .order("url", { ascending: false })
      .limit(100); // Start with a smaller limit to avoid timeout
    
    if (billsError) {
      console.error("❌ Error fetching bills:", billsError);
      console.error("❌ Error details:", JSON.stringify(billsError, null, 2));
      
      // Try a simpler query without ordering
      console.log("🔄 Trying simpler query...");
      const { data: simpleBillsData, error: simpleError } = await supabase
        .from("bill_track_50")
        .select("*")
        .limit(50);
      
      if (simpleError) {
        console.error("❌ Simple query also failed:", simpleError);
        setBills([]);
      } else {
        setBills(simpleBillsData || []);
        console.log("✅ Simple query succeeded:", simpleBillsData?.length || 0);
      }
    } else {
      setBills(billsData || []);
      console.log("✅ Bills loaded:", billsData?.length || 0);
      
      if (billsData && billsData.length > 0) {
        // Check the first few entries for is_new values
        const first10 = billsData.slice(0, 10);
        console.log("🎯 FIRST 10 BILLS (ordered by URL desc - newest URLs first):");
        first10.forEach((bill, index) => {
          console.log(`${index + 1}. URL: ${bill.url}, is_new: "${bill.is_new}" (type: ${typeof bill.is_new}), State: ${bill.state}, Bill: ${bill.bill_number}`);
        });
        
        // Check for different variations of is_new
        const withYes = billsData.filter(b => b.is_new === 'yes');
        const withTrue = billsData.filter(b => b.is_new === true);
        const withOne = billsData.filter(b => b.is_new === 1);
        const withStringTrue = billsData.filter(b => b.is_new === 'true');
        
        console.log("🎯 NEW BILLS ANALYSIS:");
        console.log(`- is_new === 'yes': ${withYes.length}`);
        console.log(`- is_new === true: ${withTrue.length}`);
        console.log(`- is_new === 1: ${withOne.length}`);
        console.log(`- is_new === 'true': ${withStringTrue.length}`);
        
        // Find ANY entries that might be considered "new"
        const potentialNew = billsData.filter(b => 
          b.is_new === 'yes' || 
          b.is_new === true || 
          b.is_new === 1 || 
          b.is_new === 'true'
        );
        
        if (potentialNew.length > 0) {
          console.log("🎯 POTENTIAL NEW BILLS FOUND:", potentialNew);
          potentialNew.forEach(bill => {
            console.log(`- URL: ${bill.url}, is_new: "${bill.is_new}" (${typeof bill.is_new}), state: ${bill.state}, bill_number: ${bill.bill_number}`);
          });
        } else {
          console.log("❌ No new bills found with any of the expected is_new values");
        }
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
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
        
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
          <h2 className="text-lg font-semibold mb-2">Newest Bills (First 10) - Ordered by URL DESC</h2>
          <div className="space-y-2">
            {bills.slice(0, 10).map((bill, index) => (
              <div key={bill.url} className={`p-2 rounded text-sm border-l-4 ${
                bill.is_new === 'yes' || bill.is_new === true || bill.is_new === 1 || bill.is_new === 'true' 
                  ? 'bg-green-100 border-green-500' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <p><strong>#{index + 1}</strong></p>
                <p><strong>{bill.state} - {bill.bill_number}</strong></p>
                <p><strong>is_new:</strong> "{bill.is_new}" (type: {typeof bill.is_new})</p>
                <p>{bill.name}</p>
                <p className="text-xs text-gray-600 mt-1">URL: {bill.url}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🔍 Debug: Check Console Logs</h2>
          <p className="text-sm text-gray-600">
            Open browser console (F12) to see detailed analysis of is_new values and the newest 10 bills.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
