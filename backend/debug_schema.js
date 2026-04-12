const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function check() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'receipts' });
    if (error) {
       // RPC might not exist, try an empty select to see column names in error or metadata
       const { data: cols, error: err } = await supabase.from('receipts').select().limit(0);
       if (err) {
           console.error('Error fetching columns:', err);
       } else {
           console.log('Columns found:', Object.keys(cols?.[0] || {}));
           // If cols is empty, we might not get keys. Try a different way.
           const { data: one, error: err2 } = await supabase.from('receipts').select().limit(1);
           console.log('Sample record keys:', Object.keys(one?.[0] || {}));
       }
       return;
    }
    console.log(JSON.stringify(data, null, 2));
}

check();
