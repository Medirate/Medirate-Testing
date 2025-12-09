/**
 * Quick test script to verify Vercel Blob token works
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { list } from '@vercel/blob';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function testToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment');
    process.exit(1);
  }
  
  console.log(`🔑 Token found: ${token.substring(0, 25)}...`);
  console.log('📥 Testing connection to Vercel Blob...\n');
  
  try {
    const result = await list({ token });
    console.log(`✅ Success! Found ${result.blobs.length} files`);
    console.log(`\n📋 First 5 files:`);
    result.blobs.slice(0, 5).forEach((blob, i) => {
      console.log(`   ${i + 1}. ${blob.pathname} (${blob.size} bytes)`);
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message?.includes('Access denied')) {
      console.error('\n💡 The token is invalid or expired.');
      console.error('   Get a new token from: Vercel Dashboard → Project → Storage → Blob → Settings');
    }
    process.exit(1);
  }
}

testToken();

