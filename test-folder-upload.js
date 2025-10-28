const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadWithFolderStructure() {
  try {
    const filePath = '/home/dev/Downloads/MEDIRATE DOCUMENTS/ALABAMA/ABA/Alabama ASD Fee Schedule 12072021.pdf';
    const fileBuffer = fs.readFileSync(filePath);
    
    // This should create the virtual folder structure
    const blob = await put('ALABAMA/ABA/Alabama ASD Fee Schedule 12072021.pdf', fileBuffer, {
      access: 'public',
      token: 'vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy'
    });
    
    console.log('✅ Uploaded successfully!');
    console.log('📁 Pathname:', blob.pathname);
    console.log('🔗 URL:', blob.url);
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadWithFolderStructure();
