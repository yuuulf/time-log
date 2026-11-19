import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { ProjectItem } from "./ProjectItem";

vi.mock("@/lib/projects/actions", () => ({
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
  test("色のアイコン・名前・クライアント名を表示し、説明と編集ボタンは出さない", () => {
    const { container } = render(<ProjectItem project={project} />);

    expect(screen.getByText("A 社")).toBeDefined();
    expect(container.querySelector(".text-project-blue")).not.toBeNull();
    expect(screen.queryByText("2026 年度の改修")).toBeNull();
    expect(screen.queryByRole("button", { name: "編集" })).toBeNull();
    expect(screen.queryByRole("button", { name: t.actions.delete })).toBeNull();
    expect(
      screen.getByRole("button", { name: t.actions.more }).textContent,
    ).toBe("");
  });

  test("名前は詳細画面へのリンクになる", () => {
    render(<ProjectItem project={project} />);

    const link = screen.getByRole("link", { name: "A 社サイト改修" });
    expect(link.getAttribute("href")).toBe("/projects/3");
  });

  test("クライアント名が空なら何も表示しない", () => {
    const { container } = render(
      <ProjectItem project={{ ...project, clientName: "" }} />,
    );

    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("削除", () => {
  /** その他の操作のメニューから「削除」を選ぶ */
  const chooseDelete = () => {
    fireEvent.click(screen.getByRole("button", { name: t.actions.more }));
    fireEvent.click(screen.getByRole("menuitem", { name: t.actions.delete }));
  };

  test("メニューにごみ箱のアイコンと「削除」がある", () => {
    render(<ProjectItem project={project} />);

    fireEvent.click(screen.getByRole("button", { name: t.actions.more }));
    const item = screen.getByRole("menuitem", { name: t.actions.delete });
    expect(item.querySelector("svg.lucide-trash-2")).not.toBeNull();
  });

  test("確認で削除を選ぶと削除する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProjectItem project={project} />);

    chooseDelete();

    expect(window.confirm).toHaveBeenCalledWith(t.confirmDelete);
    await vi.waitFor(() => expect(deleteProjectAction).toHaveBeenCalledWith(3));
  });

  test("確認で取り消すと削除しない", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProjectItem project={project} />);

    chooseDelete();

    expect(deleteProjectAction).not.toHaveBeenCalled();
  });

  test("記録が紐づいていて削除できなければ理由を表示する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteProjectAction).mockResolvedValue({
      errors: { form: t.errors.inUse },
    });
    render(<ProjectItem project={project} />);

    chooseDelete();

    expect((await screen.findByRole("alert")).textContent).toBe(t.errors.inUse);
  });
});
