import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { sendTelegramMessage } from "../lib/telegram.js";

const router = Router();

const JWT_SECRET = process.env["JWT_SECRET"] || "noc_secret_key_2025";

interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

function requireApiAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.clearCookie("token");
    res.status(401).json({ error: "Unauthorized" });
  }
}

function requireApiRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

async function generateTicketNumber(): Promise<string> {
  const last = await prisma.ticket.findFirst({ orderBy: { id: "desc" } });
  const num = last ? last.id + 1 : 1;
  return `TCK-${String(num).padStart(4, "0")}`;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

router.get("/auth/me", requireApiAuth, (req, res) => {
  const { id, name, email, role } = req.user!;
  res.json({ id, name, email, role, createdAt: new Date().toISOString() });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.cookie("token", token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error("API login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", requireApiAuth, (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get("/dashboard/stats", requireApiAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [total, open, resolved, slaBreached, totalLastMonth, openLastMonth, resolvedLastMonth, slaBreachedLastMonth, totalThisMonth] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "Open" } }),
      prisma.ticket.count({ where: { status: "Resolved" } }),
      prisma.ticket.count({ where: { slaBreached: true, status: { notIn: ["Resolved", "Closed"] } } }),
      prisma.ticket.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { status: "Open", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { status: "Resolved", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { slaBreached: true, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const pct = (cur: number, prev: number) => prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

    res.json({
      total,
      open,
      resolved,
      slaBreached,
      totalChange: pct(totalThisMonth, totalLastMonth),
      openChange: pct(open, openLastMonth),
      resolvedChange: pct(resolved, resolvedLastMonth),
      slaChange: pct(slaBreached, slaBreachedLastMonth),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

router.get("/dashboard/chart", requireApiAuth, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const days: string[] = [];
    const openCounts: number[] = [];
    const resolvedCounts: number[] = [];
    const closedCounts: number[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      const dateStr = d.toISOString().slice(0, 10);
      days.push(label);
      const dayTickets = tickets.filter(t => t.createdAt.toISOString().slice(0, 10) === dateStr);
      openCounts.push(dayTickets.filter(t => t.status === "Open").length);
      resolvedCounts.push(dayTickets.filter(t => t.status === "Resolved").length);
      closedCounts.push(dayTickets.filter(t => t.status === "Closed").length);
    }

    res.json({ days, openCounts, resolvedCounts, closedCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chart data" });
  }
});

router.get("/dashboard/categories", requireApiAuth, async (req, res) => {
  try {
    const categories = await prisma.ticketCategory.findMany({
      include: { _count: { select: { tickets: true } } },
    });
    res.json(categories.map(c => ({ name: c.name, count: c._count.tickets })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.get("/dashboard/recent-activity", requireApiAuth, async (req, res) => {
  try {
    const logs = await prisma.ticketLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { ticket: true, user: true },
    });
    res.json(logs.map(l => ({
      id: l.id,
      action: l.action,
      description: l.description,
      createdAt: l.createdAt,
      ticketId: l.ticketId,
      ticketNumber: l.ticket.ticketNumber,
      user: { id: l.user.id, name: l.user.name, email: l.user.email, role: l.user.role, createdAt: l.user.createdAt },
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load activity" });
  }
});

// ─── Tickets ─────────────────────────────────────────────────────────────────

router.get("/tickets", requireApiAuth, async (req, res) => {
  try {
    const { status, category, search, engineer } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where["status"] = status;
    if (category) where["categoryId"] = parseInt(category);
    if (engineer) where["assignedTo"] = parseInt(engineer);
    if (search) {
      where["OR"] = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (req.user?.role === "noc_engineer") {
      where["assignedTo"] = req.user.id;
    }
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true, category: true, assignedEngineer: true, createdBy: true },
    });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load tickets" });
  }
});

router.post("/tickets", requireApiAuth, async (req, res) => {
  const { customerId, categoryId, assignedTo, remarks } = req.body as Record<string, unknown>;
  try {
    const ticketNumber = await generateTicketNumber();
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        customerId: Number(customerId),
        categoryId: Number(categoryId),
        assignedTo: assignedTo ? Number(assignedTo) : null,
        remarks: remarks as string || null,
        createdById: req.user!.id,
      },
      include: { customer: true, category: true, assignedEngineer: true, createdBy: true },
    });

    await prisma.ticketLog.create({
      data: {
        ticketId: ticket.id,
        action: "Ticket Created",
        description: `Ticket ${ticketNumber} created by ${req.user!.name}`,
        userId: req.user!.id,
      },
    });

    const msg = `🎫 <b>New Ticket Created</b>\nTicket: ${ticketNumber}\nCustomer: ${ticket.customer.name}\nCategory: ${ticket.category.name}\nAssigned to: ${ticket.assignedEngineer?.name ?? "Unassigned"}\nStatus: Open`;
    await sendTelegramMessage(msg).catch(() => {});

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

router.get("/tickets/:id", requireApiAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        category: true,
        assignedEngineer: true,
        createdBy: true,
        logs: { include: { user: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!ticket) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const formatted = {
      ...ticket,
      logs: ticket.logs.map(l => ({
        id: l.id,
        action: l.action,
        description: l.description,
        createdAt: l.createdAt,
        ticketId: l.ticketId,
        ticketNumber: ticket.ticketNumber,
        user: { id: l.user.id, name: l.user.name, email: l.user.email, role: l.user.role, createdAt: l.user.createdAt },
      })),
    };
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load ticket" });
  }
});

router.patch("/tickets/:id", requireApiAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const { status, categoryId, assignedTo, remarks, slaBreached } = req.body as Record<string, unknown>;
  try {
    const prev = await prisma.ticket.findUnique({ where: { id } });
    if (!prev) { res.status(404).json({ error: "Not found" }); return; }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data["status"] = status;
    if (categoryId !== undefined) data["categoryId"] = Number(categoryId);
    if (assignedTo !== undefined) data["assignedTo"] = assignedTo ? Number(assignedTo) : null;
    if (remarks !== undefined) data["remarks"] = remarks;
    if (slaBreached !== undefined) data["slaBreached"] = Boolean(slaBreached);

    const ticket = await prisma.ticket.update({
      where: { id },
      data: data as Parameters<typeof prisma.ticket.update>[0]["data"],
      include: { customer: true, category: true, assignedEngineer: true, createdBy: true },
    });

    if (status && status !== prev.status) {
      await prisma.ticketLog.create({
        data: {
          ticketId: id,
          action: "Status Changed",
          description: `Status changed from ${prev.status} to ${status} by ${req.user!.name}`,
          userId: req.user!.id,
        },
      });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

router.delete("/tickets/:id", requireApiAuth, requireApiRole("admin", "manager"), async (req, res) => {
  const id = parseInt(req.params["id"]!);
  try {
    await prisma.ticketLog.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

router.get("/users", requireApiAuth, requireApiRole("admin", "manager"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.post("/users", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const { name, email, password, role } = req.body as Record<string, string>;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) { res.status(400).json({ error: "Email already exists" }); return; }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role as "admin" | "noc_engineer" | "manager" },
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.patch("/users/:id", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const { name, email, role } = req.body as Record<string, string>;
  try {
    const data: Record<string, unknown> = {};
    if (name) data["name"] = name;
    if (email) data["email"] = email;
    if (role) data["role"] = role;
    const user = await prisma.user.update({
      where: { id },
      data: data as Parameters<typeof prisma.user.update>[0]["data"],
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const id = parseInt(req.params["id"]!);
  try {
    if (id === req.user!.id) { res.status(400).json({ error: "Cannot delete yourself" }); return; }
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ─── Customers ───────────────────────────────────────────────────────────────

router.get("/customers", requireApiAuth, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load customers" });
  }
});

router.post("/customers", requireApiAuth, async (req, res) => {
  const { name, contactPerson, phone, email, address } = req.body as Record<string, string>;
  try {
    const customer = await prisma.customer.create({
      data: { name, contactPerson: contactPerson || null, phone: phone || null, email: email || null, address: address || null },
    });
    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

router.patch("/customers/:id", requireApiAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const { name, contactPerson, phone, email, address } = req.body as Record<string, string>;
  try {
    const data: Record<string, unknown> = {};
    if (name !== undefined) data["name"] = name;
    if (contactPerson !== undefined) data["contactPerson"] = contactPerson || null;
    if (phone !== undefined) data["phone"] = phone || null;
    if (email !== undefined) data["email"] = email || null;
    if (address !== undefined) data["address"] = address || null;
    const customer = await prisma.customer.update({
      where: { id },
      data: data as Parameters<typeof prisma.customer.update>[0]["data"],
    });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

router.delete("/customers/:id", requireApiAuth, async (req, res) => {
  const id = parseInt(req.params["id"]!);
  try {
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// ─── Departments ─────────────────────────────────────────────────────────────

router.get("/departments", requireApiAuth, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load departments" });
  }
});

router.post("/departments", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const { name, description } = req.body as { name: string; description?: string };
  try {
    const dept = await prisma.department.create({
      data: { name, description: description || null },
    });
    res.status(201).json(dept);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create department" });
  }
});

router.patch("/departments/:id", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const id = parseInt(req.params["id"]!);
  const { name, description } = req.body as { name?: string; description?: string };
  try {
    const data: Record<string, unknown> = {};
    if (name !== undefined) data["name"] = name;
    if (description !== undefined) data["description"] = description || null;
    const dept = await prisma.department.update({
      where: { id },
      data: data as Parameters<typeof prisma.department.update>[0]["data"],
    });
    res.json(dept);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update department" });
  }
});

router.delete("/departments/:id", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const id = parseInt(req.params["id"]!);
  try {
    await prisma.department.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete department" });
  }
});

// ─── Categories ──────────────────────────────────────────────────────────────

router.get("/categories", requireApiAuth, async (req, res) => {
  try {
    const categories = await prisma.ticketCategory.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.post("/categories", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const { name } = req.body as { name: string };
  try {
    const category = await prisma.ticketCategory.create({ data: { name } });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.delete("/categories/:id", requireApiAuth, requireApiRole("admin"), async (req, res) => {
  const id = parseInt(req.params["id"]!);
  try {
    await prisma.ticketCategory.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
