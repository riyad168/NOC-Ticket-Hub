import { Router } from "express";
import { listCategories, createCategory, deleteCategory } from "../controllers/categoryController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

router.get("/categories", requireAuth, listCategories);
router.post("/categories/create", requireAuth, requireRole("admin"), createCategory);
router.post("/categories/:id/delete", requireAuth, requireRole("admin"), deleteCategory);

export default router;
