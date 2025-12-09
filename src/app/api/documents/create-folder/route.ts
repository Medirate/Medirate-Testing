import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { put } from '@vercel/blob';

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

    const { parentPath, folderName } = await request.json();

    if (!folderName) {
      return NextResponse.json({ error: 'folderName is required' }, { status: 400 });
    }

    // Vercel Blob doesn't support empty folders, so we create a .gitkeep file
    const folderPath = parentPath 
      ? `${parentPath}/${folderName}/.gitkeep`
      : `${folderName}/.gitkeep`;

    // Create a placeholder file to represent the folder
    // Use a small text string to ensure proper content-length header
    const placeholder = new Blob(['Folder placeholder'], { type: 'text/plain' });
    await put(folderPath, placeholder, {
      access: 'public',
    });

    return NextResponse.json({ 
      success: true, 
      folder: {
        id: folderPath.replace('/.gitkeep', ''),
        name: folderName,
        path: folderPath.replace('/.gitkeep', ''),
      }
    });
  } catch (error: any) {
    console.error('Create folder error:', error);
    return NextResponse.json({ 
      error: 'Create folder failed',
      details: error.message 
    }, { status: 500 });
  }
}

