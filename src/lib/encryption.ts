import CryptoJS from 'crypto-js';

// The key used for encryption/decryption
// Fallback to a default for development if env is not provided, 
// but it is highly recommended to set NEXT_PUBLIC_ENCRYPTION_KEY in .env
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default_secret_key_for_dev_only_change_in_prod';

/**
 * Encrypts a plain text string using AES-256
 * @param text The plain text to encrypt
 * @returns The encrypted ciphertext
 */
/**
 * Encrypts a plain text string using AES-256 (Synchronous)
 * @param text The plain text to encrypt
 * @returns The encrypted ciphertext
 */
export const encryptDataSync = (text: string | null | undefined): string => {
    if (!text) return '';
    try {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        return '';
    }
};

/**
 * Decrypts an AES-256 ciphertext back to plain text (Synchronous)
 * @param ciphertext The encrypted text to decrypt
 * @returns The decrypted plain text
 */
export const decryptDataSync = (ciphertext: string | null | undefined): string => {
    if (!ciphertext) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || '';
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
};

// --- Web Crypto API implementations for AuthContext ---

export async function generateKey(pin: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    const salt = encoder.encode("fixed-salt-for-pin-app");

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoder.encode(data)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv, 0);
    result.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode.apply(null, result as unknown as number[]));
}

export async function decryptData<T = string>(ciphertext: string, key: CryptoKey): Promise<T> {
    const binaryString = atob(ciphertext);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    const decoder = new TextDecoder();
    const resultString = decoder.decode(decrypted);

    // Try to parse as JSON if T is an object, otherwise return as string
    try {
        return JSON.parse(resultString) as T;
    } catch {
        return resultString as unknown as T;
    }
}

