import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { StartStopForm } from "./StartStopForm";

vi.mock("@/lib/time-entries/actions", () => ({
  startEntryAction: vi.fn(),
  stopEntryAction: vi.fn(),
}));

const { startEntryAction, stopEntryAction } =
  await import("@/lib/time-entries/actions");
const t = messages.timeEntries;
const startedAt = new Date("2026-11-18T09:05:00+09:00");

beforeEach(() => {
  vi.mocked(startEntryAction).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(stopEntryAction).mockReset().mockResolvedValue(undefined);
});

describe("記録中のタスクがないとき", () => {
  test("入力欄と「開始する」を表示し、「終了する」は表示しない", () => {
    render(<StartStopForm running={null} suggestions={[]} />);

    expect(screen.getByLabelText(t.taskName)).toBeDefined();
    expect(screen.getByRole("button", { name: t.actions.start })).toBeDefined();
    expect(screen.queryByRole("button", { name: t.actions.stop })).toBeNull();
  });

  test("「開始する」で入力したタスク名を送り、成功したら入力欄を空にする", async () => {
    render(<StartStopForm running={null} suggestions={[]} />);
    const input = screen.getByLabelText<HTMLInputElement>(t.taskName);

    fireEvent.change(input, { target: { value: "資料作成" } });
    fireEvent.click(screen.getByRole("button", { name: t.actions.start }));

    await vi.waitFor(() => expect(startEntryAction).toHaveBeenCalledOnce());
    const formData = vi.mocked(startEntryAction).mock.calls[0][1];
    expect(formData.get("taskName")).toBe("資料作成");
    await vi.waitFor(() => expect(input.value).toBe(""));
  });

  test("入力エラーを表示し、入力欄の値を残す", async () => {
    vi.mocked(startEntryAction).mockResolvedValue({
      errors: { taskName: t.errors.taskNameTooLong },
    });
    render(<StartStopForm running={null} suggestions={[]} />);
    const input = screen.getByLabelText<HTMLInputElement>(t.taskName);

    fireEvent.change(input, { target: { value: "あ".repeat(201) } });
    fireEvent.click(screen.getByRole("button", { name: t.actions.start }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      t.errors.taskNameTooLong,
    );
    expect(input.value).toBe("あ".repeat(201));
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("記録中のタスクがあるとき", () => {
  test("タスク名・開始時刻・「終了する」と、別のタスクを始める入力欄を表示する", () => {
    render(
      <StartStopForm
        running={{ taskName: "資料作成", startedAt }}
        suggestions={[]}
      />,
    );

    expect(screen.getByText("資料作成")).toBeDefined();
    expect(screen.getByText(`${t.startedAt} 09:05`)).toBeDefined();
    expect(screen.getByRole("button", { name: t.actions.stop })).toBeDefined();
    expect(screen.getByRole("button", { name: t.actions.start })).toBeDefined();
  });

  test("タスク名が空なら「（タスク名なし）」と表示する", () => {
    render(
      <StartStopForm running={{ taskName: "", startedAt }} suggestions={[]} />,
    );

    expect(screen.getByText(t.untitled)).toBeDefined();
  });

  test("「終了する」で記録を終了する", async () => {
    render(
      <StartStopForm
        running={{ taskName: "資料作成", startedAt }}
        suggestions={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: t.actions.stop }));

    await vi.waitFor(() => expect(stopEntryAction).toHaveBeenCalledOnce());
  });
});

test("過去のタスク名を入力候補として示す", () => {
  render(
    <StartStopForm running={null} suggestions={["資料作成", "打ち合わせ"]} />,
  );
  const input = screen.getByLabelText(t.taskName);
  const datalist = document.getElementById(input.getAttribute("list") ?? "");

  expect(
    [...(datalist?.querySelectorAll("option") ?? [])].map((o) => o.value),
  ).toEqual(["資料作成", "打ち合わせ"]);
});
