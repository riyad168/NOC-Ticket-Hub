import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const JWT_SECRET = process.env["JWT_SECRET"] || "noc_secret_key_2025";

export async function showLogin(req: Request, res: Response): Promise<void> {
  res.render("auth/login", { title: "Login", error: null });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.render("auth/login", { title: "Login", error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.render("auth/login", { title: "Login", error: "Invalid email or password" });
      return;
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.cookie("token", token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 });
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.render("auth/login", { title: "Login", error: "Server error. Please try again." });
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie("token");
  res.redirect("/login");
}
