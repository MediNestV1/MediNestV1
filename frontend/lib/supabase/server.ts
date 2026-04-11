import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ [SUPABASE ERROR]: Missing credentials in createServerSupabase');
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('Missing Supabase Credentials') })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('Missing Supabase Credentials') })
          })
        })
      })
    } as any;
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore if called from Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );
}

export function createMiddlewareSupabase(request: any, response: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ [SUPABASE ERROR]: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
    // Return a dummy object that mimics the expected structure but fails gracefully
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('Missing Supabase Credentials') })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('Missing Supabase Credentials') })
          })
        })
      })
    } as any;
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = response || {}; // fallback if response is not yet passed properly
          if (response.cookies) {
             response.cookies.set({ name, value, ...options });
          }
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          if (response.cookies) {
             response.cookies.set({ name, value: '', ...options });
          }
        },
      },
    }
  );
}
