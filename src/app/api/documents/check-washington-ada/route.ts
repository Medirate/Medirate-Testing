import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking for WASHINGTON/ADA/ folder...');

    // List all files in the blob store
    const { blobs } = await list();
    
    // Find all files in WASHINGTON/ADA/
    const adaFiles = blobs.filter(blob => {
      const pathname = blob.pathname || '';
      return pathname.toUpperCase().startsWith('WASHINGTON/ADA/');
    });
    
    // Also check for WASHINGTON/ABA/ to see what exists
    const abaFiles = blobs.filter(blob => {
      const pathname = blob.pathname || '';
      return pathname.toUpperCase().startsWith('WASHINGTON/ABA/');
    });
    
    return NextResponse.json({
      success: true,
      adaFiles: adaFiles.map(f => ({
        pathname: f.pathname,
        size: f.size,
        url: f.url
      })),
      abaFiles: abaFiles.map(f => ({
        pathname: f.pathname,
        size: f.size,
        url: f.url
      })),
      adaCount: adaFiles.length,
      abaCount: abaFiles.length,
      totalBlobs: blobs.length
    });

  } catch (error: any) {
    console.error('Error checking Washington folders:', error);
    return NextResponse.json({ 
      error: 'Failed to check folders', 
      details: error.message 
    }, { status: 500 });
  }
}

