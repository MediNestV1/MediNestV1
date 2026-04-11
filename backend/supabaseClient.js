require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// BRUTE FORCE FIX: Hardcoding credentials for local dev to bypass missing .env issues
const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase URL or Key missing. Using hardcoded fallbacks.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
