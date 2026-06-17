import { Router } from "express";
import { listUsers, showCreateUser, createUser, showEditUser, updateUser, deleteUser } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

router.get("/users", requireAuth, requireRole("admin", "manager"), listUsers);
router.get("/users/create", requireAuth, requireRole("admin"), showCreateUser);
router.post("/users/create", requireAuth, requireRole("admin"), createUser);
router.get("/users/:id/edit", requireAuth, requireRole("admin"), showEditUser);
router.post("/users/:id/edit", requireAuth, requireRole("admin"), updateUser);
router.post("/users/:id/delete", requireAuth, requireRole("admin"), deleteUser);

export default router;
