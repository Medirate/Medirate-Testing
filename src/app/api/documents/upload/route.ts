import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import {
  findRootFolder,
  findOrCreateFolderPath,
  uploadFileToDrive,
} from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
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
    const folderId = formData.get('folderId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine target folder: use folderId if provided, otherwise use folderPath
    let targetFolderId: string;
    
    if (folderId) {
      // Direct folder ID provided
      targetFolderId = folderId;
    } else {
      // Use folder path (legacy support)
      const rootFolderName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'MediRate Documents';
      const rootFolderId = await findRootFolder(rootFolderName);
      
      if (!rootFolderId) {
        return NextResponse.json({ 
          error: `Root folder "${rootFolderName}" not found. Please create it in Google Drive.` 
        }, { status: 404 });
      }

      targetFolderId = folderPath 
        ? await findOrCreateFolderPath(rootFolderId, folderPath)
        : rootFolderId;
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload to Google Drive
    const uploadedFile = await uploadFileToDrive(
      targetFolderId,
      file.name,
      fileBuffer,
      file.type || 'application/octet-stream'
    );

    return NextResponse.json({
      success: true,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        pathname: folderPath ? `${folderPath}/${file.name}` : file.name,
        webViewLink: uploadedFile.webViewLink,
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
