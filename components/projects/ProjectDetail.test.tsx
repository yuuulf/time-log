import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { projectColorName } from "@/lib/projects/colors";
import { ProjectDetail, ProjectNotFound } from "./ProjectDetail";

vi.mock("@/lib/projects/actions", () => ({
  updateProjectAction: vi.fn(),
}));

const { updateProjectAction } = await import("@/lib/projects/actions");
const t = messages.projects;

beforeEach(() => {
  vi.mocked(updateProjectAction).mockReset().mockResolvedValue({ ok: true });
});
const project = {
  id: 3,
  name: "社内ツール",
  color: "violet",
  clientName: "自社",
  description: "社内向けの管理ツール",
};
const input = (label: string) =>
  screen.getByLabelText<HTMLInputElement | HTMLTextAreaElement>(label);

test("見出しにプロジェクト名を出し、全項目と一覧へ戻るリンクを表示する", () => {
  render(<ProjectDetail project={project} />);

  expect(
    screen.getByRole("heading", { level: 1, name: "社内ツール" }),
  ).toBeDefined();
  expect(input(t.name).value).toBe("社内ツール");
  expect(input(t.clientName).value).toBe("自社");
  expect(input(t.description).value).toBe("社内向けの管理ツール");
  // 説明の欄は 8 行分の高さ
  expect(input(t.description).getAttribute("rows")).toBe("8");
  expect(
    screen.getByRole<HTMLInputElement>("radio", {
      name: projectColorName("violet"),
    }).checked,
  ).toBe(true);
  expect(screen.getAllByRole("radio")).toHaveLength(10);
  expect(
    screen
      .getByRole("link", { name: t.detail.backToList })
      .getAttribute("href"),
  ).toBe("/projects");
});

test("見つからないときは、その旨と一覧へ戻るリンクを表示する", () => {
  render(<ProjectNotFound />);

  expect(screen.getByText(t.detail.notFound)).toBeDefined();
  expect(screen.getByRole("link", { name: t.detail.backToList })).toBeDefined();
});

/** 最後に送った値 */
function lastSent() {
  const calls = vi.mocked(updateProjectAction).mock.calls;
  const [id, , formData] = calls[calls.length - 1];
  return { id, formData };
}
const radio = (color: Parameters<typeof projectColorName>[0]) =>
  screen.getByRole<HTMLInputElement>("radio", {
    name: projectColorName(color),
  });

