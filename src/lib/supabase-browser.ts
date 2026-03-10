import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Singleton client for browser-side Supabase interactions.
 */
export function createClient() {
    const globalSupabase = globalThis as unknown as {
        __supabase_client__?: SupabaseClient
    }

    if (!globalSupabase.__supabase_client__) {
        globalSupabase.__supabase_client__ = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    // Robust bypass for LockManager across all platforms (Mobile/Desktop/SSR)
                    // @ts-ignore
                    lock: (...args: any[]) => {
                        const callback = args.find(arg => typeof arg === 'function');
                        if (callback) return callback();
                        return Promise.resolve();
                    }
                }
            }
        )
    }

    return globalSupabase.__supabase_client__
}
