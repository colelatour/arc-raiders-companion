// Using a simple hash for demonstration. 
// For production, consider a more robust solution like Argon2 or PBKDF2 if available in the environment.

/**
 * Hashes a password using SHA-256.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} The hex-encoded hash.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Compares a password with a hash.
 * @param {string} password The password to compare.
 * @param {string} hash The hash to compare against.
 * @returns {Promise<boolean>} True if the password matches the hash.
 */
export async function comparePassword(password, hash) {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}
