import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("service_category_list")
      .select("categories");

    if (error) {
      console.error("Error fetching service categories:", error);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }

    return NextResponse.json({ categories: data?.map(cat => cat.categories) || [] });
  } catch (error) {
    console.error("Error in service categories API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
