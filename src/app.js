import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import logger from './middlewares/logger.js';
import errorHandler from './middlewares/errorHandler.js';

// ─── BigInt JSON serialization (Prisma returns BigInt for unsigned bigint columns) ───
BigInt.prototype.toJSON = function () {
  const int = Number(this);
  return int <= Number.MAX_SAFE_INTEGER ? int : this.toString();
};

const app = express();

// ==============================
// Global Middlewares
// ==============================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ==============================
// Routes
// ==============================
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'POS API is running 🚀',
    version: '1.0.0',
  });
});

// ==============================
// 404 Handler
// ==============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ==============================
// Error Handler (harus paling akhir)
// ==============================
app.use(errorHandler);

export default app;
