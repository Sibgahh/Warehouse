import { z } from 'zod';

/**
 * Validation schemas — Zod
 *
 * Semua schema di-export dan dipakai di controller via .safeParseAsync().
 * Menggunakan .safeParseAsync() (async) bukan .parse() agar bisa dipipe
 * ke middleware dengan pattern: req.body = await schema.parseAsync(req.body)
 */

// ─── Auth: Register ─────────────────────────────────────────────────────────
export const registerSchema = z.object({
  user_name: z
    .string({ required_error: 'user_name wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  full_name: z
    .string({ required_error: 'full_name wajib diisi' })
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(150, 'Nama lengkap maksimal 150 karakter')
    .trim(),
  password: z
    .string({ required_error: 'password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  role_id: z
    .string({ required_error: 'role_id wajib diisi' })
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, 'role_id harus angka positif'),
});

// ─── Auth: Login ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  user_name: z
    .string({ required_error: 'user_name wajib diisi' })
    .min(1, 'Username wajib diisi'),
  password: z
    .string({ required_error: 'password wajib diisi' })
    .min(1, 'Password wajib diisi'),
});

// ─── Item: Create ────────────────────────────────────────────────────────────
export const itemCreateSchema = z.object({
  item_name: z
    .string({ required_error: 'item_name wajib diisi' })
    .min(1, 'item_name tidak boleh kosong')
    .max(12, 'item_name maksimal 12 karakter')
    .trim(),
  description: z
    .string({ required_error: 'description wajib diisi' })
    .max(200, 'description maksimal 200 karakter')
    .trim(),
  status: z.enum(['A', 'I', 'C']).optional().default('A'),
  std_qty: z
    .string({ required_error: 'std_qty wajib diisi' })
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v), { message: 'std_qty harus angka' })
    .refine((v) => v >= 0, { message: 'std_qty tidak boleh negatif' }),
  min_stock: z
    .string()
    .optional()
    .transform((v) => (v !== undefined && v !== '' ? Number(v) : 0))
    .refine((v) => v >= 0, { message: 'min_stock tidak boleh negatif' }),
  max_stock: z
    .string({ required_error: 'max_stock wajib diisi' })
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v), { message: 'max_stock harus angka' })
    .refine((v) => v > 0, { message: 'max_stock harus lebih dari 0' }),
  unit_cost: z
    .string({ required_error: 'unit_cost wajib diisi' })
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, { message: 'unit_cost harus angka positif' }),
  unit_retail: z
    .string({ required_error: 'unit_retail wajib diisi' })
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, { message: 'unit_retail harus angka positif' }),
  supplier_id: z
    .string({ required_error: 'supplier_id wajib diisi' })
    .transform((v) => BigInt(v))
    .refine((v) => v > 0n, { message: 'supplier_id harus positif' }),
});

// ─── Item: Update ────────────────────────────────────────────────────────────
export const itemUpdateSchema = z.object({
  item_name: z
    .string()
    .min(1, 'item_name tidak boleh kosong')
    .max(12, 'item_name maksimal 12 karakter')
    .trim()
    .optional(),
  description: z.string().max(200, 'description maksimal 200 karakter').trim().optional(),
  status: z.enum(['A', 'I', 'C']).optional(),
  std_qty: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, { message: 'std_qty harus angka' })
    .optional(),
  min_stock: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, { message: 'min_stock tidak boleh negatif' })
    .optional(),
  max_stock: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, { message: 'max_stock harus lebih dari 0' })
    .optional(),
  unit_cost: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, { message: 'unit_cost harus angka' })
    .optional(),
  unit_retail: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, { message: 'unit_retail harus angka' })
    .optional(),
  supplier_id: z
    .string()
    .transform((v) => BigInt(v))
    .refine((v) => v > 0n, { message: 'supplier_id harus positif' })
    .optional(),
});

