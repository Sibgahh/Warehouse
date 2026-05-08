import prisma from '../config/prisma.js';

const roleSubmenuSelect = {
  role_submenu_id: true,
  role_id: true,
  submenu_id: true,
  role: { select: { role_id: true, role_code: true, role_name: true } },
  submenu: {
    select: {
      submenu_id: true,
      submenu_name: true,
      submenu_sequence: true,
      menu: { select: { menu_name: true } },
    },
  },
};

export const getAll = async (_req, res, next) => {
  try {
    const data = await prisma.roleSubmenu.findMany({
      select: roleSubmenuSelect,
      orderBy: [{ role_id: 'asc' }, { submenu_id: 'asc' }],
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { role_id, submenu_id } = req.body;
    const role = await prisma.role.findUnique({ where: { role_id: Number(role_id) } });
    if (!role) return res.status(400).json({ success: false, message: 'role_id tidak valid' });
    const submenu = await prisma.submenu.findUnique({ where: { submenu_id: Number(submenu_id) } });
    if (!submenu) return res.status(400).json({ success: false, message: 'submenu_id tidak valid' });

    const duplicate = await prisma.roleSubmenu.findFirst({
      where: { role_id: Number(role_id), submenu_id: Number(submenu_id) },
    });
    if (duplicate) return res.status(409).json({ success: false, message: 'Role submenu sudah terdaftar' });

    const data = await prisma.roleSubmenu.create({
      data: { role_id: Number(role_id), submenu_id: Number(submenu_id) },
      select: roleSubmenuSelect,
    });
    res.status(201).json({ success: true, message: 'Role submenu berhasil ditambahkan', data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.roleSubmenu.findUnique({ where: { role_submenu_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Role submenu tidak ditemukan' });
    await prisma.roleSubmenu.delete({ where: { role_submenu_id: id } });
    res.status(200).json({ success: true, message: 'Role submenu berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
