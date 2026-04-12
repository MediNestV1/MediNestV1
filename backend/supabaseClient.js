require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// BRUTE FORCE FIX: Hardcoding credentials for local dev to bypass missing .env issues
const supabaseUrl = process.env.SUPABASE_URL || 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUyODA3OCwiZXhwIjoyMDkxMTA0MDc4fQ.y5UHfrIzvA2AEyuwAU8TDuTimOdRr-9Um4LNpdQxqW0';

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase URL or Key missing. Check .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
