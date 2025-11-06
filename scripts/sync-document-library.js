#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { list, put } = require('@vercel/blob');

const ALLOWED_EXTS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']);
const MAX_CONCURRENCY = Math.max(2, Math.min(8, os.cpus().length));

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

function formatNumber(n) { return new Intl.NumberFormat('en-US').format(n); }

async function uploadWithConcurrency(localRoot, relativePaths, token) {
  let completed = 0;
  const total = relativePaths.length;
  const queue = [...relativePaths];
  const errors = [];

  function logProgress(prefix, file) {
    process.stdout.write(`\r${prefix} ${formatNumber(completed)}/${formatNumber(total)} | remaining ${formatNumber(total - completed)} | ${file.slice(0, 80)}`);
  }

  async function worker(id) {
    while (queue.length) {
      const rel = queue.shift();
      const full = path.join(localRoot, rel);
      try {
        const data = fs.readFileSync(full);
        await put(rel, data, { access: 'public', token });
        completed++;
        logProgress(`Uploading`, rel);
      } catch (err) {
        errors.push({ rel, error: err.message });
        completed++;
        logProgress(`Error`, rel);
      }
    }
  }

  const workers = Array.from({ length: MAX_CONCURRENCY }, (_, i) => worker(i));
  await Promise.all(workers);
  process.stdout.write('\n');
  return errors;
}

async function main() {
  const localRoot = process.argv[2];
  if (!localRoot) {
    console.error('Usage: node scripts/sync-document-library.js <LOCAL_ROOT_DIRECTORY>');
    process.exit(1);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || process.env.BLOB_TOKEN;
  if (!token) {
    console.error('Missing blob token. Ensure BLOB_READ_WRITE_TOKEN is set in .env');
    process.exit(1);
  }

  console.log(`🔁 Sync: Local → Vercel Blob`);
  console.log(`📂 Local root: ${localRoot}`);

  // Scan local
  console.log('📊 Scanning local files...');
  const t0 = Date.now();
  const { paths: localPaths, total: localCount } = collectLocalRelativePaths(localRoot);
  console.log(`✅ Local: ${formatNumber(localCount)} files`);

  // Remote listing
  console.log('🌐 Listing remote blobs...');
  const blobs = await collectAllBlobs(token);
  const remotePaths = new Set(blobs.map(b => (b.pathname || '').replace(/^\/*/, '')));
  console.log(`✅ Remote: ${formatNumber(remotePaths.size)} blobs`);

  // Compute diff
  const missing = [];
  for (const p of localPaths) {
    if (!remotePaths.has(p)) missing.push(p);
  }
  console.log(`➕ To upload: ${formatNumber(missing.length)} files`);
  if (missing.length === 0) {
    console.log('🎉 Nothing to upload. Local and remote are in sync.');
    return;
  }

  // Upload
  console.log(`⬆️  Uploading with concurrency ${MAX_CONCURRENCY}...`);
  const errors = await uploadWithConcurrency(localRoot, missing, token);
  if (errors.length) {
    console.log(`⚠️  Completed with ${errors.length} upload errors. Showing first 10:`);
    for (const e of errors.slice(0, 10)) console.log(` - ${e.rel}: ${e.error}`);
  } else {
    console.log('✅ Upload finished with no errors.');
  }

  // Re-compare
  console.log('🔎 Verifying...');
  const blobsAfter = await collectAllBlobs(token);
  const remoteAfter = new Set(blobsAfter.map(b => (b.pathname || '').replace(/^\/*/, '')));
  const stillMissing = [];
  for (const p of localPaths) {
    if (!remoteAfter.has(p)) stillMissing.push(p);
  }
  if (stillMissing.length === 0) {
    console.log('🎯 Verification success: Remote now matches local by path.');
  } else {
    console.log(`❌ Verification found ${stillMissing.length} paths still missing (showing first 20):`);
    for (const p of stillMissing.slice(0, 20)) console.log('  - ' + p);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});



