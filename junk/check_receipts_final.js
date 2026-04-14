const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function check() {
    const { count, error } = await supabase.from('receipts').select('*', { count: 'exact', head: true });
    if (error) {
        console.error('Error fetching receipts count:', error);
        return;
    }
    console.log(`Receipts Count: ${count}`);
    
    if (count > 0) {
        const { data } = await supabase.from('receipts').select('*').limit(5);
        console.log('Sample Data:', JSON.stringify(data, null, 2));
    }
}

check();
