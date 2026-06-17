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

    const categoryStats = await prisma.ticket.groupBy({
      by: ["categoryId"],
      _count: { id: true },
    });

    const categories = await prisma.ticketCategory.findMany();
    const categoryData = categories.map((cat) => {
      const stat = categoryStats.find((s) => s.categoryId === cat.id);
      return { name: cat.name, count: stat?._count.id ?? 0 };
    });

    res.render("dashboard/index", {
      title: "Dashboard",
      user: req.user,
      stats: { total, open, resolved, slaBreached },
      recentTickets,
      recentLogs,
      categoryData,
    });
  } catch (err) {
    res.render("error", { title: "Error", user: req.user, message: "Failed to load dashboard" });
  }
}
