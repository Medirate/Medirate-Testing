import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you can modify this check)
    const adminEmails = ['dev@metasysconsulting.com', 'gnersess@medirate.net'];
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create the full path
    const fileName = file.name;
    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Upload to Vercel Blob
    const blob = await put(fullPath, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      blob: {
        url: blob.url,
        pathname: blob.pathname
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
