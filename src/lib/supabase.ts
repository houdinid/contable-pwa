import { createClient } from './supabase-browser';

// We now use the SSR browser client uniformly across the app to prevent
// LockManager timeout issues when multiple clients try to access the same
// auth token lock simultaneously during hot-reloads.
export const supabase = createClient();
