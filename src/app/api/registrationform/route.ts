import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseServiceRole = getSupabaseServiceRole();
    const { data, error } = await supabaseServiceRole
      .from("registrationform")
      .select("email, firstname, lastname, companyname, companytype, providertype, howdidyouhear, interest, demorequest, account_role, primary_user_email")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error fetching registrationform data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, ...formData } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseServiceRole = getSupabaseServiceRole();

    // Check if record exists
    const { data: existing } = await supabaseServiceRole
      .from("registrationform")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { data, error } = await supabaseServiceRole
        .from("registrationform")
        .update(formData)
        .eq("email", email)
        .select()
        .single();

      if (error) {
        console.error("Error updating registrationform data:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data, action: 'updated' });
    } else {
      // Insert new record
      const { data, error } = await supabaseServiceRole
        .from("registrationform")
        .insert({ email, ...formData })
        .select()
        .single();

      if (error) {
        console.error("Error inserting registrationform data:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data, action: 'created' });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
