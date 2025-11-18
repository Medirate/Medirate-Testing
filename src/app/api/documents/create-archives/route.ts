import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

// States list
const STATES = [
  'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO',
  'CONNECTICUT', 'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO',
  'ILLINOIS', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA',
  'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA',
  'MISSISSIPPI', 'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA',
  'NEW_HAMPSHIRE', 'NEW_JERSEY', 'NEW_MEXICO', 'NEW_YORK',
  'NORTH_CAROLINA', 'NORTH_DAKOTA', 'OHIO', 'OKLAHOMA', 'OREGON',
  'PENNSYLVANIA', 'RHODE_ISLAND', 'SOUTH_CAROLINA', 'SOUTH_DAKOTA',
  'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON',
  'WEST_VIRGINIA', 'WISCONSIN', 'WYOMING'
];

// Common subfolders
const SUBFOLDERS = ['ABA', 'BH', 'BILLING_MANUALS', 'IDD', 'HCBS'];

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

    console.log('🚀 Starting archive folder creation...');

    const results = {
      total: 0,
      success: 0,
      failed: 0,
      failedPaths: [] as string[]
    };

    // Create archive folders for each state and subfolder
    for (const state of STATES) {
      for (const subfolder of SUBFOLDERS) {
        const archivePath = `${state}/${subfolder}_ARCHIVE/.gitkeep`;
        results.total++;

        try {
          // Create a small placeholder file to create the folder
          // Vercel Blob doesn't support empty folders, so we create a minimal file
          const placeholder = new Blob(['Archive folder placeholder'], { type: 'text/plain' });
          
          await put(archivePath, placeholder, {
            access: 'public',
          });

          console.log(`✅ Created: ${archivePath}`);
          results.success++;
        } catch (error: any) {
          console.error(`❌ Failed: ${archivePath} - ${error.message}`);
          results.failed++;
          results.failedPaths.push(archivePath);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total folders attempted: ${results.total}`);
    console.log(`   ✅ Successful: ${results.success}`);
    console.log(`   ❌ Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      message: 'Archive folder creation complete',
      results
    });

  } catch (error: any) {
    console.error('Error creating archive folders:', error);
    return NextResponse.json({ 
      error: 'Failed to create archive folders', 
      details: error.message 
    }, { status: 500 });
  }
}

