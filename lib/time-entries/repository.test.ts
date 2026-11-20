// @vitest-environment node
import { beforeEach, describe, expect, test } from "vitest";
import { createDb, type Db } from "@/lib/db/client";
import { timeEntries } from "@/lib/db/schema";
import {
  deleteEntry,
  getEntry,
  getRunningEntry,
  listEntriesBetween,
  listEntriesOfDay,
  listTaskNameSuggestions,
  startEntry,
  stopRunningEntry,
  updateEntry,
} from "./repository";
import { createProject, updateProject } from "@/lib/projects/repository";

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

/** 日本時間の日時（「2026-11-18T23:30:00」） */
const jst = (value: string) => new Date(`${value}+09:00`);

/** 記録を開始時刻の順に、タスク名・プロジェクト・開始・終了時刻だけにして返す */
function allEntries() {
  return db
    .select()
    .from(timeEntries)
    .all()
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
    .map(({ taskName, projectId, startedAt, endedAt }) => ({
      taskName,
      projectId,
      startedAt,
      endedAt,
    }));
}

describe("日をまたいだ記録の終了", () => {
  test("終了すると日の境目で分かれ、タスク名とプロジェクトを引き継ぐ", () => {
    const project = createProject(
      db,
      { name: "社内ツール", color: "blue", clientName: "", description: "" },
      jst("2026-11-18T09:00:00"),
    );
    const entry = startEntry(db, {
      taskName: "資料作成",
      projectId: project.id,
      now: jst("2026-11-18T23:30:00"),
    });

    const stopped = stopRunningEntry(db, jst("2026-11-19T00:30:00"));

    expect(stopped).toMatchObject({
      id: entry.id,
      endedAt: jst("2026-11-18T23:59:59"),
    });
    expect(allEntries()).toEqual([
      {
        taskName: "資料作成",
        projectId: project.id,
        startedAt: jst("2026-11-18T23:30:00"),
        endedAt: jst("2026-11-18T23:59:59"),
      },
      {
        taskName: "資料作成",
        projectId: project.id,
        startedAt: jst("2026-11-19T00:00:00"),
        endedAt: jst("2026-11-19T00:30:00"),
      },
    ]);
    expect(getRunningEntry(db)).toBeUndefined();
  });

  test("記録中に別のタスクを開始すると、前の記録が分かれて新しい記録が記録中になる", () => {
    startEntry(db, {
      taskName: "資料作成",
      now: jst("2026-11-18T23:00:00"),
    });

    const second = startEntry(db, {
      taskName: "打ち合わせ",
      now: jst("2026-11-19T01:00:00"),
    });

    expect(allEntries()).toEqual([
      {
        taskName: "資料作成",
        projectId: null,
        startedAt: jst("2026-11-18T23:00:00"),
        endedAt: jst("2026-11-18T23:59:59"),
      },
      {
        taskName: "資料作成",
        projectId: null,
        startedAt: jst("2026-11-19T00:00:00"),
        endedAt: jst("2026-11-19T01:00:00"),
      },
      {
        taskName: "打ち合わせ",
        projectId: null,
        startedAt: jst("2026-11-19T01:00:00"),
        endedAt: null,
      },
    ]);
    expect(getRunningEntry(db)?.id).toBe(second.id);
  });

  test("3 日にまたがると 3 件に分かれる", () => {
    startEntry(db, { taskName: "検証", now: jst("2026-11-17T22:00:00") });

    stopRunningEntry(db, jst("2026-11-19T02:00:00"));

    expect(
      allEntries().map(({ startedAt, endedAt }) => [startedAt, endedAt]),
    ).toEqual([
      [jst("2026-11-17T22:00:00"), jst("2026-11-17T23:59:59")],
      [jst("2026-11-18T00:00:00"), jst("2026-11-18T23:59:59")],
      [jst("2026-11-19T00:00:00"), jst("2026-11-19T02:00:00")],
    ]);
  });

  test("同じ日の中、またはちょうど 0 時に終了すると分かれない", () => {
    startEntry(db, { taskName: "資料作成", now: jst("2026-11-18T09:00:00") });
    stopRunningEntry(db, jst("2026-11-18T17:00:00"));
    startEntry(db, { taskName: "検証", now: jst("2026-11-18T23:00:00") });
    stopRunningEntry(db, jst("2026-11-19T00:00:00"));

    expect(
      allEntries().map(({ startedAt, endedAt }) => [startedAt, endedAt]),
    ).toEqual([
      [jst("2026-11-18T09:00:00"), jst("2026-11-18T17:00:00")],
      [jst("2026-11-18T23:00:00"), jst("2026-11-19T00:00:00")],
    ]);
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

describe("今日の一覧", () => {
  const now = at("12:00:00");

  test("今日に開始した記録を、開始時刻の新しい順に返す", () => {
    insertEntry("朝", at("08:00:00"), at("09:00:00"));
    insertEntry("昼", at("11:00:00"), null);

    expect(listEntriesOfDay(db, now).map((e) => e.taskName)).toEqual([
      "昼",
      "朝",
    ]);
  });

  test("日本時間の 0 時で分け、昨日に開始した記録は含まない", () => {
    insertEntry("今日の0時30分", at("00:30:00"), at("01:00:00"));
    insertEntry(
      "昨日の23時30分",
      new Date("2026-11-17T23:30:00+09:00"),
      at("00:10:00"),
    );

    expect(listEntriesOfDay(db, now).map((e) => e.taskName)).toEqual([
      "今日の0時30分",
    ]);
  });

  test("昨日から記録中の記録は含まない", () => {
    insertEntry("昨日から記録中", new Date("2026-11-17T23:00:00+09:00"), null);

    expect(listEntriesOfDay(db, now)).toEqual([]);
  });

  test("記録がなければ空", () => {
    expect(listEntriesOfDay(db, now)).toEqual([]);
  });
});

describe("期間の一覧", () => {
  const from = new Date("2026-10-01T00:00:00+09:00");
  const to = new Date("2026-11-01T00:00:00+09:00");
  /** 1 分間の終了した記録を入れる */
  const insertAt = (taskName: string, startedAt: Date) =>
    insertEntry(taskName, startedAt, new Date(startedAt.getTime() + 60_000));

  test("from ちょうどは含み、to ちょうどは含まない", () => {
    insertAt("from より 1 ミリ秒前", new Date(from.getTime() - 1));
    insertAt("from ちょうど", from);
    insertAt("to より 1 ミリ秒前", new Date(to.getTime() - 1));
    insertAt("to ちょうど", to);

    expect(listEntriesBetween(db, from, to).map((e) => e.taskName)).toEqual([
      "to より 1 ミリ秒前",
      "from ちょうど",
    ]);
  });

  test("開始時刻の新しい順に並び、同じ時刻なら後から入れた記録が先", () => {
    const noon = new Date("2026-10-15T12:00:00+09:00");
    insertAt("先", noon);
    insertAt("後", noon);
    insertAt("朝", new Date("2026-10-15T09:00:00+09:00"));
    insertAt("翌日", new Date("2026-10-16T09:00:00+09:00"));

    expect(listEntriesBetween(db, from, to).map((e) => e.taskName)).toEqual([
      "翌日",
      "後",
      "先",
      "朝",
    ]);
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

  test("終了時刻を翌日に直すと、元の記録は 23:59:59 で終わり翌日の記録が増える", () => {
    const entry = insertEntry(
      "資料作成",
      jst("2026-11-18T22:00:00"),
      jst("2026-11-18T23:00:00"),
    );

    const updated = updateEntry(
      db,
      entry.id,
      {
        taskName: "資料作成",
        startedAt: jst("2026-11-18T22:00:00"),
        endedAt: jst("2026-11-19T01:00:00"),
      },
      jst("2026-11-19T12:00:00"),
    );

    expect(updated).toMatchObject({
      id: entry.id,
      endedAt: jst("2026-11-18T23:59:59"),
    });
    expect(allEntries()).toEqual([
      {
        taskName: "資料作成",
        projectId: null,
        startedAt: jst("2026-11-18T22:00:00"),
        endedAt: jst("2026-11-18T23:59:59"),
      },
      {
        taskName: "資料作成",
        projectId: null,
        startedAt: jst("2026-11-19T00:00:00"),
        endedAt: jst("2026-11-19T01:00:00"),
      },
    ]);
  });

  test("開始時刻を前の日に直すと、元の記録は前の日の区間になり当日に 0:00:00 からの記録が増える", () => {
    const project = createProject(
      db,
      { name: "社内ツール", color: "teal", clientName: "", description: "" },
      jst("2026-11-18T09:00:00"),
    );
    const entry = db
      .insert(timeEntries)
      .values({
        taskName: "資料作成",
        projectId: project.id,
        startedAt: jst("2026-11-19T00:30:00"),
        endedAt: jst("2026-11-19T01:00:00"),
        createdAt: jst("2026-11-19T00:30:00"),
        updatedAt: jst("2026-11-19T00:30:00"),
      })
      .returning()
      .get();

    updateEntry(
      db,
      entry.id,
      {
        taskName: "資料作成",
        startedAt: jst("2026-11-18T23:30:00"),
        endedAt: jst("2026-11-19T01:00:00"),
      },
      jst("2026-11-19T12:00:00"),
    );

    expect(getEntry(db, entry.id)).toMatchObject({
      startedAt: jst("2026-11-18T23:30:00"),
      endedAt: jst("2026-11-18T23:59:59"),
    });
    expect(
      listEntriesOfDay(db, jst("2026-11-19T12:00:00")).map((e) => ({
        taskName: e.taskName,
        projectId: e.projectId,
        startedAt: e.startedAt,
        endedAt: e.endedAt,
      })),
    ).toEqual([
      {
        taskName: "資料作成",
        projectId: project.id,
        startedAt: jst("2026-11-19T00:00:00"),
        endedAt: jst("2026-11-19T01:00:00"),
      },
    ]);
  });

  test("記録中の記録の開始時刻を前の日に直しても分かれない", () => {
    const entry = insertEntry("資料作成", jst("2026-11-19T00:30:00"), null);

    updateEntry(
      db,
      entry.id,
      { taskName: "資料作成", startedAt: jst("2026-11-18T23:30:00") },
      jst("2026-11-19T12:00:00"),
    );

    expect(allEntries()).toEqual([
      {
        taskName: "資料作成",
        projectId: null,
        startedAt: jst("2026-11-18T23:30:00"),
        endedAt: null,
      },
    ]);
  });

  test("日をまたがない修正では件数が変わらない", () => {
    const entry = insertEntry("資料作成", at("09:00:00"), at("10:00:00"));

    updateEntry(
      db,
      entry.id,
      {
        taskName: "資料作成",
        startedAt: at("08:00:00"),
        endedAt: at("11:00:00"),
      },
      now,
    );

    expect(allEntries()).toHaveLength(1);
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

describe("プロジェクトの紐づけ", () => {
  const addProject = (name: string, color: "teal" | "blue" = "teal") =>
    createProject(
      db,
      { name, color, clientName: "", description: "" },
      at("08:00:00"),
    );

  test("プロジェクトを付けて開始でき、記録中の記録にプロジェクトが付く", () => {
    const project = addProject("社内ツール");

    const entry = startEntry(db, {
      taskName: "資料作成",
      projectId: project.id,
      now: at("09:00:00"),
    });

    expect(entry.projectId).toBe(project.id);
    expect(getRunningEntry(db)?.project).toEqual({
      id: project.id,
      name: "社内ツール",
      color: "teal",
    });
  });

  test("プロジェクトを省略して開始するとプロジェクトなし", () => {
    startEntry(db, { taskName: "資料作成", now: at("09:00:00") });

    expect(getRunningEntry(db)?.project).toBeNull();
  });

  test("一覧の記録にプロジェクトが付き、紐づかない記録は null", () => {
    const project = addProject("社内ツール");
    startEntry(db, {
      taskName: "資料作成",
      projectId: project.id,
      now: at("09:00:00"),
    });
    startEntry(db, { taskName: "打ち合わせ", now: at("10:00:00") });

    const entries = listEntriesOfDay(db, at("11:00:00"));
    expect(entries.map((e) => [e.taskName, e.project?.name ?? null])).toEqual([
      ["打ち合わせ", null],
      ["資料作成", "社内ツール"],
    ]);
    expect(
      listEntriesBetween(db, at("00:00:00"), at("23:59:59")).map(
        (e) => e.project?.name ?? null,
      ),
    ).toEqual([null, "社内ツール"]);
  });

  test("修正でプロジェクトを変える・外す。省略すれば変えない", () => {
    const a = addProject("社内ツール");
    const b = addProject("A 社サイト改修");
    const entry = startEntry(db, {
      taskName: "資料作成",
      projectId: a.id,
      now: at("09:00:00"),
    });
    const base = { taskName: "資料作成", startedAt: at("09:00:00") };

    updateEntry(db, entry.id, { ...base, projectId: b.id }, at("09:10:00"));
    expect(getRunningEntry(db)?.project?.name).toBe("A 社サイト改修");

    updateEntry(db, entry.id, base, at("09:20:00"));
    expect(getRunningEntry(db)?.project?.name).toBe("A 社サイト改修");

    updateEntry(db, entry.id, { ...base, projectId: null }, at("09:30:00"));
    expect(getRunningEntry(db)?.project).toBeNull();
  });

  test("プロジェクトを編集すると、記録の読み込み結果にも反映される", () => {
    const project = addProject("社内ツール");
    startEntry(db, {
      taskName: "資料作成",
      projectId: project.id,
      now: at("09:00:00"),
    });

    updateProject(
      db,
      project.id,
      {
        name: "社内ツール開発",
        color: "blue",
        clientName: "",
        description: "",
      },
      at("09:30:00"),
    );

    expect(getRunningEntry(db)?.project).toEqual({
      id: project.id,
      name: "社内ツール開発",
      color: "blue",
    });
  });
});
