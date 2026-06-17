import { Router } from "express";
import { listTickets, showCreate, createTicket, viewTicket, showEdit, updateTicket, deleteTicket } from "../controllers/ticketController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";

const router = Router();

router.get("/tickets", requireAuth, listTickets);
router.get("/tickets/create", requireAuth, showCreate);
router.post("/tickets/create", requireAuth, createTicket);
router.get("/tickets/:id", requireAuth, viewTicket);
router.get("/tickets/:id/edit", requireAuth, showEdit);
router.post("/tickets/:id/edit", requireAuth, updateTicket);
router.post("/tickets/:id/delete", requireAuth, requireRole("admin", "manager"), deleteTicket);

export default router;
