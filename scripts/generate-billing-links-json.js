#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const xlsx = require('xlsx');
const { put } = require('@vercel/blob');

function extractLinksFromWorkbook(xlsxPath) {
  const wb = xlsx.readFile(xlsxPath, { cellDates: true });
  const first = wb.SheetNames[0];
  if (!first) throw new Error('Workbook has no sheets');
  const ws = wb.Sheets[first];

  // Read header row (row 0 in our 0-based representation via sheet_to_json header:1)
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (!rows.length) return {};
  const header = rows[0].map(h => String(h).trim());
  const headerLower = header.map(h => h.toLowerCase());
  const stateIdx = headerLower.findIndex(h => h.includes('state'));
  if (stateIdx < 0) throw new Error('No STATE column found in first row');

  // Link columns = every column except state; we will pull hyperlink targets from cell.l.Target
  const linkCols = headerLower.map((_, i) => i).filter(i => i !== stateIdx);

  const range = xlsx.utils.decode_range(ws['!ref'] || `A1:${xlsx.utils.encode_cell({ c: header.length - 1, r: rows.length - 1 })}`);
  const out = {};

  for (let r = range.s.r + 1; r <= range.e.r; r++) { // start after header row
    // Read state value from its cell
    const stateCell = xlsx.utils.encode_cell({ c: stateIdx, r });
    const sCell = ws[stateCell];
    const rawState = sCell ? String(sCell.v || '').trim() : '';
    if (!rawState) continue;
    const state = rawState.toUpperCase();

    const links = [];
    for (const c of linkCols) {
      const addr = xlsx.utils.encode_cell({ c, r });
      const cell = ws[addr];
      if (!cell) continue;
      // Prefer hyperlink target if present
      const linkTarget = cell.l && (cell.l.Target || cell.l.target);
      if (typeof linkTarget === 'string' && /^https?:\/\//i.test(linkTarget.trim())) {
        const title = (typeof cell.v === 'string' && cell.v.trim()) ? cell.v.trim() : linkTarget.trim();
        links.push({ title, url: linkTarget.trim() });
        continue;
      }
      // Fallback to visible text if it is a URL
      if (typeof cell.v === 'string' && /^https?:\/\//i.test(cell.v.trim())) {
        const url = cell.v.trim();
        links.push({ title: url, url });
      }
    }
    if (links.length) out[state] = links;
  }
  return out;
}

async function main() {
  const xlsxPath = process.argv[2];
  if (!xlsxPath) {
    console.error('Usage: node scripts/generate-billing-links-json.js <PATH_TO_XLSX>');
    process.exit(1);
  }
  const abs = path.resolve(xlsxPath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || process.env.BLOB_TOKEN;
  if (!token) {
    console.error('Missing blob token. Ensure BLOB_READ_WRITE_TOKEN is set in .env');
    process.exit(1);
  }

  const data = extractLinksFromWorkbook(abs);
  const json = JSON.stringify({ stateLinks: data, updatedAt: new Date().toISOString() }, null, 2);
  const pathname = `_metadata/manual_billing_links.json`;
  console.log(`⬆️  Uploading JSON to Vercel Blob at ${pathname} ...`);
  const res = await put(pathname, Buffer.from(json), { access: 'public', token, allowOverwrite: true });
  console.log('✅ Uploaded:', res.url);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
