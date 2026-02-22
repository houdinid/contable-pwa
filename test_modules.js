const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Fallback if .env parsing fails or is missing using the known keys
const supabaseUrl = 'https://zugoozopxxemlewtvjij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE3OTAsImV4cCI6MjA4Njg2Nzc5MH0.I8WDdVhvztd_NMEYarmCa4QCP2Gw5LsTf36ZvivCogg';

const supabase = createClient(supabaseUrl, supabaseKey);

const tests = [
    { table: 'remote_access', data: { software_type: 'AnyDesk', connection_code: '123456' } },
    { table: 'antivirus_licenses', data: { license_name: 'Test AV', product_key: 'XXXX-YYYY' } },
    { table: 'corporate_emails', data: { email_address: 'test@example.com' } },
    { table: 'software_licenses', data: { software_type: 'Windows' } },
    { table: 'tax_deadlines', data: { business_name: 'Test Inc', tax_id: '123', tax_type: 'IVA', expiration_date: '2026-12-31' } },
    { table: 'wifi_networks', data: { ssid: 'Test Network', device_type: 'Router' } },
    { table: 'cctv_systems', data: { technology: 'IP', channels: 4 } },
    { table: 'contacts', data: { name: 'Test Client', type: 'client' } }
];

async function runTests() {
    let allSuccess = true;
    for (const t of tests) {
        console.log(`\n--- Testing ${t.table} ---`);
        const id = crypto.randomUUID();
        const row = { id, ...t.data };
        try {
            // Insert
            const { error: insErr } = await supabase.from(t.table).insert(row);
            if (insErr) { console.error(`[FAIL] Insert: ${insErr.message}`); allSuccess = false; continue; }

            // Read
            const { data, error: readErr } = await supabase.from(t.table).select('*').eq('id', id);
            if (readErr) { console.error(`[FAIL] Read: ${readErr.message}`); allSuccess = false; continue; }
            if (!data || data.length === 0) { console.error(`[FAIL] Read: Not found`); allSuccess = false; continue; }
            console.log(`[OK] Insert & Read`);

            // Delete
            const { error: delErr } = await supabase.from(t.table).delete().eq('id', id);
            if (delErr) { console.error(`[FAIL] Delete: ${delErr.message}`); allSuccess = false; continue; }
            console.log(`[OK] Delete`);
        } catch (e) {
            console.error(`[FAIL] Exception:`, e);
            allSuccess = false;
        }
    }

    if (allSuccess) {
        console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY');
    } else {
        console.log('\n❌ SOME TESTS FAILED');
    }
}

runTests();
