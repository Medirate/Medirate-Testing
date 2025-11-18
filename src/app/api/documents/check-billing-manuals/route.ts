import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getKindeServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Checking for BILLING_MANUALS folder variations...');

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
               part.includes('BILLING') && part.includes('MANUAL');
      });
    });
    
    // Group by actual folder name to see variations
    const folderVariations = new Map<string, Array<{ pathname: string; size: number }>>();
    
    billingManualsFiles.forEach(file => {
      const pathParts = (file.pathname || '').split('/').filter(part => part && part !== '');
      // Find the billing manuals folder name (usually the second part: STATE/BILLING_MANUALS/file)
      if (pathParts.length >= 2) {
        const folderName = pathParts[1];
        if (!folderVariations.has(folderName)) {
          folderVariations.set(folderName, []);
        }
        folderVariations.get(folderName)!.push({
          pathname: file.pathname || '',
          size: file.size
        });
      }
    });
    
    // Group by state
    const byState = new Map<string, string[]>();
    billingManualsFiles.forEach(file => {
      const pathParts = (file.pathname || '').split('/').filter(part => part && part !== '');
      if (pathParts.length > 0) {
        const state = pathParts[0];
        const folderName = pathParts[1] || '';
        if (!byState.has(state)) {
          byState.set(state, []);
        }
        if (!byState.get(state)!.includes(folderName)) {
          byState.get(state)!.push(folderName);
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      totalFiles: billingManualsFiles.length,
      folderVariations: Array.from(folderVariations.entries()).map(([folderName, files]) => ({
        folderName,
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        sampleFiles: files.slice(0, 3).map(f => f.pathname)
      })),
      byState: Array.from(byState.entries()).map(([state, folders]) => ({
        state,
        folders,
        folderCount: folders.length
      })),
      allFiles: billingManualsFiles.map(f => ({
        pathname: f.pathname,
        size: f.size
      }))
    });

  } catch (error: any) {
    console.error('Error checking billing manuals folders:', error);
    return NextResponse.json({ 
      error: 'Failed to check folders', 
      details: error.message 
    }, { status: 500 });
  }
}

