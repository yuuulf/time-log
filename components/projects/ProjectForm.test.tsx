import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { PROJECT_COLORS, projectColorName } from "@/lib/projects/colors";
import { ProjectForm } from "./ProjectForm";

vi.mock("@/lib/projects/actions", () => ({
  createProjectAction: vi.fn(),
  updateProjectAction: vi.fn(),
}));

const { createProjectAction, updateProjectAction } =
  await import("@/lib/projects/actions");
const t = messages.projects;

beforeEach(() => {
  vi.mocked(createProjectAction).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(updateProjectAction).mockReset().mockResolvedValue({ ok: true });
});

const input = (label: string) => screen.getByLabelText<HTMLInputElement>(label);
const radio = (color: (typeof PROJECT_COLORS)[number]) =>
  screen.getByRole<HTMLInputElement>("radio", {
    name: projectColorName(color),
  });

describe("登録", () => {
  test("色の選択肢は 10 個で、最初は先頭の色を選んでいる", () => {
    render(<ProjectForm />);

    const group = screen.getByRole("group", { name: t.color });
    expect(group.querySelectorAll("input[type=radio]")).toHaveLength(10);
    expect(radio(PROJECT_COLORS[0]).checked).toBe(true);
    expect(
      screen.getByTitle(projectColorName("sky")).querySelector("input"),
    ).toBeDefined();
  });

  test("入力を送り、登録できたら入力欄を空に戻す", async () => {
    render(<ProjectForm />);
    fireEvent.change(input(t.name), { target: { value: "A 社サイト改修" } });
    fireEvent.change(input(t.clientName), { target: { value: "A 社" } });
    fireEvent.change(input(t.description), { target: { value: "説明" } });
    fireEvent.click(radio("blue"));

    fireEvent.click(screen.getByRole("button", { name: t.actions.create }));

    await vi.waitFor(() => expect(createProjectAction).toHaveBeenCalledOnce());
    const [, formData] = vi.mocked(createProjectAction).mock.calls[0];
    expect(Object.fromEntries(formData)).toEqual({
      name: "A 社サイト改修",
      clientName: "A 社",
      description: "説明",
      color: "blue",
    });
    await vi.waitFor(() => expect(input(t.name).value).toBe(""));
    expect(input(t.clientName).value).toBe("");
    expect(radio(PROJECT_COLORS[0]).checked).toBe(true);
  });

  test("入力エラーなら理由を表示し、入力した値を残す", async () => {
    vi.mocked(createProjectAction).mockResolvedValue({
      errors: { name: t.errors.nameTaken },
    });
    render(<ProjectForm />);
    fireEvent.change(input(t.name), { target: { value: "社内ツール" } });
    fireEvent.click(radio("green"));

    fireEvent.click(screen.getByRole("button", { name: t.actions.create }));

    expect(await screen.findByText(t.errors.nameTaken)).toBeDefined();
    expect(input(t.name).value).toBe("社内ツール");
    expect(input(t.name).getAttribute("aria-invalid")).toBe("true");
    expect(radio("green").checked).toBe(true);
  });
});

describe("編集", () => {
  const project = {
    id: 3,
    name: "社内ツール",
    color: "violet",
    clientName: "自社",
    description: "説明",
  };

  test("今の値が入っていて、保存で送り、成功したら閉じる", async () => {
    const onClose = vi.fn();
    render(<ProjectForm project={project} onClose={onClose} />);

    expect(input(t.name).value).toBe("社内ツール");
    expect(input(t.clientName).value).toBe("自社");
    expect(input(t.description).value).toBe("説明");
    expect(radio("violet").checked).toBe(true);

    fireEvent.change(input(t.name), { target: { value: "社内ツール開発" } });
    fireEvent.click(screen.getByRole("button", { name: t.actions.save }));

    await vi.waitFor(() => expect(updateProjectAction).toHaveBeenCalledOnce());
    const [id, , formData] = vi.mocked(updateProjectAction).mock.calls[0];
    expect(id).toBe(3);
    expect(formData.get("name")).toBe("社内ツール開発");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  test("キャンセルで保存せずに閉じる", () => {
    const onClose = vi.fn();
    render(<ProjectForm project={project} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.cancel }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(updateProjectAction).not.toHaveBeenCalled();
  });
});
