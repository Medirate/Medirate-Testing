/*
  Read-only comparison of latest BT50 Excel (Azure Blob) vs Supabase bill_track_50.
  Outputs counts and samples of DB rows missing from Excel, with an option to filter
  to rows that have no service lines populated.

  Usage:
    node scripts/compare-bt50-vs-db.js            # full diff
    node scripts/compare-bt50-vs-db.js --no-sl    # only rows with no service lines

  Env required:
    AZURE_CONNECTION_STRING
    CONTAINER_NAME
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE
*/

const { BlobServiceClient } = require('@azure/storage-blob');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getCurrentFileName() {
  return 'Medicaid Rates bill sheet with categories.xlsx';
}

async function toBufferFromStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function isEmpty(val) {
  if (val === null || val === undefined) return true;
  const s = String(val).trim();
  return s === '' || s.toUpperCase() === 'NULL';
}

(async () => {
  const onlyNoServiceLines = process.argv.includes('--no-sl');

  const AZURE_CONNECTION_STRING = getEnv('AZURE_CONNECTION_STRING');
  const CONTAINER_NAME = getEnv('CONTAINER_NAME');
  const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE');

  console.log('Connecting to Azure Blob...');
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const fileName = getCurrentFileName();
  const blobClient = containerClient.getBlobClient(fileName);
  if (!(await blobClient.exists())) {
    throw new Error(`BT50 file not found: ${fileName}`);
  }

  console.log('Downloading BT50 Excel...');
  const dl = await blobClient.download();
  const stream = dl.readableStreamBody;
  if (!stream) throw new Error('No stream from blob');
  const buffer = await toBufferFromStream(stream);

  console.log('Parsing Excel...');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames.filter((n) => /^\d{6}$/.test(n)).sort((a, b) => b.localeCompare(a));
  if (sheetNames.length === 0) throw new Error('No MMDDYY sheets found');
  const latestSheet = sheetNames[0];
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[latestSheet], { defval: '' });

  const columnMap = {
    'action date': 'action_date',
    'bill number': 'bill_number',
    'ai summary': 'ai_summary',
    'bill progress': 'bill_progress',
    'last action': 'last_action',
    'sponsor list': 'sponsor_list',
    'service': 'service_lines_impacted',
    'service 1': 'service_lines_impacted_1',
    'service 2': 'service_lines_impacted_2',
    'service 3': 'service_lines_impacted_3',
    'service lines impacted': 'service_lines_impacted',
    'service lines impacted 1': 'service_lines_impacted_1',
    'service lines impacted 2': 'service_lines_impacted_2',
    'service lines impacted 3': 'service_lines_impacted_3',
  };
  function mapToDbColumns(obj) {
    const mapped = {};
    for (const key in obj) {
      const clean = key.trim().toLowerCase();
      mapped[columnMap[clean] || clean] = obj[key];
    }
    return mapped;
  }
  const mappedRows = rawRows.map(mapToDbColumns);
  const excelUrls = new Set(
    mappedRows
      .map((r) => (typeof r.url === 'string' ? r.url.trim() : ''))
      .filter((u) => u.length > 0)
  );

  console.log(`Excel latest sheet: ${latestSheet}, URLs: ${excelUrls.size}`);

  console.log('Querying Supabase bill_track_50...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: dbRows, error: dbError } = await supabase
    .from('bill_track_50')
    .select('state,bill_number,name,last_action,action_date,sponsor_list,bill_progress,url,ai_summary,service_lines_impacted,service_lines_impacted_1,service_lines_impacted_2,service_lines_impacted_3,is_new,date_extracted');
  if (dbError) throw new Error(`Supabase error: ${dbError.message}`);

  const notInExcel = (dbRows || []).filter((row) => {
    const url = typeof row.url === 'string' ? row.url.trim() : '';
    return url && !excelUrls.has(url);
  });

  const withoutService = notInExcel.filter((row) =>
    isEmpty(row.service_lines_impacted) &&
    isEmpty(row.service_lines_impacted_1) &&
    isEmpty(row.service_lines_impacted_2) &&
    isEmpty(row.service_lines_impacted_3)
  );

  const result = onlyNoServiceLines ? withoutService : notInExcel;

  console.log('----- Comparison Summary -----');
  console.log(`DB total: ${dbRows?.length || 0}`);
  console.log(`Excel total URLs: ${excelUrls.size}`);
  console.log(`DB entries missing from Excel: ${notInExcel.length}`);
  console.log(`...of which have no service lines: ${withoutService.length}`);
  console.log(`Sample (first 10):`);
  console.log(
    result.slice(0, 10).map((r) => ({ state: r.state, bill_number: r.bill_number, name: r.name, url: r.url }))
  );

  // Detailed recency info for the no-service-line subset
  if (withoutService.length > 0) {
    console.log('\n----- No Service Lines — Recency Info (up to 15) -----');
    const recencySample = withoutService.slice(0, 15).map(r => ({
      state: r.state,
      bill_number: r.bill_number,
      name: r.name,
      url: r.url,
      date_extracted: r.date_extracted || null,
      is_new: r.is_new || null,
    }));
    console.log(recencySample);
  }
})().catch((e) => {
  console.error('Compare failed:', e?.message || e);
  process.exit(1);
});


