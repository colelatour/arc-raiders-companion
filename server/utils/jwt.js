export const base64UrlEncode = (input) => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const base64UrlDecodeToUint8 = (b64url) => {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad === 2) b64 += '==';
  else if (pad === 3) b64 += '=';
  else if (pad !== 0) throw new Error('Invalid base64 string');
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
};

export const base64UrlDecode = (b64url) => {
  const bytes = base64UrlDecodeToUint8(b64url);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};

const importHmacKey = async (secret) => {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

export async function sign(payload = {}, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encoder = new TextEncoder();
  const headerB = encoder.encode(JSON.stringify(header));
  const payloadB = encoder.encode(JSON.stringify(payload));
  const encodedHeader = base64UrlEncode(headerB);
  const encodedPayload = base64UrlEncode(payloadB);
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${data}.${encodedSignature}`;
}

export async function verify(token, secret) {
  if (!token) throw new Error('No token provided');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const signatureBytes = base64UrlDecodeToUint8(encodedSignature);
  const encoder = new TextEncoder();
  const verified = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(data));
  if (!verified) throw new Error('Invalid signature');
  const payloadJson = base64UrlDecode(encodedPayload);
  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch (e) {
    throw new Error('Invalid payload');
  }
  if (payload.exp && typeof payload.exp === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) throw new Error('Token expired');
  }
  return payload;
}