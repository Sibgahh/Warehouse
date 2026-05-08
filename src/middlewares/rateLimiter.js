import rateLimit from 'express-rate-limit';

/**
 * Rate limiter untuk endpoint autentikasi.
 *
 * Login  — max 10 percobaan per IP per 15 menit.
 * Register — max 5 percobaan per IP per 15 menit.
 *
 * Catatan: Di environment production, gunakan Redis/IP tracking store
 * supaya rate limit tidak reset saat server restart. Contoh:
 *   import RedisStore from 'rate-limit-redis';
 *   store: new RedisStore({ client: redisClient })
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,                   // max 10 request per IP per window
  standardHeaders: true,      // kirim RateLimit-* headers
  legacyHeaders: false,

  // Skip jika IP adalah trusted (misal: internal network / localhost)
  skip: (req) => {
    const trusted = ['::ffff:127.0.0.1', '::1', '127.0.0.1'];
    return trusted.includes(req.ip);
  },

  // Custom response saat limit exceeded
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    retryAfter: '15 menit',
  },

  // Key berdasarkan IP saja (tidak kombinasi IP + user_name
  // supaya brute-force per username tetap terdeteksi per IP)
  keyGenerator: (req) => req.ip,
});

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,                    // max 5 registrasi per IP per window
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => {
    const trusted = ['::ffff:127.0.0.1', '::1', '127.0.0.1'];
    return trusted.includes(req.ip);
  },

  message: {
    success: false,
    message: 'Terlalu banyak percobaan registrasi. Hubungi admin jika ini kesalahan.',
    retryAfter: '15 menit',
  },

  keyGenerator: (req) => req.ip,
});