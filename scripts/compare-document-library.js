#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { list } = require('@vercel/blob');

const ALLOWED_EXTS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']);

function* walkFiles(rootDir) {
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    let dirents;
    try {
      dirents = fs.readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const d of dirents) {
      const full = path.join(current, d.name);
      if (d.isDirectory()) {
        stack.push(full);
      } else if (d.isFile()) {
        const ext = path.extname(d.name).toLowerCase();
        if (ALLOWED_EXTS.has(ext)) {
          yield full;
        }
      }
    }
  }
}

function collectLocalRelativePaths(rootDir) {
  const normalizedRoot = path.resolve(rootDir);
  const result = new Set();
  let total = 0;
  for (const file of walkFiles(normalizedRoot)) {
    const rel = path.relative(normalizedRoot, file).split(path.sep).join('/');
    result.add(rel);
    total++;
  }
  return { paths: result, total };
}

async function collectAllBlobs(token) {
  const all = [];
  let cursor = undefined;
  do {
    const res = await list({ cursor, token });
    all.push(...res.blobs);
    cursor = res.cursor;
  } while (cursor);
  return all;
}

function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n);
}

async function main() {
  const localRoot = process.argv[2];
  if (!localRoot) {
    console.error('Usage: node scripts/compare-document-library.js <LOCAL_ROOT_DIRECTORY>');
    process.exit(1);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || process.env.BLOB_TOKEN;
  if (!token) {
    console.error('Missing blob token. Ensure BLOB_READ_WRITE_TOKEN is set in .env');
    process.exit(1);
  }

  console.log(`🔎 Comparing local folder to Vercel Blob`);
  console.log(`📂 Local root: ${localRoot}`);
  console.log(`☁️  Remote: Vercel Blob (using provided token)`);

  // Local
  console.log('📊 Scanning local files...');
  const t0 = Date.now();
  const { paths: localPaths, total: localCount } = collectLocalRelativePaths(localRoot);
  console.log(`✅ Local scan complete in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${formatNumber(localCount)} files`);

  // Remote
  console.log('🌐 Listing remote blobs...');
  const r0 = Date.now();
  const blobs = await collectAllBlobs(token);
  const remotePaths = new Set(blobs.map(b => (b.pathname || '').replace(/^\/*/, '')));
  const remoteCount = remotePaths.size;
  console.log(`✅ Remote list complete in ${((Date.now() - r0) / 1000).toFixed(1)}s — ${formatNumber(remoteCount)} blobs`);

  // Compare by relative path, assuming uploads preserved relative paths
  const missingRemotely = [];
  const onlyRemote = [];

  for (const p of localPaths) {
    if (!remotePaths.has(p)) missingRemotely.push(p);
  }
  for (const p of remotePaths) {
    if (!localPaths.has(p)) onlyRemote.push(p);
  }

  const intersection = Math.min(localCount, remoteCount) - Math.abs(localCount - remoteCount) / 2; // rough indicator

  console.log('──────── Summary ────────');
  console.log(`📦 Local files:  ${formatNumber(localCount)}`);
  console.log(`☁️  Remote blobs: ${formatNumber(remoteCount)}`);
  console.log(`➕ In local not in remote: ${formatNumber(missingRemotely.length)}`);
  console.log(`➕ In remote not in local: ${formatNumber(onlyRemote.length)}`);

  const sample = (arr) => arr.slice(0, 20);
  if (missingRemotely.length) {
    console.log('\n🟠 Example paths missing in remote (first 20):');
    for (const p of sample(missingRemotely)) console.log(`  - ${p}`);
  }
  if (onlyRemote.length) {
    console.log('\n🔵 Example paths only in remote (first 20):');
    for (const p of sample(onlyRemote)) console.log(`  - ${p}`);
  }

  // Exit code conveys drift
  if (missingRemotely.length === 0 && onlyRemote.length === 0) {
    console.log('\n✅ Local and remote sets match by path.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Drift detected between local and remote.');
    process.exit(2);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});



