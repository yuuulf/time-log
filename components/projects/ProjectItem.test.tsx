import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { ProjectItem } from "./ProjectItem";

vi.mock("@/lib/projects/actions", () => ({
  createProjectAction: vi.fn(),
  updateProjectAction: vi.fn(),
  deleteProjectAction: vi.fn(),
}));

const { deleteProjectAction } = await import("@/lib/projects/actions");
const t = messages.projects;

const project = {
  id: 3,
  name: "A 社サイト改修",
  color: "blue",
  clientName: "A 社",
  description: "2026 年度の改修",
};

beforeEach(() => {
  vi.mocked(deleteProjectAction).mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("表示", () => {
  test("色のアイコン・名前・クライアント名・説明を表示する", () => {
    const { container } = render(<ProjectItem project={project} />);

    expect(screen.getByText("A 社サイト改修")).toBeDefined();
    expect(screen.getByText("A 社")).toBeDefined();
    expect(screen.getByText("2026 年度の改修")).toBeDefined();
    expect(container.querySelector(".text-project-blue")).not.toBeNull();
  });

  test("クライアント名・説明が空なら何も表示しない", () => {
    const { container } = render(
      <ProjectItem project={{ ...project, clientName: "", description: "" }} />,
    );

    expect(container.querySelectorAll("p")).toHaveLength(1);
  });
});

describe("編集", () => {
  test("編集ボタンで今の値が入ったフォームを開き、キャンセルで閉じる", () => {
    render(<ProjectItem project={project} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.edit }));
    expect(screen.getByLabelText<HTMLInputElement>(t.name).value).toBe(
      "A 社サイト改修",
    );

    fireEvent.click(screen.getByRole("button", { name: t.actions.cancel }));
    expect(screen.queryByLabelText(t.name)).toBeNull();
    expect(screen.getByText("A 社サイト改修")).toBeDefined();
  });
});

describe("削除", () => {
  test("確認で削除を選ぶと削除する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProjectItem project={project} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));

    expect(window.confirm).toHaveBeenCalledWith(t.confirmDelete);
    await vi.waitFor(() => expect(deleteProjectAction).toHaveBeenCalledWith(3));
  });

  test("確認で取り消すと削除しない", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProjectItem project={project} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));

    expect(deleteProjectAction).not.toHaveBeenCalled();
  });

  test("記録が紐づいていて削除できなければ理由を表示する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteProjectAction).mockResolvedValue({
      errors: { form: t.errors.inUse },
    });
    render(<ProjectItem project={project} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.delete }));

    expect((await screen.findByRole("alert")).textContent).toBe(t.errors.inUse);
  });
});
