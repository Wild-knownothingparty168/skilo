// Ed25519 signing utilities for skill verification
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SIGNING_KEY_FILE = join(homedir(), '.skilo', 'signing.key');
const SIGNING_PUB_FILE = join(homedir(), '.skilo', 'signing.pub');

interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

// Generate Ed25519 keypair using Web Crypto API
export async function generateKeyPair(): Promise<KeyPair> {
  // Note: Web Crypto API doesn't support Ed25519 directly in all environments
  // For Node.js 20+, we can use the built-in crypto module
  const { webcrypto } = await import('node:crypto');

  // Generate Ed25519 key pair
  const keyPair = await (webcrypto as any).generateKey('Ed25519', true, ['sign', 'verify']);

  // Export private key
  const privateKeyJwk = await (webcrypto as any).exportKey('jwk', keyPair.privateKey);
  const privateKey = base64UrlToUint8Array(privateKeyJwk.d);

  // Export public key
  const publicKeyJwk = await (webcrypto as any).exportKey('jwk', keyPair.publicKey);
  const publicKey = base64UrlToUint8Array(publicKeyJwk.x);

  return { publicKey, privateKey };
}

// Load or generate signing keys
export async function loadOrGenerateKeys(): Promise<KeyPair> {
  try {
    const privateKey = await readFile(SIGNING_KEY_FILE);
    const publicKey = await readFile(SIGNING_PUB_FILE);
    return {
      privateKey: new Uint8Array(privateKey),
      publicKey: new Uint8Array(publicKey),
    };
  } catch {
    // Generate new keys
    console.log('Generating new signing keys...');
    const keys = await generateKeyPair();

    // Save keys
    await mkdir(join(homedir(), '.skilo'), { recursive: true });
    await writeFile(SIGNING_KEY_FILE, keys.privateKey, { mode: 0o600 });
    await writeFile(SIGNING_PUB_FILE, keys.publicKey, { mode: 0o644 });

    console.log('Signing keys saved to ~/.skilo/');
    return keys;
  }
}

// Sign data with private key
export async function sign(data: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  const { webcrypto } = await import('node:crypto');

  // Import private key
  const privateKeyJwk = {
    crv: 'Ed25519',
    kty: 'OKP',
    d: uint8ArrayToBase64Url(privateKey),
    x: '', // Not needed for signing
  };

  const key = await (webcrypto as any).importKey(
    'jwk',
    privateKeyJwk,
    'Ed25519',
    false,
    ['sign']
  );

  const signature = await (webcrypto as any).sign('Ed25519', key, data);
  return new Uint8Array(signature);
}

// Verify signature with public key
export async function verify(
  data: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const { webcrypto } = await import('node:crypto');

    // Import public key
    const publicKeyJwk = {
      crv: 'Ed25519',
      kty: 'OKP',
      x: uint8ArrayToBase64Url(publicKey),
    };

    const key = await (webcrypto as any).importKey(
      'jwk',
      publicKeyJwk,
      'Ed25519',
      false,
      ['verify']
    );

    return await (webcrypto as any).verify('Ed25519', key, signature, data);
  } catch {
    return false;
  }
}

// Calculate SHA-256 checksum
export async function calculateChecksum(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper functions
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  const binary = String.fromCharCode(...arr);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Export for use in other modules
export { uint8ArrayToBase64Url as encodeBase64Url, base64UrlToUint8Array as decodeBase64Url };
