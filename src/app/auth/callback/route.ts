import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // Si invitaron al usuario, el enlace de "Accept Invite" puede traer 'token_hash'
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') // suele ser 'invite' o 'recovery'

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    // Caso 1: Flujo PKCE (Login normal por Magic Link)
    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error("Auth Callback Error (PKCE):", error)
    }

    // Caso 2: Flujo Token Hash (Invitación de usuarios o Recuperación de contraseña)
    if (token_hash && type) {
        const supabase = await createClient()
        // @ts-ignore - Supabase types are sometimes tricky with OTP types
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
            // Si es una invitación, lo mandamos a reset-password para que defina su clave
            if (type === 'invite') {
                // Ojo, asegúrate de tener una página /reset-password o redirigir a dashboard
                return NextResponse.redirect(`${origin}/dashboard`)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error("Auth Callback Error (OTP):", error)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Invalid_Login_Link`)
}
