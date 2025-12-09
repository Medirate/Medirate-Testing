import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getKindeServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Support both 'url' (for backward compatibility) and 'pathname' parameters
    const url = searchParams.get('url');
    const pathname = searchParams.get('pathname');

    if (!url && !pathname) {
      return NextResponse.json({ error: 'No file URL or pathname provided' }, { status: 400 });
    }

    let fileUrl = url;
    
    // If pathname provided, find the file URL
    if (pathname && !url) {
      const { blobs } = await list();
      const fileBlob = blobs.find(b => b.pathname === pathname);
      if (!fileBlob) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      fileUrl = fileBlob.url;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL found' }, { status: 400 });
    }

    // Fetch file from Vercel Blob
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileData = await response.arrayBuffer();
    const fileName = pathname ? pathname.split('/').pop() || 'document' : 'document';
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return the file with proper headers
    return new NextResponse(new Uint8Array(fileData), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileData.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading document from Vercel Blob:', error);
    return NextResponse.json({ 
      error: 'Failed to download document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