describe("その場の編集", () => {
  test("名前を変えてフォーカスが外れたら、今の値をすべて送る", async () => {
    render(<ProjectDetail project={project} />);

    fireEvent.change(input(t.name), { target: { value: "社内ツール開発" } });
    fireEvent.blur(input(t.name));

    await vi.waitFor(() => expect(updateProjectAction).toHaveBeenCalledOnce());
    const { id, formData } = lastSent();
    expect(id).toBe(3);
    expect(Object.fromEntries(formData)).toEqual({
      name: "社内ツール開発",
      color: "violet",
      clientName: "自社",
      description: "社内向けの管理ツール",
    });
  });

  test("値を変えずにフォーカスが外れても送らない", () => {
    render(<ProjectDetail project={project} />);

    fireEvent.focus(input(t.description));
    fireEvent.blur(input(t.description));

    expect(updateProjectAction).not.toHaveBeenCalled();
  });

  test("名前・クライアント名は Enter で確定して送る", async () => {
    render(<ProjectDetail project={project} />);
    const clientName = input(t.clientName);
    clientName.focus();

    fireEvent.change(clientName, { target: { value: "情報システム部" } });
    fireEvent.keyDown(clientName, { key: "Enter" });

    await vi.waitFor(() => expect(updateProjectAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.get("clientName")).toBe("情報システム部");
  });

  test("変換中の Enter では確定も保存もしない", () => {
    render(<ProjectDetail project={project} />);
    const name = input(t.name);
    name.focus();

    fireEvent.change(name, { target: { value: "社内ツール開発" } });
    fireEvent.keyDown(name, { key: "Enter", isComposing: true });

    expect(updateProjectAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(name);
  });

  test("変換中の Escape では元に戻さない", () => {
    render(<ProjectDetail project={project} />);
    const name = input(t.name);
    name.focus();

    fireEvent.change(name, { target: { value: "社内ツール開発" } });
    fireEvent.keyDown(name, { key: "Escape", keyCode: 229 });

    expect(name.value).toBe("社内ツール開発");
    expect(document.activeElement).toBe(name);
  });

  test("説明の Enter では送らない（改行のため）", () => {
    render(<ProjectDetail project={project} />);
    const description = input(t.description);
    description.focus();

    fireEvent.change(description, { target: { value: "1 行目" } });
    fireEvent.keyDown(description, { key: "Enter" });

    expect(updateProjectAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(description);
  });

  test("Escape で保存済みの値に戻し、送らない", () => {
    render(<ProjectDetail project={project} />);
    const name = input(t.name);
    name.focus();

    fireEvent.change(name, { target: { value: "別の名前" } });
    fireEvent.keyDown(name, { key: "Escape" });

    expect(name.value).toBe("社内ツール");
    expect(updateProjectAction).not.toHaveBeenCalled();
  });

  test("色は選んだら送る", async () => {
    render(<ProjectDetail project={project} />);

    fireEvent.click(radio("teal"));

    await vi.waitFor(() => expect(updateProjectAction).toHaveBeenCalledOnce());
    expect(lastSent().formData.get("color")).toBe("teal");
    expect(radio("teal").checked).toBe(true);
  });

  test("入力エラーなら理由を表示し、入力した値を残す", async () => {
    vi.mocked(updateProjectAction).mockResolvedValue({
      errors: { name: t.errors.nameTaken },
    });
    render(<ProjectDetail project={project} />);
    const name = input(t.name);

    fireEvent.change(name, { target: { value: "A 社サイト改修" } });
    fireEvent.blur(name);

    expect((await screen.findByRole("alert")).textContent).toBe(
      t.errors.nameTaken,
    );
    expect(name.value).toBe("A 社サイト改修");
    expect(name.getAttribute("aria-invalid")).toBe("true");
  });

  test("エラーの欄を保存済みの値に戻したらエラーを消す", async () => {
    vi.mocked(updateProjectAction).mockResolvedValue({
      errors: { name: t.errors.nameRequired },
    });
    render(<ProjectDetail project={project} />);
    fireEvent.change(input(t.name), { target: { value: "" } });
    fireEvent.blur(input(t.name));
    await screen.findByRole("alert");

    fireEvent.change(input(t.name), { target: { value: "社内ツール" } });
    fireEvent.blur(input(t.name));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(updateProjectAction).toHaveBeenCalledOnce();
  });

  test("見つからないなどの全体のエラーも表示する", async () => {
    vi.mocked(updateProjectAction).mockResolvedValue({
      errors: { form: t.errors.notFound },
    });
    render(<ProjectDetail project={project} />);

    fireEvent.click(radio("teal"));

    expect((await screen.findByRole("alert")).textContent).toBe(
      t.errors.notFound,
    );
  });

  test("保存の後にプロジェクトが新しくなったら、編集中でない欄だけを合わせる", () => {
    const { rerender } = render(<ProjectDetail project={project} />);
    // 名前を保存したあと、説明を編集している途中
    fireEvent.change(input(t.name), { target: { value: "社内ツール開発" } });
    fireEvent.change(input(t.description), { target: { value: "書きかけ" } });

    rerender(
      <ProjectDetail
        project={{ ...project, name: "社内ツール開発", clientName: "自社 IT" }}
      />,
    );

    expect(input(t.name).value).toBe("社内ツール開発");
    expect(input(t.description).value).toBe("書きかけ");
    expect(input(t.clientName).value).toBe("自社 IT");
    expect(
      screen.getByRole("heading", { level: 1, name: "社内ツール開発" }),
    ).toBeDefined();
  });
});
