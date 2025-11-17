import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single Supabase client instance for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create an authenticated Supabase client with user token
export const createAuthenticatedClient = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

// For server-side operations that need service role access
export const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  )
}

// Service role client - only create when needed (server-side)
export const getSupabaseServiceRole = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Service role client cannot be used on the client side');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
} 