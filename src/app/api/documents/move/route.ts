import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { list, put, del } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = ['dev@metasysconsulting.com', 'gnersess@medirate.net'];
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { oldPath, newPath } = await request.json();

    if (!oldPath || !newPath) {
      return NextResponse.json({ error: 'oldPath and newPath are required' }, { status: 400 });
    }

    // Find the file in Vercel Blob
    const { blobs } = await list();
    const fileBlob = blobs.find(b => b.pathname === oldPath);

    if (!fileBlob) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Download the file
    const response = await fetch(fileBlob.url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const fileData = await response.arrayBuffer();
    const blob = new Blob([fileData]);

    // Upload to new location
    await put(newPath, blob, {
      access: 'public',
    });

    // Delete old file
    await del(oldPath);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Move error:', error);
    return NextResponse.json({ 
      error: 'Move failed',
      details: error.message 
    }, { status: 500 });
  }
}

