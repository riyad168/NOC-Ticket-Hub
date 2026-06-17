import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { sendTelegramMessage } from "../lib/telegram.js";

async function generateTicketNumber(): Promise<string> {
  const last = await prisma.ticket.findFirst({ orderBy: { id: "desc" } });
  const num = last ? last.id + 1 : 1;
  return `TCK-${String(num).padStart(4, "0")}`;
}

export async function listTickets(req: Request, res: Response): Promise<void> {
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

    const [tickets, categories, engineers] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { customer: true, category: true, assignedEngineer: true, createdBy: true },
      }),
      prisma.ticketCategory.findMany(),
      prisma.user.findMany({ where: { role: "noc_engineer" }, orderBy: { name: "asc" } }),
    ]);

    res.render("tickets/index", {
      title: "All Tickets",
      user: req.user,
      tickets,
      categories,
      engineers,
      filters: { status, category, search, engineer },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load tickets. Check server logs.");
  }
}

export async function showCreate(req: Request, res: Response): Promise<void> {
  try {
    const [customers, categories, engineers] = await Promise.all([
      prisma.customer.findMany({ orderBy: { name: "asc" } }),
      prisma.ticketCategory.findMany(),
      prisma.user.findMany({ where: { role: "noc_engineer" }, orderBy: { name: "asc" } }),
    ]);
    res.render("tickets/create", { title: "Create Ticket", user: req.user, customers, categories, engineers, error: null });
  } catch {
    res.render("error", { title: "Error", user: req.user, message: "Failed to load form" });
  }
}

export async function createTicket(req: Request, res: Response): Promise<void> {
  const { customerId, categoryId, assignedTo, remarks } = req.body as Record<string, string>;
  try {
    const ticketNumber = await generateTicketNumber();
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        customerId: parseInt(customerId),
        categoryId: parseInt(categoryId),
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        remarks: remarks || null,
        createdById: req.user!.id,
      },
      include: { customer: true, category: true, assignedEngineer: true },
    });

    await prisma.ticketLog.create({
      data: {
        ticketId: ticket.id,
        action: "Ticket Created",
        description: `Ticket ${ticketNumber} created by ${req.user!.name}`,
        userId: req.user!.id,
      },
    });

    const msg = `🎫 <b>New Ticket Created</b>\n` +
      `Ticket: ${ticketNumber}\n` +
      `Customer: ${ticket.customer.name}\n` +
      `Category: ${ticket.category.name}\n` +
      `Assigned to: ${ticket.assignedEngineer?.name ?? "Unassigned"}\n` +
      `Status: Open`;
    await sendTelegramMessage(msg);

    res.redirect("/tickets");
  } catch {
    const [customers, categories, engineers] = await Promise.all([
      prisma.customer.findMany(),
      prisma.ticketCategory.findMany(),
      prisma.user.findMany({ where: { role: "noc_engineer" } }),
    ]);
    res.render("tickets/create", { title: "Create Ticket", user: req.user, customers, categories, engineers, error: "Failed to create ticket" });
  }
}

export async function viewTicket(req: Request, res: Response): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params["id"]!) },
      include: { customer: true, category: true, assignedEngineer: true, createdBy: true, logs: { include: { user: true }, orderBy: { createdAt: "desc" } } },
    });
    if (!ticket) { res.redirect("/tickets"); return; }
    res.render("tickets/view", { title: `Ticket ${ticket.ticketNumber}`, user: req.user, ticket });
  } catch {
    res.redirect("/tickets");
  }
}

export async function showEdit(req: Request, res: Response): Promise<void> {
  try {
    const [ticket, customers, categories, engineers] = await Promise.all([
      prisma.ticket.findUnique({
        where: { id: parseInt(req.params["id"]!) },
        include: { customer: true, category: true, assignedEngineer: true },
      }),
      prisma.customer.findMany({ orderBy: { name: "asc" } }),
      prisma.ticketCategory.findMany(),
      prisma.user.findMany({ where: { role: "noc_engineer" }, orderBy: { name: "asc" } }),
    ]);
    if (!ticket) { res.redirect("/tickets"); return; }
    res.render("tickets/edit", { title: "Edit Ticket", user: req.user, ticket, customers, categories, engineers, error: null });
  } catch {
    res.redirect("/tickets");
  }
}

export async function updateTicket(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params["id"]!);
  const { customerId, categoryId, assignedTo, status, remarks } = req.body as Record<string, string>;
  try {
    const old = await prisma.ticket.findUnique({ where: { id } });
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        customerId: parseInt(customerId),
        categoryId: parseInt(categoryId),
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        status: status as "Open" | "In_Progress" | "Resolved" | "Closed",
        remarks: remarks || null,
      },
      include: { customer: true, category: true, assignedEngineer: true },
    });

    const changes: string[] = [];
    if (old?.status !== ticket.status) changes.push(`Status: ${old?.status} → ${ticket.status}`);
    if (old?.assignedTo !== ticket.assignedTo) changes.push(`Assigned to: ${ticket.assignedEngineer?.name ?? "Unassigned"}`);
    if (remarks) changes.push(`Remark added`);

    await prisma.ticketLog.create({
      data: {
        ticketId: ticket.id,
        action: "Ticket Updated",
        description: changes.length ? changes.join(", ") : "Ticket updated",
        userId: req.user!.id,
      },
    });

    if (changes.length) {
      const msg = `📝 <b>Ticket Updated</b>\n` +
        `Ticket: ${ticket.ticketNumber}\n` +
        `Customer: ${ticket.customer.name}\n` +
        `${changes.join("\n")}`;
      await sendTelegramMessage(msg);
    }

    res.redirect(`/tickets/${id}`);
  } catch {
    res.redirect("/tickets");
  }
}

export async function deleteTicket(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params["id"]!);
  try {
    await prisma.ticketLog.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.delete({ where: { id } });
    res.redirect("/tickets");
  } catch {
    res.redirect("/tickets");
  }
}
