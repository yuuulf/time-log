import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { ProjectsContent } from "./ProjectsContent";

vi.mock("@/lib/projects/actions", () => ({
  deleteProjectAction: vi.fn(),
}));

const t = messages.projects;
const project = (id: number, name: string) => ({
  id,
  name,
  color: "teal",
  clientName: "",
  description: "",
});

test("「追加」のリンクと、渡した順の一覧を表示し、登録欄は置かない", () => {
  render(
    <ProjectsContent
      projects={[project(1, "社内ツール"), project(2, "A 社サイト改修")]}
    />,
  );

  expect(
    screen.getByRole("link", { name: t.actions.add }).getAttribute("href"),
  ).toBe("/projects/new");
  expect(screen.queryByRole("heading", { name: t.formHeading })).toBeNull();
  expect(screen.queryByLabelText(t.name)).toBeNull();
  const list = screen.getByRole("region", { name: t.listHeading });
  expect(
    within(list)
      .getAllByRole("listitem")
      .map((li) => li.querySelector("a")?.textContent),
  ).toEqual(["社内ツール", "A 社サイト改修"]);
  expect(screen.queryByText(t.empty)).toBeNull();
});

test("プロジェクトがなければ、ないことと「追加」から登録できることを伝える", () => {
  render(<ProjectsContent projects={[]} />);

  expect(screen.getByText(t.empty)).toBeDefined();
  expect(t.empty).toContain("「追加」");
  expect(screen.getByRole("link", { name: t.actions.add })).toBeDefined();
  expect(screen.queryByRole("list")).toBeNull();
});
