// @vitest-environment node
import { beforeEach, describe, expect, test } from "vitest";
import { createDb, type Db } from "@/lib/db/client";
import { timeEntries } from "@/lib/db/schema";
import {
  getEntry,
  getRunningEntry,
  startEntry,
  stopRunningEntry,
} from "./repository";

const at = (time: string) => new Date(`2026-11-18T${time}+09:00`);

let db: Db;

beforeEach(() => {
  db = createDb(":memory:");
});

describe("記録の開始と終了", () => {
  test("開始すると、現在時刻を開始時刻とする記録中の記録ができる", () => {
    const entry = startEntry(db, { taskName: "資料作成", now: at("09:00:00") });

    expect(entry).toMatchObject({
      taskName: "資料作成",
      startedAt: at("09:00:00"),
      endedAt: null,
    });
    expect(getRunningEntry(db)?.id).toBe(entry.id);
  });

  test("記録中に別のタスクを開始すると、記録中の記録は同じ時刻で終了する", () => {
    const first = startEntry(db, { taskName: "資料作成", now: at("09:00:00") });
    const second = startEntry(db, {
      taskName: "打ち合わせ",
      now: at("10:15:00"),
    });

    expect(getEntry(db, first.id)?.endedAt).toEqual(at("10:15:00"));
    expect(second.startedAt).toEqual(at("10:15:00"));
    expect(getRunningEntry(db)?.id).toBe(second.id);
    expect(db.select().from(timeEntries).all()).toHaveLength(2);
  });

  test("終了すると、現在時刻が終了時刻になり記録中の記録はなくなる", () => {
    const entry = startEntry(db, { taskName: "資料作成", now: at("09:00:00") });

    const stopped = stopRunningEntry(db, at("10:05:00"));

    expect(stopped).toMatchObject({ id: entry.id, endedAt: at("10:05:00") });
    expect(getRunningEntry(db)).toBeUndefined();
  });

  test("記録中の記録がないときの終了は何もしない", () => {
    startEntry(db, { taskName: "資料作成", now: at("09:00:00") });
    stopRunningEntry(db, at("10:00:00"));

    expect(stopRunningEntry(db, at("11:00:00"))).toBeUndefined();
    expect(db.select().from(timeEntries).all()[0].endedAt).toEqual(
      at("10:00:00"),
    );
  });

  test("記録中の記録を 2 件作ろうとすると DB が拒否する", () => {
    startEntry(db, { taskName: "資料作成", now: at("09:00:00") });
    const now = at("09:30:00");

    expect(() =>
      db
        .insert(timeEntries)
        .values({
          taskName: "別",
          startedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .run(),
    ).toThrow(/UNIQUE/);
  });
});
