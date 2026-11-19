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
  test("入力欄と開始ボタンを表示し、終了ボタンは表示しない", () => {
    render(<StartStopForm running={null} suggestions={[]} />);

    expect(screen.getByLabelText(t.taskName)).toBeDefined();
    expect(screen.getByRole("button", { name: t.actions.start })).toBeDefined();
    expect(screen.queryByRole("button", { name: t.actions.stop })).toBeNull();
  });

  test("開始ボタンで入力したタスク名を送り、成功したら入力欄を空にする", async () => {
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
  test("タスク名・開始時刻・終了ボタンと、別のタスクを始める入力欄を表示する", () => {
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

  test("終了ボタンで記録を終了する", async () => {
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

describe("プロジェクト", () => {
  const projects = [
    { id: 1, name: "社内ツール", color: "teal" },
    { id: 2, name: "A 社サイト改修", color: "blue" },
  ];
  const picker = (name: string) =>
    screen.getByRole("button", { name: t.projectButton(name) });
  const choose = (current: string, name: string) => {
    fireEvent.click(picker(current));
    fireEvent.click(screen.getByRole("option", { name }));
  };

  test("選択肢は「プロジェクトなし」と渡したプロジェクトで色のアイコン付き、最初は「プロジェクトなし」", () => {
    render(
      <StartStopForm running={null} suggestions={[]} projects={projects} />,
    );

    fireEvent.click(picker(t.noProject));
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      t.noProject,
      "社内ツール",
      "A 社サイト改修",
    ]);
    expect(options[1].querySelector(".text-project-teal")).not.toBeNull();
    expect(options[2].querySelector(".text-project-blue")).not.toBeNull();
    expect(options[0].getAttribute("aria-selected")).toBe("true");
  });

  test("選んだプロジェクトを送り、開始できたら「プロジェクトなし」に戻す", async () => {
    render(
      <StartStopForm running={null} suggestions={[]} projects={projects} />,
    );
    choose(t.noProject, "A 社サイト改修");
    expect(picker("A 社サイト改修")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: t.actions.start }));

    await vi.waitFor(() => expect(startEntryAction).toHaveBeenCalledOnce());
    expect(vi.mocked(startEntryAction).mock.calls[0][1].get("projectId")).toBe(
      "2",
    );
    await vi.waitFor(() => expect(picker(t.noProject)).toBeDefined());
  });

  test("選ばなければ空の projectId を送る", async () => {
    render(
      <StartStopForm running={null} suggestions={[]} projects={projects} />,
    );

    fireEvent.click(screen.getByRole("button", { name: t.actions.start }));

    await vi.waitFor(() => expect(startEntryAction).toHaveBeenCalledOnce());
    expect(vi.mocked(startEntryAction).mock.calls[0][1].get("projectId")).toBe(
      "",
    );
  });

  test("プロジェクトが見つからなければ理由を表示し、選んだ値を残す", async () => {
    vi.mocked(startEntryAction).mockResolvedValue({
      errors: { projectId: messages.projects.errors.notFound },
    });
    render(
      <StartStopForm running={null} suggestions={[]} projects={projects} />,
    );
    choose(t.noProject, "社内ツール");

    fireEvent.click(screen.getByRole("button", { name: t.actions.start }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      messages.projects.errors.notFound,
    );
    expect(picker("社内ツール").getAttribute("aria-invalid")).toBe("true");
  });

  test("記録中の枠にはプロジェクトのアイコンと名前を文字で表示する", () => {
    const { container } = render(
      <StartStopForm
        running={{ taskName: "資料作成", startedAt, project: projects[0] }}
        suggestions={[]}
        projects={projects}
      />,
    );

    const section = screen.getByRole("region", { name: t.runningHeading });
    expect(section.textContent).toContain("社内ツール");
    const icon = section.querySelector('[title="社内ツール"]');
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".text-project-teal")).not.toBeNull();
  });

  test("プロジェクトのない記録中の枠にはアイコンを出さない", () => {
    render(
      <StartStopForm
        running={{ taskName: "資料作成", startedAt, project: null }}
        suggestions={[]}
        projects={projects}
      />,
    );

    const section = screen.getByRole("region", { name: t.runningHeading });
    expect(section.querySelector('[title="社内ツール"]')).toBeNull();
    expect(section.querySelector('[class*="text-project-"]')).toBeNull();
  });
});
