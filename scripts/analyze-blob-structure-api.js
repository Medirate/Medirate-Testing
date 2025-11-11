/**
 * Script to analyze blob structure by calling the existing API endpoint
 * This uses the same authentication as the documents page
 */

const http = require('http');

async function fetchFromAPI(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function analyzeStructure() {
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}/api/documents/structure`;
  
  console.log(`🔍 Fetching structure from API: ${url}\n`);
  
  try {
    const data = await fetchFromAPI(url);
    
    if (!data.success) {
      console.error('❌ API returned error:', data.error);
      return;
    }
    
    console.log('📊 STRUCTURE ANALYSIS');
    console.log('='.repeat(80));
    console.log(`\nTotal States: ${data.stats.states}`);
    console.log(`Total Document Files: ${data.stats.documentFiles}`);
    console.log(`Total Storage: ${data.stats.totalSizeMB} MB (${data.stats.totalSizeGB} GB)\n`);
    
    console.log('\n📂 STATES AND SUBFOLDERS:');
    console.log('='.repeat(80));
    
    const states = Object.keys(data.structure).sort();
    
    states.forEach(state => {
      const subfolders = Object.keys(data.structure[state]);
      console.log(`\n${state}:`);
      console.log(`  Subfolders: ${subfolders.length}`);
      
      subfolders.forEach(subfolder => {
        const files = data.structure[state][subfolder];
        const fileCount = files.length;
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`    - ${subfolder}: ${fileCount} files, ${sizeMB} MB`);
      });
    });
    
    // Extract unique subfolders
    const allSubfolders = new Set();
    states.forEach(state => {
      Object.keys(data.structure[state]).forEach(subfolder => {
        allSubfolders.add(subfolder);
      });
    });
    
    console.log('\n\n📋 SUMMARY FOR ARCHIVE CREATION:');
    console.log('='.repeat(80));
    console.log(`States: ${states.length}`);
    console.log(`Unique Subfolders: ${Array.from(allSubfolders).sort().join(', ')}`);
    console.log(`\nArchive folders to create: ${states.length * allSubfolders.size}`);
    console.log(`\nPattern: STATE/SUBFOLDER_ARCHIVE/`);
    
    // Save analysis
    const analysis = {
      states: states,
      subfolders: Array.from(allSubfolders).sort(),
      stateSubfolderMap: Object.fromEntries(
        states.map(state => [
          state,
          Object.keys(data.structure[state]).sort()
        ])
      ),
      totalArchiveFolders: states.length * allSubfolders.size
    };
    
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'blob-structure-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\n✅ Analysis saved to: ${outputPath}`);
    
    return analysis;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Could not connect to server');
      console.error('Please start the dev server first: pnpm dev');
      console.error('Then run this script again.');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

analyzeStructure();

