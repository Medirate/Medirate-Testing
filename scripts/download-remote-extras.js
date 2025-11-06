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
        if (ALLOWED_EXTS.has(ext)) yield full;
      }
    }
  }
}

function collectLocalRelativePaths(rootDir) {
  const normalizedRoot = path.resolve(rootDir);
  const result = new Set();
  for (const file of walkFiles(normalizedRoot)) {
    const rel = path.relative(normalizedRoot, file).split(path.sep).join('/');
    result.add(rel);
  }
  return result;
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

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function downloadToFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(dest, buffer);
}

function formatNumber(n) { return new Intl.NumberFormat('en-US').format(n); }

async function main() {
  const localRoot = process.argv[2];
  if (!localRoot) {
    console.error('Usage: node scripts/download-remote-extras.js <LOCAL_ROOT_DIRECTORY>');
    process.exit(1);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_RW_TOKEN || process.env.BLOB_TOKEN;
  if (!token) {
    console.error('Missing blob token. Ensure BLOB_READ_WRITE_TOKEN is set in .env');
    process.exit(1);
  }

  console.log('🌐 Listing remote blobs...');
  const blobs = await collectAllBlobs(token);
  const remoteMap = new Map();
  for (const b of blobs) {
    const pathname = (b.pathname || '').replace(/^\/*/, '');
    remoteMap.set(pathname, b.url);
  }

  console.log('📊 Scanning local files...');
  const localSet = collectLocalRelativePaths(localRoot);

  const extras = [];
  for (const [pathname, url] of remoteMap.entries()) {
    const base = path.basename(pathname);
    const ext = path.extname(base).toLowerCase();
    // treat directory-like entries explicitly
    if (!base || base.endsWith('/')) {
      // create directory if missing
      const destDir = path.join(localRoot, pathname.replace(/\/$/, ''));
      await ensureDir(destDir);
      continue;
    }
    // skip non-allowed file types except metadata json
    if (ext && !ALLOWED_EXTS.has(ext) && !(pathname.startsWith('_metadata/') && ext === '.json')) {
      continue;
    }
    if (!localSet.has(pathname)) extras.push({ pathname, url });
  }

  console.log(`➕ Remote-only files to download: ${formatNumber(extras.length)}`);
  if (extras.length === 0) {
    console.log('🎉 No extras to download.');
    return;
  }

  let done = 0;
  for (const item of extras) {
    const destPath = path.join(localRoot, item.pathname);
    await ensureDir(path.dirname(destPath));
    try {
      await downloadToFile(item.url, destPath);
      done++;
      process.stdout.write(`\r⬇️  Downloaded ${formatNumber(done)}/${formatNumber(extras.length)} | ${item.pathname.slice(0, 80)}`);
    } catch (e) {
      console.error(`\n❌ Failed ${item.pathname}: ${e.message}`);
    }
  }
  process.stdout.write('\n✅ Completed downloads.\n');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});



