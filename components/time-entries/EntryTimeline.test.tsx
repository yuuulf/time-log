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

/** タイムラインの dayStart からの分の位置（空いている場所）をクリックする */
function clickArea(minute: number) {
  const area = screen.getByTestId("timeline-area");
  area.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  fireEvent.click(area, { clientY: minute * MINUTE_PX });
}

/** jsdom が calc() を書き換えるので、期待する値も同じく書き換えて比べる */
function css(property: "left" | "width", value: string) {
  const element = document.createElement("div");
  element.style[property] = value;
  return element.style[property];
}

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
    // タスク名と時刻を 1 行に並べる
    expect(block.textContent).toBe("資料作成 09:15〜10:30");
    expect(block.querySelectorAll(":scope > span")).toHaveLength(1);
    expect(block.firstElementChild?.className).toContain("truncate");
    // 長い帯でも文字は上下の真ん中ではなく上端に寄せる
    expect(block.className).toContain("flex");
    expect(block.className).toContain("items-start");
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

    expect(blockStyle(/^A /).left).toBe(css("left", "calc((100% - 2rem) * 0)"));
    expect(blockStyle(/^B /).left).toBe(
      css("left", "calc((100% - 2rem) * 0.5)"),
    );
    expect(blockStyle(/^A /).width).toBe(
      css("width", "calc((100% - 2rem) / 2 - 4px)"),
    );
  });

  test("短い記録が続くときは、上下に重ならないよう横に並べる", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "A",
            startedAt: at("09:00:00"),
            endedAt: at("09:05:00"),
          },
          {
            id: 2,
            taskName: "B",
            startedAt: at("09:05:00"),
            endedAt: at("09:10:00"),
          },
        ]}
      />,
    );

    expect(blockStyle(/^A /).left).toBe(css("left", "calc((100% - 2rem) * 0)"));
    expect(blockStyle(/^B /).left).toBe(
      css("left", "calc((100% - 2rem) * 0.5)"),
    );
  });

  test("帯は右端まで届かず、追加のために選べる幅を残す", () => {
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
        ]}
      />,
    );

    expect(blockStyle(/^A /).width).toBe(
      css("width", "calc((100% - 2rem) / 1 - 4px)"),
    );
    // 右端の 2rem は帯で埋めない
    expect(blockStyle(/^A /).width).toContain("2rem");
    expect(blockStyle(/^A /).width).not.toBe("calc(100% - 4px)");
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

  describe("枠の高さ", () => {
    /** 画面の高さと、枠の上端の位置（ページの上から。スクロールしていない状態）を決めて描く */
    const renderWith = (innerHeight: number, top: number) => {
      vi.stubGlobal("innerHeight", innerHeight);
      const original = HTMLElement.prototype.getBoundingClientRect;
      vi.spyOn(
        HTMLElement.prototype,
        "getBoundingClientRect",
      ).mockImplementation(function (this: HTMLElement) {
        return this.getAttribute("role") === "group"
          ? ({ top } as DOMRect)
          : original.call(this);
      });
      render(<EntryTimeline now={now} entries={[]} />);
      return screen.getByRole("group", { name: t.timeline.label });
    };

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    test("最小は 560px（35rem）で、枠の中でスクロールする", () => {
      const timeline = renderWith(700, 300);

      expect(timeline.className).toContain("max-h-[35rem]");
      expect(timeline.className).toContain("overflow-y-auto");
      expect(timeline.style.maxHeight).toBe("560px");
    });

    test("画面が高いときは、枠の下端を画面の下端（下の余白 24px を除く）まで広げる", () => {
      const timeline = renderWith(1200, 200);

      expect(timeline.style.maxHeight).toBe("976px");
    });

    test("画面の大きさが変わったら合わせ直す", () => {
      const timeline = renderWith(1200, 200);

      act(() => {
        vi.stubGlobal("innerHeight", 1000);
        window.dispatchEvent(new Event("resize"));
      });

      expect(timeline.style.maxHeight).toBe("776px");
    });
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

  test("記録のある時間でも、右端の帯のない幅を選ぶと入力欄が開く", () => {
    renderTimeline([
      {
        id: 1,
        taskName: "A",
        startedAt: at("09:00:00"),
        endedAt: at("10:00:00"),
      },
    ]);

    clickAt(9 * 60 + 20);

    expect(time(field(t.startedAt).value)).toBe("2026-11-18T09:15:00");
    expect(time(field(t.endedAt).value)).toBe("2026-11-18T09:45:00");
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

  test("Escape キーで保存せずに閉じる", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    clickArea(10 * 60);

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    expect(editor()).toBeNull();
    expect(createEntryAction).not.toHaveBeenCalled();
  });

  test("「記録の追加」ボタンはない", () => {
    render(<EntryTimeline now={now} entries={[]} />);

    expect(screen.queryByRole("button", { name: "記録の追加" })).toBeNull();
  });

  test("今の時刻の線より下では追加用のポインタの形を出さず、選んでも開かない", () => {
    render(<EntryTimeline now={now} entries={[]} />);

    const future = screen.getByTestId("timeline-future");
    expect(future.className).toContain("cursor-auto");
    expect(future.style.top).toBe(`${15 * 60 * MINUTE_PX}px`);
    expect(future.parentElement).toBe(screen.getByTestId("timeline-area"));
    expect(future.parentElement?.className).toContain("cursor-copy");

    fireEvent.click(future, { clientY: 16 * 60 * MINUTE_PX });
    expect(editor()).toBeNull();
  });

  test("入力欄の中では追加用のポインタの形を出さない", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    clickArea(10 * 60);

    expect(screen.getByTestId("timeline-area").className).toContain(
      "cursor-copy",
    );
    expect(editor()!.className).toContain("cursor-auto");
  });

  test("右上にバツのアイコンの「閉じる」がある", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    clickArea(10 * 60);

    const close = within(editor()!).getByRole("button", {
      name: t.timeline.close,
    });
    // 入力欄の最初の行（右寄せ）に置く
    expect(close.parentElement).toBe(editor()!.firstElementChild);
    expect(close.parentElement?.className).toContain("justify-end");
    expect(close.textContent).toBe("");
    // 枠を出さず、ポインタを合わせたときに背景を付ける
    expect(close.classList.contains("border")).toBe(false);
    expect(close.className).toContain("hover:bg-border/40");
  });

  test("「閉じる」で閉じる", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    clickArea(10 * 60);

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
    clickArea(10 * 60);

    fireEvent.pointerDown(screen.getByText("外側"));

    expect(editor()).toBeNull();
  });

  test("入力欄は同時に 1 つだけ開く", () => {
    render(<EntryTimeline now={now} entries={[]} />);
    clickArea(10 * 60);
    fireEvent.pointerDown(screen.getByTestId("timeline-area"));
    clickArea(11 * 60);

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
});

