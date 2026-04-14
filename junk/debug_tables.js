const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function check() {
    const { data: tables, error } = await supabase.rpc('get_tables'); // This might not work if RPC doesn't exist
    if (error) {
        // Fallback: try querying common names
        const names = ['receipts', 'billing_receipts', 'invoices'];
        for (const name of names) {
            const { count, error: err } = await supabase.from(name).select('*', { count: 'exact', head: true });
            console.log(`Table ${name}: count=${count}, error=${err?.message || 'none'}`);
        }
        return;
    }
    console.log(JSON.stringify(tables, null, 2));
}

check();
