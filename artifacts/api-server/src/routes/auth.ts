import { Router } from "express";
import { showLogin, login, logout } from "../controllers/authController.js";
import { requireAuth, requireGuest } from "../middlewares/auth.js";

const router = Router();

router.get("/login", requireGuest, showLogin);
router.post("/login", requireGuest, login);
router.get("/logout", requireAuth, logout);

export default router;
