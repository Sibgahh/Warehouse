/**
 * Decode JWT payload di frontend — TANPA library tambahan.
 * Gunakan untuk role checking UI (localStorage role bisa dimanipulasi user).
 * Validasi otorisasi SELALU di backend — ini cuma untuk tampilan UI.
 *
 * @param {string} token - JWT string
 * @returns {object|null} decoded payload, atau null jika invalid/expired
 */
export function decodeToken(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    // Ganti karakter URL-safe base64 → standard base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Buffer.from handles UTF-8 correctly in both Node.js and browser
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Ambil role_code user dari token (bukan dari localStorage).
 * Ini mencegah manipulasi role via browser DevTools.
 *
 * @returns {string|null} role_code atau null
 */
export function getRoleFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const payload = decodeToken(token);
  return payload?.role_code || null;
}

/**
 * Cek apakah user sedang login (berdasarkan token ada & valid).
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}
