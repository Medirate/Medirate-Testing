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
    
    // Transform blob data to match our document interface
    const documents = blobs.map(blob => {
      const fileName = blob.pathname.split('/').pop() || 'Document';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Determine document type based on file extension and name
      let documentType = 'document';
      if (fileName.toLowerCase().includes('rate') || fileName.toLowerCase().includes('schedule')) {
        documentType = 'state_note';
      } else if (fileName.toLowerCase().includes('policy') || fileName.toLowerCase().includes('guideline')) {
        documentType = 'policy';
      } else if (fileName.toLowerCase().includes('form') || fileName.toLowerCase().includes('application')) {
        documentType = 'form';
      } else if (fileName.toLowerCase().includes('report') || fileName.toLowerCase().includes('analysis')) {
        documentType = 'report';
      } else if (fileExtension === 'pdf') {
        documentType = 'state_note'; // Default PDFs to state notes
      } else if (fileExtension === 'csv' || fileExtension === 'xlsx') {
        documentType = 'report'; // Default data files to reports
      }
      
      return {
        id: blob.url.split('/').pop() || blob.url,
        title: fileName,
        type: documentType,
        state: extractStateFromPath(blob.pathname),
        category: getCategoryFromPath(documentType),
        description: `Document uploaded on ${new Date(blob.uploadedAt).toLocaleDateString()}`,
        uploadDate: blob.uploadedAt,
        lastModified: blob.uploadedAt,
        fileSize: formatFileSize(blob.size),
        downloadUrl: blob.url,
        tags: extractTagsFromPath(blob.pathname),
        isPublic: true
      };
    });

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
