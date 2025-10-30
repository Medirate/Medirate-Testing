import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createServiceClient();

// Helper function to parse rate from text
function parseRate(rateText: string): number {
  if (!rateText) return 0;
  
  // Remove $, spaces, and other non-numeric characters except decimal point and minus
  const cleaned = rateText.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

export async function GET(request: Request) {
  console.log('🚀 API HIT - state-payment-comparison endpoint called!');
  console.log('🔍 FULL URL:', request.url);
  
  // Force debug mode detection
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode');
  console.log('🔍 MODE DETECTED:', mode);
  
  if (mode === 'stateAverages') {
    console.log('🎯 STATE AVERAGES MODE DETECTED - THIS IS THE CRITICAL PATH!');
  }
  
  try {
    // Validate authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      console.log('❌ API - Authentication failed');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('✅ API - Authentication successful for user:', user.email);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    
    // Handle state averages mode for "All States" feature
    if (mode === "stateAverages") {
      const serviceCategory = searchParams.get("serviceCategory");
      const serviceCode = searchParams.get("serviceCode");
      const program = searchParams.get("program");
      const locationRegion = searchParams.get("locationRegion");
      const providerType = searchParams.get("providerType");
      const modifier = searchParams.get("modifier");
      const serviceDescription = searchParams.get("serviceDescription");
      const durationUnit = searchParams.get("durationUnit");
      const feeScheduleDate = searchParams.get("feeScheduleDate");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      
      if (!serviceCategory || !serviceCode) {
        return NextResponse.json({ error: "Service category and service code are required" }, { status: 400 });
      }

      // SPECIAL DEBUG: Check for the specific H0004 + BEHAVIORAL HEALTH combination
      if (serviceCode.trim() === 'H0004' && serviceCategory.includes('BEHAVIORAL HEALTH')) {
        console.log('🎯 SPECIAL DEBUG - H0004 + BEHAVIORAL HEALTH combination detected!');
        
        // Test 1: Check total count for this service code
        const { data: h0004Data, error: h0004Error } = await supabase
          .from('master_data_sept_2')
          .select('state_name, service_category, service_code')
          .eq('service_code', 'H0004');
        console.log('🎯 H0004 total records:', h0004Data?.length || 0);
        console.log('🎯 H0004 unique categories:', [...new Set(h0004Data?.map(r => r.service_category) || [])]);
        
        // Test 2: Check for exact category match
        const { data: exactData, error: exactError } = await supabase
          .from('master_data_sept_2')
          .select('state_name, service_category, service_code')
          .eq('service_code', 'H0004')
          .eq('service_category', serviceCategory);
        console.log('🎯 H0004 + exact category match:', exactData?.length || 0);
        
        // Test 3: Check for ILIKE category match
        const { data: ilikeData, error: ilikeError } = await supabase
          .from('master_data_sept_2')
          .select('state_name, service_category, service_code')
          .eq('service_code', 'H0004')
          .ilike('service_category', serviceCategory.trim());
        console.log('🎯 H0004 + ilike category match:', ilikeData?.length || 0);
        
        // Test 4: Check for partial category match
        const { data: partialData, error: partialError } = await supabase
          .from('master_data_sept_2')
          .select('state_name, service_category, service_code')
          .eq('service_code', 'H0004')
          .ilike('service_category', '%BEHAVIORAL HEALTH%');
        console.log('🎯 H0004 + partial category match:', partialData?.length || 0);
        
        if (partialData && partialData.length > 0) {
          const uniqueStates = [...new Set(partialData.map(r => r.state_name))];
          console.log('🎯 H0004 unique states found:', uniqueStates.length, uniqueStates.slice(0, 10));
        }
      }

      // Build the query for state averages
      console.log(`🔍 API: Building state averages query for serviceCategory="${serviceCategory}" serviceCode="${serviceCode}"`);
      
      // For state averages, we need ALL records by paginating through Supabase's 1000-record limit
      console.log(`🔍 API: Fetching ALL records via pagination (Supabase has 1000-record limit)`);
      
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`🔍 API: Fetching batch ${Math.floor(offset/batchSize) + 1} (offset: ${offset})`);
        
        const { data: batchData, error } = await supabase
          .from('master_data_sept_2')
          .select('state_name, service_category, service_code, rate, duration_unit, rate_effective_date')
          .ilike('service_category', serviceCategory.trim())
          .ilike('service_code', serviceCode.trim())
          .range(offset, offset + batchSize - 1);
        
        if (error) {
          console.error(`🔍 API: Error in batch ${Math.floor(offset/batchSize) + 1}:`, error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        if (batchData && batchData.length > 0) {
          allData.push(...batchData);
          console.log(`🔍 API: Batch ${Math.floor(offset/batchSize) + 1} fetched ${batchData.length} records. Total so far: ${allData.length}`);
          
          // If we got less than batchSize, we've reached the end
          if (batchData.length < batchSize) {
            hasMore = false;
            console.log(`🔍 API: Reached end of data (batch returned ${batchData.length} < ${batchSize})`);
          } else {
            offset += batchSize;
          }
        } else {
          hasMore = false;
          console.log(`🔍 API: No more data found`);
        }
      }
      
      console.log(`🔍 API: Pagination complete. Total records fetched: ${allData.length}`);
      const data = allData;
      
      // For state averages mode, we only filter by service_category and service_code
      // We want ALL records across all programs, durations, locations, etc. to get true state averages
      console.log(`🔍 API: State Averages mode - only filtering by service_category and service_code`);
      
      // Note: service_category and service_code are already applied above
      // Do NOT apply additional filters like program, locationRegion, durationUnit, etc.
      // as we want to average across ALL variations for each state

      // Debug: Check raw data before state averaging
      const uniqueStates = [...new Set(data?.map((item: any) => item.state_name) || [])];
      console.log(`🔍 API: Raw query found ${data?.length || 0} records across ${uniqueStates.length} unique states`);
      console.log(`🔍 API: Unique states found:`, uniqueStates.sort());
      
      // Check if we're getting all the expected data
      if (data && data.length > 0) {
        const sampleRecord = data[0];
        console.log(`🔍 API: Sample record structure:`, {
          state_name: sampleRecord.state_name,
          service_category: sampleRecord.service_category,
          service_code: sampleRecord.service_code,
          rate: sampleRecord.rate
        });
      }

      // Group by state and unique combination, then pick latest per combo
      const stateCombos: { [state: string]: { [combo: string]: any } } = {};
      data?.forEach((item: any) => {
        const state = item.state_name;
        // Build a unique key for the combination (excluding date and rate)
        const comboKey = [
          item.service_code,
          item.program,
          item.location_region,
          item.provider_type,
          item.duration_unit,
          item.service_description,
          item.modifier_1,
          item.modifier_2,
          item.modifier_3,
          item.modifier_4
        ].map(x => x ?? '').join('|');
        if (!stateCombos[state]) stateCombos[state] = {};
        const existing = stateCombos[state][comboKey];
        if (!existing || new Date(item.rate_effective_date) > new Date(existing.rate_effective_date)) {
          stateCombos[state][comboKey] = item;
        }
      });

      // For each state, average the latest rates for all combos
      const stateAverages = Object.entries(stateCombos).map(([state, combos]) => {
        const rates = Object.values(combos).map((item: any) => parseRate(item.rate)).filter((r: number) => r > 0);
        const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
        
        // Get service_category and service_code from the first combo for this state
        const firstCombo = Object.values(combos)[0] as any;
        
        return {
          state_name: state,
          service_category: firstCombo?.service_category || serviceCategory, // Fallback to request param
          service_code: firstCombo?.service_code || serviceCode, // Fallback to request param
          avg_rate: avg,
          count: rates.length
        };
      });
      
      // DEBUG: Log what we're actually returning for state averages
      console.log('🎯 STATE AVERAGES DEBUG - Final response:', {
        totalStates: stateAverages.length,
        sampleState: stateAverages[0],
        serviceCategories: [...new Set(stateAverages.map(s => s.service_category))],
        serviceCodes: [...new Set(stateAverages.map(s => s.service_code))]
      });

      // Debug: Check how many states survived the averaging
      const validAverages = stateAverages.filter(s => s.avg_rate > 0);
      console.log(`🔍 API: After state averaging: ${validAverages.length} states with valid rates`);

      return NextResponse.json({
        stateAverages,
        totalStates: stateAverages.length
      });
    }

    // Regular data fetching mode (existing logic)
    const getParam = (key: string) => searchParams.get(key) || searchParams.get(key.replace(/_/g, ''));
    const serviceCategory = getParam("service_category") || getParam("serviceCategory");
    const state = getParam("state_name") || getParam("state");
    const serviceCode = getParam("service_code") || getParam("serviceCode");
    const serviceDescription = getParam("service_description") || getParam("serviceDescription");
    const program = getParam("program");
    const locationRegion = getParam("location_region") || getParam("locationRegion");
    const providerType = getParam("provider_type") || getParam("providerType");
    const modifier = getParam("modifier_1") || getParam("modifier");
    // Handle multiple duration units - get all values and join with comma
    const durationUnitParams1 = searchParams.getAll("durationUnit");
    const durationUnitParams2 = searchParams.getAll("duration_unit");
    const durationUnitParams = durationUnitParams1.length > 0 ? durationUnitParams1 : durationUnitParams2;
    const durationUnit = durationUnitParams.length > 0 ? durationUnitParams.join(',') : null;
    console.log('🎯 API: Multiple duration units extracted:', { 
      durationUnitParams1, 
      durationUnitParams2, 
      durationUnitParams, 
      durationUnit,
      url: request.url
    });
    const startDate = getParam("start_date") || getParam("startDate");
    const endDate = getParam("end_date") || getParam("endDate");
    const feeScheduleDate = getParam("fee_schedule_date") || getParam("feeScheduleDate");
    const page = parseInt(getParam("page") || "1");
    const itemsPerPage = parseInt(getParam("itemsPerPage") || "50");
    const sortParam = getParam("sort");

    // Build Supabase query
    let query = supabase.from('master_data_sept_2').select('*', { count: 'exact' });
    
    // DEBUG: Log the parameters being used
    console.log('🔍 API Debug - Parameters received:', {
      serviceCategory,
      state,
      serviceCode,
      serviceDescription,
      program,
      locationRegion,
      providerType,
      modifier,
      durationUnit,
      feeScheduleDate,
      startDate,
      endDate
    });
    
    // DEBUG: Test query to see if we can get any data at all
    const testQuery = supabase.from('master_data_sept_2').select('service_category, state_name, service_code').limit(5);
    const { data: testData, error: testError } = await testQuery;
    console.log('🔍 API Debug - Test query results:', {
      testDataLength: testData?.length || 0,
      testError: testError?.message || null,
      sampleTestData: testData?.slice(0, 2) || []
    });
    
    // DEBUG: Check what service categories exist for HCBS
    const hcbsQuery = supabase.from('master_data_sept_2')
      .select('service_category')
      .ilike('service_category', '%HOME AND COMMUNITY%')
      .limit(10);
    const { data: hcbsData, error: hcbsError } = await hcbsQuery;
    console.log('🔍 API Debug - HCBS service categories found:', {
      hcbsDataLength: hcbsData?.length || 0,
      hcbsError: hcbsError?.message || null,
      hcbsCategories: hcbsData?.map(item => item.service_category) || []
    });
    
    // DEBUG: Test each filter individually
    console.log('🔍 API Debug - Testing filters individually...');
    
    // Test 1: Just service category
    const test1 = supabase.from('master_data_sept_2')
      .select('service_category, state_name, service_code')
      .eq('service_category', serviceCategory);
    const { data: test1Data, error: test1Error } = await test1;
    console.log('🔍 API Debug - Test 1 (service_category only):', {
      count: test1Data?.length || 0,
      error: test1Error?.message || null,
      sample: test1Data?.slice(0, 2) || []
    });
    
    // Test 2: Service category + state
    const test2 = supabase.from('master_data_sept_2')
      .select('service_category, state_name, service_code')
      .eq('service_category', serviceCategory)
      .ilike('state_name', (state || '').trim() + '%'); // Use ILIKE to handle trailing spaces
    const { data: test2Data, error: test2Error } = await test2;
    console.log('🔍 API Debug - Test 2 (service_category + state):', {
      count: test2Data?.length || 0,
      error: test2Error?.message || null,
      sample: test2Data?.slice(0, 2) || []
    });
    
    // Test 3: Service category + state + service code
    const test3 = supabase.from('master_data_sept_2')
      .select('service_category, state_name, service_code')
      .eq('service_category', serviceCategory)
      .ilike('state_name', (state || '').trim() + '%') // Use ILIKE to handle trailing spaces
      .eq('service_code', serviceCode);
    const { data: test3Data, error: test3Error } = await test3;
    console.log('🔍 API Debug - Test 3 (all three filters):', {
      count: test3Data?.length || 0,
      error: test3Error?.message || null,
      sample: test3Data?.slice(0, 2) || []
    });
    
    // DEBUG: Check what state names exist for HCBS
    const stateQuery = supabase.from('master_data_sept_2')
      .select('state_name')
      .eq('service_category', serviceCategory)
      .ilike('state_name', '%NEBRASKA%');
    const { data: stateData, error: stateError } = await stateQuery;
    console.log('🔍 API Debug - State names for HCBS containing "NEBRASKA":', {
      stateDataLength: stateData?.length || 0,
      stateError: stateError?.message || null,
      stateNames: [...new Set(stateData?.map(item => `"${item.state_name}"`) || [])] // Show unique state names with quotes to see spaces
    });
    
    if (serviceCategory) {
      // Use ILIKE to handle potential trailing spaces
      const trimmedCategory = serviceCategory.trim();
      console.log(`🔍 API Debug - Service category filtering: "${serviceCategory}" → "${trimmedCategory}"`);
      
      // Test different service category approaches
      const exactCatTest = supabase.from('master_data_sept_2')
        .select('service_category')
        .eq('service_category', trimmedCategory)
        .limit(5);
      const { data: exactCatData } = await exactCatTest;
      console.log(`🔍 API Debug - Exact category match for "${trimmedCategory}":`, exactCatData?.length || 0);
      
      const spaceCatTest = supabase.from('master_data_sept_2')
        .select('service_category')
        .eq('service_category', trimmedCategory + ' ')
        .limit(5);
      const { data: spaceCatData } = await spaceCatTest;
      console.log(`🔍 API Debug - Category with trailing space "${trimmedCategory} ":`, spaceCatData?.length || 0);
      
      // Use ILIKE with wildcards to handle any trailing spaces
      console.log(`🔍 API Debug - Using ILIKE pattern for service category: "%${trimmedCategory}%"`);
      query = query.ilike('service_category', `%${trimmedCategory}%`);
    }
    if (state) {
      // Use ILIKE to handle trailing spaces on both sides
      const trimmedState = state.trim();
      console.log(`🔍 API Debug - State filtering: "${state}" → "${trimmedState}"`);
      
      // Test different state name approaches
      const exactStateTest = supabase.from('master_data_sept_2')
        .select('state_name')
        .eq('state_name', trimmedState)
        .limit(5);
      const { data: exactStateData } = await exactStateTest;
      console.log(`🔍 API Debug - Exact state match for "${trimmedState}":`, exactStateData?.length || 0);
      
      const spaceStateTest = supabase.from('master_data_sept_2')
        .select('state_name')
        .eq('state_name', trimmedState + ' ')
        .limit(5);
      const { data: spaceStateData } = await spaceStateTest;
      console.log(`🔍 API Debug - State with trailing space "${trimmedState} ":`, spaceStateData?.length || 0);
      
      // Avoid substring matches like "KANSAS" matching "ARKANSAS".
      // Prefer prefix match (handles potential trailing spaces in source data) OR exact match.
      console.log(`🔍 API Debug - Using ILIKE pattern for state (prefix): "${trimmedState}%" with OR exact`);
      query = query.or(`state_name.eq.${trimmedState},state_name.ilike.${trimmedState}%`);
    }
    if (serviceCode) {
      if (serviceCode.includes(',')) {
        // Handle multi-select service codes
        const serviceCodes = serviceCode.split(',').map(code => code.trim()).filter(code => code.length > 0);
        console.log(`🔍 API Debug - Multi-select service codes: "${serviceCode}" → [${serviceCodes.join(', ')}]`);
        
        if (serviceCodes.length > 0) {
          // Use OR condition for multiple service codes with ILIKE for each
          const orConditions = serviceCodes.map(code => `service_code.ilike.%${code}%`).join(',');
          query = query.or(orConditions);
          console.log(`🔍 API Debug - Using OR condition: ${orConditions}`);
        }
      } else {
        const trimmedCode = serviceCode.trim();
        console.log(`🔍 API Debug - Single service code filtering: "${serviceCode}" → "${trimmedCode}"`);
        
        // Test different approaches to find the service code
        // First try exact match
        const exactTest = supabase.from('master_data_sept_2')
          .select('service_code, state_name, service_category')
          .eq('service_code', trimmedCode)
          .limit(5);
        const { data: exactData } = await exactTest;
        console.log(`🔍 API Debug - Exact match for "${trimmedCode}":`, exactData?.length || 0);
        
        // Try with trailing space
        const spaceTest = supabase.from('master_data_sept_2')
          .select('service_code, state_name, service_category')
          .eq('service_code', trimmedCode + ' ')
          .limit(5);
        const { data: spaceData } = await spaceTest;
        console.log(`🔍 API Debug - With trailing space "${trimmedCode} ":`, spaceData?.length || 0);
        
        // Try ILIKE with wildcards
        const ilikeTest = supabase.from('master_data_sept_2')
          .select('service_code, state_name, service_category')
          .ilike('service_code', `%${trimmedCode}%`)
          .limit(5);
        const { data: ilikeData } = await ilikeTest;
        console.log(`🔍 API Debug - ILIKE with wildcards "%${trimmedCode}%":`, ilikeData?.length || 0);
        
        // Use ILIKE with wildcards since service codes have varying trailing spaces
        console.log(`🔍 API Debug - Using ILIKE pattern for service code: "%${trimmedCode}%"`);
        query = query.ilike('service_code', `%${trimmedCode}%`);
      }
    }
    if (serviceDescription) {
      const trimmedDescription = serviceDescription.trim();
      // Use ILIKE to handle potential trailing spaces
      query = query.ilike('service_description', trimmedDescription);
    }
    
    // Handle secondary filters with "-" option for empty values and multi-select support
    if (program) {
      if (program === '-') {
        query = query.or('program.is.null,program.eq.');
      } else {
        // Always use exact match for program since it doesn't have trailing spaces
        // Note: Program names can contain commas, so don't treat commas as multi-select separators
        const trimmedProgram = program.trim();
        console.log(`🔍 API Debug - Program filtering: "${program}" → "${trimmedProgram}"`);
        query = query.eq('program', trimmedProgram);
      }
    }
    if (locationRegion) {
      if (locationRegion === '-') {
        query = query.or('location_region.is.null,location_region.eq.');
      } else if (locationRegion.includes(',')) {
        // Handle multi-select - split by comma and use OR with ILIKE
        const regions = locationRegion.split(',').map(r => r.trim()).filter(r => r);
        if (regions.length > 0) {
          const orConditions = regions.map(r => `location_region.ilike.${r}`).join(',');
          query = query.or(orConditions);
        }
      } else {
        // Use ILIKE to handle trailing spaces
        query = query.ilike('location_region', locationRegion.trim());
      }
    }
    if (providerType) {
      if (providerType === '-') {
        query = query.or('provider_type.is.null,provider_type.eq.');
      } else if (providerType.includes(',')) {
        // Handle multi-select - split by comma and use OR with ILIKE
        const types = providerType.split(',').map(t => t.trim()).filter(t => t);
        if (types.length > 0) {
          const orConditions = types.map(t => `provider_type.ilike.${t}`).join(',');
          query = query.or(orConditions);
        }
      } else {
        // Use ILIKE to handle trailing spaces
        query = query.ilike('provider_type', providerType.trim());
      }
    }
    if (modifier) {
      if (modifier === '-') {
        // Show entries with no modifiers
        query = query.is('modifier_1', null).is('modifier_2', null).is('modifier_3', null).is('modifier_4', null);
      } else if (modifier.includes(',')) {
        // Handle multi-select - split by comma and check all modifier columns with ILIKE
        const modifiers = modifier.split(',').map(m => m.trim()).filter(m => m);
        if (modifiers.length > 0) {
          const orConditions = modifiers.map(m => 
            `modifier_1.ilike.${m},modifier_2.ilike.${m},modifier_3.ilike.${m},modifier_4.ilike.${m}`
          ).join(',');
          query = query.or(orConditions);
        }
      } else {
        // Check all modifier columns with ILIKE to handle trailing spaces
        const trimmedModifier = modifier.trim();
        query = query.or(`modifier_1.ilike.${trimmedModifier},modifier_2.ilike.${trimmedModifier},modifier_3.ilike.${trimmedModifier},modifier_4.ilike.${trimmedModifier}`);
      }
    }
    if (durationUnit) {
      if (durationUnit === '-') {
        query = query.or('duration_unit.is.null,duration_unit.eq.');
      } else if (durationUnit.includes(',')) {
        // Handle multi-select - split by comma and use exact matching with .in()
        const units = durationUnit.split(',').map(u => u.trim()).filter(u => u);
        if (units.length > 0) {
          console.log('🎯 API: Using .in() for multiple duration units:', units);
          query = query.in('duration_unit', units);
        }
      } else {
        // Use exact matching - fetch exactly what was selected
        query = query.eq('duration_unit', durationUnit.trim());
      }
    }
    if (feeScheduleDate) {
      query = query.eq('rate_effective_date', feeScheduleDate);
    } else if (startDate && endDate) {
      query = query.gte('rate_effective_date', startDate).lte('rate_effective_date', endDate);
    } else if (startDate) {
      query = query.gte('rate_effective_date', startDate);
    } else if (endDate) {
      query = query.lte('rate_effective_date', endDate);
    }
    // Sorting
    if (sortParam) {
      for (const sortPart of sortParam.split(',')) {
        const [col, dir] = sortPart.split(':');
        if (col) query = query.order(col, { ascending: dir !== 'desc' });
      }
    } else {
      query = query.order('state_name', { ascending: true }).order('service_code', { ascending: true });
    }
    // Pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    // DEBUG: Add final query summary
    console.log('🔍 API Debug - Final query summary:', {
      serviceCategory: serviceCategory || 'NOT_SET',
      state: state || 'NOT_SET', 
      serviceCode: serviceCode || 'NOT_SET',
      program: program || 'NOT_SET',
      locationRegion: locationRegion || 'NOT_SET',
      providerType: providerType || 'NOT_SET',
      modifier: modifier || 'NOT_SET',
      durationUnit: durationUnit || 'NOT_SET'
    });

    // Fetch data
    const { data, error, count } = await query;
    
    // DEBUG: Log the query results
    console.log('🔍 API Debug - Query results:', {
      dataLength: data?.length || 0,
      count: count || 0,
      error: error?.message || null,
      sampleData: data?.slice(0, 2) || [] // Show first 2 records for debugging
    });
    
    if (error) {
      console.error('❌ API Debug - Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      data: data || [],
      totalCount: count || 0,
      currentPage: page,
      itemsPerPage,
      filterOptions: {}, // Optionally, you can add filter options here if needed
      debug: {
        durationUnitReceived: durationUnit,
        durationUnitParams,
        uniqueDurationUnits: [...new Set((data || []).map((item: any) => item.duration_unit))],
        sampleEntries: (data || []).slice(0, 3).map((item: any) => ({
          state: item.state_name,
          duration_unit: item.duration_unit,
          rate: item.rate
        }))
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

