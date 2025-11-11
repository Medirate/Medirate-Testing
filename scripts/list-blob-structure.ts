/**
 * Script to list and display the folder structure in Vercel Blob Storage
 * Run with: npx tsx scripts/list-blob-structure.ts
 */

import { list } from '@vercel/blob';

interface BlobFile {
  pathname: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

interface FolderStructure {
  [state: string]: {
    [subfolder: string]: BlobFile[];
  };
}

async function listBlobStructure() {
  try {
    console.log('🔍 Connecting to Vercel Blob Storage...\n');
    
    // List all files in the blob store
    const { blobs } = await list();
    
    console.log(`📁 Total files found: ${blobs.length}\n`);
    
    // Filter out metadata files
    const documentBlobs = blobs.filter(blob => {
      const p = (blob.pathname || '');
      if (p.startsWith('_metadata/')) return false;
      if (p.toLowerCase().endsWith('.json')) return false;
      return true;
    });
    
    console.log(`📄 Document files (excluding metadata): ${documentBlobs.length}\n`);
    
    // Build folder structure
    const structure: FolderStructure = {};
    const metadataFiles: BlobFile[] = [];
    
    blobs.forEach(blob => {
      const pathname = blob.pathname || '';
      
      // Separate metadata files
      if (pathname.startsWith('_metadata/') || pathname.toLowerCase().endsWith('.json')) {
        metadataFiles.push({
          pathname: blob.pathname || '',
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          url: blob.url
        });
        return;
      }
      
      // Extract state and subfolder from pathname
      const parts = pathname.split('/').filter(part => part && part !== '');
      
      if (parts.length === 0) {
        // Root level file
        if (!structure['ROOT']) {
          structure['ROOT'] = {};
        }
        if (!structure['ROOT']['Root']) {
          structure['ROOT']['Root'] = [];
        }
        structure['ROOT']['Root'].push({
          pathname: blob.pathname || '',
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          url: blob.url
        });
      } else if (parts.length === 1) {
        // State level file (no subfolder)
        const state = parts[0];
        if (!structure[state]) {
          structure[state] = {};
        }
        if (!structure[state]['Root']) {
          structure[state]['Root'] = [];
        }
        structure[state]['Root'].push({
          pathname: blob.pathname || '',
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          url: blob.url
        });
      } else if (parts.length >= 2) {
        // State/Subfolder/File structure
        const state = parts[0];
        const subfolder = parts[1];
        const fileName = parts[parts.length - 1];
        
        if (!structure[state]) {
          structure[state] = {};
        }
        if (!structure[state][subfolder]) {
          structure[state][subfolder] = [];
        }
        structure[state][subfolder].push({
          pathname: blob.pathname || '',
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          url: blob.url
        });
      }
    });
    
    // Display folder structure
    console.log('📂 VERCEL BLOB STORAGE FOLDER STRUCTURE\n');
    console.log('='.repeat(80));
    console.log();
    
    // Sort states alphabetically
    const sortedStates = Object.keys(structure).sort();
    
    sortedStates.forEach(state => {
      console.log(`📁 ${state}/`);
      const subfolders = Object.keys(structure[state]).sort();
      
      subfolders.forEach(subfolder => {
        const files = structure[state][subfolder];
        const fileCount = files.length;
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        console.log(`  ├── ${subfolder}/ (${fileCount} files, ${sizeMB} MB)`);
        
        // Show first 5 files as examples
        files.slice(0, 5).forEach((file, index) => {
          const fileName = file.pathname.split('/').pop() || 'Unknown';
          const fileSizeKB = (file.size / 1024).toFixed(2);
          const isLast = index === Math.min(4, files.length - 1);
          const prefix = index === files.length - 1 ? '  │     └──' : '  │     ├──';
          console.log(`${prefix} ${fileName} (${fileSizeKB} KB)`);
        });
        
        if (files.length > 5) {
          console.log(`  │     └── ... and ${files.length - 5} more files`);
        }
      });
      
      // Calculate totals for state
      const stateTotalFiles = Object.values(structure[state]).flat().length;
      const stateTotalSize = Object.values(structure[state])
        .flat()
        .reduce((sum, file) => sum + file.size, 0);
      const stateTotalSizeMB = (stateTotalSize / (1024 * 1024)).toFixed(2);
      
      console.log(`  └── Total: ${stateTotalFiles} files, ${stateTotalSizeMB} MB`);
      console.log();
    });
    
    // Display metadata files if any
    if (metadataFiles.length > 0) {
      console.log('📋 METADATA FILES');
      console.log('='.repeat(80));
      metadataFiles.forEach(file => {
        console.log(`  - ${file.pathname}`);
      });
      console.log();
    }
    
    // Summary statistics
    console.log('📊 SUMMARY STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total States: ${sortedStates.length}`);
    console.log(`Total Document Files: ${documentBlobs.length}`);
    console.log(`Total Metadata Files: ${metadataFiles.length}`);
    console.log(`Total Files (All): ${blobs.length}`);
    
    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
    console.log(`Total Storage Used: ${totalSizeMB} MB (${totalSizeGB} GB)`);
    console.log();
    
    // Detailed breakdown by state
    console.log('📈 BREAKDOWN BY STATE');
    console.log('='.repeat(80));
    sortedStates.forEach(state => {
      const stateFiles = Object.values(structure[state]).flat();
      const stateSize = stateFiles.reduce((sum, file) => sum + file.size, 0);
      const stateSizeMB = (stateSize / (1024 * 1024)).toFixed(2);
      const subfolderCount = Object.keys(structure[state]).length;
      console.log(`  ${state}: ${stateFiles.length} files, ${subfolderCount} subfolders, ${stateSizeMB} MB`);
    });
    
  } catch (error) {
    console.error('❌ Error listing blob structure:', error);
    process.exit(1);
  }
}

// Run the script
listBlobStructure();

