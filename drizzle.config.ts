import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { defineConfig } from "drizzle-kit";
import { getDatabasePath } from "./lib/db/config";

// Next.js と同じく .env の DATABASE_URL を使う（drizzle-kit は .env を読まないため）
if (existsSync(".env")) process.loadEnvFile(".env");
const databasePath = getDatabasePath();

// drizzle-kit はファイルの置き場所を作らないため、アプリ側（lib/db/client.ts）と同じく先に作る
mkdirSync(dirname(databasePath), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: databasePath },
});
