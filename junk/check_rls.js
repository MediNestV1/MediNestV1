const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function check() {
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'receipts' });
    if (error) {
        // Fallback: try to see if we can get anything from information_schema via a trick
        const { data: cols, error: err } = await supabase.from('receipts').select('*').limit(1);
        console.log('Insert test result following...');
        const { error: insErr } = await supabase.from('receipts').insert([{ id: '00000000-0000-0000-0000-000000000000' }]);
        console.log('Error:', insErr?.message);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
