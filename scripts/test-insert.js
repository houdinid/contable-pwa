const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://zugoozopxxemlewtvjij.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE3OTAsImV4cCI6MjA4Njg2Nzc5MH0.I8WDdVhvztd_NMEYarmCa4QCP2Gw5LsTf36ZvivCogg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Attempting to insert test record into cctv_systems...");

    const testSystem = {
        id: "550e8400-e29b-41d4-a716-446655440000", // Test UUID
        branch: "Test Branch - Debug Script",
        brand: "TestBrand",
        technology: "IP",
        observations: "Created by debug script"
    };

    const { data, error } = await supabase
        .from('cctv_systems')
        .insert(testSystem)
        .select()
        .single();

    if (error) {
        console.error("INSERT FAILED:", error);
    } else {
        console.log("INSERT SUCCESS:", data);

        // Cleanup
        console.log("Cleaning up test record...");
        await supabase.from('cctv_systems').delete().eq('id', data.id);
    }
}

testInsert();
