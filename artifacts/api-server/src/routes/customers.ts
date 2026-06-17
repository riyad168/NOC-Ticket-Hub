import { Router } from "express";
import { listCustomers, showCreateCustomer, createCustomer, showEditCustomer, updateCustomer, deleteCustomer } from "../controllers/customerController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

router.get("/customers", requireAuth, listCustomers);
router.get("/customers/create", requireAuth, requireRole("admin", "manager"), showCreateCustomer);
router.post("/customers/create", requireAuth, requireRole("admin", "manager"), createCustomer);
router.get("/customers/:id/edit", requireAuth, requireRole("admin", "manager"), showEditCustomer);
router.post("/customers/:id/edit", requireAuth, requireRole("admin", "manager"), updateCustomer);
router.post("/customers/:id/delete", requireAuth, requireRole("admin", "manager"), deleteCustomer);

export default router;
