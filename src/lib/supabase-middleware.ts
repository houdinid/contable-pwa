import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT USE getSession IN MIDDLEWARE. Use getUser
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Proteger rutas de /dashboard
    if (
        !user &&
        request.nextUrl.pathname.startsWith('/dashboard')
    ) {
        // no hay usuario, mandarlo al login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Permitir acceso a /mfa y /mfa-setup para usuarios autenticados (no redirigir)
    if (
        user &&
        (request.nextUrl.pathname === '/mfa' || request.nextUrl.pathname === '/mfa-setup')
    ) {
        return supabaseResponse
    }

    // Si ya hay usuario y quiere entrar a /login o /, verificar MFA antes de redirigir
    if (
        user &&
        (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')
    ) {
        // Verificar nivel de MFA para decidir a dónde redirigir
        try {
            const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
            if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
                // MFA pendiente, redirigir a /mfa
                const url = request.nextUrl.clone()
                url.pathname = '/mfa'
                return NextResponse.redirect(url)
            }
        } catch (e) {
            // Si falla la verificación MFA, dejar pasar al dashboard
            console.error('Middleware MFA check failed:', e)
        }
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
