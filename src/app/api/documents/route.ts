import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getKindeServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List all files in the blob store
    const { blobs } = await list();
    console.log('📁 Found blobs:', blobs.length);
    console.log('📁 Blob details:', blobs.map(b => ({ pathname: b.pathname, size: b.size })));
    
    // Locate metadata JSON with external links
    const linksMeta = blobs.find(b => (b.pathname || '').startsWith('_metadata/') && b.pathname.endsWith('manual_billing_links.json'));
    let stateLinks: Record<string, string[]> = {};
    if (linksMeta) {
      try {
        const res = await fetch(linksMeta.url);
        if (res.ok) {
          const json = await res.json();
          stateLinks = (json && json.stateLinks) || {};
        }
      } catch (e) {
        console.warn('Failed to load state links JSON:', e);
      }
    }

    // Transform blob data to show actual storage structure
    const documents = blobs
      // exclude metadata, json helper files, archive folders, and BILLING_MANUALS from UI
      .filter(blob => {
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
      })
      .map(blob => {
      const fileName = blob.pathname.split('/').pop() || 'Document';
      const filePath = blob.pathname;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Extract folder structure from pathname
      const pathParts = filePath.split('/').filter(part => part && part !== '');
      const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'Root';
      
      // Extract subfolder (like ABA, BH, BILLING_MANUALS, IDD)
      const subfolder = pathParts.length > 2 ? pathParts[pathParts.length - 2] : null;
      
      return {
        id: blob.url.split('/').pop() || blob.url,
        title: fileName,
        type: fileExtension, // Show actual file extension
        folder: folderPath, // Show actual folder path
        subfolder: subfolder, // Add subfolder information
        state: extractStateFromPath(blob.pathname),
        category: subfolder || folderPath, // Use subfolder as primary category
        description: `File in ${folderPath}${subfolder ? ` → ${subfolder}` : ''} - Uploaded on ${new Date(blob.uploadedAt).toLocaleDateString()}`,
        uploadDate: blob.uploadedAt,
        lastModified: blob.uploadedAt,
        fileSize: formatFileSize(blob.size),
        downloadUrl: blob.url,
        tags: [fileExtension, folderPath, ...(subfolder ? [subfolder] : [])],
        isPublic: true,
        filePath: filePath // Include full path for reference
      };
    });

    return NextResponse.json({ documents, stateLinks });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}


// Helper functions
function getDocumentTypeFromPath(pathname: string): string {
  const pathParts = pathname.split('/');
  const typeIndex = pathParts.indexOf('documents') + 1;
  return pathParts[typeIndex] || 'document';
}

function extractStateFromPath(pathname: string): string | undefined {
  // Derive the state dynamically from the top-level folder name.
  // Example: "CALIFORNIA/ABA/file.pdf" -> "CALIFORNIA"
  // Works for any new/renamed folders without maintaining a fixed list.
  const parts = pathname.split('/').filter(Boolean);
  return parts.length > 0 ? parts[0] : undefined;
}

function getCategoryFromPath(pathname: string): string {
  const type = getDocumentTypeFromPath(pathname);
  const categoryMap: Record<string, string> = {
    'state_note': 'State Updates',
    'policy': 'Policy Updates',
    'guideline': 'Implementation Guidelines',
    'form': 'Forms',
    'report': 'Analysis',
    'document': 'General'
  };
  return categoryMap[type] || 'General';
}

function extractTagsFromPath(pathname: string): string[] {
  const tags: string[] = [];
  const pathParts = pathname.split('/');
  
  // Add type as tag
  const type = getDocumentTypeFromPath(pathname);
  tags.push(type.replace('_', '-'));
  
  // Add state as tag if present
  const state = extractStateFromPath(pathname);
  if (state) {
    tags.push(state.toLowerCase().replace(/\s+/g, '-'));
  }
  
  return tags;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
