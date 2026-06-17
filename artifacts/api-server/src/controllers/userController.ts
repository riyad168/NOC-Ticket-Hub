import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.render("users/index", { title: "Users", user: req.user, users, error: null, success: null });
  } catch {
    res.render("error", { title: "Error", user: req.user, message: "Failed to load users" });
  }
}

export async function showCreateUser(req: Request, res: Response): Promise<void> {
  res.render("users/form", { title: "Create User", user: req.user, editUser: null, error: null });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body as Record<string, string>;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.render("users/form", { title: "Create User", user: req.user, editUser: null, error: "Email already exists" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, password: hashed, role: role as "admin" | "noc_engineer" | "manager" } });
    res.redirect("/users");
  } catch {
    res.render("users/form", { title: "Create User", user: req.user, editUser: null, error: "Failed to create user" });
  }
}

export async function showEditUser(req: Request, res: Response): Promise<void> {
  try {
    const editUser = await prisma.user.findUnique({ where: { id: parseInt(req.params["id"]!) } });
    if (!editUser) { res.redirect("/users"); return; }
    res.render("users/form", { title: "Edit User", user: req.user, editUser, error: null });
  } catch {
    res.redirect("/users");
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params["id"]!);
  const { name, email, password, role } = req.body as Record<string, string>;
  try {
    const data: Record<string, unknown> = { name, email, role };
    if (password && password.trim()) {
      data["password"] = await bcrypt.hash(password, 10);
    }
    await prisma.user.update({ where: { id }, data: data as Parameters<typeof prisma.user.update>[0]["data"] });
    res.redirect("/users");
  } catch {
    const editUser = await prisma.user.findUnique({ where: { id } });
    res.render("users/form", { title: "Edit User", user: req.user, editUser, error: "Failed to update user" });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params["id"]!);
  try {
    if (id === req.user!.id) {
      res.redirect("/users");
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.redirect("/users");
  } catch {
    res.redirect("/users");
  }
}
