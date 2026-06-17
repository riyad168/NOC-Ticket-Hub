import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function dailyReport(req: Request, res: Response): Promise<void> {
  try {
    const dateStr = (req.query["date"] as string) || new Date().toISOString().split("T")[0];
    const date = new Date(dateStr!);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { customer: true, category: true, assignedEngineer: true },
      orderBy: { createdAt: "asc" },
    });

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      inProgress: tickets.filter((t) => t.status === "In_Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
      closed: tickets.filter((t) => t.status === "Closed").length,
      slaBreached: tickets.filter((t) => t.slaBreached).length,
    };

    res.render("reports/daily", { title: "Daily Report", user: req.user, tickets, stats, date: dateStr });
  } catch {
    res.render("error", { title: "Error", user: req.user, message: "Failed to generate report" });
  }
}

export async function monthlyReport(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const year = parseInt((req.query["year"] as string) || String(now.getFullYear()));
    const month = parseInt((req.query["month"] as string) || String(now.getMonth() + 1));
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const tickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { customer: true, category: true, assignedEngineer: true },
      orderBy: { createdAt: "asc" },
    });

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      inProgress: tickets.filter((t) => t.status === "In_Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
      closed: tickets.filter((t) => t.status === "Closed").length,
      slaBreached: tickets.filter((t) => t.slaBreached).length,
    };

    const categoryBreakdown = tickets.reduce((acc: Record<string, number>, t) => {
      const name = t.category.name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    res.render("reports/monthly", { title: "Monthly Report", user: req.user, tickets, stats, categoryBreakdown, year, month });
  } catch {
    res.render("error", { title: "Error", user: req.user, message: "Failed to generate report" });
  }
}

export async function engineerReport(req: Request, res: Response): Promise<void> {
  try {
    const engineers = await prisma.user.findMany({
      where: { role: "noc_engineer" },
      orderBy: { name: "asc" },
    });

    const data = await Promise.all(
      engineers.map(async (eng) => {
        const tickets = await prisma.ticket.findMany({
          where: { assignedTo: eng.id },
        });
        return {
          engineer: eng,
          total: tickets.length,
          resolved: tickets.filter((t) => t.status === "Resolved").length,
          closed: tickets.filter((t) => t.status === "Closed").length,
          open: tickets.filter((t) => t.status === "Open").length,
          slaBreached: tickets.filter((t) => t.slaBreached).length,
        };
      })
    );

    res.render("reports/engineer", { title: "Engineer Performance", user: req.user, data });
  } catch {
    res.render("error", { title: "Error", user: req.user, message: "Failed to generate report" });
  }
}
