import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { defineConfig } from "drizzle-kit";
import { databasePath } from "./lib/db/config";

// drizzle-kit はファイルの置き場所を作らないため、アプリ側（lib/db/client.ts）と同じく先に作る
mkdirSync(dirname(databasePath), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: databasePath },
});
