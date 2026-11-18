// @vitest-environment node
import { beforeEach, describe, expect, test } from "vitest";
import { createDb, type Db } from "@/lib/db/client";
import { timeEntries } from "@/lib/db/schema";
import {
  deleteEntry,
  getEntry,
  getRunningEntry,
  listRecentEntries,
  listTaskNameSuggestions,
  startEntry,
  stopRunningEntry,
  updateEntry,
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

/** 開始・終了時刻を指定して記録を入れる（テスト用） */
function insertEntry(taskName: string, startedAt: Date, endedAt: Date | null) {
  return db
    .insert(timeEntries)
    .values({
      taskName,
      startedAt,
      endedAt,
      createdAt: startedAt,
      updatedAt: startedAt,
    })
    .returning()
    .get();
}

describe("直近 30 日の一覧", () => {
  const now = at("12:00:00");
  const daysAgo = (days: number, plusMs = 0) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000 + plusMs);

  test("開始時刻の新しい順に並ぶ", () => {
    insertEntry("朝", at("08:00:00"), at("09:00:00"));
    insertEntry("昼", at("11:00:00"), null);
    insertEntry("昨日", daysAgo(1), daysAgo(1, 60_000));

    expect(listRecentEntries(db, now).map((e) => e.taskName)).toEqual([
      "昼",
      "朝",
      "昨日",
    ]);
  });

  test("ちょうど 30 日前に開始した記録は含み、それより前は含まない", () => {
    insertEntry("30日前", daysAgo(30), daysAgo(30, 60_000));
    insertEntry("30日前より1ミリ秒前", daysAgo(30, -1), daysAgo(30, 60_000));
    insertEntry("31日前", daysAgo(31), daysAgo(31, 60_000));

    expect(listRecentEntries(db, now).map((e) => e.taskName)).toEqual([
      "30日前",
    ]);
  });

  test("記録がなければ空", () => {
    expect(listRecentEntries(db, now)).toEqual([]);
  });
});

describe("タスク名の候補", () => {
  test("最近使った順に重複なく並び、空のタスク名は含まない", () => {
    insertEntry("資料作成", at("08:00:00"), at("09:00:00"));
    insertEntry("打ち合わせ", at("09:00:00"), at("10:00:00"));
    insertEntry("", at("10:00:00"), at("10:30:00"));
    insertEntry("資料作成", at("11:00:00"), null);

    expect(listTaskNameSuggestions(db)).toEqual(["資料作成", "打ち合わせ"]);
  });

  test("最大 20 件まで", () => {
    for (let i = 1; i <= 25; i++) {
      const start = new Date(at("00:00:00").getTime() + i * 60_000);
      insertEntry(`タスク${i}`, start, new Date(start.getTime() + 30_000));
    }

    const suggestions = listTaskNameSuggestions(db);
    expect(suggestions).toHaveLength(20);
    expect(suggestions[0]).toBe("タスク25");
    expect(suggestions[19]).toBe("タスク6");
  });
});

describe("記録の修正", () => {
  const now = at("12:00:00");

  test("終了した記録のタスク名・開始・終了時刻を変更できる", () => {
    const entry = insertEntry("資料作成", at("09:00:00"), at("10:00:00"));

    const updated = updateEntry(
      db,
      entry.id,
      {
        taskName: "資料レビュー",
        startedAt: at("09:10:00"),
        endedAt: at("10:30:00"),
      },
      now,
    );

    expect(updated).toMatchObject({
      taskName: "資料レビュー",
      startedAt: at("09:10:00"),
      endedAt: at("10:30:00"),
      updatedAt: now,
    });
  });

  test("記録中の記録では終了時刻を変えない", () => {
    const entry = insertEntry("資料作成", at("09:00:00"), null);

    const updated = updateEntry(
      db,
      entry.id,
      {
        taskName: "資料作成2",
        startedAt: at("08:50:00"),
        endedAt: at("11:00:00"),
      },
      now,
    );

    expect(updated).toMatchObject({
      taskName: "資料作成2",
      startedAt: at("08:50:00"),
      endedAt: null,
    });
    expect(getRunningEntry(db)?.id).toBe(entry.id);
  });

  test("存在しない記録の修正は undefined を返す", () => {
    expect(
      updateEntry(db, 999, { taskName: "x", startedAt: at("09:00:00") }, now),
    ).toBeUndefined();
  });
});

describe("記録の削除", () => {
  test("削除すると一覧から消える", () => {
    const entry = insertEntry("資料作成", at("09:00:00"), at("10:00:00"));
    const other = insertEntry("打ち合わせ", at("10:00:00"), at("11:00:00"));

    expect(deleteEntry(db, entry.id)).toBe(true);
    expect(getEntry(db, entry.id)).toBeUndefined();
    expect(getEntry(db, other.id)).toBeDefined();
  });

  test("存在しない記録の削除は false を返す", () => {
    expect(deleteEntry(db, 999)).toBe(false);
  });
});
