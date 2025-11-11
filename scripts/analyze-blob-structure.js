/**
 * Script to analyze the current folder structure in Vercel Blob
 * This will help us understand what states and subfolders actually exist
 * Usage: node scripts/analyze-blob-structure.js
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function analyzeBlobStructure() {
  // Try to get token from environment
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
    console.error('Please set it with: export BLOB_READ_WRITE_TOKEN=your_token_here');
    process.exit(1);
  }

  console.log('🔍 Analyzing Vercel Blob storage structure...');
  console.log(`Token found: ${token.substring(0, 10)}...${token.substring(token.length - 5)}\n`);

  try {
    // List all files in the blob store
    // Pass token explicitly
    const { blobs } = await list({ token });
    
    console.log(`📁 Total files found: ${blobs.length}\n`);

    // Filter out metadata and JSON files
    const documentBlobs = blobs.filter(blob => {
      const p = (blob.pathname || '');
      if (p.startsWith('_metadata/')) return false;
      if (p.toLowerCase().endsWith('.json')) return false;
      // Also exclude archive folders for now
      const pathParts = p.split('/').filter(part => part && part !== '');
      const hasArchiveFolder = pathParts.some(part => 
        part.toUpperCase().includes('ARCHIVE') || 
        part.toUpperCase().endsWith('_ARCHIVE')
      );
      if (hasArchiveFolder) return false;
      return true;
    });

    console.log(`📄 Document files (excluding metadata and archives): ${documentBlobs.length}\n`);

    // Build structure analysis
    const structure = {};
    const states = new Set();
    const subfolders = new Set();
    const stateSubfolderMap = {};

    documentBlobs.forEach(blob => {
      const pathname = blob.pathname || '';
      const parts = pathname.split('/').filter(part => part && part !== '');
      
      if (parts.length >= 1) {
        const state = parts[0];
        states.add(state);
        
        if (parts.length >= 2) {
          const subfolder = parts[1];
          subfolders.add(subfolder);
          
          if (!stateSubfolderMap[state]) {
            stateSubfolderMap[state] = new Set();
          }
          stateSubfolderMap[state].add(subfolder);
        }
      }
    });

    // Display analysis
    console.log('📊 STRUCTURE ANALYSIS');
    console.log('='.repeat(80));
    console.log(`\nTotal States Found: ${states.size}`);
    console.log(`Total Unique Subfolders Found: ${subfolders.size}`);
    console.log(`\nStates: ${Array.from(states).sort().join(', ')}`);
    console.log(`\nSubfolders: ${Array.from(subfolders).sort().join(', ')}`);

    // Detailed breakdown by state
    console.log('\n\n📂 DETAILED BREAKDOWN BY STATE');
    console.log('='.repeat(80));
    
    const sortedStates = Array.from(states).sort();
    sortedStates.forEach(state => {
      const stateSubfolders = Array.from(stateSubfolderMap[state] || []).sort();
      const stateFiles = documentBlobs.filter(blob => {
        const parts = (blob.pathname || '').split('/').filter(part => part && part !== '');
        return parts[0] === state;
      });
      
      console.log(`\n${state}:`);
      console.log(`  Subfolders: ${stateSubfolders.length} (${stateSubfolders.join(', ')})`);
      console.log(`  Total Files: ${stateFiles.length}`);
      
      // Count files per subfolder
      stateSubfolders.forEach(subfolder => {
        const subfolderFiles = documentBlobs.filter(blob => {
          const parts = (blob.pathname || '').split('/').filter(part => part && part !== '');
          return parts[0] === state && parts[1] === subfolder;
        });
        console.log(`    - ${subfolder}: ${subfolderFiles.length} files`);
      });
    });

    // Save analysis to file
    const analysis = {
      totalFiles: blobs.length,
      documentFiles: documentBlobs.length,
      states: Array.from(states).sort(),
      subfolders: Array.from(subfolders).sort(),
      stateSubfolderMap: Object.fromEntries(
        Object.entries(stateSubfolderMap).map(([state, subfolders]) => [
          state,
          Array.from(subfolders).sort()
        ])
      ),
      timestamp: new Date().toISOString()
    };

    const outputPath = path.join(__dirname, 'blob-structure-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\n\n✅ Analysis saved to: ${outputPath}`);

    // Summary for archive folder creation
    console.log('\n\n📋 ARCHIVE FOLDERS TO CREATE');
    console.log('='.repeat(80));
    console.log('\nBased on the analysis, we need to create archive folders for:');
    console.log(`- ${sortedStates.length} states`);
    console.log(`- ${Array.from(subfolders).length} unique subfolders per state`);
    console.log(`- Total: ~${sortedStates.length * Array.from(subfolders).length} archive folders\n`);

    return analysis;

  } catch (error) {
    console.error('❌ Error analyzing blob structure:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeBlobStructure().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

