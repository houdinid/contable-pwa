"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { generateKey, encryptData, decryptData } from "@/lib/encryption";
import { useRouter } from "next/navigation";

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (pin: string) => Promise<boolean>;
    register: (pin: string) => Promise<void>;
    logout: () => void;
    encryptionKey: CryptoKey | null;
    hasPin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    login: async () => false,
    register: async () => { },
    logout: () => { },
    encryptionKey: null,
    hasPin: false,
});

const PIN_CHECK_KEY = "auth_check"; // Key in localStorage to store encrypted verification string

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPin, setHasPin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if a PIN is already set (by checking if the check value exists)
        const storedCheck = localStorage.getItem(PIN_CHECK_KEY);
        setHasPin(!!storedCheck);
        setIsLoading(false);
    }, []);

    const login = async (pin: string): Promise<boolean> => {
        try {
            const key = await generateKey(pin);
            const storedCheck = localStorage.getItem(PIN_CHECK_KEY);

            if (!storedCheck) return false;

            // Try to decrypt the check value
            const decrypted = await decryptData<string>(storedCheck, key);

            if (decrypted === "valid-pin") {
                setEncryptionKey(key);
                setIsAuthenticated(true);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Login failed", e);
            return false;
        }
    };

    const register = async (pin: string) => {
        try {
            const key = await generateKey(pin);
            const encryptedCheck = await encryptData("valid-pin", key); // "valid-pin" is the secret token
            localStorage.setItem(PIN_CHECK_KEY, encryptedCheck);
            setEncryptionKey(key);
            setIsAuthenticated(true);
            setHasPin(true);
            router.push("/dashboard");
        } catch (e) {
            console.error("Registration failed", e);
            throw e;
        }
    };

    const logout = () => {
        setEncryptionKey(null);
        setIsAuthenticated(false);
        router.push("/");
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                login,
                register,
                logout,
                encryptionKey,
                hasPin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
