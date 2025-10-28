const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadAllDocuments() {
  const documentsPath = '/home/dev/Downloads/MEDIRATE DOCUMENTS';
  const token = 'vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy';
  
  let uploadedCount = 0;
  let totalFiles = 0;
  
  // First, count all files
  function countFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        countFiles(filePath);
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'].includes(ext)) {
          totalFiles++;
        }
      }
    }
  }
  
  console.log('📊 Counting files...');
  countFiles(documentsPath);
  console.log(`📁 Found ${totalFiles} files to upload`);
  
  // Upload all files
  async function uploadFiles(dir, relativePath = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively upload files in subdirectories
        const newRelativePath = relativePath ? `${relativePath}/${file}` : file;
        await uploadFiles(filePath, newRelativePath);
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'].includes(ext)) {
          const blobPath = relativePath ? `${relativePath}/${file}` : file;
          
          try {
            console.log(`📤 Uploading: ${blobPath}`);
            
            const fileBuffer = fs.readFileSync(filePath);
            const blob = await put(blobPath, fileBuffer, {
              access: 'public',
              token: token
            });
            
            uploadedCount++;
            console.log(`✅ Uploaded: ${blobPath} (${uploadedCount}/${totalFiles})`);
            
          } catch (error) {
            console.error(`❌ Failed to upload ${blobPath}:`, error.message);
          }
        }
      }
    }
  }
  
  console.log('⬆️  Starting upload process...');
  await uploadFiles(documentsPath);
  
  console.log(`🎉 Upload complete! Uploaded ${uploadedCount} out of ${totalFiles} files`);
  console.log('📁 Folder structure maintained in Vercel Blob storage');
  console.log('🔗 Files are accessible via public URLs with full folder paths');
}

uploadAllDocuments().catch(console.error);
