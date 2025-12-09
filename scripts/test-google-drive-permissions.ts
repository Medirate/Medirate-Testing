/**
 * Test script to verify Google Drive folder permissions and ownership
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import {
  getGoogleDriveClient,
  findRootFolder,
} from '../src/lib/google-drive';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function testPermissions() {
  const drive = getGoogleDriveClient();
  const rootFolderName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'Medirate Document Library';
  
  console.log(`🔍 Testing Google Drive permissions for folder: "${rootFolderName}"\n`);
  
  try {
    // Find root folder
    const rootFolderId = await findRootFolder(rootFolderName);
    
    if (!rootFolderId) {
      console.error(`❌ Root folder "${rootFolderName}" not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found root folder (ID: ${rootFolderId})\n`);
    
    // Get folder metadata including ownership
    const folderMetadata = await drive.files.get({
      fileId: rootFolderId,
      fields: 'id, name, owners, permissions, driveId, shared, capabilities',
      supportsAllDrives: true,
    });
    
    console.log('📋 Folder Metadata:');
    console.log(`   Name: ${folderMetadata.data.name}`);
    console.log(`   ID: ${folderMetadata.data.id}`);
    console.log(`   Shared: ${folderMetadata.data.shared}`);
    console.log(`   Drive ID: ${folderMetadata.data.driveId || 'Not a Shared Drive'}`);
    
    if (folderMetadata.data.owners) {
      console.log(`\n👤 Owners:`);
      folderMetadata.data.owners.forEach((owner: any) => {
        console.log(`   - ${owner.displayName || owner.emailAddress} (${owner.emailAddress})`);
        console.log(`     Kind: ${owner.kind}`);
      });
    }
    
    if (folderMetadata.data.permissions) {
      console.log(`\n🔐 Permissions:`);
      folderMetadata.data.permissions.forEach((perm: any) => {
        console.log(`   - ${perm.displayName || perm.emailAddress || perm.type}: ${perm.role}`);
        if (perm.emailAddress) {
          console.log(`     Email: ${perm.emailAddress}`);
        }
      });
    }
    
    if (folderMetadata.data.capabilities) {
      console.log(`\n⚙️  Capabilities:`);
      const caps = folderMetadata.data.capabilities as any;
      console.log(`   Can add children: ${caps.canAddChildren}`);
      console.log(`   Can edit: ${caps.canEdit}`);
      console.log(`   Can share: ${caps.canShare}`);
      console.log(`   Can delete: ${caps.canDelete}`);
    }
    
    // Try to create a test file
    console.log(`\n🧪 Testing file creation...`);
    try {
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = Buffer.from('This is a test file');
      const { Readable } = await import('stream');
      const stream = Readable.from(testContent);
      
      const createParams: any = {
        requestBody: {
          name: testFileName,
          parents: [rootFolderId],
        },
        media: {
          mimeType: 'text/plain',
          body: stream,
        },
        fields: 'id, name, owners',
        supportsAllDrives: true,
      };
      
      // If it's a Shared Drive, add driveId
      if (folderMetadata.data.driveId) {
        createParams.requestBody.driveId = folderMetadata.data.driveId;
        console.log(`   Using Shared Drive ID: ${folderMetadata.data.driveId}`);
      }
      
      const testFile = await drive.files.create(createParams);
      console.log(`   ✅ Successfully created test file: ${testFile.data.name} (ID: ${testFile.data.id})`);
      
      // Get file ownership
      if (testFile.data.owners) {
        console.log(`   File owners:`);
        testFile.data.owners.forEach((owner: any) => {
          console.log(`     - ${owner.displayName || owner.emailAddress} (${owner.emailAddress})`);
        });
      }
      
      // Clean up - delete the test file
      console.log(`\n🧹 Cleaning up test file...`);
      await drive.files.delete({
        fileId: testFile.data.id!,
        supportsAllDrives: true,
      });
      console.log(`   ✅ Test file deleted`);
      
    } catch (error: any) {
      console.error(`   ❌ Failed to create test file: ${error.message}`);
      if (error.message.includes('storage quota')) {
        console.error(`\n💡 This is the storage quota error. Possible solutions:`);
        console.error(`   1. Use a Shared Drive (Google Workspace feature)`);
        console.error(`   2. The folder must be owned by a regular Google account`);
        console.error(`   3. Service accounts cannot create files in regular folders, only in Shared Drives`);
      }
      throw error;
    }
    
    console.log(`\n✅ All tests passed!`);
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

testPermissions();

