import { google } from 'googleapis';

// Initialize Google Drive client using Service Account
export function getGoogleDriveClient() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.GOOGLE_DRIVE_PROJECT_ID;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials not configured. Please set GOOGLE_DRIVE_CLIENT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

// Find root folder by name (e.g., "MediRate Documents")
export async function findRootFolder(folderName: string = 'MediRate Documents'): Promise<string | null> {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    return null;
  } catch (error) {
    console.error('Error finding root folder:', error);
    throw error;
  }
}

// Get all files recursively from a folder
export async function getAllFilesFromFolder(folderId: string): Promise<any[]> {
  const drive = getGoogleDriveClient();
  const allFiles: any[] = [];

  async function traverseFolder(currentFolderId: string, path: string[] = []): Promise<void> {
    try {
      // Get all files in current folder
      const filesResponse = await drive.files.list({
        q: `'${currentFolderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink)',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (filesResponse.data.files) {
        for (const file of filesResponse.data.files) {
          // Skip archive folders
          const fileName = file.name || '';
          if (fileName.toUpperCase().includes('ARCHIVE') || fileName.toUpperCase().endsWith('_ARCHIVE')) {
            continue;
          }

          // Skip BILLING_MANUALS folders
          const normalized = fileName.toUpperCase().replace(/[_\s-]/g, '');
          if (normalized === 'BILLINGMANUALS' || 
              (fileName.toUpperCase().includes('BILLING') && fileName.toUpperCase().includes('MANUAL'))) {
            continue;
          }

          // If it's a folder, recurse
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            await traverseFolder(file.id!, [...path, fileName]);
          } else {
            // It's a file - add to list
            const currentPath = [...path, fileName];
            allFiles.push({
              ...file,
              path: currentPath.join('/'),
              folderPath: path.join('/'),
            });
          }
        }
      }

      // Handle pagination if needed
      let nextPageToken = filesResponse.data.nextPageToken;
      while (nextPageToken) {
        const nextResponse = await drive.files.list({
          q: `'${currentFolderId}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink)',
          pageSize: 1000,
          pageToken: nextPageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        if (nextResponse.data.files) {
          for (const file of nextResponse.data.files) {
            const fileName = file.name || '';
            if (fileName.toUpperCase().includes('ARCHIVE') || fileName.toUpperCase().endsWith('_ARCHIVE')) {
              continue;
            }
            const normalized = fileName.toUpperCase().replace(/[_\s-]/g, '');
            if (normalized === 'BILLINGMANUALS' || 
                (fileName.toUpperCase().includes('BILLING') && fileName.toUpperCase().includes('MANUAL'))) {
              continue;
            }

            if (file.mimeType === 'application/vnd.google-apps.folder') {
              await traverseFolder(file.id!, [...path, fileName]);
            } else {
              const currentPath = [...path, fileName];
              allFiles.push({
                ...file,
                path: currentPath.join('/'),
                folderPath: path.join('/'),
              });
            }
          }
        }

        nextPageToken = nextResponse.data.nextPageToken || undefined;
      }
    } catch (error) {
      console.error(`Error traversing folder ${currentFolderId}:`, error);
      throw error;
    }
  }

  await traverseFolder(folderId);
  return allFiles;
}

// Find or create folder by path (e.g., "ALABAMA/ABA")
export async function findOrCreateFolderPath(rootFolderId: string, folderPath: string): Promise<string> {
  const drive = getGoogleDriveClient();
  const pathParts = folderPath.split('/').filter(p => p);

  // Get root folder metadata to check if it's in a Shared Drive
  const rootFolderMetadata = await drive.files.get({
    fileId: rootFolderId,
    fields: 'id, driveId',
    supportsAllDrives: true,
  });
  
  const driveId = rootFolderMetadata.data.driveId;

  let currentFolderId = rootFolderId;

  for (const folderName of pathParts) {
    // Check if folder exists
    const listParams: any = {
      q: `name='${folderName}' and '${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    };
    
    if (driveId) {
      listParams.driveId = driveId;
      listParams.corpora = 'drive';
    }
    
    const response = await drive.files.list(listParams);

    if (response.data.files && response.data.files.length > 0) {
      currentFolderId = response.data.files[0].id!;
    } else {
      // Create folder
      const createParams: any = {
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId],
        },
        fields: 'id, name',
        supportsAllDrives: true,
      };
      
      if (driveId) {
        createParams.requestBody.driveId = driveId;
      }
      
      const createResponse = await drive.files.create(createParams);
      currentFolderId = createResponse.data.id!;
    }
  }

  return currentFolderId;
}

// Upload file to Google Drive
export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string = 'application/octet-stream'
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const drive = getGoogleDriveClient();

  // Get folder metadata to check if it's in a Shared Drive
  let driveId: string | undefined;
  try {
    const folderMetadata = await drive.files.get({
      fileId: folderId,
      fields: 'id, driveId',
      supportsAllDrives: true,
    });
    driveId = folderMetadata.data.driveId || undefined;
  } catch (error) {
    // If we can't get metadata, continue without driveId
    console.warn('Could not get folder metadata for driveId:', error);
  }

  // Convert Buffer to a format that googleapis can handle
  // Use Readable stream or pass buffer directly
  const { Readable } = await import('stream');
  const stream = Readable.from(fileBuffer);

  const createParams: any = {
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, webViewLink',
    supportsAllDrives: true,
  };
  
  if (driveId) {
    createParams.requestBody.driveId = driveId;
  }

  const response = await drive.files.create(createParams);

  return {
    id: response.data.id!,
    name: response.data.name!,
    webViewLink: response.data.webViewLink || undefined,
  };
}

// Get file download URL (for authenticated downloads)
export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const drive = getGoogleDriveClient();
  
  // Generate a temporary download URL
  // Note: For service accounts, we'll need to download the file directly
  // This function returns the file ID which we'll use in the download endpoint
  return fileId;
}

// Download file as buffer
export async function downloadFileAsBuffer(fileId: string): Promise<Buffer> {
  const drive = getGoogleDriveClient();
  
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    {
      responseType: 'arraybuffer',
    }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

// Get file metadata
export async function getFileMetadata(fileId: string) {
  const drive = getGoogleDriveClient();
  
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime, parents, webViewLink',
    supportsAllDrives: true,
  });

  return response.data;
}

// Find metadata file (manual_billing_links.json)
export async function findMetadataFile(rootFolderId: string): Promise<any | null> {
  try {
    const drive = getGoogleDriveClient();
    
    // Look for _metadata folder
    const metadataFolderResponse = await drive.files.list({
      q: `name='_metadata' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (!metadataFolderResponse.data.files || metadataFolderResponse.data.files.length === 0) {
      return null;
    }

    const metadataFolderId = metadataFolderResponse.data.files[0].id!;

    // Look for manual_billing_links.json
    const jsonFileResponse = await drive.files.list({
      q: `name='manual_billing_links.json' and '${metadataFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (!jsonFileResponse.data.files || jsonFileResponse.data.files.length === 0) {
      return null;
    }

    const jsonFileId = jsonFileResponse.data.files[0].id!;
    const fileBuffer = await downloadFileAsBuffer(jsonFileId);
    const jsonContent = JSON.parse(fileBuffer.toString('utf-8'));

    return jsonContent;
  } catch (error) {
    console.warn('Error finding metadata file:', error);
    return null;
  }
}

// Helper: Extract state from path
export function extractStateFromPath(path: string): string | undefined {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? parts[0] : undefined;
}

// Helper: Extract subfolder from path
export function extractSubfolderFromPath(path: string): string | null {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : null;
}

// Helper: Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Move file or folder to a new parent
export async function moveFileOrFolder(fileId: string, newParentId: string, removeFromOldParent: boolean = true): Promise<void> {
  const drive = getGoogleDriveClient();
  
  // Get current parents
  const fileMetadata = await drive.files.get({
    fileId,
    fields: 'parents',
    supportsAllDrives: true,
  });
  
  const previousParents = fileMetadata.data.parents?.join(',') || '';
  
  // Move to new parent
  await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: removeFromOldParent ? previousParents : undefined,
    supportsAllDrives: true,
    fields: 'id, parents',
  });
}

// Copy file (folders cannot be copied via API, must recreate)
export async function copyFile(fileId: string, newParentId: string, newName?: string): Promise<{ id: string; name: string }> {
  const drive = getGoogleDriveClient();
  
  const copyParams: any = {
    fileId,
    requestBody: {
      parents: [newParentId],
    },
    fields: 'id, name',
    supportsAllDrives: true,
  };
  
  if (newName) {
    copyParams.requestBody.name = newName;
  }
  
  const response = await drive.files.copy(copyParams);
  
  return {
    id: response.data.id!,
    name: response.data.name!,
  };
}

// Delete file or folder (move to trash)
export async function deleteFileOrFolder(fileId: string): Promise<void> {
  const drive = getGoogleDriveClient();
  
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}

// Rename file or folder
export async function renameFileOrFolder(fileId: string, newName: string): Promise<void> {
  const drive = getGoogleDriveClient();
  
  await drive.files.update({
    fileId,
    requestBody: {
      name: newName,
    },
    supportsAllDrives: true,
    fields: 'id, name',
  });
}

// Create a new folder
export async function createFolder(parentId: string, folderName: string): Promise<{ id: string; name: string }> {
  const drive = getGoogleDriveClient();
  
  // Get parent metadata to check if it's in a Shared Drive
  let driveId: string | undefined;
  try {
    const parentMetadata = await drive.files.get({
      fileId: parentId,
      fields: 'id, driveId',
      supportsAllDrives: true,
    });
    driveId = parentMetadata.data.driveId || undefined;
  } catch (error) {
    console.warn('Could not get parent metadata for driveId:', error);
  }
  
  const createParams: any = {
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, name',
    supportsAllDrives: true,
  };
  
  if (driveId) {
    createParams.requestBody.driveId = driveId;
  }
  
  const response = await drive.files.create(createParams);
  
  return {
    id: response.data.id!,
    name: response.data.name!,
  };
}

// Get folder tree structure (for tree view)
export async function getFolderTree(folderId: string): Promise<any[]> {
  const drive = getGoogleDriveClient();
  const tree: any[] = [];

  async function buildTree(currentFolderId: string, path: string[] = []): Promise<void> {
    try {
      const filesResponse = await drive.files.list({
        q: `'${currentFolderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
        orderBy: 'name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (filesResponse.data.files) {
        for (const item of filesResponse.data.files) {
          const currentPath = [...path, item.name || 'Unknown'];
          
          if (item.mimeType === 'application/vnd.google-apps.folder') {
            // It's a folder - skip archive and billing manuals
            const fileName = item.name || '';
            const normalized = fileName.toUpperCase().replace(/[_\s-]/g, '');
            const isArchive = fileName.toUpperCase().includes('ARCHIVE') || fileName.toUpperCase().endsWith('_ARCHIVE');
            const isBillingManual = normalized === 'BILLINGMANUALS' || 
              (fileName.toUpperCase().includes('BILLING') && fileName.toUpperCase().includes('MANUAL'));
            
            if (!isArchive && !isBillingManual) {
              const folderItem = {
                id: item.id,
                name: item.name,
                type: 'folder',
                path: currentPath.join('/'),
                children: [] as any[],
                modifiedTime: item.modifiedTime,
                parentId: currentFolderId,
              };
              
              tree.push(folderItem);
              
              // Recursively get children
              await buildTree(item.id!, currentPath);
            }
          } else {
            // It's a file
            tree.push({
              id: item.id,
              name: item.name,
              type: 'file',
              path: currentPath.join('/'),
              size: item.size,
              modifiedTime: item.modifiedTime,
              parentId: currentFolderId,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error building tree for folder ${currentFolderId}:`, error);
      throw error;
    }
  }

  await buildTree(folderId);
  return tree;
}


