import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // BRUTE FORCE FIX: Hardcoding credentials because process.env is failing to load in this environment
  const url = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';

  return createBrowserClient(url, anonKey);
}
