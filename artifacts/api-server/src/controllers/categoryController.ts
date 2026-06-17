import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.ticketCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { tickets: true } } } });
    res.render("categories/index", { title: "Ticket Categories", user: req.user, categories, error: null });
  } catch {
    res.render("error", { title: "Error", user: req.user, message: "Failed to load categories" });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name } = req.body as { name: string };
  try {
    await prisma.ticketCategory.create({ data: { name } });
    res.redirect("/categories");
  } catch {
    const categories = await prisma.ticketCategory.findMany({ include: { _count: { select: { tickets: true } } } });
    res.render("categories/index", { title: "Ticket Categories", user: req.user, categories, error: "Category name already exists or failed to create" });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params["id"]!);
  try {
    await prisma.ticketCategory.delete({ where: { id } });
    res.redirect("/categories");
  } catch {
    res.redirect("/categories");
  }
}
