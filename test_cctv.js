const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCctvInsert() {
    const systemData = {
        id: crypto.randomUUID(),
        client_id: 'd1cecef2-4664-41a5-89cc-1ef8e7ce942e', // Fictional UUID for testing, might fail FK but let's see
        branch: 'Branch 1',
        brand: 'Brand X',
        model: 'Model Y',
        serial_number: 'SN123',
        channels: 4,
        technology: 'IP',
        disk_capacity: '1TB',
        ip_address: '192.168.1.1',
        http_port: '80',
        rtsp_port: '554',
        email: 'test@test.com',
        observations: 'No notes',
        qr_code_url: null,
        photo_url: null
    };

    const { error } = await supabase.from('cctv_systems').insert(systemData);
    console.log("CCTV Insert Error:", error);
}

testCctvInsert();
