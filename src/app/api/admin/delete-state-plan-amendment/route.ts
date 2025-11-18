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
      return NextResponse.json({ error: 'State plan amendment ID is required' }, { status: 400 });
    }

    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();

    // Delete the state plan amendment from the database
    const { error } = await supabase
      .from('state_plan_amendments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting state plan amendment:', error);
      return NextResponse.json({ error: 'Failed to delete state plan amendment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'State plan amendment deleted successfully' });
  } catch (error) {
    console.error('Error in delete state plan amendment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
