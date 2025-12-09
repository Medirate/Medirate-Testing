import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import {
  findRootFolder,
  getAllFilesFromFolder,
  findMetadataFile,
  extractStateFromPath,
  extractSubfolderFromPath,
  formatFileSize,
} from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getKindeServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find root folder (default: "MediRate Documents")
    const rootFolderName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'MediRate Documents';
    const rootFolderId = await findRootFolder(rootFolderName);
    
    if (!rootFolderId) {
      console.error(`Root folder "${rootFolderName}" not found in Google Drive`);
      return NextResponse.json({ 
        error: `Root folder "${rootFolderName}" not found. Please create it in Google Drive and share it with the service account.` 
      }, { status: 404 });
    }

    console.log(`📁 Found root folder: ${rootFolderName} (ID: ${rootFolderId})`);

    // Get all files from Google Drive
    const driveFiles = await getAllFilesFromFolder(rootFolderId);
    console.log('📁 Found files in Google Drive:', driveFiles.length);

    // Load metadata (state links)
    const metadata = await findMetadataFile(rootFolderId);
    const stateLinks: Record<string, string[]> = metadata?.stateLinks || {};

    // Transform Google Drive files to Document format
    const documents = driveFiles.map(file => {
      const fileName = file.name || 'Document';
      const filePath = file.path || fileName;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Extract folder structure from path
      const pathParts = filePath.split('/').filter(part => part && part !== '');
      const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'Root';
      
      // Extract subfolder (like ABA, BH, IDD)
      const subfolder = extractSubfolderFromPath(filePath);
      
      // Get file size (convert from string to number if needed)
      const fileSizeBytes = typeof file.size === 'string' ? parseInt(file.size) : (file.size || 0);
      
      // Get modified time
      const modifiedTime = file.modifiedTime ? new Date(file.modifiedTime).toISOString() : new Date().toISOString();

      return {
        id: file.id, // Google Drive file ID
        title: fileName,
        type: fileExtension,
        folder: folderPath,
        subfolder: subfolder,
        state: extractStateFromPath(filePath),
        category: subfolder || folderPath,
        description: `File in ${folderPath}${subfolder ? ` → ${subfolder}` : ''} - Modified on ${new Date(modifiedTime).toLocaleDateString()}`,
        uploadDate: modifiedTime,
        lastModified: modifiedTime,
        fileSize: formatFileSize(fileSizeBytes),
        downloadUrl: file.id, // We'll use file ID for download endpoint
        tags: [fileExtension, folderPath, ...(subfolder ? [subfolder] : [])],
        isPublic: true,
        filePath: filePath,
        googleDriveFileId: file.id, // Store for reference
      };
    });

    console.log(`✅ Returning ${documents.length} documents`);

    return NextResponse.json({ documents, stateLinks });
  } catch (error) {
    console.error('Error fetching documents from Google Drive:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
