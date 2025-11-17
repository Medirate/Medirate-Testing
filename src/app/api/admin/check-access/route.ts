import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Check if user exists in admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    if (adminError) {
      if (adminError.code === "PGRST116") {
        // No rows returned
        return NextResponse.json({ 
          isAdmin: false, 
          adminUser: null 
        });
      } else {
        console.error("Error checking admin access:", adminError);
        return NextResponse.json({ 
          error: "Failed to check admin access" 
        }, { status: 500 });
      }
    }

    if (adminData) {
      return NextResponse.json({ 
        isAdmin: true, 
        adminUser: adminData 
      });
    }

    return NextResponse.json({ 
      isAdmin: false, 
      adminUser: null 
    });

  } catch (error) {
    console.error("Error in admin check access API:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
