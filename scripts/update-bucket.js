const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zugoozopxxemlewtvjij.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI5MTc5MCwiZXhwIjoyMDg2ODY3NzkwfQ.lIDsOdomnqtnvjMTXLAipugyCdMI9v17PQKmy7sw4Qs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBucket() {
    const { data, error } = await supabase.storage.updateBucket('antivirus-files', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        // allow anything, or add rar types specifically
        allowedMimeTypes: null 
    });

    if (error) {
        console.error("Error updating bucket:", error);
    } else {
        console.log("Bucket updated:", data);
    }
}

updateBucket();
