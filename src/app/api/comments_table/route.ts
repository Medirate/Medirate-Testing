import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceCategory = searchParams.get("serviceCategory");
    const state = searchParams.get("state");

    let query = "SELECT * FROM comments_table";
    const params = [];

    if (serviceCategory && state) {
      query += " WHERE service_category = $1 AND state = $2";
      params.push(serviceCategory, state);
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching comments data:", error.message, error.stack);
    } else {
      console.error("Unknown error occurred:", error);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 