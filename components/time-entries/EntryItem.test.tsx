import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { EntryItem, type EntryItemData } from "./EntryItem";

vi.mock("@/lib/time-entries/actions", () => ({
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
  startEntryAction: vi.fn(),
}));

const { updateEntryAction, deleteEntryAction, startEntryAction } =
  await import("@/lib/time-entries/actions");
const t = messages.timeEntries;
const at = (time: string) => new Date(`2026-11-18T${time}+09:00`);

const finished: EntryItemData = {
  id: 1,
  taskName: "資料作成",
  startedAt: at("09:00:00"),
  endedAt: at("10:05:00"),
};
const running: EntryItemData = { ...finished, id: 2, endedAt: null };

beforeEach(() => {
  vi.mocked(updateEntryAction).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(deleteEntryAction).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(startEntryAction).mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** 行の入力欄 */
const field = (label: string) => screen.getByLabelText<HTMLInputElement>(label);

/** 時刻のボタン（読み上げ名は「開始時刻 09:00:00」の形） */
const timeButton = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label} `) });

/** 時刻のボタンを押して入力欄を開き、入力欄を返す */
function openTime(label: string) {
  fireEvent.click(timeButton(label));
  return field(label);
}

/** 最後に送った入力値 */
function lastSent() {
  const calls = vi.mocked(updateEntryAction).mock.calls;
  const [id, , formData] = calls[calls.length - 1];
  return { id, formData };
}

describe("表示", () => {
  test("終了した記録は、タスク名を入力欄に入れ、開始・終了時刻を時分で、作業時間を表示する", () => {
    render(<EntryItem entry={finished} />);

    expect(field(t.taskName).value).toBe("資料作成");
    expect(timeButton(t.startedAt).textContent).toBe("09:00");
    expect(timeButton(t.endedAt).textContent).toBe("10:05");
    expect(timeButton(t.startedAt).getAttribute("aria-label")).toBe(
      "開始時刻 09:00:00",
    );
    // 時刻の入力欄は、選ぶまで出さない
    expect(screen.queryByLabelText(t.startedAt)).toBeNull();
    expect(screen.getByText("1時間5分")).toBeDefined();
  });

  test("日をまたぐ記録も時分だけを出す", () => {
    render(
      <EntryItem
        entry={{
          ...finished,
          startedAt: at("23:30:00"),
          endedAt: new Date("2026-11-19T00:30:00+09:00"),
        }}
      />,
    );

    expect(timeButton(t.startedAt).textContent).toBe("23:30");
    expect(timeButton(t.endedAt).textContent).toBe("00:30");
    expect(screen.getByText("1時間0分")).toBeDefined();
  });

  test("記録中の記録は終了時刻を出さず、作業時間の代わりに「記録中」と表示する", () => {
    render(<EntryItem entry={running} />);

    expect(timeButton(t.startedAt)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: new RegExp(`^${t.endedAt} `) }),
    ).toBeNull();
    expect(screen.getByText(t.running)).toBeDefined();
    expect(screen.queryByText(/分$/)).toBeNull();
  });

  test("タスク名が空なら入力欄に「（タスク名なし）」を薄く出す", () => {
    render(<EntryItem entry={{ ...finished, taskName: "" }} />);

    expect(field(t.taskName).value).toBe("");
    expect(field(t.taskName).placeholder).toBe(t.untitled);
  });

  test("タスク名の入力欄は、フォーカスしたとき枠をテーマ色にする", () => {
    render(<EntryItem entry={finished} />);

    expect(field(t.taskName).className).toContain("focus:border-primary");
  });

  test("修正ボタンはない", () => {
    render(<EntryItem entry={finished} />);

    expect(screen.queryByRole("button", { name: "修正" })).toBeNull();
  });
});

describe("時刻の編集", () => {
  test("時刻を押すと、日付と時分秒の入力欄（カレンダーのアイコンなし）にフォーカスが移る", () => {
    render(<EntryItem entry={{ ...finished, startedAt: at("09:00:15") }} />);

    const input = openTime(t.startedAt);
    expect(input.type).toBe("datetime-local");
    expect(input.step).toBe("1");
    expect(input.value).toBe("2026-11-18T09:00:15");
    expect(document.activeElement).toBe(input);
    expect(input.className).toContain(
      "[&::-webkit-calendar-picker-indicator]:hidden",
    );
    // 時刻の表示の上に重ねるので、背景は透けさせない
    expect(input.className).toContain("bg-background");
    expect(input.className).not.toContain("bg-transparent");
  });

  test("Tab で時刻にフォーカスしても入力欄になる", () => {
    render(<EntryItem entry={finished} />);

    fireEvent.focus(timeButton(t.endedAt));

    expect(document.activeElement).toBe(field(t.endedAt));
  });

  test("値を変えずにフォーカスが外れたら、保存せずに時分の表示に戻る", () => {
    render(<EntryItem entry={finished} />);

    fireEvent.blur(openTime(t.startedAt));

    expect(screen.queryByLabelText(t.startedAt)).toBeNull();
    expect(timeButton(t.startedAt).textContent).toBe("09:00");
    expect(updateEntryAction).not.toHaveBeenCalled();
  });

  test("変えてフォーカスが外れたら保存し、入力した時刻を時分で表示する", async () => {
    render(<EntryItem entry={finished} />);
    const input = openTime(t.endedAt);

    fireEvent.change(input, { target: { value: "2026-11-18T10:30:20" } });
    fireEvent.blur(input);

    expect(timeButton(t.endedAt).textContent).toBe("10:30");
    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
  });

  test("Escape で戻したら時分の表示に戻る", () => {
    render(<EntryItem entry={finished} />);
    const input = openTime(t.endedAt);

    fireEvent.change(input, { target: { value: "2026-11-18T10:30:20" } });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.blur(input);

    expect(timeButton(t.endedAt).textContent).toBe("10:05");
    expect(updateEntryAction).not.toHaveBeenCalled();
  });
});

describe("直接編集", () => {
  test("値を変えてフォーカスが外れたら、今の値をすべて送る", async () => {
    render(<EntryItem entry={finished} />);

    fireEvent.change(field(t.taskName), { target: { value: "資料レビュー" } });
    fireEvent.blur(field(t.taskName));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    const { id, formData } = lastSent();
    expect(id).toBe(1);
    expect(formData.get("taskName")).toBe("資料レビュー");
    expect(formData.get("projectId")).toBe("");
    expect(formData.get("startedAt")).toBe("2026-11-18T09:00:00");
    expect(formData.get("endedAt")).toBe("2026-11-18T10:05:00");
  });

  test("時刻を変えてフォーカスが外れたら送る", async () => {
    render(<EntryItem entry={finished} />);

    const endedAt = openTime(t.endedAt);
    fireEvent.change(endedAt, { target: { value: "2026-11-18T10:30:20" } });
    fireEvent.blur(endedAt);

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.get("endedAt")).toBe("2026-11-18T10:30:20");
  });

  test("値を変えずにフォーカスが外れても送らない（秒の 0 の省略は変更とみなさない）", () => {
    render(<EntryItem entry={finished} />);

    fireEvent.focus(field(t.taskName));
    fireEvent.blur(field(t.taskName));
    const startedAt = openTime(t.startedAt);
    fireEvent.change(startedAt, { target: { value: "2026-11-18T09:00" } });
    fireEvent.blur(startedAt);

    expect(updateEntryAction).not.toHaveBeenCalled();
  });

  test("Enter キーで確定して送る", async () => {
    render(<EntryItem entry={finished} />);
    const taskName = field(t.taskName);
    taskName.focus();

    fireEvent.change(taskName, { target: { value: "資料レビュー" } });
    fireEvent.keyDown(taskName, { key: "Enter" });

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.get("taskName")).toBe("資料レビュー");
    expect(document.activeElement).not.toBe(taskName);
  });

  test("変換中の Enter では確定も保存もしない", () => {
    render(<EntryItem entry={finished} />);
    const taskName = field(t.taskName);
    taskName.focus();

    fireEvent.change(taskName, { target: { value: "資料レビュー" } });
    fireEvent.keyDown(taskName, { key: "Enter", isComposing: true });

    expect(updateEntryAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(taskName);
  });

  test("Escape キーで保存済みの値に戻し、送らない", () => {
    render(<EntryItem entry={finished} />);
    const taskName = field(t.taskName);
    taskName.focus();

    fireEvent.change(taskName, { target: { value: "資料レビュー" } });
    fireEvent.keyDown(taskName, { key: "Escape" });

    expect(taskName.value).toBe("資料作成");
    expect(updateEntryAction).not.toHaveBeenCalled();
  });

  test("記録中の記録では終了時刻を送らない", async () => {
    render(<EntryItem entry={running} />);

    fireEvent.change(field(t.taskName), { target: { value: "資料レビュー" } });
    fireEvent.blur(field(t.taskName));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.has("endedAt")).toBe(false);
  });

  test("入力エラーなら理由を行に表示し、入力した値を入力欄のまま残す", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { endedAt: t.errors.endBeforeStart },
    });
    render(<EntryItem entry={finished} />);

    const input = openTime(t.endedAt);
    fireEvent.change(input, { target: { value: "2026-11-18T08:30:10" } });
    fireEvent.blur(input);

    expect((await screen.findByRole("alert")).textContent).toBe(
      t.errors.endBeforeStart,
    );
    // エラーの欄は時分の表示に戻さず、入力欄のまま出す
    const endedAt = field(t.endedAt);
    expect(endedAt.value).toBe("2026-11-18T08:30:10");
    expect(endedAt.getAttribute("aria-invalid")).toBe("true");
    expect(
      document.getElementById(endedAt.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe(t.errors.endBeforeStart);
  });

  test("エラーの欄を保存済みの値に戻したら、保存せずにエラーを消して時分の表示に戻る", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { endedAt: t.errors.endBeforeStart },
    });
    render(<EntryItem entry={finished} />);
    const input = openTime(t.endedAt);
    fireEvent.change(input, { target: { value: "2026-11-18T08:30:10" } });
    fireEvent.blur(input);
    await screen.findByRole("alert");

    fireEvent.change(field(t.endedAt), {
      target: { value: "2026-11-18T10:05" },
    });
    fireEvent.blur(field(t.endedAt));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(timeButton(t.endedAt).textContent).toBe("10:05");
    expect(updateEntryAction).toHaveBeenCalledOnce();
  });

  test("エラーの欄で Escape を押しても、エラーを消して保存済みの値に戻る", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { taskName: t.errors.taskNameTooLong },
    });
    render(<EntryItem entry={finished} />);
    fireEvent.change(field(t.taskName), {
      target: { value: "あ".repeat(201) },
    });
    fireEvent.blur(field(t.taskName));
    await screen.findByRole("alert");

    fireEvent.keyDown(field(t.taskName), { key: "Escape" });
    fireEvent.blur(field(t.taskName));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(field(t.taskName).value).toBe("資料作成");
  });

  test("次に保存できたらエラーを消す", async () => {
    vi.mocked(updateEntryAction).mockResolvedValueOnce({
      errors: { taskName: t.errors.taskNameTooLong },
    });
    render(<EntryItem entry={finished} />);

    fireEvent.change(field(t.taskName), {
      target: { value: "あ".repeat(201) },
    });
    fireEvent.blur(field(t.taskName));
    await screen.findByRole("alert");

    fireEvent.change(field(t.taskName), { target: { value: "資料レビュー" } });
    fireEvent.blur(field(t.taskName));

    await vi.waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(field(t.taskName).getAttribute("aria-invalid")).toBeNull();
  });

  test("保存の後に記録が新しくなったら、編集中でない欄だけを合わせる", () => {
    const { rerender } = render(<EntryItem entry={finished} />);
    // タスク名を保存したあと、開始時刻を編集している途中
    fireEvent.change(field(t.taskName), { target: { value: "資料レビュー" } });
    fireEvent.change(openTime(t.startedAt), {
      target: { value: "2026-11-18T08:45:00" },
    });

    rerender(
      <EntryItem
        entry={{
          ...finished,
          taskName: "資料レビュー",
          endedAt: at("10:10:00"),
        }}
      />,
    );

    expect(field(t.taskName).value).toBe("資料レビュー");
    // 編集中の開始時刻は上書きしない
    expect(field(t.startedAt).value).toBe("2026-11-18T08:45");
    // 編集していない終了時刻は新しい値になる
    expect(timeButton(t.endedAt).textContent).toBe("10:10");
  });
});

describe("削除", () => {
  /** その他の操作のメニューから「削除」を選ぶ */
  const chooseDelete = () => {
    fireEvent.click(screen.getByRole("button", { name: t.actions.more }));
    fireEvent.click(screen.getByRole("menuitem", { name: t.actions.delete }));
  };

  test("行に削除ボタンは直接なく、その他の操作のメニューにごみ箱のアイコンと「削除」がある", () => {
    render(<EntryItem entry={finished} />);

    expect(screen.queryByRole("button", { name: t.actions.delete })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: t.actions.more }));
    const item = screen.getByRole("menuitem", { name: t.actions.delete });
    expect(item.textContent).toBe(t.actions.delete);
    expect(item.querySelector("svg.lucide-trash-2")).not.toBeNull();
  });

  test("確認で削除を選ぶと削除する", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<EntryItem entry={finished} />);

    chooseDelete();

    expect(confirm).toHaveBeenCalledWith(t.confirmDelete);
    await vi.waitFor(() => expect(deleteEntryAction).toHaveBeenCalledWith(1));
  });

  test("確認で取り消すと削除しない", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<EntryItem entry={finished} />);

    chooseDelete();

    expect(deleteEntryAction).not.toHaveBeenCalled();
  });

  test("削除に失敗したら理由を表示する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteEntryAction).mockResolvedValue({
      errors: { form: t.errors.notFound },
    });
    render(<EntryItem entry={finished} />);

    chooseDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(
      t.errors.notFound,
    );
  });
});

describe("再開", () => {
  test("終了した記録の再開ボタンで、同じタスク名で記録を始める", async () => {
    render(<EntryItem entry={finished} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.resume }));

    await vi.waitFor(() => expect(startEntryAction).toHaveBeenCalledOnce());
    const [, formData] = vi.mocked(startEntryAction).mock.calls[0];
    expect(formData.get("taskName")).toBe("資料作成");
    // 元の記録の表示は変わらない
    expect(field(t.taskName).value).toBe("資料作成");
  });

  test("タスク名のない記録は、タスク名を空にして記録を始める", async () => {
    render(<EntryItem entry={{ ...finished, taskName: "" }} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.resume }));

    await vi.waitFor(() => expect(startEntryAction).toHaveBeenCalledOnce());
    const [, formData] = vi.mocked(startEntryAction).mock.calls[0];
    expect(formData.get("taskName")).toBe("");
  });

  test("記録中の記録には再開ボタンを表示しない", () => {
    render(<EntryItem entry={running} />);

    expect(screen.queryByRole("button", { name: t.actions.resume })).toBeNull();
  });

  test("記録中の行は再開ボタンの場所を空けて、ボタンの列を他の行と揃える", () => {
    const { unmount } = render(<EntryItem entry={finished} />);
    const slots = () =>
      screen
        .getByRole("button", { name: t.actions.more })
        .closest(".flex.gap-2")!.children.length;
    const finishedSlots = slots();
    unmount();

    render(<EntryItem entry={running} />);

    expect(slots()).toBe(finishedSlots);
  });

  test("再開に失敗したら理由を表示する", async () => {
    vi.mocked(startEntryAction).mockResolvedValue({
      errors: { taskName: t.errors.taskNameTooLong },
    });
    render(<EntryItem entry={finished} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.resume }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      t.errors.taskNameTooLong,
    );
  });
});

describe("プロジェクト", () => {
  const projects = [
    { id: 1, name: "社内ツール", color: "teal" },
    { id: 2, name: "A 社サイト改修", color: "blue" },
  ];
  const withProject: EntryItemData = { ...finished, project: projects[0] };

  const pickerButton = (name: string) =>
    screen.getByRole("button", { name: t.projectButton(name) });

  test("タスク名の左側にプロジェクトの色のアイコンと名前を出す", () => {
    render(<EntryItem entry={withProject} projects={projects} />);

    const button = pickerButton("社内ツール");
    expect(button.textContent).toBe("社内ツール");
    expect(button.querySelector(".text-project-teal")).not.toBeNull();
    // タスク名の入力欄より前にある
    expect(
      button.compareDocumentPosition(field(t.taskName)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("プロジェクトのない記録は「プロジェクトなし」と出し、アイコンは出さない", () => {
    render(
      <EntryItem entry={{ ...finished, project: null }} projects={projects} />,
    );

    const button = pickerButton(t.noProject);
    expect(button.querySelector('[class*="text-project-"]')).toBeNull();
  });

  test("プルダウンで選ぶと、選んだプロジェクトと今の値を送る", async () => {
    render(<EntryItem entry={withProject} projects={projects} />);
    fireEvent.change(field(t.taskName), { target: { value: "資料レビュー" } });

    fireEvent.click(pickerButton("社内ツール"));
    fireEvent.click(screen.getByRole("option", { name: "A 社サイト改修" }));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    const { formData } = lastSent();
    expect(formData.get("projectId")).toBe("2");
    expect(formData.get("taskName")).toBe("資料レビュー");
    expect(pickerButton("A 社サイト改修")).toBeDefined();
  });

  test("「プロジェクトなし」を選ぶと空の projectId を送る", async () => {
    render(<EntryItem entry={withProject} projects={projects} />);

    fireEvent.click(pickerButton("社内ツール"));
    fireEvent.click(screen.getByRole("option", { name: t.noProject }));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.get("projectId")).toBe("");
  });

  test("タスク名を保存するときは今のプロジェクトを送る", async () => {
    render(<EntryItem entry={withProject} projects={projects} />);

    fireEvent.change(field(t.taskName), { target: { value: "資料レビュー" } });
    fireEvent.blur(field(t.taskName));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.get("projectId")).toBe("1");
  });

  test("プロジェクトが見つからなければ理由を表示し、選んだ値を残す", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { projectId: messages.projects.errors.notFound },
    });
    render(<EntryItem entry={withProject} projects={projects} />);

    fireEvent.click(pickerButton("社内ツール"));
    fireEvent.click(screen.getByRole("option", { name: "A 社サイト改修" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      messages.projects.errors.notFound,
    );
    const button = pickerButton("A 社サイト改修");
    expect(button.getAttribute("aria-invalid")).toBe("true");
  });

  test("アーカイブして選択肢にないプロジェクトの記録は、ボタンに名前を出し、タスク名の保存でもプロジェクトを変えない", async () => {
    const archived = { id: 9, name: "旧案件", color: "brown" };
    render(
      <EntryItem
        entry={{ ...finished, project: archived }}
        projects={projects}
      />,
    );

    expect(pickerButton("旧案件").textContent).toBe("旧案件");

    fireEvent.change(field(t.taskName), { target: { value: "資料レビュー" } });
    fireEvent.blur(field(t.taskName));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.get("projectId")).toBe("9");
  });

  test("保存の後に記録のプロジェクトが変わったら、表示も合わせる", () => {
    const { rerender } = render(
      <EntryItem entry={withProject} projects={projects} />,
    );

    rerender(
      <EntryItem
        entry={{ ...withProject, project: projects[1] }}
        projects={projects}
      />,
    );

    expect(pickerButton("A 社サイト改修")).toBeDefined();
  });

  test("再開ボタンは元の記録のプロジェクトを送る", async () => {
    render(<EntryItem entry={withProject} projects={projects} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.resume }));

    await vi.waitFor(() => expect(startEntryAction).toHaveBeenCalledOnce());
    const formData = vi.mocked(startEntryAction).mock.calls[0][1];
    expect(formData.get("taskName")).toBe("資料作成");
    expect(formData.get("projectId")).toBe("1");
  });

  test("プロジェクトのない記録の再開は「プロジェクトなし」を送る", async () => {
    render(<EntryItem entry={finished} projects={projects} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.resume }));

    await vi.waitFor(() => expect(startEntryAction).toHaveBeenCalledOnce());
    expect(vi.mocked(startEntryAction).mock.calls[0][1].get("projectId")).toBe(
      "",
    );
  });
});
