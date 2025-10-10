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
    
    // Transform blob data to match our document interface
    const documents = blobs.map(blob => ({
      id: blob.url.split('/').pop() || blob.url,
      title: blob.pathname.split('/').pop() || 'Document',
      type: getDocumentTypeFromPath(blob.pathname),
      state: extractStateFromPath(blob.pathname),
      category: getCategoryFromPath(blob.pathname),
      description: `Document uploaded on ${new Date(blob.uploadedAt).toLocaleDateString()}`,
      uploadDate: blob.uploadedAt,
      lastModified: blob.uploadedAt,
      fileSize: formatFileSize(blob.size),
      downloadUrl: blob.url,
      tags: extractTagsFromPath(blob.pathname),
      isPublic: true
    }));

    return NextResponse.json({ documents });
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
  const pathParts = pathname.split('/');
  const documentsIndex = pathParts.indexOf('documents');
  const typeIndex = documentsIndex + 1;
  const stateIndex = typeIndex + 1;
  
  // Check if there's a state in the path
  if (pathParts[stateIndex] && !pathParts[stateIndex].includes('.')) {
    return pathParts[stateIndex];
  }
  return undefined;
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