// ─── Supplier: Create ────────────────────────────────────────────────────────
export const supplierCreateSchema = z.object({
  supplier_code: z
    .string({ required_error: 'supplier_code wajib diisi' })
    .min(1, 'supplier_code tidak boleh kosong')
    .max(10, 'supplier_code maksimal 10 karakter')
    .trim(),
  supplier_name: z
    .string({ required_error: 'supplier_name wajib diisi' })
    .min(1, 'supplier_name tidak boleh kosong')
    .max(180, 'supplier_name maksimal 180 karakter')
    .trim(),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(150, 'email maksimal 150 karakter')
    .optional()
    .or(z.literal('')),
  phone_number: z
    .string()
    .max(14, 'phone_number maksimal 14 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(80, 'city maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  regency: z
    .string()
    .max(80, 'regency maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(180, 'address maksimal 180 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional().default(true),
});

// ─── Supplier: Update ─────────────────────────────────────────────────────────
export const supplierUpdateSchema = z.object({
  supplier_code: z
    .string({ required_error: 'supplier_code wajib diisi' })
    .min(1, 'supplier_code tidak boleh kosong')
    .max(10, 'supplier_code maksimal 10 karakter')
    .trim(),
  supplier_name: z
    .string({ required_error: 'supplier_name wajib diisi' })
    .min(1, 'supplier_name tidak boleh kosong')
    .max(180, 'supplier_name maksimal 180 karakter')
    .trim(),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(150, 'email maksimal 150 karakter')
    .optional()
    .or(z.literal('')),
  phone_number: z
    .string()
    .max(14, 'phone_number maksimal 14 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(80, 'city maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  regency: z
    .string()
    .max(80, 'regency maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(180, 'address maksimal 180 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
});

// ─── Order: Create ───────────────────────────────────────────────────────────
export const orderCreateSchema = z.object({
  warehouse_id: z
    .string({ required_error: 'warehouse_id wajib diisi' })
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, { message: 'warehouse_id harus angka positif' }),
  supplier_id: z
    .string({ required_error: 'supplier_id wajib diisi' })
    .transform((v) => BigInt(v))
    .refine((v) => v > 0n, { message: 'supplier_id harus positif' }),
  delivery_start_date: z
    .string({ required_error: 'delivery_start_date wajib diisi' })
    .refine((v) => !isNaN(Date.parse(v)), { message: 'delivery_start_date format tidak valid (YYYY-MM-DD)' }),
  delivery_end_date: z
    .string({ required_error: 'delivery_end_date wajib diisi' })
    .refine((v) => !isNaN(Date.parse(v)), { message: 'delivery_end_date format tidak valid (YYYY-MM-DD)' }),
  approval_id: z
    .string({ required_error: 'approval_id wajib diisi' })
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, { message: 'approval_id harus angka positif' }),
  items: z
    .array(
      z.object({
        item_id: z
          .string({ required_error: 'item_id wajib diisi' })
          .transform((v) => BigInt(v))
          .refine((v) => v > 0n, { message: 'item_id harus positif' }),
        qty_ordered: z
          .string({ required_error: 'qty_ordered wajib diisi' })
          .transform((v) => Number(v))
          .refine((v) => !isNaN(v) && v > 0, { message: 'qty_ordered harus lebih dari 0' }),
      })
    )
    .min(1, 'items minimal 1 item')
    .refine(
      (items) => {
        const ids = items.map((i) => i.item_id.toString());
        return new Set(ids).size === ids.length;
      },
      { message: 'Terdapat item_id duplikat dalam request', path: ['items'] }
    ),
});

// ─── Warehouse: Create ───────────────────────────────────────────────────────
export const warehouseCreateSchema = z.object({
  warehouse_code: z
    .string({ required_error: 'warehouse_code wajib diisi' })
    .min(1, 'warehouse_code tidak boleh kosong')
    .max(5, 'warehouse_code maksimal 5 karakter')
    .trim(),
  warehouse_name: z
    .string()
    .max(150, 'warehouse_name maksimal 150 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(150, 'email maksimal 150 karakter')
    .optional()
    .or(z.literal('')),
  phone_number: z
    .string()
    .max(14, 'phone_number maksimal 14 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(80, 'city maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  regency: z
    .string()
    .max(80, 'regency maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(180, 'address maksimal 180 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  status: z.enum(['A', 'C']).optional().default('A'),
});

// ─── Warehouse: Update ─────────────────────────────────────────────────────────
export const warehouseUpdateSchema = z.object({
  warehouse_code: z
    .string({ required_error: 'warehouse_code wajib diisi' })
    .min(1, 'warehouse_code tidak boleh kosong')
    .max(5, 'warehouse_code maksimal 5 karakter')
    .trim(),
  warehouse_name: z
    .string()
    .max(150, 'warehouse_name maksimal 150 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(150, 'email maksimal 150 karakter')
    .optional()
    .or(z.literal('')),
  phone_number: z
    .string()
    .max(14, 'phone_number maksimal 14 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(80, 'city maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  regency: z
    .string()
    .max(80, 'regency maksimal 80 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(180, 'address maksimal 180 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  status: z.enum(['A', 'C']).optional(),
});

// ─── Helper: parse with error formatting ─────────────────────────────────────
/**
 * Parse request body dengan Zod schema.
 * Kembalikan { success: true, data } atau { success: false, errors }
 *
 * @param {z.ZodSchema} schema
 * @param {object} data
 * @returns {Promise<{ success: boolean, data?: any, errors?: any }>}
 */
export async function validate(schema, data) {
  const result = await schema.safeParseAsync(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Zod error → human-readable messages
  const errors = result.error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return { success: false, errors };
}