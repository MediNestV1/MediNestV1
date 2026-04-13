require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// SUPABASE CONFIGURATION: Uses environment variables for security.
// Ensure these are set in your backend/.env file.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ CRITICAL ERROR: Supabase URL or Service Role Key missing in .env");
  process.exit(1); // Exit if critical config is missing
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
