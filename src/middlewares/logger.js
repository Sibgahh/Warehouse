/**
 * Basic Logger Middleware
 * Log setiap incoming request ke console
 */
const logger = (req, res, next) => {
  const start = Date.now();

  // Log saat request masuk
  console.log(`[${new Date().toISOString()}] → ${req.method} ${req.originalUrl}`);

  // Log saat response selesai
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ← ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

export default logger;
