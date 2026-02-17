
import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks for production build stability
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zugoozopxxemlewtvjij.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE3OTAsImV4cCI6MjA4Njg2Nzc5MH0.I8WDdVhvztd_NMEYarmCa4QCP2Gw5LsTf36ZvivCogg";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Data synchronization will not work.');
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);
