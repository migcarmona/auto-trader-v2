const ALG = "AES-GCM";
const KEY_LEN = 256;

function getSecret(): string {
  const s = process.env.ENCRYPTION_SECRET;
  if (!s || s.length < 32) throw new Error("ENCRYPTION_SECRET must be at least 32 chars");
  return s;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(secret.slice(0, 32)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("astrax-salt-v1"), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: ALG, length: KEY_LEN },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await deriveKey(getSecret());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: ALG, iv }, key, enc.encode(plaintext));
  const buf = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ciphertext), iv.byteLength);
  return Buffer.from(buf).toString("base64");
}

export async function decrypt(encoded: string): Promise<string> {
  const key = await deriveKey(getSecret());
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, 12);
  const ciphertext = buf.subarray(12);
  const plaintext = await crypto.subtle.decrypt({ name: ALG, iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
