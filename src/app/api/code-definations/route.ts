import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    console.log('🔍 Code Definitions API - Starting batch fetch from Supabase...');
    
    // Create service client for server-side operations
    const supabase = createServiceClient();
    
    let allData: any[] = [];
    let start = 0;
    const batchSize = 1000;
    let hasMoreData = true;
    let batchCount = 0;
    
    while (hasMoreData) {
      batchCount++;
      console.log(`📦 Fetching batch ${batchCount} (records ${start}-${start + batchSize - 1})...`);
      
      const { data, error } = await supabase
        .from('code_definitions')
        .select('hcpcs_code_cpt_code, service_code, service_description')
        .order('service_code')
        .range(start, start + batchSize - 1);
      
      if (error) {
        console.error(`❌ Supabase error fetching batch ${batchCount}:`, error);
        return NextResponse.json(
          { error: "Failed to fetch code definitions" },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        console.log(`🏁 No more data found at batch ${batchCount}, stopping...`);
        hasMoreData = false;
        break;
      }

      // Add this batch to our total data
      allData.push(...data);
      console.log(`✅ Batch ${batchCount}: Fetched ${data.length} records. Total so far: ${allData.length}`);
      
      // If we got less than the batch size, we've reached the end
      if (data.length < batchSize) {
        console.log(`🏁 Reached end of data (batch returned ${data.length} < ${batchSize})`);
        hasMoreData = false;
      } else {
        start += batchSize;
      }
      
      // Safety mechanism to prevent infinite loops
      if (batchCount > 100) {
        console.warn('⚠️ Stopping after 100 batches to prevent infinite loop');
        hasMoreData = false;
      }
    }

    if (allData.length === 0) {
      console.log('⚠️ Code Definitions API - No data found across all batches');
      return NextResponse.json(
        { error: "No code definitions found" },
        { status: 404 }
      );
    }

    console.log(`🎉 Code Definitions API - Successfully fetched ${allData.length} total records across ${batchCount} batches`);
    console.log(`📊 Breakdown: CPT: ${allData.filter(item => item.hcpcs_code_cpt_code === 'CPT').length}, HCPCS: ${allData.filter(item => item.hcpcs_code_cpt_code === 'HCPCS').length}`);
    
    return NextResponse.json(allData);
  } catch (error) {
    console.error("❌ Error fetching code definitions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
