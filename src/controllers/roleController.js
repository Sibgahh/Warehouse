import prisma from '../config/prisma.js';

export const getAll = async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      select: {
        role_id: true,
        role_code: true,
        role_name: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { role_id: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const role = await prisma.role.findUnique({
      where: { role_id: id },
      include: { _count: { select: { users: true, role_menus: true, role_submenus: true } } },
    });
    if (!role) return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { role_code, role_name, is_active } = req.body;
    const codeExists = await prisma.role.findUnique({ where: { role_code } });
    if (codeExists) return res.status(409).json({ success: false, message: 'Role code sudah terdaftar' });

    const role = await prisma.role.create({
      data: { role_code, role_name, is_active: Boolean(is_active) },
    });
    res.status(201).json({ success: true, message: 'Role berhasil ditambahkan', data: role });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.role.findUnique({ where: { role_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });

    const { role_code, role_name, is_active } = req.body;
    if (role_code && role_code !== existing.role_code) {
      const dupCode = await prisma.role.findFirst({ where: { role_code, role_id: { not: id } } });
      if (dupCode) return res.status(409).json({ success: false, message: 'Role code sudah terdaftar' });
    }

    const role = await prisma.role.update({
      where: { role_id: id },
      data: {
        ...(role_code !== undefined && { role_code }),
        ...(role_name !== undefined && { role_name }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
    });
    res.status(200).json({ success: true, message: 'Role berhasil diperbarui', data: role });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.role.findUnique({
      where: { role_id: id },
      include: { _count: { select: { users: true, role_menus: true, role_submenus: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });
    if (existing._count.users > 0) {
      return res.status(400).json({ success: false, message: `Role masih dipakai oleh ${existing._count.users} user` });
    }
    if (existing._count.role_menus > 0 || existing._count.role_submenus > 0) {
      return res.status(400).json({
        success: false,
        message: 'Role masih punya assignment menu/submenu. Hapus assignment dulu.',
      });
    }
    await prisma.role.delete({ where: { role_id: id } });
    res.status(200).json({ success: true, message: 'Role berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
