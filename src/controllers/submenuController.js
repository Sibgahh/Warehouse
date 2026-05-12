import prisma from '../config/prisma.js';

const submenuSelect = {
  submenu_id: true,
  menu_id: true,
  submenu_sequence: true,
  submenu_name: true,
  submenu_icon: true,
  submenu_link: true,
  is_active: true,
  menu: { select: { menu_id: true, menu_name: true } },
};

// Format sequence sebagai 3-digit padded string supaya string-sort konsisten
// dengan numeric sort. Cukup untuk 999 submenu per menu.
const formatSeq = (n) => String(n).padStart(3, '0');

export const getAll = async (req, res, next) => {
  try {
    const { search, menu_id, is_active } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { submenu_name: { contains: search } },
        { submenu_sequence: { contains: search } },
      ];
    }
    if (menu_id) where.menu_id = Number(menu_id);
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const submenus = await prisma.submenu.findMany({
      where,
      select: submenuSelect,
      orderBy: [{ menu_id: 'asc' }, { submenu_sequence: 'asc' }, { submenu_id: 'asc' }],
    });
    res.status(200).json({ success: true, data: submenus });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const submenu = await prisma.submenu.findUnique({
      where: { submenu_id: Number(req.params.id) },
      select: submenuSelect,
    });
    if (!submenu) return res.status(404).json({ success: false, message: 'Submenu tidak ditemukan' });
    res.status(200).json({ success: true, data: submenu });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { menu_id, submenu_sequence, submenu_name, submenu_icon, submenu_link, is_active } = req.body;
    const menuIdNum = Number(menu_id);
    const menu = await prisma.menu.findUnique({ where: { menu_id: menuIdNum } });
    if (!menu) return res.status(400).json({ success: false, message: 'menu_id tidak valid' });

    // Auto-generate sequence scoped per menu_id kalau client tidak supply.
    let nextSequence = submenu_sequence;
    if (!nextSequence) {
      const last = await prisma.submenu.findFirst({
        where: { menu_id: menuIdNum },
        orderBy: { submenu_sequence: 'desc' },
        select: { submenu_sequence: true },
      });
      const lastNum = last ? Number(last.submenu_sequence) || 0 : 0;
      nextSequence = formatSeq(lastNum + 10);
    }

    const duplicate = await prisma.submenu.findFirst({ where: { menu_id: menuIdNum, submenu_sequence: nextSequence, submenu_name } });
    if (duplicate) return res.status(409).json({ success: false, message: 'Kombinasi menu + sequence + submenu sudah digunakan' });

    const submenu = await prisma.submenu.create({
      data: {
        menu_id: menuIdNum,
        submenu_sequence: nextSequence,
        submenu_name,
        submenu_icon: submenu_icon || null,
        submenu_link: submenu_link || '#',
        is_active: is_active === undefined ? true : Boolean(is_active),
      },
      select: submenuSelect,
    });
    res.status(201).json({ success: true, message: 'Submenu berhasil ditambahkan', data: submenu });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/submenus/reorder
 * Body: { menu_id, items: [submenu_id, submenu_id, ...] }
 *
 * Re-assign submenu_sequence sesuai urutan array (per menu_id scope).
 * Hanya update yang menu_id-nya cocok untuk safety.
 */
export const reorder = async (req, res, next) => {
  try {
    const { menu_id, items } = req.body;
    const menuIdNum = Number(menu_id);

    await prisma.$transaction(
      items.map((submenuId, idx) =>
        prisma.submenu.updateMany({
          where: { submenu_id: submenuId, menu_id: menuIdNum },
          data: { submenu_sequence: formatSeq((idx + 1) * 10) },
        })
      )
    );

    const submenus = await prisma.submenu.findMany({
      where: { menu_id: menuIdNum },
      select: submenuSelect,
      orderBy: [{ submenu_sequence: 'asc' }, { submenu_id: 'asc' }],
    });
    res.status(200).json({ success: true, message: 'Urutan submenu berhasil diperbarui', data: submenus });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.submenu.findUnique({ where: { submenu_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Submenu tidak ditemukan' });

    const { menu_id, submenu_sequence, submenu_name, submenu_icon, submenu_link, is_active } = req.body;
    const nextMenuId = menu_id !== undefined ? Number(menu_id) : existing.menu_id;
    if (menu_id !== undefined) {
      const menu = await prisma.menu.findUnique({ where: { menu_id: nextMenuId } });
      if (!menu) return res.status(400).json({ success: false, message: 'menu_id tidak valid' });
    }

    const nextSequence = submenu_sequence ?? existing.submenu_sequence;
    const nextName = submenu_name ?? existing.submenu_name;
    if (nextMenuId !== existing.menu_id || nextSequence !== existing.submenu_sequence || nextName !== existing.submenu_name) {
      const duplicate = await prisma.submenu.findFirst({
        where: { menu_id: nextMenuId, submenu_sequence: nextSequence, submenu_name: nextName, submenu_id: { not: id } },
      });
      if (duplicate) return res.status(409).json({ success: false, message: 'Kombinasi menu + sequence + submenu sudah digunakan' });
    }

    const submenu = await prisma.submenu.update({
      where: { submenu_id: id },
      data: {
        ...(menu_id !== undefined && { menu_id: nextMenuId }),
        ...(submenu_sequence !== undefined && { submenu_sequence }),
        ...(submenu_name !== undefined && { submenu_name }),
        ...(submenu_icon !== undefined && { submenu_icon: submenu_icon || null }),
        ...(submenu_link !== undefined && { submenu_link: submenu_link || '#' }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      },
      select: submenuSelect,
    });
    res.status(200).json({ success: true, message: 'Submenu berhasil diperbarui', data: submenu });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.submenu.findUnique({
      where: { submenu_id: id },
      include: { _count: { select: { role_submenus: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Submenu tidak ditemukan' });
    if (existing._count.role_submenus > 0) {
      return res.status(400).json({ success: false, message: `Submenu tidak bisa dihapus karena masih dipakai di ${existing._count.role_submenus} role submenu` });
    }

    await prisma.submenu.delete({ where: { submenu_id: id } });
    res.status(200).json({ success: true, message: 'Submenu berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
