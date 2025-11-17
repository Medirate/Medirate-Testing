import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Corrected table name to 'provider_alerts'
    const { rows } = await pool.query("SELECT * FROM provider_alerts ORDER BY announcement_date DESC");

    // Return the rows as JSON
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching data:", error.message, error.stack);
    } else {
      console.error("Unknown error occurred:", error);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
