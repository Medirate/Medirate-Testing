const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadAlabamaTest() {
  const documentsPath = '/home/dev/Downloads/MEDIRATE DOCUMENTS/ALABAMA';
  const token = 'vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy';
  
  let uploadedCount = 0;
  
  console.log('🚀 Testing Alabama upload with proper folder structure...');
  
  // Upload all files in Alabama
  async function uploadFiles(dir, relativePath = 'ALABAMA') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively upload files in subdirectories
        const newRelativePath = `${relativePath}/${file}`;
        await uploadFiles(filePath, newRelativePath);
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'].includes(ext)) {
          const blobPath = `${relativePath}/${file}`;
          
          try {
            console.log(`📤 Uploading: ${blobPath}`);
            
            const fileBuffer = fs.readFileSync(filePath);
            const blob = await put(blobPath, fileBuffer, {
              access: 'public',
              token: token
            });
            
            uploadedCount++;
            console.log(`✅ Uploaded: ${blobPath} (${uploadedCount})`);
            
          } catch (error) {
            console.error(`❌ Failed to upload ${blobPath}:`, error.message);
          }
        }
      }
    }
  }
  
  await uploadFiles(documentsPath);
  
  console.log(`🎉 Alabama upload complete! Uploaded ${uploadedCount} files`);
  console.log('📁 Folder structure: ALABAMA/ABA/, ALABAMA/BH/, etc.');
}

uploadAlabamaTest().catch(console.error);
