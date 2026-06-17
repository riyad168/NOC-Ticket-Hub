import { Request, Response, NextFunction } from "express";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.redirect("/login");
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).render("error", {
        user: req.user,
        message: "Access denied. Insufficient permissions.",
        title: "403 Forbidden",
      });
      return;
    }
    next();
  };
}
