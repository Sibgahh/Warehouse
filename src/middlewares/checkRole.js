import prisma from '../config/prisma.js';

/**
 * Middleware: checkRole
 * Role-based access control
 * Mengecek apakah user memiliki role yang diizinkan
 *
 * @param {string[]} allowedRoles - Array role_code yang diizinkan, contoh: ['admin', 'manager']
 *
 * Penggunaan:
 *   router.get('/admin-only', verifyToken, checkRole(['admin']), controller);
 *   router.get('/multi-role', verifyToken, checkRole(['admin', 'manager']), controller);
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

      // ─── Ambil role_code dari database ───
      const role = await prisma.role.findUnique({
        where: { role_id: req.user.role_id },
        select: { role_code: true, role_name: true },
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Role tidak ditemukan.',
        });
      }

      // ─── Cek apakah role_code termasuk dalam allowedRoles ───
      const roleCode = role.role_code.toLowerCase();
      const allowed = allowedRoles.map((r) => r.toLowerCase());

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
