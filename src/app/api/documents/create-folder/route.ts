import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createFolder } from '@/lib/google-drive';

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

    const { parentId, folderName } = await request.json();

    if (!parentId || !folderName) {
      return NextResponse.json({ error: 'parentId and folderName are required' }, { status: 400 });
    }

    const folder = await createFolder(parentId, folderName);

    return NextResponse.json({ success: true, folder });
  } catch (error: any) {
    console.error('Create folder error:', error);
    return NextResponse.json({ 
      error: 'Create folder failed',
      details: error.message 
    }, { status: 500 });
  }
}

