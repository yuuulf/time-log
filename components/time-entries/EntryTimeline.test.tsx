import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  createEntryAction,
  deleteEntryAction,
  updateEntryAction,
} from "@/lib/time-entries/actions";
import { messages } from "@/lib/messages";
import { EntryTimeline, MINUTE_PX } from "./EntryTimeline";

vi.mock("@/lib/time-entries/actions", () => ({
  createEntryAction: vi.fn(),
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
}));

const t = messages.timeEntries;
const at = (time: string) => new Date(`2026-11-18T${time}+09:00`);
const now = at("15:00:00");
const project = { id: 1, name: "社内ツール", color: "teal" };

function blockStyle(name: RegExp) {
  return screen.getByRole("button", { name }).style;
}

describe("タイムラインの表示", () => {
  test("記録を時間軸に置き、タスク名と時刻を表示する", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "資料作成",
            startedAt: at("09:15:00"),
            endedAt: at("10:30:00"),
            project,
          },
        ]}
      />,
    );

    const block = screen.getByRole("button", {
      name: "資料作成 09:15〜10:30",
    });
    expect(block.textContent).toContain("資料作成");
    expect(block.textContent).toContain("09:15〜10:30");
    expect(block.title).toBe("資料作成 09:15〜10:30");
    expect(block.style.top).toBe(`${(9 * 60 + 15) * MINUTE_PX}px`);
    expect(block.style.height).toBe(`${75 * MINUTE_PX}px`);
    expect(block.className).toContain("bg-project-teal/15");
  });

  test("プロジェクトのない記録は控えめな色、タスク名がなければ「（タスク名なし）」", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "",
            startedAt: at("09:00:00"),
            endedAt: at("10:00:00"),
            project: null,
          },
        ]}
      />,
    );

    const block = screen.getByRole("button", {
      name: `${t.untitled} 09:00〜10:00`,
    });
    expect(block.className).toContain("bg-muted/15");
  });

  test("記録中の記録は開始から 30 分ぶんの高さで「記録中」と表示する", () => {
    render(
      <EntryTimeline
        now={at("14:00:00")}
        entries={[
          {
            id: 1,
            taskName: "打ち合わせ",
            startedAt: at("13:00:00"),
            endedAt: null,
          },
        ]}
      />,
    );

    const style = blockStyle(/打ち合わせ 13:00〜記録中/);
    expect(style.top).toBe(`${13 * 60 * MINUTE_PX}px`);
    expect(style.height).toBe(`${30 * MINUTE_PX}px`);
  });

  test("重なる記録は横に並べる", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "A",
            startedAt: at("09:00:00"),
            endedAt: at("10:00:00"),
          },
          {
            id: 2,
            taskName: "B",
            startedAt: at("09:30:00"),
            endedAt: at("11:00:00"),
          },
        ]}
      />,
    );

    expect(blockStyle(/^A /).left).toBe("0%");
    expect(blockStyle(/^B /).left).toBe("50%");
    expect(blockStyle(/^A /).width).toBe("calc(50% - 4px)");
  });

  test("短い記録も選べる高さにする", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "電話",
            startedAt: at("09:00:00"),
            endedAt: at("09:05:00"),
          },
        ]}
      />,
    );

    expect(blockStyle(/電話/).height).toBe("20px");
  });

  test("日付の見出しの右端に合計時間を表示する（記録中は含めない）", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "A",
            startedAt: at("09:00:00"),
            endedAt: at("10:30:00"),
          },
          {
            id: 2,
            taskName: "B",
            startedAt: at("11:00:00"),
            endedAt: at("11:45:00"),
          },
          { id: 3, taskName: "C", startedAt: at("14:00:00"), endedAt: null },
        ]}
      />,
    );

    const day = screen.getByRole("region", { name: "2026年11月18日（水）" });
    expect(within(day).getByRole("heading", { level: 3 }).textContent).toBe(
      "2026年11月18日（水）",
    );
    expect(day.textContent).toContain(`${t.dayTotal} 2時間15分`);
  });

  test("今日の記録がなくても 0 時〜24 時の目盛りと今の時刻の線を表示する", () => {
    render(<EntryTimeline now={now} entries={[]} />);

    const timeline = screen.getByRole("group", { name: t.timeline.label });
    expect(timeline.textContent).toContain("0:00");
    expect(timeline.textContent).toContain("23:00");
    expect(within(timeline).queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByTestId("timeline-now").style.top).toBe(
      `${15 * 60 * MINUTE_PX}px`,
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      t.listHeading,
    );
  });

  test("開いたときは今の時刻の 1 時間前までスクロールする", () => {
    render(<EntryTimeline now={now} entries={[]} />);

    expect(
      screen.getByRole("group", { name: t.timeline.label }).scrollTop,
    ).toBe(14 * 60 * MINUTE_PX);
  });
});

