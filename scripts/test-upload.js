const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
    const fileContent = "test file content";
    const { data, error } = await supabase.storage.from('antivirus-files').upload('test.txt', fileContent, {
        contentType: 'text/plain',
        upsert: true
    });
    console.log("Anon Upload Error:", error);
    console.log("Anon Upload Data:", data);
}

testUpload();
