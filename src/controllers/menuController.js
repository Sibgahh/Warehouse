import prisma from '../config/prisma.js';

const menuSelect = {
  menu_id: true,
  menu_sequence: true,
  menu_name: true,
  menu_icon: true,
  menu_link: true,
  is_submenu: true,
  is_active: true,
};

export const getAll = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { menu_name: { contains: search } },
        { menu_sequence: { contains: search } },
      ];
    }
    if (is_active !== undefined) where.is_active = is_active === 'true';
    const menus = await prisma.menu.findMany({ where, select: menuSelect, orderBy: [{ menu_sequence: 'asc' }, { menu_id: 'asc' }] });
    res.status(200).json({ success: true, data: menus });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const menu = await prisma.menu.findUnique({
      where: { menu_id: Number(req.params.id) },
      select: { ...menuSelect, submenus: { select: { submenu_id: true, submenu_name: true, submenu_sequence: true, submenu_link: true, is_active: true } } },
    });
    if (!menu) return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    res.status(200).json({ success: true, data: menu });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { menu_sequence, menu_name, menu_icon, menu_link, is_submenu, is_active } = req.body;
    const duplicate = await prisma.menu.findFirst({ where: { menu_sequence, menu_name } });
    if (duplicate) return res.status(409).json({ success: false, message: 'Kombinasi menu_sequence + menu_name sudah digunakan' });

    const menu = await prisma.menu.create({
      data: {
        menu_sequence,
        menu_name,
        menu_icon: menu_icon || null,
        menu_link: menu_link || '#',
        is_submenu: Boolean(is_submenu),
        is_active: is_active === undefined ? true : Boolean(is_active),
      },
      select: menuSelect,
    });
    res.status(201).json({ success: true, message: 'Menu berhasil ditambahkan', data: menu });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.menu.findUnique({ where: { menu_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });

    const { menu_sequence, menu_name, menu_icon, menu_link, is_submenu, is_active } = req.body;
    const nextSequence = menu_sequence ?? existing.menu_sequence;
    const nextName = menu_name ?? existing.menu_name;
    if (nextSequence !== existing.menu_sequence || nextName !== existing.menu_name) {
      const duplicate = await prisma.menu.findFirst({ where: { menu_sequence: nextSequence, menu_name: nextName, menu_id: { not: id } } });
      if (duplicate) return res.status(409).json({ success: false, message: 'Kombinasi menu_sequence + menu_name sudah digunakan' });
    }

    const menu = await prisma.menu.update({
      where: { menu_id: id },
      data: {
        ...(menu_sequence !== undefined && { menu_sequence }),
        ...(menu_name !== undefined && { menu_name }),
        ...(menu_icon !== undefined && { menu_icon: menu_icon || null }),
        ...(menu_link !== undefined && { menu_link: menu_link || '#' }),
        ...(is_submenu !== undefined && { is_submenu: Boolean(is_submenu) }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      },
      select: menuSelect,
    });
    res.status(200).json({ success: true, message: 'Menu berhasil diperbarui', data: menu });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.menu.findUnique({
      where: { menu_id: id },
      include: { _count: { select: { submenus: true, role_menus: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    if (existing._count.submenus > 0 || existing._count.role_menus > 0) {
      return res.status(400).json({
        success: false,
        message: `Menu tidak bisa dihapus karena masih memiliki ${existing._count.submenus} submenu dan ${existing._count.role_menus} role menu`,
      });
    }

    await prisma.menu.delete({ where: { menu_id: id } });
    res.status(200).json({ success: true, message: 'Menu berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
