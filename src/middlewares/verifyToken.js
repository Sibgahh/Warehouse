import jwt from 'jsonwebtoken';

/**
 * Middleware: verifyToken
 * Memvalidasi JWT dari header Authorization: Bearer <token>
 * Jika valid, menyimpan payload ke req.user
 */
const verifyToken = (req, res, next) => {
  try {
    // ─── Ambil token dari header ───
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];

    // ─── Verifikasi token ───
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ─── Simpan payload ke request ───
    req.user = {
      user_id: decoded.user_id,
      role_id: decoded.role_id,
      role_code: decoded.role_code || null,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa. Silakan login ulang.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi token.',
    });
  }
};

export default verifyToken;
