import prisma from '../config/prisma.js';

const roleMenuSelect = {
  role_menu_id: true,
  role_id: true,
  menu_id: true,
  role: { select: { role_id: true, role_code: true, role_name: true } },
  menu: { select: { menu_id: true, menu_name: true, menu_sequence: true } },
};

export const getAll = async (_req, res, next) => {
  try {
    const data = await prisma.roleMenu.findMany({
      select: roleMenuSelect,
      orderBy: [{ role_id: 'asc' }, { menu_id: 'asc' }],
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getByRole = async (req, res, next) => {
  try {
    const roleId = Number(req.params.roleId);
    if (!Number.isInteger(roleId) || roleId <= 0) {
      return res.status(400).json({ success: false, message: 'roleId tidak valid' });
    }

    const role = await prisma.role.findUnique({
      where: { role_id: roleId },
      select: { role_id: true, role_code: true, role_name: true },
    });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });
    }

    const assignments = await prisma.roleMenu.findMany({
      where: { role_id: roleId },
      select: roleMenuSelect,
      orderBy: [{ menu: { menu_sequence: 'asc' } }, { menu_id: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: {
        role,
        assignments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { role_id, menu_id } = req.body;
    const role = await prisma.role.findUnique({ where: { role_id: Number(role_id) } });
    if (!role) return res.status(400).json({ success: false, message: 'role_id tidak valid' });
    const menu = await prisma.menu.findUnique({ where: { menu_id: Number(menu_id) } });
    if (!menu) return res.status(400).json({ success: false, message: 'menu_id tidak valid' });

    const duplicate = await prisma.roleMenu.findFirst({ where: { role_id: Number(role_id), menu_id: Number(menu_id) } });
    if (duplicate) return res.status(409).json({ success: false, message: 'Role menu sudah terdaftar' });

    const data = await prisma.roleMenu.create({
      data: { role_id: Number(role_id), menu_id: Number(menu_id) },
      select: roleMenuSelect,
    });
    res.status(201).json({ success: true, message: 'Role menu berhasil ditambahkan', data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.roleMenu.findUnique({ where: { role_menu_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Role menu tidak ditemukan' });
    await prisma.roleMenu.delete({ where: { role_menu_id: id } });
    res.status(200).json({ success: true, message: 'Role menu berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
