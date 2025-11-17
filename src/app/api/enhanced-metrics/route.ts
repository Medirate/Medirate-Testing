import { NextResponse } from 'next/server';
import { gunzipSync, strFromU8 } from "fflate";
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the enhanced compressed metrics file from public folder
    const filePath = join(process.cwd(), 'public', 'enhanced_metrics_detailed.json.gz');
    
    // Check if the enhanced file exists, fallback to original if not
    let gzipped;
    try {
      gzipped = readFileSync(filePath);
    } catch (error) {
      console.log('⚠️ Enhanced metrics file not found, falling back to original metrics');
      const originalPath = join(process.cwd(), 'public', 'state_metrics_detailed.json.gz');
      gzipped = readFileSync(originalPath);
    }
    
    // Decompress the data
    const decompressed = gunzipSync(new Uint8Array(gzipped));
    const jsonStr = strFromU8(decompressed);
    const data = JSON.parse(jsonStr);
    
    console.log('✅ Enhanced metrics loaded successfully');
    console.log('📊 Data version:', data.metadata?.version || '1.0');
    console.log('📋 Tables included:', data.metadata?.tables || ['state_metrics']);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error loading enhanced metrics:', error);
    return NextResponse.json(
      { error: "Failed to load enhanced metrics" },
      { status: 500 }
    );
  }
}




