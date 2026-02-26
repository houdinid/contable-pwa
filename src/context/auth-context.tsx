"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { User, Session } from "@supabase/supabase-js";

// Role-based Enums
export enum UserRole {
    SUPER_ADMIN = "SuperAdministrador",
    CONTADOR_PRINCIPAL = "Contador Principal",
    AUXILIAR_CONTABLE = "Auxiliar Contable",
    AUDITOR = "Auditor"
}

export interface UserProfile {
    id: string; // The auth.users UUID
    name?: string;
    email: string | undefined;
    role: UserRole;
    isMfaEnabled?: boolean;
}

interface AuthContextRoleData {
    role_id: string;
    roles: { name: string } | null | { name: string }[];
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: UserProfile | null;
    supabaseUser: User | null;
    session: Session | null;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    supabaseUser: null,
    session: null,
    logout: async () => { },
    checkSession: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const fetchUserProfile = async (currentUser: User) => {
        try {
            // Check for MFA first (no RLS issues)
            let isMfaEnabled = false;
            try {
                const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (!mfaError && mfaData) {
                    isMfaEnabled = mfaData.currentLevel === 'aal2';
                }
            } catch (mfaFail) {
                console.error("MFA check failed:", mfaFail);
            }

            // Intentar obtener el rol del usuario desde la tabla user_roles
            let roleName = UserRole.AUXILIAR_CONTABLE; // Default fallback
            try {
                const { data: userRoleData, error: roleError } = await supabase
                    .from('user_roles')
                    .select(`
                        role_id,
                        roles (
                            name
                        )
                    `)
                    .eq('user_id', currentUser.id)
                    .single();

                if (!roleError && userRoleData) {
                    const rawRoleData = userRoleData as unknown as AuthContextRoleData;
                    roleName = (Array.isArray(rawRoleData?.roles)
                        ? rawRoleData.roles[0]?.name
                        : rawRoleData?.roles?.name) as UserRole || UserRole.AUXILIAR_CONTABLE;
                } else if (roleError) {
                    console.error("Error fetching user role:", roleError);
                }
            } catch (roleFail) {
                console.error("Role fetch failed:", roleFail);
            }

            setUserProfile({
                id: currentUser.id,
                email: currentUser.email,
                role: roleName,
                isMfaEnabled
            });

        } catch (error) {
            console.error("Failed to build user profile", error);
            // Fallback en caso de error crítico
            setUserProfile({
                id: currentUser.id,
                email: currentUser.email,
                role: UserRole.AUXILIAR_CONTABLE,
                isMfaEnabled: false
            });
        }
    };

    const checkSession = async () => {
        setIsLoading(true);
        try {
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();

            setSession(currentSession);
            if (currentSession?.user) {
                setSupabaseUser(currentSession.user);
                await fetchUserProfile(currentSession.user);
            } else {
                setSupabaseUser(null);
                setUserProfile(null);
            }
        } catch (e) {
            console.error("Error checking session:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        checkSession();

        // Set up real-time listener for Auth State changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                setSession(currentSession);

                if (event === 'SIGNED_IN' && currentSession?.user) {
                    setSupabaseUser(currentSession.user);
                    await fetchUserProfile(currentSession.user);
                    setIsLoading(false); // Ensure loading is cleared
                } else if (event === 'SIGNED_OUT') {
                    setSupabaseUser(null);
                    setUserProfile(null);
                    setSession(null);
                    setIsLoading(false); // Ensure loading is cleared
                    router.push('/login');
                } else if (event === 'INITIAL_SESSION') {
                    setIsLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            // Router redirection is handled by onAuthStateChange event 'SIGNED_OUT'
        } catch (e) {
            console.error("Error logging out:", e);
        }
    };

    // Inactivity Timeout - Auto Logout (10 Minutes)
    useEffect(() => {
        let inactivityTimeout: NodeJS.Timeout;
        const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

        const resetInactivityTimeout = () => {
            if (inactivityTimeout) clearTimeout(inactivityTimeout);

            if (supabaseUser) {
                inactivityTimeout = setTimeout(async () => {
                    console.warn("Session expired due to inactivity. Logging out.");
                    await logout();
                }, INACTIVITY_LIMIT);
            }
        };

        // Listeners for user activity
        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        activityEvents.forEach(event => {
            window.addEventListener(event, resetInactivityTimeout, { passive: true });
        });

        // Start timer initially
        resetInactivityTimeout();

        return () => {
            if (inactivityTimeout) clearTimeout(inactivityTimeout);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetInactivityTimeout);
            });
        };
    }, [supabaseUser]);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!session,
                isLoading,
                user: userProfile,
                supabaseUser,
                session,
                logout,
                checkSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
