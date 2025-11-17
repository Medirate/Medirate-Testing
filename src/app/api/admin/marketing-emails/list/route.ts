import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return authError;
    }
    
    console.log(`✅ Admin access validated for marketing emails list: ${adminUser.email}`);
    
    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE) {
      console.error("SUPABASE_SERVICE_ROLE environment variable is missing");
      return NextResponse.json(
        { error: "Database configuration error", details: "SUPABASE_SERVICE_ROLE not set" },
        { status: 500 }
      );
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL environment variable is missing");
      return NextResponse.json(
        { error: "Database configuration error", details: "NEXT_PUBLIC_SUPABASE_URL not set" },
        { status: 500 }
      );
    }
    
    console.log("Creating Supabase service client...");
    const supabase = createServiceClient();
    console.log("Supabase service client created successfully");
    
    // Fetch both email lists with batch processing to get all records
    const fetchAllRecords = async (tableName: string) => {
      let allData: any[] = [];
      let start = 0;
      const batchSize = 1000;
      let hasMoreData = true;
      let batchCount = 0;
      
      while (hasMoreData) {
        batchCount++;
        console.log(`📦 Fetching batch ${batchCount} for ${tableName} (records ${start}-${start + batchSize - 1})...`);
        
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .order("email", { ascending: true })
          .range(start, start + batchSize - 1);
        
        if (error) {
          console.error(`Error fetching batch ${batchCount} from ${tableName}:`, error);
          break;
        }
        
        if (!data || data.length === 0) {
          hasMoreData = false;
          break;
        }
        
        allData.push(...data);
        
        if (data.length < batchSize) {
          hasMoreData = false;
        } else {
          start += batchSize;
        }
        
        // Safety mechanism to prevent infinite loops
        if (batchCount > 100) {
          console.warn(`⚠️ Safety limit reached for ${tableName}, stopping at ${batchCount} batches`);
          hasMoreData = false;
        }
      }
      
      console.log(`✅ Fetched ${allData.length} total records from ${tableName} in ${batchCount} batches`);
      return allData;
    };

    const [testEmailList, marketingEmailList] = await Promise.all([
      fetchAllRecords("test_email_list"),
      fetchAllRecords("marketing_email_list")
    ]);

    const testEmailResult = { data: testEmailList, error: null };
    const marketingEmailResult = { data: marketingEmailList, error: null };

    if (testEmailResult.error) {
      console.error("Error fetching test email list:", testEmailResult.error);
    }

    if (marketingEmailResult.error) {
      console.error("Error fetching marketing email list:", marketingEmailResult.error);
    }

    return NextResponse.json({
      testEmailList: testEmailResult.data || [],
      marketingEmailList: marketingEmailResult.data || []
    });

  } catch (error) {
    console.error("Error in marketing emails list API:", error);
    
    // Check if it's a Supabase connection error
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: "Database connection failed", details: "Unable to connect to database" },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch email lists", details: "Internal server error" },
      { status: 500 }
    );
  }
}
