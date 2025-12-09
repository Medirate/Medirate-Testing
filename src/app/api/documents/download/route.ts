import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { downloadFileAsBuffer, getFileMetadata } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getKindeServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Support both 'url' (for backward compatibility) and 'fileId' parameters
    const fileId = searchParams.get('fileId') || searchParams.get('url');

    if (!fileId) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 });
    }

    // Get file metadata to determine content type and filename
    const fileMetadata = await getFileMetadata(fileId);
    const fileName = fileMetadata.name || 'document';
    const mimeType = fileMetadata.mimeType || 'application/octet-stream';

    // Download file from Google Drive
    const fileBuffer = await downloadFileAsBuffer(fileId);

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading document from Google Drive:', error);
    return NextResponse.json({ 
      error: 'Failed to download document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
