require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.warn("⚠️ Supabase URL or Service Role Key missing in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

module.exports = { supabase };
