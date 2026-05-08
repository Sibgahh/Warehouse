import prisma from '../config/prisma.js';

/**
 * Middleware: checkRole
 * Role-based access control
 *
 * SECURITY OPTIMIZATION: role_code sudah ada di JWT payload (decode di verifyToken).
 * Tidak perlu query database untuk setiap request — cukup bandingkan dari token.
 *
 * Hanya fallback ke DB lookup jika role_code tidak ada di token (legacy token).
 *
 * @param {string[]} allowedRoles - Array role_code yang diizinkan, contoh: ['ADMIN', 'MANAGER']
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // ─── Pastikan verifyToken sudah dijalankan ───
      if (!req.user || !req.user.role_id) {
        return res.status(401).json({
          success: false,
          message: 'Akses ditolak. Autentikasi diperlukan.',
        });
      }

      const allowed = allowedRoles.map((r) => r.toLowerCase());

      // ─── Cek role dari JWT payload (tanpa DB query) ───
      const roleCodeFromToken = req.user.role_code;
      if (roleCodeFromToken) {
        const roleCode = roleCodeFromToken.toLowerCase();
        if (allowed.includes(roleCode)) {
          req.user.role_name = roleCodeFromToken;
          return next();
        }

        // Role pada token bisa stale setelah perubahan role user.
        // Verifikasi ulang ke DB agar akses mengikuti role terbaru.
        console.warn(
          `[AUTH] Role mismatch token for user_id:${req.user.user_id}, token_role:${roleCodeFromToken} — checking latest role from DB`
        );
      } else {
        console.warn(
          `[AUTH] Legacy token detected for user_id:${req.user.user_id} — falling back to DB lookup`
        );
      }

      // ─── Fallback: ambil role terbaru dari DB ───
      const userWithRole = await prisma.user.findUnique({
        where: { user_id: req.user.user_id },
        select: {
          role: {
            select: { role_code: true, role_name: true },
          },
        },
      });
      const role = userWithRole?.role;
      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Role tidak ditemukan.',
        });
      }

      const roleCode = role.role_code.toLowerCase();

      if (!allowed.includes(roleCode)) {
        console.log(
          `[AUTH] Access denied for user_id: ${req.user.user_id}, role: ${role.role_name}, required: [${allowedRoles.join(', ')}]`
        );

        return res.status(403).json({
          success: false,
          message: `Akses ditolak. Role '${role.role_name}' tidak memiliki izin untuk akses ini.`,
        });
      }

      // ─── Simpan info role ke request ───
      req.user.role_code = role.role_code;
      req.user.role_name = role.role_name;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default checkRole;
