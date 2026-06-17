import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export async function listCustomers(req: Request, res: Response): Promise<void> {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
    res.render("customers/index", { title: "Customers", user: req.user, customers });
  } catch {
    res.render("error", { title: "Error", user: req.user, message: "Failed to load customers" });
  }
}

export async function showCreateCustomer(req: Request, res: Response): Promise<void> {
  res.render("customers/form", { title: "Add Customer", user: req.user, editCustomer: null, error: null });
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const { name, contactPerson, phone, email, address } = req.body as Record<string, string>;
  try {
    await prisma.customer.create({ data: { name, contactPerson: contactPerson || null, phone: phone || null, email: email || null, address: address || null } });
    res.redirect("/customers");
  } catch {
    res.render("customers/form", { title: "Add Customer", user: req.user, editCustomer: null, error: "Failed to create customer" });
  }
}

export async function showEditCustomer(req: Request, res: Response): Promise<void> {
  try {
    const editCustomer = await prisma.customer.findUnique({ where: { id: parseInt(req.params["id"]!) } });
    if (!editCustomer) { res.redirect("/customers"); return; }
    res.render("customers/form", { title: "Edit Customer", user: req.user, editCustomer, error: null });
  } catch {
    res.redirect("/customers");
  }
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params["id"]!);
  const { name, contactPerson, phone, email, address } = req.body as Record<string, string>;
  try {
    await prisma.customer.update({ where: { id }, data: { name, contactPerson: contactPerson || null, phone: phone || null, email: email || null, address: address || null } });
    res.redirect("/customers");
  } catch {
    res.redirect("/customers");
  }
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params["id"]!);
  try {
    await prisma.customer.delete({ where: { id } });
    res.redirect("/customers");
  } catch {
    res.redirect("/customers");
  }
}
