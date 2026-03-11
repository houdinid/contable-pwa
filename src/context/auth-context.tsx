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
    isMfaRequired?: boolean;
    isMfaVerified?: boolean;
}

interface AuthContextRoleData {
    role_id: string;
    roles: { name: string } | null | { name: string }[];
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    isMfaVerified: boolean;
    isMfaRequired: boolean;
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
    isMfaVerified: false,
    isMfaRequired: false,
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
    const isChecking = React.useRef(false);
    const isFetchingProfile = React.useRef<string | null>(null); // Track which user is being fetched
    const initialCheckDone = React.useRef(false);


    const fetchUserProfile = async (currentUser: User) => {
        if (isFetchingProfile.current === currentUser.id) {
            console.log("AuthContext: Profile fetch already in progress for user:", currentUser.id);
            return;
        }
        isFetchingProfile.current = currentUser.id;
        console.log(`[${new Date().toISOString()}] AuthContext: Fetching profile for:`, currentUser.id);
        
        try {
            // MFA DESACTIVADO A PETICIÓN DEL USUARIO
            // Defaulting all MFA states to false to bypass any MFA checks
            let isMfaEnabled = false;
            let isMfaRequired = false;
            let isMfaVerified = false;

            let roleName = UserRole.AUXILIAR_CONTABLE; // Default fallback
            try {
                const withTimeout = (promise: Promise<any>, timeoutMs = 8000) => {
                    return Promise.race([
                        promise,
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("Timeout en query de roles")), timeoutMs)
                        )
                    ]);
                };

                const { data: userRoleData, error: roleError } = await withTimeout(
                    Promise.resolve(supabase
                        .from('user_roles')
                        .select(`
                            role_id,
                            roles (
                                name
                            )
                        `)
                        .eq('user_id', currentUser.id)
                        .maybeSingle()
                    )
                ).catch(err => {
                    console.warn("AuthContext: Role query timed out or failed:", err.message);
                    return { data: null, error: null };
                }) as any;

                if (userRoleData) {
                    const rawRoleData = userRoleData as unknown as AuthContextRoleData;
                    roleName = (Array.isArray(rawRoleData?.roles)
                        ? rawRoleData.roles[0]?.name
                        : rawRoleData?.roles?.name) as UserRole || UserRole.AUXILIAR_CONTABLE;
                } else if (roleError) {
                    const isMeaningfulError = Object.keys(roleError).length > 0 &&
                        (roleError.message || roleError.details || roleError.hint);

                    if (isMeaningfulError) {
                        console.error("Error fetching user role:", roleError.message || roleError);
                    }
                }
            } catch (roleFail) {
                console.error("Role fetch failed:", roleFail);
            }

            setUserProfile({
                id: currentUser.id,
                email: currentUser.email,
                role: roleName,
                isMfaEnabled,
                isMfaRequired,
                isMfaVerified
            });

        } catch (error) {
            console.error("Failed to build user profile", error);
            setUserProfile({
                id: currentUser.id,
                email: currentUser.email,
                role: UserRole.AUXILIAR_CONTABLE,
                isMfaEnabled: false,
                isMfaRequired: false,
                isMfaVerified: false
            });
        } finally {
            // CRITICAL: Always reset the guard so subsequent events can update profile
            isFetchingProfile.current = null;
        }
    };

    const checkSession = async () => {
        if (isChecking.current) return;
        isChecking.current = true;
        setIsLoading(true);
        try {
            console.log("AuthContext: Calling getSession()...");
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("AuthContext: getSession error:", error);
                throw error;
            }
            console.log("AuthContext: getSession success, user:", currentSession?.user?.id);

            setSession(currentSession);
            if (currentSession?.user) {
                setSupabaseUser(currentSession.user);
                await fetchUserProfile(currentSession.user);
            } else {
                setSupabaseUser(null);
                setUserProfile(null);
                setIsLoading(false);
            }
        } catch (e) {
            console.error("AuthContext: Error checking session:", e);
        } finally {
            isFetchingProfile.current = null;
            console.log(`[${new Date().toISOString()}] AuthContext: checkSession completed.`);
            setIsLoading(false);
            isChecking.current = false;
        }
    };

    useEffect(() => {
        // Set up real-time listener for Auth State changes - runs ONCE
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log("AuthContext: Auth Event:", event);

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    // Skip SIGNED_IN if we already handled this user via INITIAL_SESSION
                    if (event === 'SIGNED_IN' && initialCheckDone.current && session) {
                        console.log("AuthContext: Skipping duplicate SIGNED_IN (already handled by INITIAL_SESSION)");
                        setIsLoading(false);
                        return;
                    }
                    setSession(currentSession);
                    if (currentSession?.user) {
                        setSupabaseUser(currentSession.user);
                        await fetchUserProfile(currentSession.user);
                    }
                    setIsLoading(false);
                } else if (event === 'SIGNED_OUT') {
                    setSupabaseUser(null);
                    setUserProfile(null);
                    setSession(null);
                    isFetchingProfile.current = null;
                    setIsLoading(false);
                    router.push('/login');
                } else if (event === 'INITIAL_SESSION') {
                    if (currentSession) {
                        setSession(currentSession);
                        if (currentSession.user) {
                            setSupabaseUser(currentSession.user);
                            await fetchUserProfile(currentSession.user);
                        }
                    } else {
                        // No session at all
                        setSession(null);
                        setSupabaseUser(null);
                        setUserProfile(null);
                    }
                    setIsLoading(false);
                    initialCheckDone.current = true;
                } else if (event === 'MFA_CHALLENGE_VERIFIED') {
                    // MFA was just verified - update session and re-fetch profile with new aal2 level
                    console.log("AuthContext: MFA verified, updating profile...");
                    if (currentSession) {
                        setSession(currentSession);
                        if (currentSession.user) {
                            setSupabaseUser(currentSession.user);
                            await fetchUserProfile(currentSession.user);
                        }
                    } else {
                        // MFA verified but no session passed - re-fetch from Supabase
                        const { data: { session: freshSession } } = await supabase.auth.getSession();
                        if (freshSession) {
                            setSession(freshSession);
                            if (freshSession.user) {
                                setSupabaseUser(freshSession.user);
                                await fetchUserProfile(freshSession.user);
                            }
                        }
                    }
                    setIsLoading(false);
                } else {
                    // Unknown event - only update session if it's not null (don't wipe existing session)
                    if (currentSession) {
                        setSession(currentSession);
                    }
                    setIsLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run ONCE - onAuthStateChange handles all session updates

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

    const value = React.useMemo(() => ({
        isAuthenticated: !!session,
        isLoading,
        isMfaVerified: userProfile?.isMfaVerified || false,
        isMfaRequired: userProfile?.isMfaRequired || false,
        user: userProfile,
        supabaseUser,
        session,
        logout,
        checkSession,
    }), [session, isLoading, userProfile, supabaseUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
