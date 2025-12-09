import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { list, del } from '@vercel/blob';

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

    const { pathname } = await request.json();

    if (!pathname) {
      return NextResponse.json({ error: 'pathname is required' }, { status: 400 });
    }

    // Check if it's a folder (need to delete all files in folder)
    const { blobs } = await list();
    const isFolder = !blobs.find(b => b.pathname === pathname);
    const filesToDelete = isFolder 
      ? blobs.filter(b => b.pathname.startsWith(pathname + '/'))
      : [{ pathname }];

    // Delete all files
    for (const file of filesToDelete) {
      await del(file.pathname);
    }

    return NextResponse.json({ success: true, deleted: filesToDelete.length });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Delete failed',
      details: error.message 
    }, { status: 500 });
  }
}

