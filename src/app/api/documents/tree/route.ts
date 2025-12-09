import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { findRootFolder, getFolderTree } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
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

    const rootFolderName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'Medirate Document Library';
    const rootFolderId = await findRootFolder(rootFolderName);
    
    if (!rootFolderId) {
      return NextResponse.json({ 
        error: `Root folder "${rootFolderName}" not found` 
      }, { status: 404 });
    }

    const tree = await getFolderTree(rootFolderId);

    return NextResponse.json({ 
      success: true, 
      rootFolderId,
      rootFolderName,
      tree 
    });
  } catch (error: any) {
    console.error('Get tree error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to get folder tree',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

