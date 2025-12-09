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

    // Find the file(s) in Vercel Blob
    const { blobs } = await list();
    const exactMatch = blobs.find(b => b.pathname === oldPath);
    const isFolder = !exactMatch;
    const filesToRename = isFolder 
      ? blobs.filter(b => b.pathname.startsWith(oldPath + '/'))
      : exactMatch ? [exactMatch] : [];

    if (filesToRename.length === 0) {
      return NextResponse.json({ error: 'File or folder not found' }, { status: 404 });
    }

    // Rename each file (download, upload with new path, delete old)
    for (const fileBlob of filesToRename) {
      const oldFilePath = fileBlob.pathname;
      const newFilePath = isFolder 
        ? oldFilePath.replace(oldPath, newPath)
        : newPath;

      // Download
      const response = await fetch(fileBlob.url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const fileData = await response.arrayBuffer();
      const blob = new Blob([fileData]);

      // Upload to new path
      await put(newFilePath, blob, {
        access: 'public',
      });

      // Delete old file
      await del(oldFilePath);
    }

    return NextResponse.json({ success: true, renamed: filesToRename.length });
  } catch (error: any) {
    console.error('Rename error:', error);
    return NextResponse.json({ 
      error: 'Rename failed',
      details: error.message 
    }, { status: 500 });
  }
}

