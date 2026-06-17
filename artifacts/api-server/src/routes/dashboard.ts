import { Router } from "express";
import { showDashboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/dashboard", requireAuth, showDashboard);

export default router;
