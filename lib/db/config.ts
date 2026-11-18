/** SQLite のデータベースファイルのパス。環境変数 DATABASE_URL で変更できる */
export const databasePath = process.env.DATABASE_URL ?? "data/timelog.db";
