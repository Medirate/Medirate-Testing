import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { copyFile } from '@/lib/google-drive';

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

    const { fileId, newParentId, newName } = await request.json();

    if (!fileId || !newParentId) {
      return NextResponse.json({ error: 'fileId and newParentId are required' }, { status: 400 });
    }

    const copiedFile = await copyFile(fileId, newParentId, newName);

    return NextResponse.json({ success: true, file: copiedFile });
  } catch (error: any) {
    console.error('Copy error:', error);
    return NextResponse.json({ 
      error: 'Copy failed',
      details: error.message 
    }, { status: 500 });
  }
}

