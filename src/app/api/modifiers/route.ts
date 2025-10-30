import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Modifiers API - Starting fetch from Supabase...');
    
    // Create service client for server-side operations
    const supabase = createServiceClient();
    
    let allModifiers: any[] = [];
    let start = 0;
    const batchSize = 1000;
    let hasMoreData = true;
    let batchCount = 0;
    
    while (hasMoreData) {
      batchCount++;
      console.log(`📦 Fetching batch ${batchCount} (records ${start}-${start + batchSize - 1})...`);
      
      // Pull modifiers from the SAME table as code definitions
      // The code_definitions table contains: hcpcs_code_cpt_code, service_code, service_description
      // We derive modifiers by scanning service_description for 2-character modifier codes (e.g., 25, 59, 26, TC, RT, LT, GT, QK, etc.)
      const { data, error } = await supabase
        .from('code_definitions')
        .select('service_description')
        .range(start, start + batchSize - 1);
      
      if (error) {
        console.error(`❌ Supabase error fetching batch ${batchCount}:`, error);
        return NextResponse.json(
          { error: "Failed to fetch modifiers" },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        console.log(`🏁 No more data found at batch ${batchCount}, stopping...`);
        hasMoreData = false;
        break;
      }

      // Process modifiers from this batch by parsing service_description
      const MODIFIER_REGEX = /\b([A-Z]{2}|[A-Z]\d|\d[A-Z]|\d{2})\b/g; // conservative 2-char tokens
      const KNOWN_PREFIX_REGEX = /\bmodifier[s]?\b\s*:?\s*/i; // e.g., "Modifier 59" or "modifiers: RT, LT"
      (data || []).forEach(record => {
        const desc = (record?.service_description || '').toString();
        if (!desc) return;
        // If the description references modifiers explicitly, prioritize those tokens
        const scanText = desc;
        const matches = scanText.match(MODIFIER_REGEX) || [];
        matches.forEach(token => {
          const code = token.trim().toUpperCase();
          // Heuristic: skip common two-letter English words that are not modifiers
          if ([
            'OF','IN','ON','TO','BY','AN','AS','AT','OR','IF','IT','IS','BE','US','NO','UP','PT','PA','FC'
          ].includes(code)) return;
          const existing = allModifiers.find(m => m.modifier_code === code);
          if (!existing) {
            allModifiers.push({ modifier_code: code, modifier_details: 'Derived from code definitions', usage_count: 1 });
          } else {
            existing.usage_count += 1;
          }
        });
      });

      console.log(`✅ Batch ${batchCount}: Processed ${data.length} records. Unique modifiers so far: ${allModifiers.length}`);
      
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

    if (allModifiers.length === 0) {
      console.log('⚠️ No modifiers found in database');
      return NextResponse.json([]);
    }

    // Sort modifiers by code
    allModifiers.sort((a, b) => a.modifier_code.localeCompare(b.modifier_code));

    console.log(`🎉 Modifiers API - Successfully fetched ${allModifiers.length} unique modifiers`);
    
    return NextResponse.json(allModifiers);

  } catch (error) {
    console.error('❌ Modifiers API - Error:', error);
    return NextResponse.json(
      { error: "Failed to fetch modifiers" },
      { status: 500 }
    );
  }
}
