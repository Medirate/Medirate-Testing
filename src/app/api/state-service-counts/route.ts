import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    console.log('🔍 State Service Counts API - Fetching unique service codes per state...');
    
    // Create service client for server-side operations
    const supabase = createServiceClient();
    
    // First, let's see how many total records we have
    const { count: totalCount, error: countError } = await supabase
      .from('master_data_sept_2')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting total count:', countError);
    } else {
      console.log(`📊 Total records in master_data_sept_2: ${totalCount}`);
    }

    // Use a raw SQL query to get unique service code counts per state efficiently
    console.log('🔍 Using raw SQL query to get unique service code counts per state...');
    
    const { data, error } = await supabase
      .rpc('get_state_service_counts_aggregated');
    
    if (error) {
      console.log('🔄 RPC function not found, using individual state queries...');
      
      // Fallback: Query each state individually but more efficiently
      const usStates = [
        'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO', 'CONNECTICUT',
        'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO', 'ILLINOIS', 'INDIANA', 'IOWA',
        'KANSAS', 'KENTUCKY', 'LOUISIANA', 'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN',
        'MINNESOTA', 'MISSISSIPPI', 'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA', 'NEW HAMPSHIRE',
        'NEW JERSEY', 'NEW MEXICO', 'NEW YORK', 'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO',
        'OKLAHOMA', 'OREGON', 'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA',
        'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON', 'WEST VIRGINIA',
        'WISCONSIN', 'WYOMING', 'DISTRICT OF COLUMBIA'
      ];
      
      const stateCounts: { [key: string]: number } = {};
      
      for (const state of usStates) {
        // Get all service codes for this state (with a reasonable limit)
        const { data: serviceCodes, error: codesError } = await supabase
          .from('master_data_sept_2')
          .select('service_code')
          .eq('state_name', state)
          .not('service_code', 'is', null)
          .not('service_code', 'eq', '')
          .limit(10000); // Reasonable limit per state
        
        if (codesError) {
          console.error(`❌ Error fetching service codes for ${state}:`, codesError);
          continue;
        }
        
        // Count unique service codes
        const uniqueCodes = new Set(serviceCodes.map(s => s.service_code?.trim()).filter(Boolean));
        stateCounts[state] = uniqueCodes.size;
        
        console.log(`✅ ${state}: ${uniqueCodes.size} unique service codes`);
      }
      
      console.log(`✅ Successfully processed ${Object.keys(stateCounts).length} states`);
      console.log('📊 Sample counts:', Object.entries(stateCounts).slice(0, 5));

      return NextResponse.json({ 
        stateCounts: stateCounts,
        totalStates: Object.keys(stateCounts).length
      });
    }
    
    // If RPC function worked, use that data
    if (!data || data.length === 0) {
      console.log('🏁 No data found from RPC function');
      return NextResponse.json({ stateCounts: {} });
    }
    
    console.log(`✅ Successfully processed ${data.length} states from RPC function`);
    console.log('📊 Sample data:', data.slice(0, 5));
    
    return NextResponse.json({ 
      stateCounts: data,
      totalStates: data.length
    });

  } catch (error) {
    console.error('❌ Error in state service counts API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
