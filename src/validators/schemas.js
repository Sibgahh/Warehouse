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
  role_id: z.coerce
    .number({ required_error: 'role_id wajib diisi', invalid_type_error: 'role_id harus angka positif' })
    .int('role_id harus angka positif')
    .positive('role_id harus angka positif'),
});

export const publicRegisterSchema = z.object({
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

// ─── Store: Create/Update ─────────────────────────────────────────────────────
export const storeCreateSchema = z.object({
  store_code: z
    .string({ required_error: 'store_code wajib diisi' })
    .min(1, 'store_code tidak boleh kosong')
    .max(5, 'store_code maksimal 5 karakter')
    .trim(),
  store_name: z
    .string({ required_error: 'store_name wajib diisi' })
    .min(1, 'store_name tidak boleh kosong')
    .max(150, 'store_name maksimal 150 karakter')
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
  status: z.enum(['A', 'C']).optional().default('A'),
});

export const storeUpdateSchema = storeCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi' }
);

// ─── Menu: Create/Update ──────────────────────────────────────────────────────
export const menuCreateSchema = z.object({
  menu_sequence: z
    .string({ required_error: 'menu_sequence wajib diisi' })
    .min(1, 'menu_sequence tidak boleh kosong')
    .max(5, 'menu_sequence maksimal 5 karakter')
    .trim(),
  menu_name: z
    .string({ required_error: 'menu_name wajib diisi' })
    .min(1, 'menu_name tidak boleh kosong')
    .max(80, 'menu_name maksimal 80 karakter')
    .trim(),
  menu_icon: z.string().max(150, 'menu_icon maksimal 150 karakter').optional().or(z.literal('')),
  menu_link: z.string().max(150, 'menu_link maksimal 150 karakter').optional().or(z.literal('')),
  is_submenu: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

export const menuUpdateSchema = menuCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi' }
);

// ─── Submenu: Create/Update ───────────────────────────────────────────────────
export const submenuCreateSchema = z.object({
  menu_id: z.coerce
    .number({ required_error: 'menu_id wajib diisi', invalid_type_error: 'menu_id harus angka positif' })
    .int('menu_id harus angka positif')
    .positive('menu_id harus angka positif'),
  submenu_sequence: z
    .string({ required_error: 'submenu_sequence wajib diisi' })
    .min(1, 'submenu_sequence tidak boleh kosong')
    .max(5, 'submenu_sequence maksimal 5 karakter')
    .trim(),
  submenu_name: z
    .string({ required_error: 'submenu_name wajib diisi' })
    .min(1, 'submenu_name tidak boleh kosong')
    .max(80, 'submenu_name maksimal 80 karakter')
    .trim(),
  submenu_icon: z.string().max(150, 'submenu_icon maksimal 150 karakter').optional().or(z.literal('')),
  submenu_link: z.string().max(150, 'submenu_link maksimal 150 karakter').optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
});

export const submenuUpdateSchema = submenuCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi' }
);

// ─── Role Menu/Submenu: Create ────────────────────────────────────────────────
export const roleMenuCreateSchema = z.object({
  role_id: z.coerce
    .number({ required_error: 'role_id wajib diisi', invalid_type_error: 'role_id harus angka positif' })
    .int('role_id harus angka positif')
    .positive('role_id harus angka positif'),
  menu_id: z.coerce
    .number({ required_error: 'menu_id wajib diisi', invalid_type_error: 'menu_id harus angka positif' })
    .int('menu_id harus angka positif')
    .positive('menu_id harus angka positif'),
});

export const roleSubmenuCreateSchema = z.object({
  role_id: z.coerce
    .number({ required_error: 'role_id wajib diisi', invalid_type_error: 'role_id harus angka positif' })
    .int('role_id harus angka positif')
    .positive('role_id harus angka positif'),
  submenu_id: z.coerce
    .number({ required_error: 'submenu_id wajib diisi', invalid_type_error: 'submenu_id harus angka positif' })
    .int('submenu_id harus angka positif')
    .positive('submenu_id harus angka positif'),
});

// ─── Order Status: Create/Update ─────────────────────────────────────────────
export const orderStatusCreateSchema = z.object({
  status_code: z
    .string({ required_error: 'status_code wajib diisi' })
    .min(1, 'status_code tidak boleh kosong')
    .max(5, 'status_code maksimal 5 karakter')
    .trim(),
  status_name: z
    .string({ required_error: 'status_name wajib diisi' })
    .min(1, 'status_name tidak boleh kosong')
    .max(100, 'status_name maksimal 100 karakter')
    .trim(),
});

export const orderStatusUpdateSchema = orderStatusCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi' }
);

