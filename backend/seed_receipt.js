const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wmmxvgpwvhjcpyhgcpzw.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtbXh2Z3B3dmhqY3B5aGdjcHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjgwNzgsImV4cCI6MjA5MTEwNDA3OH0.4gYcjTwRU9sqQc_XmFtUy0DSQLn2Qrx2fu27snHda5w';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function seed() {
    const clinic_id = '9e8bfb9f-ca9b-4a1f-aaa5-6d3b0c254fcd'; // From existing prescriptions
    const { data, error } = await supabase.from('receipts').insert([{
        receipt_number: 'REC-TEST-001',
        patient_name: 'TEST PATIENT',
        total_amount: 1500,
        printed_at: new Date().toISOString(),
        clinic_id: clinic_id
    }]);
    
    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Seed successful');
    }
}

seed();
