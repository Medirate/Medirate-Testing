const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// Configuration
const DOCUMENTS_PATH = '/path/to/MEDIRATE DOCUMENTS'; // UPDATE THIS PATH
const BLOB_TOKEN = 'your_vercel_blob_token_here'; // UPDATE THIS TOKEN

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

// Upload delay to avoid rate limiting (milliseconds)
const UPLOAD_DELAY = 100;

async function uploadAllDocuments() {
  console.log('🚀 Starting document upload process...');
  console.log(`📁 Source folder: ${DOCUMENTS_PATH}`);
  
  let totalFiles = 0;
  let uploadedFiles = 0;
  let skippedFiles = 0;
  let errorFiles = 0;
  
  // Count total files first
  function countFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        countFiles(filePath);
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          totalFiles++;
        }
      }
    }
  }
  
  console.log('📊 Counting files...');
  countFiles(DOCUMENTS_PATH);
  console.log(`📊 Found ${totalFiles} files to upload`);
  
  // Upload files
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
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          const blobPath = relativePath ? `${relativePath}/${file}` : file;
          
          try {
            console.log(`📤 [${uploadedFiles + skippedFiles + errorFiles + 1}/${totalFiles}] Uploading: ${blobPath}`);
            
            const fileBuffer = fs.readFileSync(filePath);
            const blob = await put(blobPath, fileBuffer, {
              access: 'public',
              token: BLOB_TOKEN
            });
            
            console.log(`✅ Uploaded: ${blobPath}`);
            uploadedFiles++;
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, UPLOAD_DELAY));
            
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`⚠️  Skipped (already exists): ${blobPath}`);
              skippedFiles++;
            } else {
              console.error(`❌ Failed to upload ${blobPath}:`, error.message);
              errorFiles++;
            }
          }
        }
      }
    }
  }
  
  try {
    await uploadFiles(DOCUMENTS_PATH);
    
    console.log('\n🎉 Upload process completed!');
    console.log(`✅ Uploaded: ${uploadedFiles} files`);
    console.log(`⚠️  Skipped: ${skippedFiles} files (already exist)`);
    console.log(`❌ Errors: ${errorFiles} files`);
    console.log(`📊 Total processed: ${uploadedFiles + skippedFiles + errorFiles} files`);
    
  } catch (error) {
    console.error('💥 Upload process failed:', error);
    process.exit(1);
  }
}

// Run the upload
if (require.main === module) {
  uploadAllDocuments().catch(console.error);
}

module.exports = { uploadAllDocuments };
