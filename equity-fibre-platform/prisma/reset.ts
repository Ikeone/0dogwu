/**
 * Cross-platform DB reset: removes the local SQLite file, pushes the schema,
 * and seeds demo data. Works with zero configuration (no .env required).
 */
process.env.DATABASE_URL ??= "file:./dev.db";

import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

const dbFile = join(process.cwd(), "prisma", "dev.db");
rmSync(dbFile, { force: true });
rmSync(`${dbFile}-journal`, { force: true });

execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });
