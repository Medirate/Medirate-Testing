import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30'); // Default to last 30 days
    const limit = parseInt(searchParams.get('limit') || '100'); // Default to 100 records
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`🔍 Fetching recent rate changes from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Query the database for recent rate changes
    // We'll get all records and then process them to find actual changes
    const { data: allData, error: allError } = await supabase
      .from('master_data_sept_2')
      .select('*')
      .gte('rate_effective_date', startDate.toISOString().split('T')[0])
      .lte('rate_effective_date', endDate.toISOString().split('T')[0])
      .order('rate_effective_date', { ascending: false })
      .limit(1000); // Get more data to process changes
    
    if (allError) {
      console.error('Error fetching data:', allError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
    
    if (!allData || allData.length === 0) {
      return NextResponse.json({
        changes: [],
        totalChanges: 0,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        summary: {
          totalStates: 0,
          totalServiceCategories: 0,
          averagePercentageChange: 0
        }
      });
    }
    
    console.log(`📊 Found ${allData.length} records in date range`);
    
    // Group by service details (everything except rate and date)
    const serviceGroups = new Map();
    
    allData.forEach(record => {
      const key = JSON.stringify({
        state_name: record.state_name,
        service_category: record.service_category,
        service_code: record.service_code,
        service_description: record.service_description,
        program: record.program,
        location_region: record.location_region,
        provider_type: record.provider_type,
        duration_unit: record.duration_unit,
        modifier_1: record.modifier_1,
        modifier_1_details: record.modifier_1_details,
        modifier_2: record.modifier_2,
        modifier_2_details: record.modifier_2_details,
        modifier_3: record.modifier_3,
        modifier_3_details: record.modifier_3_details,
        modifier_4: record.modifier_4,
        modifier_4_details: record.modifier_4_details
      });
      
      if (!serviceGroups.has(key)) {
        serviceGroups.set(key, []);
      }
      serviceGroups.get(key).push(record);
    });
    
    console.log(`📊 Grouped into ${serviceGroups.size} unique service combinations`);
    
    // Find actual changes (services with multiple rate/date combinations)
    const changes = [];
    let totalPercentageChange = 0;
    let changeCount = 0;
    
    for (const [key, records] of serviceGroups) {
      // Sort by date to get chronological order
      const sortedRecords = records.sort((a, b) => 
        new Date(a.rate_effective_date).getTime() - new Date(b.rate_effective_date).getTime()
      );
      
      // Get the latest record
      const latestRecord = sortedRecords[sortedRecords.length - 1];
      
      // If we have multiple records, try to find a change
      if (records.length >= 2) {
        const previousRecord = sortedRecords[sortedRecords.length - 2];
        const latestRate = parseFloat(latestRecord.rate?.replace(/[$,]/g, '') || '0');
        const previousRate = parseFloat(previousRecord.rate?.replace(/[$,]/g, '') || '0');
        
        if (latestRate !== previousRate) {
          // This is an actual rate change
          const percentageChange = previousRate > 0 ? ((latestRate - previousRate) / previousRate) * 100 : 0;
          
          changes.push({
            id: `${latestRecord.state_name}-${latestRecord.service_code}-${latestRecord.rate_effective_date}`,
            state: latestRecord.state_name,
            serviceCategory: latestRecord.service_category,
            serviceCode: latestRecord.service_code,
            serviceDescription: latestRecord.service_description,
            program: latestRecord.program,
            locationRegion: latestRecord.location_region,
            providerType: latestRecord.provider_type,
            durationUnit: latestRecord.duration_unit,
            modifier1: latestRecord.modifier_1,
            modifier1Details: latestRecord.modifier_1_details,
            modifier2: latestRecord.modifier_2,
            modifier2Details: latestRecord.modifier_2_details,
            modifier3: latestRecord.modifier_3,
            modifier3Details: latestRecord.modifier_3_details,
            modifier4: latestRecord.modifier_4,
            modifier4Details: latestRecord.modifier_4_details,
            oldRate: previousRecord.rate,
            newRate: latestRecord.rate,
            oldRateNumeric: previousRate,
            newRateNumeric: latestRate,
            percentageChange: percentageChange,
            effectiveDate: latestRecord.rate_effective_date,
            previousDate: previousRecord.rate_effective_date,
            changeCount: records.length,
            isChange: true
          });
          
          totalPercentageChange += percentageChange;
          changeCount++;
        } else {
          // No rate change, but show the latest rate
          changes.push({
            id: `${latestRecord.state_name}-${latestRecord.service_code}-${latestRecord.rate_effective_date}`,
            state: latestRecord.state_name,
            serviceCategory: latestRecord.service_category,
            serviceCode: latestRecord.service_code,
            serviceDescription: latestRecord.service_description,
            program: latestRecord.program,
            locationRegion: latestRecord.location_region,
            providerType: latestRecord.provider_type,
            durationUnit: latestRecord.duration_unit,
            modifier1: latestRecord.modifier_1,
            modifier1Details: latestRecord.modifier_1_details,
            modifier2: latestRecord.modifier_2,
            modifier2Details: latestRecord.modifier_2_details,
            modifier3: latestRecord.modifier_3,
            modifier3Details: latestRecord.modifier_3_details,
            modifier4: latestRecord.modifier_4,
            modifier4Details: latestRecord.modifier_4_details,
            oldRate: latestRecord.rate,
            newRate: latestRecord.rate,
            oldRateNumeric: latestRate,
            newRateNumeric: latestRate,
            percentageChange: 0,
            effectiveDate: latestRecord.rate_effective_date,
            previousDate: latestRecord.rate_effective_date,
            changeCount: records.length,
            isChange: false
          });
        }
      } else {
        // Only one record, show it as the latest rate
        const latestRate = parseFloat(latestRecord.rate?.replace(/[$,]/g, '') || '0');
        
        changes.push({
          id: `${latestRecord.state_name}-${latestRecord.service_code}-${latestRecord.rate_effective_date}`,
          state: latestRecord.state_name,
          serviceCategory: latestRecord.service_category,
          serviceCode: latestRecord.service_code,
          serviceDescription: latestRecord.service_description,
          program: latestRecord.program,
          locationRegion: latestRecord.location_region,
          providerType: latestRecord.provider_type,
          durationUnit: latestRecord.duration_unit,
          modifier1: latestRecord.modifier_1,
          modifier1Details: latestRecord.modifier_1_details,
          modifier2: latestRecord.modifier_2,
          modifier2Details: latestRecord.modifier_2_details,
          modifier3: latestRecord.modifier_3,
          modifier3Details: latestRecord.modifier_3_details,
          modifier4: latestRecord.modifier_4,
          modifier4Details: latestRecord.modifier_4_details,
          oldRate: latestRecord.rate,
          newRate: latestRecord.rate,
          oldRateNumeric: latestRate,
          newRateNumeric: latestRate,
          percentageChange: 0,
          effectiveDate: latestRecord.rate_effective_date,
          previousDate: latestRecord.rate_effective_date,
          changeCount: 1,
          isChange: false
        });
      }
    }
    
    // Sort by most recent changes first
    changes.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    // Limit results
    const limitedChanges = changes.slice(0, limit);
    
    // Calculate summary statistics
    const uniqueStates = new Set(limitedChanges.map(c => c.state));
    const uniqueServiceCategories = new Set(limitedChanges.map(c => c.serviceCategory));
    const averagePercentageChange = changeCount > 0 ? totalPercentageChange / changeCount : 0;
    
    console.log(`📊 Found ${changes.length} actual rate changes`);
    
    return NextResponse.json({
      changes: limitedChanges,
      totalChanges: changes.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      summary: {
        totalStates: uniqueStates.size,
        totalServiceCategories: uniqueServiceCategories.size,
        averagePercentageChange: Math.round(averagePercentageChange * 100) / 100
      }
    });
    
  } catch (error) {
    console.error('Error fetching recent rate changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent rate changes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
