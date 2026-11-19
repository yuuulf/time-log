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

describe("表示", () => {
  test("終了した記録は開始・終了時刻、タスク名、作業時間を表示する", () => {
    render(<EntryItem entry={finished} />);

    expect(screen.getByText("資料作成")).toBeDefined();
    expect(screen.getByText("09:00 – 10:05")).toBeDefined();
    expect(screen.getByText("1時間5分")).toBeDefined();
  });

  test("記録中の記録は作業時間の代わりに「記録中」と表示する", () => {
    render(<EntryItem entry={running} />);

    expect(screen.getByText(t.running)).toBeDefined();
    expect(screen.queryByText(/分$/)).toBeNull();
  });

  test("タスク名が空なら「（タスク名なし）」と表示する", () => {
    render(<EntryItem entry={{ ...finished, taskName: "" }} />);

    expect(screen.getByText(t.untitled)).toBeDefined();
  });
});

describe("修正", () => {
  test("修正ボタンで現在の値が入ったフォームを開く", () => {
    render(<EntryItem entry={finished} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));

    expect(screen.getByLabelText<HTMLInputElement>(t.taskName).value).toBe(
      "資料作成",
    );
    // datetime-local の値は、秒が 0 のとき秒を省いた形に正規化される
    expect(screen.getByLabelText<HTMLInputElement>(t.startedAt).value).toBe(
      "2026-11-18T09:00",
    );
    expect(screen.getByLabelText<HTMLInputElement>(t.endedAt).value).toBe(
      "2026-11-18T10:05",
    );
  });

  test("秒まで表示し、時刻を変えずに保存しても秒が失われない", () => {
    render(<EntryItem entry={{ ...finished, startedAt: at("09:00:15") }} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));

    expect(screen.getByLabelText<HTMLInputElement>(t.startedAt).value).toBe(
      "2026-11-18T09:00:15",
    );
  });

  test("記録中の記録では終了時刻の欄を表示しない", () => {
    render(<EntryItem entry={running} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));

    expect(screen.getByLabelText(t.startedAt)).toBeDefined();
    expect(screen.queryByLabelText(t.endedAt)).toBeNull();
  });

  test("保存ボタンで入力を送り、成功したらフォームを閉じる", async () => {
    render(<EntryItem entry={finished} />);
    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));

    fireEvent.change(screen.getByLabelText(t.endedAt), {
      target: { value: "2026-11-18T10:30:20" },
    });
    fireEvent.click(screen.getByRole("button", { name: t.actions.save }));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    const [id, , formData] = vi.mocked(updateEntryAction).mock.calls[0];
    expect(id).toBe(1);
    expect(formData.get("endedAt")).toBe("2026-11-18T10:30:20");
    expect(
      await screen.findByRole("button", { name: t.actions.edit }),
    ).toBeDefined();
  });

  test("入力エラーなら理由を表示し、入力した値を残す", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { endedAt: t.errors.endBeforeStart },
    });
    render(<EntryItem entry={finished} />);
    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));
    const endedAt = screen.getByLabelText<HTMLInputElement>(t.endedAt);

    fireEvent.change(endedAt, { target: { value: "2026-11-18T08:30:10" } });
    fireEvent.click(screen.getByRole("button", { name: t.actions.save }));

    expect(await screen.findByText(t.errors.endBeforeStart)).toBeDefined();
    expect(endedAt.value).toBe("2026-11-18T08:30:10");
    expect(endedAt.getAttribute("aria-invalid")).toBe("true");
  });

  test("キャンセルボタンで保存せずに閉じる", () => {
    render(<EntryItem entry={finished} />);
    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));

    fireEvent.click(screen.getByRole("button", { name: t.actions.cancel }));

    expect(updateEntryAction).not.toHaveBeenCalled();
    expect(screen.getByText("1時間5分")).toBeDefined();
  });
});

describe("削除", () => {
  test("確認で削除を選ぶと削除する", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<EntryItem entry={finished} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));

    expect(confirm).toHaveBeenCalledWith(t.confirmDelete);
    await vi.waitFor(() => expect(deleteEntryAction).toHaveBeenCalledWith(1));
  });

  test("確認で取り消すと削除しない", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<EntryItem entry={finished} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));

    expect(deleteEntryAction).not.toHaveBeenCalled();
  });

  test("削除に失敗したら理由を表示する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteEntryAction).mockResolvedValue({
      errors: { form: t.errors.notFound },
    });
    render(<EntryItem entry={finished} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));

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
    expect(screen.getByText("09:00 – 10:05")).toBeDefined();
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
      screen.getByRole("button", { name: t.actions.edit }).parentElement!
        .children.length;
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

  test("タスク名の右側にプロジェクトの色のアイコンを出し、名前で読み上げる", () => {
    render(<EntryItem entry={withProject} projects={projects} />);

    const icon = screen.getByRole("img", { name: "社内ツール" });
    expect(icon.getAttribute("title")).toBe("社内ツール");
    expect(icon.className).toContain("bg-project-teal");
    // 名前は文字では出さない
    expect(screen.queryByText("社内ツール")).toBeNull();
  });

  test("プロジェクトのない記録にはアイコンを出さない", () => {
    render(
      <EntryItem entry={{ ...finished, project: null }} projects={projects} />,
    );

    expect(screen.queryByRole("img")).toBeNull();
  });

  test("修正フォームは今のプロジェクトを選んだ状態で開き、選んだ値を送る", async () => {
    render(<EntryItem entry={withProject} projects={projects} />);
    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));
    const select = screen.getByLabelText<HTMLSelectElement>(t.project);

    expect(select.value).toBe("1");
    expect([...select.options].map((o) => o.textContent)).toEqual([
      t.noProject,
      "社内ツール",
      "A 社サイト改修",
    ]);

    fireEvent.change(select, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: t.actions.save }));

    await vi.waitFor(() => expect(updateEntryAction).toHaveBeenCalledOnce());
    expect(vi.mocked(updateEntryAction).mock.calls[0][2].get("projectId")).toBe(
      "",
    );
  });

  test("修正でプロジェクトが見つからなければ理由を表示し、選んだ値を残す", async () => {
    vi.mocked(updateEntryAction).mockResolvedValue({
      errors: { projectId: messages.projects.errors.notFound },
    });
    render(<EntryItem entry={withProject} projects={projects} />);
    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));
    const select = screen.getByLabelText<HTMLSelectElement>(t.project);

    fireEvent.change(select, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: t.actions.save }));

    expect(
      await screen.findByText(messages.projects.errors.notFound),
    ).toBeDefined();
    expect(select.value).toBe("2");
    expect(select.getAttribute("aria-invalid")).toBe("true");
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
