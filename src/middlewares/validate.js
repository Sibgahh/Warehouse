/**
 * Zod validation middleware factory
 *
 * Usage di route:
 *   router.post('/login', loginLimiter, validate(loginSchema), login);
 *
 * Atau langsung di controller:
 *   const result = await validate(schemas.loginSchema, req.body);
 *   if (!result.success) return res.status(400).json({ ... });
 *
 * @param {import('zod').ZodSchema} schema - Zod schema untuk req.body
 */
export function validate(schema) {
  return async (req, res, next) => {
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      // Zod v3/v4: error structure
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((e) => ({
        field: (e.path || []).filter((p) => typeof p === 'string').join('.') || 'body',
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors,
      });
    }

    // Replace req.body dengan parsed + transformed data
    req.body = result.data;
    next();
  };
}

/**
 * Validate query params dengan schema.
 * Usage: router.get('/items', validateQuery(itemListSchema), getAll);
 *
 * @param {import('zod').ZodSchema} schema
 */
export function validateQuery(schema) {
  return async (req, res, next) => {
    const result = await schema.safeParseAsync(req.query);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((e) => ({
        field: (e.path || []).join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validasi query gagal',
        errors,
      });
    }

    req.query = result.data;
    next();
  };
}

/**
 * Validate URL params (path parameters).
 * Usage: router.get('/:id', validateParams(idSchema), getById);
 *
 * @param {import('zod').ZodSchema} schema
 */
export function validateParams(schema) {
  return async (req, res, next) => {
    const result = await schema.safeParseAsync(req.params);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((e) => ({
        field: (e.path || []).join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validasi parameter gagal',
        errors,
      });
    }

    req.params = result.data;
    next();
  };
}