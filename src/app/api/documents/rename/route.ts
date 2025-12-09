import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { renameFileOrFolder } from '@/lib/google-drive';

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

    const { fileId, newName } = await request.json();

    if (!fileId || !newName) {
      return NextResponse.json({ error: 'fileId and newName are required' }, { status: 400 });
    }

    await renameFileOrFolder(fileId, newName);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Rename error:', error);
    return NextResponse.json({ 
      error: 'Rename failed',
      details: error.message 
    }, { status: 500 });
  }
}

