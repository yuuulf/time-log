import "server-only";
import { createDb } from "./client";
import { databasePath } from "./config";

/** アプリから使う DB 接続。サーバー側のコードからだけ import する */
export const db = createDb(databasePath);
