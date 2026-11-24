// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDb, type Db } from "@/lib/db/client";
import { DEFAULT_PROJECT_COLOR } from "@/lib/projects/colors";
import { createProject } from "@/lib/projects/repository";
import { timeEntries } from "@/lib/db/schema";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({ db: undefined as Db | undefined }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ getDb: () => mocks.db }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: vi.fn(async () => {}),
}));

const at = (date: string, time: string) => new Date(`${date}T${time}+09:00`);
const now = at("2026-11-24", "12:00:00");

let db: Db;

beforeEach(() => {
  db = createDb(":memory:");
  mocks.db = db;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

function addEntry(
  taskName: string,
  startedAt: Date,
  endedAt: Date | null,
  projectId: number | null = null,
) {
  db.insert(timeEntries)
    .values({
      taskName,
      startedAt,
      endedAt,
      projectId,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/history/export${query}`));

/** BOM と列名の行を外した、記録の行 */
async function rows(response: Response): Promise<string[]> {
  const text = await response.text();
  return text.replace(/^﻿/, "").split("\r\n").slice(1, -1);
}

test("月を指定すると、その月に開始した記録を CSV で返す", async () => {
  const project = createProject(
    db,
    {
      name: "社内ツール",
      color: DEFAULT_PROJECT_COLOR,
      clientName: "",
      description: "",
    },
    now,
  );
  addEntry(
    "資料作成",
    at("2026-11-18", "09:00:00"),
    at("2026-11-18", "10:05:30"),
    project.id,
  );
  addEntry(
    "10月の作業",
    at("2026-10-31", "09:00:00"),
    at("2026-10-31", "10:00:00"),
  );

  const response = await get("?month=2026-11");

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
  expect(response.headers.get("Content-Disposition")).toBe(
    `attachment; filename="timelog.csv"; filename*=UTF-8''${encodeURIComponent("記録 2026年11月.csv")}`,
  );
  expect(await rows(response)).toEqual([
    "2026-11-18,09:00:00,10:05:30,65,資料作成,社内ツール",
  ]);
});

test("月を指定しないと今月の記録を返す", async () => {
  addEntry("今月", at("2026-11-02", "09:00:00"), at("2026-11-02", "09:30:00"));
  addEntry("先月", at("2026-10-02", "09:00:00"), at("2026-10-02", "09:30:00"));

  const response = await get("");

  expect(response.headers.get("Content-Disposition")).toContain(
    encodeURIComponent("記録 2026年11月.csv"),
  );
  expect(await rows(response)).toEqual([
    "2026-11-02,09:00:00,09:30:00,30,今月,",
  ]);
});

test("期間を指定すると、その期間に開始した記録を古い順に返す", async () => {
  addEntry("前", at("2026-09-30", "23:00:00"), at("2026-09-30", "23:30:00"));
  addEntry("初日", at("2026-10-01", "00:00:00"), at("2026-10-01", "00:30:00"));
  addEntry("最終日", at("2026-10-15", "23:00:00"), null);
  addEntry("後", at("2026-10-16", "00:00:00"), at("2026-10-16", "00:30:00"));

  const response = await get("?from=2026-10-01&to=2026-10-15");

  expect(response.headers.get("Content-Disposition")).toContain(
    encodeURIComponent("記録 2026年10月1日〜2026年10月15日.csv"),
  );
  expect(await rows(response)).toEqual([
    "2026-10-01,00:00:00,00:30:00,30,初日,",
    "2026-10-15,23:00:00,,,最終日,",
  ]);
});

test("期間の指定に誤りがあると 400 を返す", async () => {
  const response = await get("?from=2026-10-15&to=2026-10-01");

  expect(response.status).toBe(400);
  expect(response.headers.get("Content-Disposition")).toBeNull();
});
