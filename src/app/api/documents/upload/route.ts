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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string;
    const parentPath = formData.get('parentPath') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine target path
    let targetPath: string;
    if (parentPath) {
      // Upload to specific parent folder
      targetPath = `${parentPath}/${file.name}`;
    } else if (folderPath) {
      // Use folder path (legacy support)
      targetPath = `${folderPath}/${file.name}`;
    } else {
      // Upload to root
      targetPath = file.name;
    }

    // Upload to Vercel Blob
    const blob = await put(targetPath, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      file: {
        id: targetPath,
        name: file.name,
        pathname: targetPath,
        url: blob.url,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
