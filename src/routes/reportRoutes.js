import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import {
  ordersPerSupplier,
  qtyPerItem,
  summary,
} from '../controllers/reportController.js';

const router = Router();

// ==============================
// Report Routes (semua protected)
// ==============================

// GET /api/reports/summary              - Dashboard overview
// GET /api/reports/orders-per-supplier  - Total order per supplier
// GET /api/reports/qty-per-item         - Total qty per item

router.get('/summary', verifyToken, summary);
router.get('/orders-per-supplier', verifyToken, ordersPerSupplier);
router.get('/qty-per-item', verifyToken, qtyPerItem);

export default router;
