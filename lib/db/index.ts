import "server-only";
import { createDb, type Db } from "./client";
import { getDatabasePath } from "./config";

let db: Db | undefined;

/**
 * アプリから使う DB 接続。初めて呼んだときに接続し、以降は同じ接続を返す。
 * サーバー側のコードからだけ import する。
 */
export function getDb(): Db {
  db ??= createDb(getDatabasePath());
  return db;
}
