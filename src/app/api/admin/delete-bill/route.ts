import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import('@/lib/admin-auth');
    const { error: authError } = await validateAdminAuth();
    if (authError) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Bill URL is required' }, { status: 400 });
    }

    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();

    // Delete the bill from the database
    const { error } = await supabase
      .from('bill_track_50')
      .delete()
      .eq('url', url);

    if (error) {
      console.error('Error deleting bill:', error);
      return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error in delete bill API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
