import { NextRequest, NextResponse } from 'next/server';
import { put, del, list } from '@vercel/blob';
import { auth } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await auth();
    
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

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated } = await auth();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const state = formData.get('state') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create a structured path for the file
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${file.name.split('.').pop()}`;
    const path = `documents/${type}/${state ? `${state}/` : ''}${fileName}`;

    // Upload to Vercel Blob
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: false
    });

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      path: blob.pathname 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { isAuthenticated } = await auth();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
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
