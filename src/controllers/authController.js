import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const createUser = async ({ user_name, full_name, password, role_id }) => {
  const existingUser = await prisma.user.findFirst({
    where: { user_name },
  });

  if (existingUser) {
    return {
      ok: false,
      status: 409,
      payload: {
        success: false,
        message: "Username sudah terdaftar",
      },
    };
  }

  const role = await prisma.role.findUnique({
    where: { role_id: Number(role_id) },
  });

  if (!role) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: "role_id tidak valid",
      },
    };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      user_name,
      full_name: full_name || user_name,
      password: hashedPassword,
      role_id: Number(role_id),
      is_active: true,
    },
    select: {
      user_id: true,
      user_name: true,
      full_name: true,
      role_id: true,
      is_active: true,
      created_at: true,
      role: {
        select: {
          role_code: true,
          role_name: true,
        },
      },
    },
  });

  return { ok: true, role, newUser };
};

/**
 * Register - Buat user baru
 * POST /api/auth/register
 *
 * NOTE: Input sudah divalidasi Zod di middleware (registerSchema).
 * req.body sudah berisi data yang sudah di-parse & transformed.
 * Di controller ini hanya cek DUPLIKAT & role validity (business logic).
 */
export const register = async (req, res, next) => {
  try {
    const { user_name, full_name, password, role_id } = req.body;
    const result = await createUser({ user_name, full_name, password, role_id });
    if (!result.ok) {
      return res.status(result.status).json(result.payload);
    }

    console.log(
      `[AUTH] User registered: ${user_name} (role: ${result.role.role_name})`,
    );

    res.status(201).json({
      success: true,
      message: "User berhasil didaftarkan",
      data: result.newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public register - Daftar akun dari halaman login
 * POST /api/auth/register-public
 *
 * Semua akun dari endpoint ini wajib role STAFF.
 */
export const registerPublic = async (req, res, next) => {
  try {
    const { user_name, full_name, password } = req.body;
    const staffRole = await prisma.role.findFirst({
      where: { role_code: "STAFF" },
      select: { role_id: true },
    });

    if (!staffRole) {
      return res.status(500).json({
        success: false,
        message: "Role STAFF belum dikonfigurasi",
      });
    }

    const result = await createUser({
      user_name,
      full_name,
      password,
      role_id: staffRole.role_id,
    });
    if (!result.ok) {
      return res.status(result.status).json(result.payload);
    }

    console.log(
      `[AUTH] Public register: ${user_name} (role: ${result.role.role_name})`,
    );

    res.status(201).json({
      success: true,
      message: "Akun berhasil dibuat. Silakan login.",
      data: result.newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login - Autentikasi user & generate JWT
 * POST /api/auth/login
 *
 * NOTE: Input sudah divalidasi Zod di middleware (loginSchema).
 */
export const login = async (req, res, next) => {
  try {
    const { user_name, password } = req.body;

    // ─── Cari user berdasarkan username ───
    const user = await prisma.user.findFirst({
      where: { user_name },
      include: {
        role: {
          select: {
            role_code: true,
            role_name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // ─── Cek apakah user aktif ───
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Akun tidak aktif. Hubungi admin.",
      });
    }

    // ─── Validasi password ───
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // ─── Generate JWT ───
    // Include role_code di payload supaya checkRole tidak perlu query DB
    const payload = {
      user_id: user.user_id,
      role_id: user.role_id,
      role_code: user.role.role_code,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // ─── Update status is_login ───
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { is_login: true },
    });

    console.log(
      `[AUTH] User logged in: ${user.user_name} (role: ${user.role.role_name})`,
    );

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          full_name: user.full_name,
          role_id: user.role_id,
          role: user.role,
        },
        token,
        expires_in: "1d",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Profile - Ambil data user yang sedang login
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: {
        user_id: true,
        user_name: true,
        full_name: true,
        role_id: true,
        is_active: true,
        created_at: true,
        role: {
          select: {
            role_code: true,
            role_name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Menus - Ambil menu/submenu sesuai role user login
 * GET /api/auth/my-menus
 */
export const getMyMenus = async (req, res, next) => {
  try {
    const roleId = Number(req.user.role_id);

    const roleMenus = await prisma.roleMenu.findMany({
      where: { role_id: roleId },
      select: {
        menu: {
          select: {
            menu_id: true,
            menu_sequence: true,
            menu_name: true,
            menu_icon: true,
            menu_link: true,
            is_active: true,
          },
        },
      },
      orderBy: { menu: { menu_sequence: "asc" } },
    });

    const roleSubmenus = await prisma.roleSubmenu.findMany({
      where: { role_id: roleId },
      select: {
        submenu: {
          select: {
            submenu_id: true,
            menu_id: true,
            submenu_sequence: true,
            submenu_name: true,
            submenu_icon: true,
            submenu_link: true,
            is_active: true,
          },
        },
      },
      orderBy: { submenu: { submenu_sequence: "asc" } },
    });

    const submenuByMenuId = roleSubmenus.reduce((acc, row) => {
      const submenu = row.submenu;
      if (!submenu || !submenu.is_active) return acc;
      if (!acc[submenu.menu_id]) acc[submenu.menu_id] = [];
      acc[submenu.menu_id].push({
        submenu_id: submenu.submenu_id,
        submenu_sequence: submenu.submenu_sequence,
        submenu_name: submenu.submenu_name,
        submenu_icon: submenu.submenu_icon,
        submenu_link: submenu.submenu_link,
      });
      return acc;
    }, {});

    const menus = roleMenus
      .map((row) => row.menu)
      .filter((menu) => menu?.is_active)
      .map((menu) => ({
        menu_id: menu.menu_id,
        menu_sequence: menu.menu_sequence,
        menu_name: menu.menu_name,
        menu_icon: menu.menu_icon,
        menu_link: menu.menu_link,
        submenus: (submenuByMenuId[menu.menu_id] || []).sort((a, b) =>
          String(a.submenu_sequence).localeCompare(String(b.submenu_sequence))
        ),
      }));

    res.status(200).json({
      success: true,
      message: "Menu user berhasil diambil",
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout - Reset is_login = false & invalidasi token
 * POST /api/auth/logout
 *
 * NOTE: JWT bersifat stateless — tidak bisa di-"revoke" langsung dari server.
 * Untuk token invalidasi instan, gunakan JWT blacklist (Redis/set) atau
 * короткоживущий access token + refresh token.
 * Di sini kita minimal reset is_login + catat di audit log.
 */
export const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: { is_login: false },
    });

    console.log(`[AUTH] User logged out: user_id:${req.user.user_id}`);

    res.status(200).json({
      success: true,
      message: "Logout berhasil. Token tidak lagi valid setelah expiry.",
    });
  } catch (error) {
    next(error);
  }
};
