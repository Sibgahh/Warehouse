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
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
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
  const token = localStorage.getItem('token');
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Cek apakah JWT sudah expired berdasarkan field `exp` di payload.
 *
 * @param {string} token - JWT string
 * @returns {boolean} true kalau expired atau invalid, false kalau masih berlaku
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  // exp adalah Unix timestamp dalam detik; Date.now() dalam milidetik
  return Date.now() >= payload.exp * 1000;
}
