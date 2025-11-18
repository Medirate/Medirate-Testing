import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

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

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getKindeServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Connecting to Vercel Blob Storage...');
    
    // List all files in the blob store
    const { blobs } = await list();
    
    console.log(`📁 Total files found: ${blobs.length}`);
    
    // Filter out metadata files, archive folders, and BILLING_MANUALS
    const documentBlobs = blobs.filter(blob => {
      const p = (blob.pathname || '');
      // Exclude metadata folder
      if (p.startsWith('_metadata/')) return false;
      // Exclude JSON files
      if (p.toLowerCase().endsWith('.json')) return false;
      // Exclude archive folders (e.g., ABA_ARCHIVE, BH_ARCHIVE, etc.)
      // Archive folders are only visible in Vercel Blob, not on the website
      const pathParts = p.split('/').filter(part => part && part !== '');
      const hasArchiveFolder = pathParts.some(part => 
        part.toUpperCase().includes('ARCHIVE') || 
        part.toUpperCase().endsWith('_ARCHIVE')
      );
      if (hasArchiveFolder) return false;
      // Exclude BILLING_MANUALS folder - should not be visible to users
      // Check for various naming patterns: BILLING_MANUALS, BILLING MANUALS, BILLING-MANUALS, etc.
      const hasBillingManuals = pathParts.some(part => {
        const normalized = part.toUpperCase().replace(/[_\s-]/g, ''); // Remove underscores, spaces, hyphens
        return normalized === 'BILLINGMANUALS' || 
               (part.toUpperCase().includes('BILLING') && part.toUpperCase().includes('MANUAL'));
      });
      if (hasBillingManuals) return false;
      return true;
    });
    
    console.log(`📄 Document files (excluding metadata): ${documentBlobs.length}`);
    
    // Build folder structure
    const structure: FolderStructure = {};
    const metadataFiles: BlobFile[] = [];
    const allFiles: Array<{ pathname: string; size: number; uploadedAt: string; url: string }> = [];
    
    blobs.forEach(blob => {
      const pathname = blob.pathname || '';
      
      // Store all file info
      allFiles.push({
        pathname: blob.pathname || '',
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
        url: blob.url
      });
      
      // Separate metadata files and archive folders
      const pathParts = pathname.split('/').filter(part => part && part !== '');
      const hasArchiveFolder = pathParts.some(part => 
        part.toUpperCase().includes('ARCHIVE') || 
        part.toUpperCase().endsWith('_ARCHIVE')
      );
      
      if (pathname.startsWith('_metadata/') || pathname.toLowerCase().endsWith('.json')) {
        metadataFiles.push({
          pathname: blob.pathname || '',
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          url: blob.url
        });
        return;
      }
      
      // Skip archive folders in structure building (they're only in Vercel Blob)
      if (hasArchiveFolder) {
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
    
    // Calculate statistics
    const stats = {
      totalFiles: blobs.length,
      documentFiles: documentBlobs.length,
      metadataFiles: metadataFiles.length,
      totalSize: blobs.reduce((sum, blob) => sum + blob.size, 0),
      states: Object.keys(structure).length,
      stateBreakdown: Object.entries(structure).map(([state, subfolders]) => {
        const stateFiles = Object.values(subfolders).flat();
        const stateSize = stateFiles.reduce((sum, file) => sum + file.size, 0);
        return {
          state,
          fileCount: stateFiles.length,
          subfolderCount: Object.keys(subfolders).length,
          size: stateSize,
          sizeMB: (stateSize / (1024 * 1024)).toFixed(2),
          subfolders: Object.entries(subfolders).map(([subfolder, files]) => ({
            subfolder,
            fileCount: files.length,
            size: files.reduce((sum, file) => sum + file.size, 0),
            sizeMB: (files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2),
            files: files.map(f => ({
              pathname: f.pathname,
              fileName: f.pathname.split('/').pop() || 'Unknown',
              size: f.size,
              sizeKB: (f.size / 1024).toFixed(2),
              uploadedAt: f.uploadedAt.toISOString()
            }))
          }))
        };
      })
    };
    
    return NextResponse.json({
      success: true,
      structure,
      metadataFiles: metadataFiles.map(f => ({
        pathname: f.pathname,
        size: f.size,
        uploadedAt: f.uploadedAt.toISOString()
      })),
      stats: {
        ...stats,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        totalSizeGB: (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2)
      },
      allFiles: allFiles.slice(0, 100) // Limit to first 100 for response size
    });
    
  } catch (error: any) {
    console.error('❌ Error listing blob structure:', error);
    return NextResponse.json({ 
      error: 'Failed to list blob structure', 
      details: error.message 
    }, { status: 500 });
  }
}

