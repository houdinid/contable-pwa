import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Singleton client for browser-side Supabase interactions.
 * Uses globalThis to survive Hot Module Replacement (HMR) during development.
 * 
 * We explicitly disable the "lock" mechanism in auth options to prevent 
 * "LockManager" timeout errors (common in Next.js dev mode/Turbopack 
 * when many parallel requests are made, as in our DataContext).
 */
export function createClient() {
    const globalSupabase = globalThis as unknown as {
        __supabase_client__?: SupabaseClient
    }

    if (!globalSupabase.__supabase_client__) {
        console.log("Initializing Supabase Singleton Client with Lock Bypass...");
        globalSupabase.__supabase_client__ = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    // Standard LockManager bypass to prevents parallel request hangs in dev/HMR
                    // and mobile browsers where the lock can become stale.
                    // @ts-ignore
                    lock: (name, acquireTimeout, callback) => {
                        if (typeof callback === 'function') return callback();
                        if (typeof acquireTimeout === 'function') return acquireTimeout();
                        return Promise.resolve();
                    }
                }
            }
        )
    }

    return globalSupabase.__supabase_client__
}