describe("タイムラインからの記録の追加", () => {
  const projects = [project, { id: 2, name: "A 社サイト改修", color: "blue" }];
  const editor = () =>
    screen.queryByRole("dialog", { name: t.timeline.editorLabel });
  const field = (label: string) =>
    within(editor()!).getByLabelText(label) as HTMLInputElement;
  /** タイムラインの dayStart からの分の位置をクリックする */
  const clickAt = (minute: number) => {
    const area = screen.getByTestId("timeline-area");
    area.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
    fireEvent.click(area, { clientY: minute * MINUTE_PX });
  };
  /** datetime-local の値を比べやすい形（秒まで）にする */
  const time = (value: string) => (value.length === 16 ? `${value}:00` : value);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    vi.mocked(createEntryAction).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderTimeline(
    entries: Parameters<typeof EntryTimeline>[0]["entries"] = [],
  ) {
    render(
      <EntryTimeline
        now={now}
        entries={entries}
        projects={projects}
        suggestions={["打ち合わせ", "資料作成"]}
      />,
    );
  }

  test("空いている場所を選ぶと、15 分に切り捨てた時刻から 30 分の入力欄が開き、タスク名にフォーカスする", () => {
    renderTimeline();

    clickAt(10 * 60 + 40);

    expect(editor()).not.toBeNull();
    expect(time(field(t.startedAt).value)).toBe("2026-11-18T10:30:00");
    expect(time(field(t.endedAt).value)).toBe("2026-11-18T11:00:00");
    expect(document.activeElement).toBe(field(t.taskName));
    expect(field(t.taskName).value).toBe("");
  });

  test("次の記録の手前までにする", () => {
    renderTimeline([
      {
        id: 1,
        taskName: "A",
        startedAt: at("11:00:00"),
        endedAt: at("12:00:00"),
      },
    ]);

    clickAt(10 * 60 + 55);

    expect(time(field(t.endedAt).value)).toBe("2026-11-18T11:00:00");
  });

  test("今より後の場所を選んでも開かない", () => {
    renderTimeline();

    clickAt(16 * 60);

    expect(editor()).toBeNull();
  });

  test("帯を選んでも追加の入力欄は開かない", () => {
    renderTimeline([
      {
        id: 1,
        taskName: "A",
        startedAt: at("09:00:00"),
        endedAt: at("10:00:00"),
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: /^A / }));

    expect(
      screen.queryByRole("button", { name: t.timeline.create }),
    ).toBeNull();
  });

  test("「記録の追加」ボタンで今の時刻までの 30 分の入力欄が開く", () => {
    vi.setSystemTime(at("15:10:40"));
    renderTimeline();

    fireEvent.click(screen.getByRole("button", { name: t.timeline.add }));

    expect(time(field(t.startedAt).value)).toBe("2026-11-18T14:40:00");
    expect(time(field(t.endedAt).value)).toBe("2026-11-18T15:10:00");
    expect(document.activeElement).toBe(field(t.taskName));
  });

  test("入力した内容を送り、保存できたら閉じる", async () => {
    vi.mocked(createEntryAction).mockResolvedValue({ ok: true });
    renderTimeline();
    clickAt(10 * 60 + 40);

    fireEvent.change(field(t.taskName), { target: { value: "打ち合わせ" } });
    fireEvent.click(screen.getByRole("button", { name: /プロジェクト/ }));
    fireEvent.click(screen.getByRole("option", { name: /社内ツール/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t.timeline.create }));
    });

    const formData = vi.mocked(createEntryAction).mock.calls[0][1];
    expect(formData.get("taskName")).toBe("打ち合わせ");
    expect(formData.get("projectId")).toBe("1");
    expect(time(String(formData.get("startedAt")))).toBe("2026-11-18T10:30:00");
    expect(time(String(formData.get("endedAt")))).toBe("2026-11-18T11:00:00");
    expect(editor()).toBeNull();
  });

  test("入力に誤りがあれば、入力欄を開いたまま値を残して理由を表示する", async () => {
    vi.mocked(createEntryAction).mockResolvedValue({
      errors: { endedAt: t.errors.endBeforeStart },
    });
    renderTimeline();
    clickAt(10 * 60 + 40);

    fireEvent.change(field(t.taskName), { target: { value: "打ち合わせ" } });
    fireEvent.change(field(t.endedAt), {
      target: { value: "2026-11-18T10:00:00" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t.timeline.create }));
    });

    expect(editor()).not.toBeNull();
    expect(field(t.taskName).value).toBe("打ち合わせ");
    expect(time(field(t.endedAt).value)).toBe("2026-11-18T10:00:00");
    expect(within(editor()!).getByRole("alert").textContent).toBe(
      t.errors.endBeforeStart,
    );
  });

  test("タスク名の入力候補を示す", () => {
    renderTimeline();
    clickAt(10 * 60);

    const listId = field(t.taskName).getAttribute("list");
    const options = document
      .getElementById(listId!)
      ?.querySelectorAll("option");
    expect([...(options ?? [])].map((o) => o.value)).toEqual([
      "打ち合わせ",
      "資料作成",
    ]);
  });
});

