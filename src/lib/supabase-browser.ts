import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

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
                    storageKey: 'sb-contable-v4-fix',
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    // @ts-ignore
                    lock: async (name, acquireTimeout, callback) => {
                        if (typeof acquireTimeout === 'function') return acquireTimeout();
                        if (typeof callback === 'function') return callback();
                        return Promise.resolve();
                    }
                }
            }
        )
    }

    return globalSupabase.__supabase_client__
}
