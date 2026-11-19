import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { PROJECT_COLORS, projectColorName } from "@/lib/projects/colors";
import { ProjectForm } from "./ProjectForm";

vi.mock("@/lib/projects/actions", () => ({
  createProjectAction: vi.fn(),
}));

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const { createProjectAction } = await import("@/lib/projects/actions");
const t = messages.projects;

beforeEach(() => {
  vi.mocked(createProjectAction).mockReset().mockResolvedValue({ ok: true });
  router.push.mockReset();
});

const input = (label: string) => screen.getByLabelText<HTMLInputElement>(label);
const radio = (color: (typeof PROJECT_COLORS)[number]) =>
  screen.getByRole<HTMLInputElement>("radio", {
    name: projectColorName(color),
  });

describe("登録", () => {
  test("一覧へ戻るリンク・見出し・項目・「プロジェクトを作成」を並べる", () => {
    render(<ProjectForm />);

    expect(
      screen
        .getByRole("link", { name: t.detail.backToList })
        .getAttribute("href"),
    ).toBe("/projects");
    expect(
      screen.getByRole("heading", { level: 1, name: t.formHeading }),
    ).toBeDefined();
    expect(input(t.name).value).toBe("");
    expect(input(t.description).getAttribute("rows")).toBe("8");
    expect(
      screen
        .getByRole("button", { name: t.actions.createSubmit })
        .getAttribute("type"),
    ).toBe("submit");
  });

  test("色の選択肢は 10 個で、最初は先頭の色を選んでいる", () => {
    render(<ProjectForm />);

    const group = screen.getByRole("group", { name: t.color });
    expect(group.querySelectorAll("input[type=radio]")).toHaveLength(10);
    expect(radio(PROJECT_COLORS[0]).checked).toBe(true);
    expect(
      screen.getByTitle(projectColorName("sky")).querySelector("input"),
    ).toBeDefined();
  });

  test("入力を送り、作成できたら一覧に戻る", async () => {
    render(<ProjectForm />);
    fireEvent.change(input(t.name), { target: { value: "A 社サイト改修" } });
    fireEvent.change(input(t.clientName), { target: { value: "A 社" } });
    fireEvent.change(input(t.description), { target: { value: "説明" } });
    fireEvent.click(radio("blue"));

    fireEvent.click(
      screen.getByRole("button", { name: t.actions.createSubmit }),
    );

    await vi.waitFor(() => expect(createProjectAction).toHaveBeenCalledOnce());
    const [, formData] = vi.mocked(createProjectAction).mock.calls[0];
    expect(Object.fromEntries(formData)).toEqual({
      name: "A 社サイト改修",
      clientName: "A 社",
      description: "説明",
      color: "blue",
    });
    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/projects"),
    );
  });

  test("入力エラーなら理由を表示し、入力した値を残す", async () => {
    vi.mocked(createProjectAction).mockResolvedValue({
      errors: { name: t.errors.nameTaken },
    });
    render(<ProjectForm />);
    fireEvent.change(input(t.name), { target: { value: "社内ツール" } });
    fireEvent.click(radio("green"));

    fireEvent.click(
      screen.getByRole("button", { name: t.actions.createSubmit }),
    );

    expect(await screen.findByText(t.errors.nameTaken)).toBeDefined();
    expect(input(t.name).value).toBe("社内ツール");
    expect(input(t.name).getAttribute("aria-invalid")).toBe("true");
    expect(radio("green").checked).toBe(true);
    // エラーのときは一覧に戻らない
    expect(router.push).not.toHaveBeenCalled();
  });
});
