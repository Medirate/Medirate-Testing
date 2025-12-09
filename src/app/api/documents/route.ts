import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { list } from '@vercel/blob';

// Helper: Extract state from path
function extractStateFromPath(path: string): string | undefined {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? parts[0] : undefined;
}

// Helper: Extract subfolder from path
function extractSubfolderFromPath(path: string): string | null {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : null;
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      // Exclude archive folders
      const pathParts = p.split('/').filter(part => part && part !== '');
      const hasArchiveFolder = pathParts.some(part => 
        part.toUpperCase().includes('ARCHIVE') || 
        part.toUpperCase().endsWith('_ARCHIVE')
      );
      if (hasArchiveFolder) return false;
      // Exclude BILLING_MANUALS
      const hasBillingManuals = pathParts.some(part => {
        const normalized = part.toUpperCase().replace(/[_\s-]/g, '');
        return normalized === 'BILLINGMANUALS' || 
               (part.toUpperCase().includes('BILLING') && part.toUpperCase().includes('MANUAL'));
      });
      if (hasBillingManuals) return false;
      return true;
    });
    
    console.log(`📄 Document files (excluding metadata): ${documentBlobs.length}`);

    // Load metadata (state links) - check for manual_billing_links.json
    let stateLinks: Record<string, Array<string | { title: string; url: string }>> = {};
    try {
      const metadataBlob = blobs.find(b => b.pathname === '_metadata/manual_billing_links.json');
      if (metadataBlob) {
        const metadataResponse = await fetch(metadataBlob.url);
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          stateLinks = metadata.stateLinks || {};
        }
      }
    } catch (error) {
      console.warn('Could not load metadata file:', error);
    }

    // Transform Vercel Blob files to Document format
    const documents = documentBlobs.map(blob => {
      const pathname = blob.pathname || '';
      const pathParts = pathname.split('/').filter(part => part && part !== '');
      const fileName = pathParts[pathParts.length - 1] || 'Document';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'Root';
      const subfolder = extractSubfolderFromPath(pathname);
      const state = extractStateFromPath(pathname);

      return {
        id: pathname, // Use pathname as ID for Vercel Blob
        title: fileName,
        type: fileExtension,
        folder: folderPath,
        subfolder: subfolder,
        state: state,
        category: subfolder || folderPath,
        description: `File in ${folderPath}${subfolder ? ` → ${subfolder}` : ''}`,
        uploadDate: blob.uploadedAt.toISOString(),
        lastModified: blob.uploadedAt.toISOString(),
        fileSize: formatFileSize(blob.size),
        downloadUrl: blob.url,
        tags: [fileExtension, folderPath, ...(subfolder ? [subfolder] : [])],
        isPublic: true,
        filePath: pathname,
      };
    });

    console.log(`✅ Returning ${documents.length} documents`);

    return NextResponse.json({ documents, stateLinks });
  } catch (error) {
    console.error('Error fetching documents from Vercel Blob:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
