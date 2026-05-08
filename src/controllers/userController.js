import prisma from '../config/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, role_id, is_active, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { user_name: { contains: search } },
        { full_name: { contains: search } },
      ];
    }
    if (role_id) {
      where.role_id = Number(role_id);
    }
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          user_id: true,
          user_name: true,
          full_name: true,
          role_id: true,
          is_active: true,
          is_login: true,
          created_at: true,
          role: {
            select: {
              role_id: true,
              role_code: true,
              role_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { user_id: Number(id) },
      select: {
        user_id: true,
        user_name: true,
        full_name: true,
        role_id: true,
        is_active: true,
        created_at: true,
        role: { select: { role_id: true, role_code: true, role_name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, role_id, is_active } = req.body;
    const targetUserId = Number(id);

    if (targetUserId === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'Tidak bisa mengubah akun sendiri' });
    }

    const existing = await prisma.user.findUnique({ where: { user_id: targetUserId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (role_id !== undefined) {
      const role = await prisma.role.findUnique({ where: { role_id: Number(role_id) } });
      if (!role) {
        return res.status(400).json({ success: false, message: 'role_id tidak valid' });
      }
    }

    if (req.body.user_name && req.body.user_name !== existing.user_name) {
      const dup = await prisma.user.findFirst({
        where: { user_name: req.body.user_name, user_id: { not: targetUserId } },
      });
      if (dup) {
        return res.status(409).json({ success: false, message: 'Username sudah terdaftar' });
      }
    }

    const user = await prisma.user.update({
      where: { user_id: targetUserId },
      data: {
        ...(full_name !== undefined && { full_name }),
        ...(role_id !== undefined && { role_id: Number(role_id) }),
        ...(is_active !== undefined && { is_active }),
      },
      select: {
        user_id: true,
        user_name: true,
        full_name: true,
        role_id: true,
        is_active: true,
        created_at: true,
        role: { select: { role_id: true, role_code: true, role_name: true } },
      },
    });

    console.log(`[USER] Updated: ${user.user_name} by user_id:${req.user.user_id}`);

    res.status(200).json({ success: true, message: 'User berhasil diperbarui', data: user });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const existing = await prisma.user.findUnique({ where: { user_id: numId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (existing.user_id === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'Tidak bisa menonaktifkan akun sendiri' });
    }

    // Soft delete: set is_active = false (bukan hard delete)
    // Ini aman karena tidak melanggar FK constraint dan data audit/order tetap utuh
    await prisma.user.update({
      where: { user_id: numId },
      data: { is_active: false },
    });

    console.log(`[USER] Deactivated: ${existing.user_name} by user_id:${req.user.user_id}`);

    res.status(200).json({ success: true, message: 'User berhasil dinonaktifkan' });
  } catch (error) {
    next(error);
  }
};
