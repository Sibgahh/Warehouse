/**
 * Global Error Handler Middleware
 * Menangkap semua error yang tidak di-handle oleh route handler
 */
const errorHandler = (err, req, res, next) => {
  // Log error ke console
  console.error('─────────────────────────────────────');
  console.error(`[ERROR] ${new Date().toISOString()}`);
  console.error(`  Path: ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(`  Stack: ${err.stack}`);
  }
  console.error('─────────────────────────────────────');

  // Tentukan status code
  const statusCode = err.statusCode || 500;

  // Kirim response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
