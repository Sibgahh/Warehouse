import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * Register - Buat user baru
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { user_name, full_name, password, role_id } = req.body;

    // ─── Validasi input ───
    if (!user_name || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'user_name, password, dan role_id wajib diisi',
      });
    }

    // ─── Cek apakah username sudah ada ───
    const existingUser = await prisma.user.findFirst({
      where: { user_name },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah terdaftar',
      });
    }

    // ─── Cek apakah role_id valid ───
    const role = await prisma.role.findUnique({
      where: { role_id: Number(role_id) },
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'role_id tidak valid',
      });
    }

    // ─── Hash password ───
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ─── Simpan user baru ───
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

    console.log(`[AUTH] User registered: ${user_name} (role: ${role.role_name})`);

    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login - Autentikasi user & generate JWT
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { user_name, password } = req.body;

    // ─── Validasi input ───
    if (!user_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'user_name dan password wajib diisi',
      });
    }

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
        message: 'Username atau password salah',
      });
    }

    // ─── Cek apakah user aktif ───
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Akun tidak aktif. Hubungi admin.',
      });
    }

    // ─── Validasi password ───
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah',
      });
    }

    // ─── Generate JWT ───
    const payload = {
      user_id: user.user_id,
      role_id: user.role_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // ─── Update status is_login ───
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { is_login: true },
    });

    console.log(`[AUTH] User logged in: ${user.user_name} (role: ${user.role.role_name})`);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          full_name: user.full_name,
          role_id: user.role_id,
          role: user.role,
        },
        token,
        expires_in: '1d',
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
        message: 'User tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data user berhasil diambil',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
