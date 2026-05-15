const ITERATIONS = 100_000
const SALT_PREFIX = 'krypted-v1:'
const SESSION_KEY = 'vk'

export async function deriveKey(masterPassword, email) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(masterPassword),
        'PBKDF2',
        false,
        ['deriveKey']
    )
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new TextEncoder().encode(SALT_PREFIX + email.toLowerCase()),
            iterations: ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    )
}

export async function encryptField(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ct = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
    )
    const buf = new Uint8Array(12 + ct.byteLength)
    buf.set(iv)
    buf.set(new Uint8Array(ct), 12)
    return btoa(String.fromCharCode(...buf))
}

export async function decryptField(key, b64) {
    const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: buf.slice(0, 12) },
        key,
        buf.slice(12)
    )
    return new TextDecoder().decode(plaintext)
}

export async function saveKeyToSession(key) {
    const raw = await crypto.subtle.exportKey('raw', key)
    sessionStorage.setItem(SESSION_KEY, btoa(String.fromCharCode(...new Uint8Array(raw))))
}

export async function loadKeyFromSession() {
    const b64 = sessionStorage.getItem(SESSION_KEY)
    if (!b64) return null
    try {
        const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        return await crypto.subtle.importKey(
            'raw',
            raw,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        )
    } catch {
        return null
    }
}

export function clearKeyFromSession() {
    sessionStorage.removeItem(SESSION_KEY)
}
