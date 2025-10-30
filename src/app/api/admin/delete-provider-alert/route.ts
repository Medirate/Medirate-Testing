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

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Provider alert ID is required' }, { status: 400 });
    }

    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();

    // Delete the provider alert from the database
    const { error } = await supabase
      .from('provider_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting provider alert:', error);
      return NextResponse.json({ error: 'Failed to delete provider alert' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Provider alert deleted successfully' });
  } catch (error) {
    console.error('Error in delete provider alert API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
