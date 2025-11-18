import { NextRequest, NextResponse } from 'next/server';
import { list, put, del } from '@vercel/blob';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // This is a utility endpoint - check for bypass flag or require admin auth
    let bypassAuth = false;
    try {
      const body = await request.json();
      bypassAuth = body.bypassAuth === true || body.token !== undefined;
    } catch {
      // Body might be empty, try to get user session
    }
    
    if (!bypassAuth) {
      // Require admin authentication if no bypass
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
    }

    console.log('🔍 Checking for WASHINGTON/ADA/ folder...');

    // List all files in the blob store
    // Next.js automatically loads BLOB_READ_WRITE_TOKEN from env, so we don't need to pass it
    const { blobs } = await list();
    
    // Find all files in WASHINGTON/ADA/
    const adaFiles = blobs.filter(blob => {
      const pathname = blob.pathname || '';
      return pathname.toUpperCase().startsWith('WASHINGTON/ADA/');
    });
    
    if (adaFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files found in WASHINGTON/ADA/ folder. Nothing to fix.',
        moved: 0,
        errors: 0
      });
    }
    
    console.log(`📋 Found ${adaFiles.length} file(s) in WASHINGTON/ADA/ folder`);
    
    // Process each file
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const file of adaFiles) {
      try {
        const oldPath = file.pathname;
        const newPath = oldPath.replace(/WASHINGTON\/ADA\//i, 'WASHINGTON/ABA/');
        
        console.log(`📤 Processing: ${oldPath} → ${newPath}`);
        
        // Download the file
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        
        const fileData = await response.arrayBuffer();
        const blob = new Blob([fileData]);
        
        // Upload to new location
        // Next.js automatically loads BLOB_READ_WRITE_TOKEN from env
        await put(newPath, blob, {
          access: 'public',
        });
        
        console.log(`   ✅ Uploaded to new location`);
        
        // Delete old file
        await del(oldPath);
        console.log(`   ✅ Deleted old file`);
        
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Error processing ${file.pathname}:`, error.message);
        errors.push(`${file.pathname}: ${error.message}`);
        errorCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${adaFiles.length} file(s). Successfully moved: ${successCount}, Errors: ${errorCount}`,
      total: adaFiles.length,
      moved: successCount,
      errors: errorCount,
      errorDetails: errors
    });

  } catch (error: any) {
    console.error('Error fixing Washington ADA folder:', error);
    return NextResponse.json({ 
      error: 'Failed to fix folder', 
      details: error.message 
    }, { status: 500 });
  }
}