describe("タイムラインでの記録の修正と削除", () => {
  const archived = { id: 9, name: "旧案件", color: "pink" };
  const other = { id: 2, name: "A 社サイト改修", color: "blue" };
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
  const openBlock = (name: RegExp) => {
    const block = screen.getByRole("button", { name });
    fireEvent.click(block);
    return block;
  };
  const sent = () => {
    const [id, , formData] = vi.mocked(updateEntryAction).mock.calls[0];
    return { id, formData };
  };

  beforeEach(() => {
    vi.mocked(updateEntryAction).mockReset();
    vi.mocked(updateEntryAction).mockResolvedValue({ ok: true });
    vi.mocked(deleteEntryAction).mockReset();
    render(
      <EntryTimeline
        now={now}
        entries={entries}
        projects={[project, other]}
        suggestions={[]}
      />,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("帯を選ぶと今の値の入った入力欄が開き、保存・追加のボタンはない", () => {
    openBlock(/^資料作成 /);

    expect(field(t.taskName)!.value).toBe("資料作成");
    expect(time(field(t.startedAt)!.value)).toBe("2026-11-18T09:00:00");
    expect(time(field(t.endedAt)!.value)).toBe("2026-11-18T10:00:00");
    expect(
      within(editor()!).getByRole("button", { name: /社内ツール/ }),
    ).toBeDefined();
    expect(
      within(editor()!).queryByRole("button", { name: "保存" }),
    ).toBeNull();
    expect(
      within(editor()!).queryByRole("button", { name: t.timeline.create }),
    ).toBeNull();
  });

  test("時刻を変えてフォーカスを外すと保存する", async () => {
    openBlock(/^資料作成 /);

    fireEvent.change(field(t.endedAt)!, {
      target: { value: "2026-11-18T10:30:00" },
    });
    await act(async () => {
      fireEvent.blur(field(t.endedAt)!);
    });

    const { id, formData } = sent();
    expect(id).toBe(5);
    expect(formData.get("taskName")).toBe("資料作成");
    expect(formData.get("projectId")).toBe("1");
    expect(time(String(formData.get("endedAt")))).toBe("2026-11-18T10:30:00");
    // 保存しても入力欄は開いたまま
    expect(editor()).not.toBeNull();
  });

  test("Enter キーで確定すると保存する", async () => {
    openBlock(/^資料作成 /);
    const input = field(t.taskName)!;
    input.focus();

    fireEvent.change(input, { target: { value: "資料レビュー" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(sent().formData.get("taskName")).toBe("資料レビュー");
  });

  test("値を変えずにフォーカスを外しても保存しない", () => {
    openBlock(/^資料作成 /);

    fireEvent.blur(field(t.taskName)!);

    expect(updateEntryAction).not.toHaveBeenCalled();
  });

  test("プロジェクトを選ぶと保存する", async () => {
    openBlock(/^資料作成 /);

    fireEvent.click(
      within(editor()!).getByRole("button", { name: /社内ツール/ }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: /A 社サイト改修/ }));
    });

    expect(sent().formData.get("projectId")).toBe("2");
  });

  test("誤りがあれば開いたまま値を残して理由を表示する", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { endedAt: t.errors.endBeforeStart },
    });
    openBlock(/^資料作成 /);

    fireEvent.change(field(t.endedAt)!, {
      target: { value: "2026-11-18T08:30:00" },
    });
    await act(async () => {
      fireEvent.blur(field(t.endedAt)!);
    });

    expect(editor()).not.toBeNull();
    expect(time(field(t.endedAt)!.value)).toBe("2026-11-18T08:30:00");
    expect(within(editor()!).getByRole("alert").textContent).toBe(
      t.errors.endBeforeStart,
    );
  });

  test("記録中の記録の帯では終了時刻の欄を出さず、アーカイブしたプロジェクトの名前を出す", async () => {
    openBlock(/^打ち合わせ /);

    expect(field(t.taskName)!.value).toBe("打ち合わせ");
    expect(field(t.startedAt)).not.toBeNull();
    expect(field(t.endedAt)).toBeNull();
    expect(
      within(editor()!).getByRole("button", { name: /旧案件/ }),
    ).toBeDefined();

    fireEvent.change(field(t.taskName)!, { target: { value: "定例" } });
    await act(async () => {
      fireEvent.blur(field(t.taskName)!);
    });
    expect(sent().formData.has("endedAt")).toBe(false);
  });

  test("右上に「閉じる」と「その他の操作」を置き、メニューの「削除」で確認してから削除して閉じる", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteEntryAction).mockResolvedValue({ ok: true });
    openBlock(/^資料作成 /);

    const close = within(editor()!).getByRole("button", {
      name: t.timeline.close,
    });
    const more = within(editor()!).getByRole("button", {
      name: t.actions.more,
    });
    // 「その他の操作」は「閉じる」の左隣で、どちらも枠を出さない
    expect(more.closest("div")?.nextElementSibling).toBe(close);
    expect(more.classList.contains("border")).toBe(false);
    expect(close.classList.contains("border")).toBe(false);
    expect(
      within(editor()!).queryByRole("button", { name: t.actions.delete }),
    ).toBeNull();

    fireEvent.click(more);
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: t.actions.delete }));
    });

    expect(window.confirm).toHaveBeenCalledWith(t.confirmDelete);
    expect(deleteEntryAction).toHaveBeenCalledWith(5);
    expect(editor()).toBeNull();
  });

  test("削除の確認で取り消すと削除せず、入力欄は開いたまま", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    openBlock(/^資料作成 /);

    fireEvent.click(
      within(editor()!).getByRole("button", { name: t.actions.more }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: t.actions.delete }));

    expect(deleteEntryAction).not.toHaveBeenCalled();
    expect(editor()).not.toBeNull();
  });

  test("追加の入力欄には「その他の操作」がなく、「追加」は文字のボタン", () => {
    clickArea(10 * 60);

    expect(
      within(editor()!).queryByRole("button", { name: t.actions.more }),
    ).toBeNull();
    expect(
      within(editor()!).getByRole("button", { name: t.timeline.create })
        .textContent,
    ).toBe("追加");
  });

  test("Escape キーでは変えている値を保存せずに閉じ、フォーカスは帯に戻る", () => {
    const block = openBlock(/^資料作成 /);
    const input = field(t.taskName)!;
    input.focus();
    fireEvent.change(input, { target: { value: "資料レビュー" } });

    fireEvent.keyDown(input, { key: "Escape" });

    expect(editor()).toBeNull();
    expect(updateEntryAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(block);
  });

  test("「閉じる」では保存していない値を保存してから閉じ、フォーカスは帯に戻る", async () => {
    const block = openBlock(/^資料作成 /);
    fireEvent.change(field(t.taskName)!, { target: { value: "資料レビュー" } });

    await act(async () => {
      fireEvent.click(
        within(editor()!).getByRole("button", { name: t.timeline.close }),
      );
    });

    expect(updateEntryAction).toHaveBeenCalledOnce();
    expect(sent().formData.get("taskName")).toBe("資料レビュー");
    expect(editor()).toBeNull();
    expect(document.activeElement).toBe(block);
  });

  test("「閉じる」での保存に誤りがあれば閉じない", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { taskName: t.errors.taskNameTooLong },
    });
    openBlock(/^資料作成 /);
    fireEvent.change(field(t.taskName)!, {
      target: { value: "あ".repeat(201) },
    });

    await act(async () => {
      fireEvent.click(
        within(editor()!).getByRole("button", { name: t.timeline.close }),
      );
    });

    expect(editor()).not.toBeNull();
    expect(within(editor()!).getByRole("alert").textContent).toBe(
      t.errors.taskNameTooLong,
    );
  });

  test("値を変えずに「閉じる」と保存しない", () => {
    openBlock(/^資料作成 /);

    fireEvent.click(
      within(editor()!).getByRole("button", { name: t.timeline.close }),
    );

    expect(updateEntryAction).not.toHaveBeenCalled();
    expect(editor()).toBeNull();
  });
});
