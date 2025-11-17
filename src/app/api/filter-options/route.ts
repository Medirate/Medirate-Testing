import { NextResponse } from "next/server";

const BLOB_URL = "https://4lg8e3vdgmahj6if.public.blob.vercel-storage.com/filter_options-Q51NqEolGmjU5uNDyYs2xF1ksviLQD.json";

let cachedFilterOptions: any = null;

export async function GET() {
  try {
    // (Optional) Add authentication here if needed

    // Use cached result if available
    if (cachedFilterOptions) {
      return NextResponse.json(cachedFilterOptions);
    }

    // Fetch from Vercel Blob Storage
    const res = await fetch(BLOB_URL);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch filter options from blob storage" }, { status: 500 });
    }
    const data = await res.json();
    cachedFilterOptions = data;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 