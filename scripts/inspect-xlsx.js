#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/inspect-xlsx.js <PATH_TO_XLSX>');
    process.exit(1);
  }
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }

  const wb = xlsx.readFile(abs, { cellDates: true, cellNF: false, cellText: false });
  const sheetNames = wb.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    console.log('Workbook has no sheets.');
    return;
  }
  const firstName = sheetNames[0];
  const ws = wb.Sheets[firstName];
  // Convert to JSON rows
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const previewRows = rows.slice(0, 50); // limit output

  console.log(`Sheets (${sheetNames.length}): ${sheetNames.join(', ')}`);
  console.log(`First sheet: ${firstName}`);
  console.log('--- First sheet preview (up to 50 rows) ---');
  for (const row of previewRows) {
    console.log(row.map(v => (typeof v === 'string' ? v : (v ?? ''))).join('\t'));
  }
}

main();


