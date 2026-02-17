const { createClient } = require('@supabase/supabase-js');

// Using the hardcoded credentials from src/lib/supabase.ts to match the app's behavior
const supabaseUrl = "https://zugoozopxxemlewtvjij.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE3OTAsImV4cCI6MjA4Njg2Nzc5MH0.I8WDdVhvztd_NMEYarmCa4QCP2Gw5LsTf36ZvivCogg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking database content...");

    const tables = ['contacts', 'cctv_systems', 'products', 'expenses'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`Error checking ${table}:`, error.message);
        } else {
            console.log(`Table '${table}': ${count} rows`);
        }
    }
}

checkData();
