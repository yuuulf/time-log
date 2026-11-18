import "server-only";
import { createDb } from "./client";
import { getDatabasePath } from "./config";

/** アプリから使う DB 接続。サーバー側のコードからだけ import する */
export const db = createDb(getDatabasePath());
