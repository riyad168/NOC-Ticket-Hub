import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function showDashboard(req: Request, res: Response): Promise<void> {
  try {
    const [total, open, resolved, slaBreached, recentTickets, recentLogs] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "Open" } }),
      prisma.ticket.count({ where: { status: "Resolved" } }),
      prisma.ticket.count({ where: { slaBreached: true, status: { notIn: ["Resolved", "Closed"] } } }),
      prisma.ticket.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { customer: true, category: true, assignedEngineer: true },
      }),
      prisma.ticketLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { ticket: true, user: true },
      }),
    ]);

    const categories = await prisma.ticketCategory.findMany({
      include: { _count: { select: { tickets: true } } },
    });
    const categoryData = categories.map((cat) => ({
      name: cat.name,
      count: cat._count.tickets,
    }));

    res.render("dashboard/index", {
      title: "Dashboard",
      user: req.user,
      stats: { total, open, resolved, slaBreached },
      recentTickets,
      recentLogs,
      categoryData,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.render("error", { title: "Error", user: req.user, message: "Failed to load dashboard" });
  }
}
