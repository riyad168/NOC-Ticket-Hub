import { Router } from "express";
import { dailyReport, monthlyReport, engineerReport } from "../controllers/reportController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

router.get("/reports/daily", requireAuth, requireRole("admin", "manager"), dailyReport);
router.get("/reports/monthly", requireAuth, requireRole("admin", "manager"), monthlyReport);
router.get("/reports/engineer", requireAuth, requireRole("admin", "manager"), engineerReport);

export default router;
