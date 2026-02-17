const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://zugoozopxxemlewtvjij.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE3OTAsImV4cCI6MjA4Njg2Nzc5MH0.I8WDdVhvztd_NMEYarmCa4QCP2Gw5LsTf36ZvivCogg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    const { data, error } = await supabase.storage.createBucket('cctv-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });

    if (error) {
        console.error("Error creating bucket:", error);
    } else {
        console.log("Bucket created:", data);
    }
}

createBucket();
