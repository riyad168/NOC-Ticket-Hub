import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function showDashboard(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [total, open, resolved, slaBreached, totalLastMonth, openLastMonth, resolvedLastMonth, slaBreachedLastMonth, recentTickets, recentLogs, categories, last30DaysTickets] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "Open" } }),
      prisma.ticket.count({ where: { status: "Resolved" } }),
      prisma.ticket.count({ where: { slaBreached: true, status: { notIn: ["Resolved", "Closed"] } } }),
      prisma.ticket.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { status: "Open", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { status: "Resolved", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.count({ where: { slaBreached: true, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.ticket.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { customer: true, category: true, assignedEngineer: true },
      }),
      prisma.ticketLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { ticket: true, user: true },
      }),
      prisma.ticketCategory.findMany({
        include: { _count: { select: { tickets: true } } },
      }),
      prisma.ticket.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Category data for donut chart
    const categoryData = categories.map((cat) => ({
      name: cat.name,
      count: cat._count.tickets,
    }));

    // Build daily line chart data for last 30 days
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

      const dayTickets = last30DaysTickets.filter(t => t.createdAt.toISOString().slice(0, 10) === dateStr);
      openCounts.push(dayTickets.filter(t => t.status === "Open").length);
      resolvedCounts.push(dayTickets.filter(t => t.status === "Resolved").length);
      closedCounts.push(dayTickets.filter(t => t.status === "Closed").length);
    }

    // % change helpers
    const pct = (cur: number, prev: number) => prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);
    const totalThisMonth = await prisma.ticket.count({ where: { createdAt: { gte: startOfMonth } } });

    res.render("dashboard/index", {
      title: "Dashboard",
      user: req.user,
      stats: {
        total, open, resolved, slaBreached,
        totalChange: pct(totalThisMonth, totalLastMonth),
        openChange: pct(open, openLastMonth),
        resolvedChange: pct(resolved, resolvedLastMonth),
        slaChange: pct(slaBreached, slaBreachedLastMonth),
      },
      recentTickets,
      recentLogs,
      categoryData,
      chartData: { days, openCounts, resolvedCounts, closedCounts },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.render("error", { title: "Error", user: req.user, message: "Failed to load dashboard" });
  }
}
