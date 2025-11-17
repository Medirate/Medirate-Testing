import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Query the 'bills' table
    const { rows } = await pool.query("SELECT * FROM bills_test_by_dev");

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
