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
      
      const { data, error } = await supabase
        .from('master_data_sept_2')
        .select('modifier_1, modifier_1_details, modifier_2, modifier_2_details, modifier_3, modifier_3_details, modifier_4, modifier_4_details')
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

      // Process modifiers from this batch
      data.forEach(record => {
        // Check each modifier column
        const modifierColumns = [
          { code: record.modifier_1, details: record.modifier_1_details },
          { code: record.modifier_2, details: record.modifier_2_details },
          { code: record.modifier_3, details: record.modifier_3_details },
          { code: record.modifier_4, details: record.modifier_4_details }
        ];

        modifierColumns.forEach(({ code, details }) => {
          if (code && code.trim() !== '' && code.toUpperCase() !== 'NULL') {
            // Check if this modifier already exists
            const existingModifier = allModifiers.find(m => m.modifier_code === code.trim().toUpperCase());
            
            if (!existingModifier) {
              allModifiers.push({
                modifier_code: code.trim().toUpperCase(),
                modifier_details: details?.trim() || 'No details available',
                usage_count: 1
              });
            } else {
              // Increment usage count
              existingModifier.usage_count += 1;
              
              // Update details if current one is more descriptive
              if (details && details.trim() !== '' && details.trim().length > existingModifier.modifier_details.length) {
                existingModifier.modifier_details = details.trim();
              }
            }
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
