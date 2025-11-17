import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const supabase = createServiceClient();

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data from Supabase
    const { data: userData, error } = await supabase
      .from('User')
      .select('UserID, FirstName, LastName, Email, Picture')
      .eq('Email', user.email)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error in user-info API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
