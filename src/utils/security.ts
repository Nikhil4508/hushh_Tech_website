export const DEFAULT_AUTH_REDIRECT = "/hushh-user-profile";


async function getEncryptionKey() {
  const envKey = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENCRYPTION_KEY) || 
    (typeof process !== 'undefined' && process.env?.VITE_ENCRYPTION_KEY) ||
    (typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY);

  if (!envKey || envKey.length !== 32) {
    throw new Error("A 32-character ENCRYPTION_KEY (or VITE_ENCRYPTION_KEY) must be set as an environment variable.");
  }
  const encoder = new TextEncoder();
  const keyData = encoder.encode(envKey);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string using AES-GCM.
 * Returns a base64-encoded string containing the IV and ciphertext.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedPlaintext
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts a base64-encoded string (IV + ciphertext) using AES-GCM.
 */
export async function decrypt(combinedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  const binaryString = atob(combinedBase64);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Only allow same-origin, app-internal redirects.
 * External URLs, protocol-relative URLs, and malformed values fall back.
 */
export function sanitizeInternalRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
): string {
  if (!value) return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(candidate, "https://hushh.local");
    if (url.origin !== "https://hushh.local") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}
