const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zugoozopxxemlewtvjij.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI5MTc5MCwiZXhwIjoyMDg2ODY3NzkwfQ.lIDsOdomnqtnvjMTXLAipugyCdMI9v17PQKmy7sw4Qs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    const { data, error } = await supabase.storage.createBucket('antivirus-files', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/zip', 'application/pdf', 'application/x-zip-compressed', 'application/octet-stream']
    });

    if (error) {
        console.error("Error creating bucket:", error);
    } else {
        console.log("Bucket created:", data);
    }
}

createBucket();
