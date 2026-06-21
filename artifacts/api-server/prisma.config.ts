import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const rel of ["./.env", "../.env", "../../.env"]) {
  const p = resolve(__dirname, rel);
  if (existsSync(p)) { config({ path: p, override: false }); break; }
}

export default defineConfig({
  datasource: {
    url: process.env["DATABASE_URL"] ?? "postgresql://localhost:5432/noc_placeholder",
  },
  schema: "./prisma/schema.prisma",
});