// ─── Inventory: Create/Update ────────────────────────────────────────────────
export const inventoryCreateSchema = z.object({
  item_id: z.coerce
    .number({ required_error: 'item_id wajib diisi', invalid_type_error: 'item_id harus angka positif' })
    .int('item_id harus angka positif')
    .positive('item_id harus angka positif')
    .transform((v) => BigInt(v)),
  on_hand_qty: z.coerce
    .number({ required_error: 'on_hand_qty wajib diisi', invalid_type_error: 'on_hand_qty harus angka' })
    .min(0, 'on_hand_qty tidak boleh negatif'),
  on_ordered_qty: z.coerce
    .number({ invalid_type_error: 'on_ordered_qty harus angka' })
    .min(0, 'on_ordered_qty tidak boleh negatif')
    .optional()
    .default(0),
});

export const inventoryUpdateSchema = z.object({
  on_hand_qty: z.coerce
    .number({ invalid_type_error: 'on_hand_qty harus angka' })
    .min(0, 'on_hand_qty tidak boleh negatif')
    .optional(),
  on_ordered_qty: z.coerce
    .number({ invalid_type_error: 'on_ordered_qty harus angka' })
    .min(0, 'on_ordered_qty tidak boleh negatif')
    .optional(),
}).refine((data) => data.on_hand_qty !== undefined || data.on_ordered_qty !== undefined, {
  message: 'Minimal satu field qty harus diisi',
});

// ─── Roles: Create/Update ────────────────────────────────────────────────────
export const roleCreateSchema = z.object({
  role_code: z
    .string({ required_error: 'role_code wajib diisi' })
    .min(1, 'role_code tidak boleh kosong')
    .max(8, 'role_code maksimal 8 karakter')
    .trim(),
  role_name: z
    .string({ required_error: 'role_name wajib diisi' })
    .min(1, 'role_name tidak boleh kosong')
    .max(80, 'role_name maksimal 80 karakter')
    .trim(),
  is_active: z.boolean().optional().default(true),
});

export const roleUpdateSchema = roleCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi' }
);

// ─── Order Details: Create/Update ────────────────────────────────────────────
export const orderDetailCreateSchema = z.object({
  order_id: z.coerce
    .number({ required_error: 'order_id wajib diisi', invalid_type_error: 'order_id harus angka positif' })
    .int('order_id harus angka positif')
    .positive('order_id harus angka positif')
    .transform((v) => BigInt(v)),
  item_id: z.coerce
    .number({ required_error: 'item_id wajib diisi', invalid_type_error: 'item_id harus angka positif' })
    .int('item_id harus angka positif')
    .positive('item_id harus angka positif')
    .transform((v) => BigInt(v)),
  qty_ordered: z.coerce
    .number({ required_error: 'qty_ordered wajib diisi', invalid_type_error: 'qty_ordered harus angka' })
    .gt(0, 'qty_ordered harus lebih dari 0'),
  qty_received: z.coerce
    .number({ invalid_type_error: 'qty_received harus angka' })
    .min(0, 'qty_received tidak boleh negatif')
    .optional(),
  qty_cancelled: z.coerce
    .number({ invalid_type_error: 'qty_cancelled harus angka' })
    .min(0, 'qty_cancelled tidak boleh negatif')
    .optional(),
  reason_cancelled: z.string().max(150, 'reason_cancelled maksimal 150 karakter').optional().or(z.literal('')),
});

export const orderDetailUpdateSchema = z.object({
  item_id: z.coerce
    .number({ invalid_type_error: 'item_id harus angka positif' })
    .int('item_id harus angka positif')
    .positive('item_id harus angka positif')
    .transform((v) => BigInt(v))
    .optional(),
  qty_ordered: z.coerce
    .number({ invalid_type_error: 'qty_ordered harus angka' })
    .gt(0, 'qty_ordered harus lebih dari 0')
    .optional(),
  qty_received: z.coerce
    .number({ invalid_type_error: 'qty_received harus angka' })
    .min(0, 'qty_received tidak boleh negatif')
    .optional(),
  qty_cancelled: z.coerce
    .number({ invalid_type_error: 'qty_cancelled harus angka' })
    .min(0, 'qty_cancelled tidak boleh negatif')
    .optional(),
  reason_cancelled: z.string().max(150, 'reason_cancelled maksimal 150 karakter').optional().or(z.literal('')),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Minimal satu field harus diisi',
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