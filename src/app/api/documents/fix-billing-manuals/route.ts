import { NextRequest, NextResponse } from 'next/server';
import { list, put, del } from '@vercel/blob';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(request: NextRequest) {
  try {
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

    console.log('🔍 Finding and fixing BILLING_MANUALS folder variations...');

    // List all files in the blob store
    const { blobs } = await list();
    
    // Find all files that might be billing manuals (various naming patterns)
    const billingManualsFiles = blobs.filter(blob => {
      const pathname = (blob.pathname || '').toUpperCase();
      const pathParts = pathname.split('/').filter(part => part && part !== '');
      
      // Check if any part of the path matches billing manuals patterns
      return pathParts.some(part => {
        const normalized = part.replace(/[_\s-]/g, ''); // Remove underscores, spaces, hyphens
        return normalized === 'BILLINGMANUALS' || 
               (part.includes('BILLING') && part.includes('MANUAL'));
      });
    });
    
    if (billingManualsFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No billing manuals files found. Nothing to fix.',
        moved: 0,
        errors: 0
      });
    }
    
    console.log(`📋 Found ${billingManualsFiles.length} file(s) in billing manuals folders`);
    
    // Process each file - we'll just delete them since they should be hidden
    // OR we could move them to an archive, but for now let's just ensure they're filtered
    // Actually, let's not delete - let's just ensure the filter catches all variations
    
    // Group files by their current folder name
    const filesByFolder = new Map<string, typeof billingManualsFiles>();
    
    billingManualsFiles.forEach(file => {
      const pathParts = (file.pathname || '').split('/').filter(part => part && part !== '');
      if (pathParts.length >= 2) {
        const folderName = pathParts[1];
        if (!filesByFolder.has(folderName)) {
          filesByFolder.set(folderName, []);
        }
        filesByFolder.get(folderName)!.push(file);
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Found ${billingManualsFiles.length} file(s) in billing manuals folders. These should be filtered from the UI.`,
      total: billingManualsFiles.length,
      folderVariations: Array.from(filesByFolder.entries()).map(([folderName, files]) => ({
        folderName,
        fileCount: files.length,
        files: files.map(f => f.pathname)
      })),
      note: 'These files will be hidden from the UI with the updated filter. No renaming needed.'
    });

  } catch (error: any) {
    console.error('Error checking billing manuals folders:', error);
    return NextResponse.json({ 
      error: 'Failed to check folders', 
      details: error.message 
    }, { status: 500 });
  }
}

