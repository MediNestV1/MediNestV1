const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function check() {
  const p = await supabase.from('patients').select('*').limit(1);
  const px = await supabase.from('prescriptions').select('*').limit(1);
  const m = await supabase.from('medicines').select('*').limit(1);
  console.log("patients:", p.data);
  console.log("prescriptions:", px.data);
  console.log("medicines:", m.data);
}
check();
