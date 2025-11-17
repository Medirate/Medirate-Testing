import { NextResponse } from 'next/server';
import { gunzipSync, strFromU8 } from "fflate";
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the compressed metrics file from public folder
    const filePath = join(process.cwd(), 'public', 'state_metrics_detailed.json.gz');
    const gzipped = readFileSync(filePath);
    
    // Decompress the data
    const decompressed = gunzipSync(new Uint8Array(gzipped));
    const jsonStr = strFromU8(decompressed);
    const data = JSON.parse(jsonStr);
    
    console.log('✅ State metrics loaded successfully');
    console.log('📊 Total states:', data.t || data.total || 'unknown');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error loading state metrics:', error);
    return NextResponse.json(
      { error: "Failed to load state metrics" },
      { status: 500 }
    );
  }
}