describe("タイムラインの入力欄の開閉", () => {
  const editor = () =>
    screen.queryByRole("dialog", { name: t.timeline.editorLabel });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("Escape キーで保存せずに閉じ、「記録の追加」ボタンにフォーカスを戻す", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    const add = screen.getByRole("button", { name: t.timeline.add });
    add.focus();
    fireEvent.click(add);

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    expect(editor()).toBeNull();
    expect(createEntryAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(add);
  });

  test("「閉じる」で閉じる", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    fireEvent.click(screen.getByRole("button", { name: t.timeline.add }));

    fireEvent.click(screen.getByRole("button", { name: t.timeline.close }));

    expect(editor()).toBeNull();
  });

  test("外側を選ぶと閉じる", () => {
    render(
      <div>
        <p>外側</p>
        <EntryTimeline now={now} entries={[]} />
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: t.timeline.add }));

    fireEvent.pointerDown(screen.getByText("外側"));

    expect(editor()).toBeNull();
  });

  test("入力欄は同時に 1 つだけ開く", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    const add = screen.getByRole("button", { name: t.timeline.add });

    fireEvent.click(add);
    fireEvent.pointerDown(add);
    fireEvent.click(add);

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
});

describe("タイムラインでの記録の修正と削除", () => {
  const archived = { id: 9, name: "旧案件", color: "pink" };
  const entries = [
    {
      id: 5,
      taskName: "資料作成",
      startedAt: at("09:00:00"),
      endedAt: at("10:00:00"),
      project,
    },
    {
      id: 6,
      taskName: "打ち合わせ",
      startedAt: at("13:00:00"),
      endedAt: null,
      project: archived,
    },
  ];
  const editor = () =>
    screen.queryByRole("dialog", { name: t.timeline.editorLabel });
  const field = (label: string) =>
    within(editor()!).queryByLabelText(label) as HTMLInputElement | null;
  const time = (value: string) => (value.length === 16 ? `${value}:00` : value);

  beforeEach(() => {
    vi.mocked(updateEntryAction).mockReset();
    vi.mocked(deleteEntryAction).mockReset();
    render(
      <EntryTimeline
        now={now}
        entries={entries}
        projects={[project]}
        suggestions={[]}
      />,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("帯を選ぶと今の値の入った入力欄が開き、「保存」で修正を送って閉じる", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({ ok: true });
    fireEvent.click(screen.getByRole("button", { name: /^資料作成 / }));

    expect(field(t.taskName)!.value).toBe("資料作成");
    expect(time(field(t.startedAt)!.value)).toBe("2026-11-18T09:00:00");
    expect(time(field(t.endedAt)!.value)).toBe("2026-11-18T10:00:00");
    expect(
      within(editor()!).getByRole("button", { name: /社内ツール/ }),
    ).toBeDefined();

    fireEvent.change(field(t.endedAt)!, {
      target: { value: "2026-11-18T10:30:00" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t.timeline.save }));
    });

    const [id, , formData] = vi.mocked(updateEntryAction).mock.calls[0];
    expect(id).toBe(5);
    expect(formData.get("taskName")).toBe("資料作成");
    expect(formData.get("projectId")).toBe("1");
    expect(time(String(formData.get("endedAt")))).toBe("2026-11-18T10:30:00");
    expect(editor()).toBeNull();
  });

  test("記録中の記録の帯では終了時刻の欄を出さず、アーカイブしたプロジェクトの名前を出す", () => {
    fireEvent.click(screen.getByRole("button", { name: /^打ち合わせ / }));

    expect(field(t.taskName)!.value).toBe("打ち合わせ");
    expect(field(t.startedAt)).not.toBeNull();
    expect(field(t.endedAt)).toBeNull();
    expect(
      within(editor()!).getByRole("button", { name: /旧案件/ }),
    ).toBeDefined();
  });

  test("「削除」で確認してから削除し、閉じる", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteEntryAction).mockResolvedValue({ ok: true });
    fireEvent.click(screen.getByRole("button", { name: /^資料作成 / }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));
    });

    expect(window.confirm).toHaveBeenCalledWith(t.confirmDelete);
    expect(deleteEntryAction).toHaveBeenCalledWith(5);
    expect(editor()).toBeNull();
  });

  test("削除の確認で取り消すと削除せず、入力欄は開いたまま", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: /^資料作成 / }));

    fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));

    expect(deleteEntryAction).not.toHaveBeenCalled();
    expect(editor()).not.toBeNull();
  });

  test("「閉じる」で保存せずに閉じ、フォーカスは帯に戻る", () => {
    const block = screen.getByRole("button", { name: /^資料作成 / });
    fireEvent.click(block);
    fireEvent.change(field(t.taskName)!, { target: { value: "資料レビュー" } });

    fireEvent.click(screen.getByRole("button", { name: t.timeline.close }));

    expect(editor()).toBeNull();
    expect(updateEntryAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(block);
  });

  test("追加の入力欄には「削除」がない", () => {
    fireEvent.click(screen.getByRole("button", { name: t.timeline.add }));

    expect(
      within(editor()!).queryByRole("button", { name: t.actions.delete }),
    ).toBeNull();
  });
});
