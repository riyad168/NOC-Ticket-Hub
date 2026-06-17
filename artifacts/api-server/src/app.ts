import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import ticketRoutes from "./routes/tickets.js";
import userRoutes from "./routes/users.js";
import customerRoutes from "./routes/customers.js";
import categoryRoutes from "./routes/categories.js";
import reportRoutes from "./routes/reports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "..", "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.get("/", (req, res) => res.redirect("/dashboard"));
app.get("/healthz", (req, res) => res.json({ ok: true }));

app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", ticketRoutes);
app.use("/", userRoutes);
app.use("/", customerRoutes);
app.use("/", categoryRoutes);
app.use("/", reportRoutes);

app.use((req, res) => {
  res.status(404).render("error", {
    title: "404 Not Found",
    user: (req as unknown as { user?: unknown }).user,
    message: "The page you are looking for does not exist.",
  });
});

export default app;
