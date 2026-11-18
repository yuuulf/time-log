/** SQLite のデータベースファイルのパス。環境変数 DATABASE_URL で変更できる */
export function getDatabasePath() {
  return process.env.DATABASE_URL ?? "data/timelog.db";
}
