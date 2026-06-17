---
name: Prisma v7 setup quirks
description: How to correctly configure Prisma v7 in the Replit pnpm monorepo — breaking changes from v5/v6.
---

# Prisma v7 Setup Quirks

**Why:** Prisma v7 has major breaking changes vs v5/v6 that cause confusing errors.

## Key differences from v5/v6

1. `schema.prisma` datasource block must NOT have `url = env("DATABASE_URL")` — this causes a validation error.
2. Connection URL goes in `prisma.config.ts` (for CLI) and via a driver adapter (for runtime client).
3. `PrismaClient` does NOT accept `datasourceUrl` as a constructor option — throws unknown property error.

## Correct setup

**prisma/schema.prisma** — datasource has NO url:
```prisma
datasource db {
  provider = "postgresql"
}
```

**prisma.config.ts** — for CLI (db push, generate, etc.):
```ts
import { defineConfig, env } from "prisma/config";
export default defineConfig({
  datasource: { url: env("DATABASE_URL") },
  schema: "./prisma/schema.prisma",
});
```

**src/lib/prisma.ts** — for runtime, use `@prisma/adapter-pg`:
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });
export default prisma;
```

**Required packages:** `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@types/pg`

**pnpm-workspace.yaml** — must add to `onlyBuiltDependencies`:
```yaml
onlyBuiltDependencies:
  - '@prisma/engines'
  - prisma
```

**How to apply:** Any project using Prisma v7 in this workspace must follow this pattern.
