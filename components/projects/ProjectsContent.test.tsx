import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { ProjectsContent } from "./ProjectsContent";

vi.mock("@/lib/projects/actions", () => ({
  createProjectAction: vi.fn(),
  updateProjectAction: vi.fn(),
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

test("登録欄と、渡した順の一覧を表示する", () => {
  render(
    <ProjectsContent
      projects={[project(1, "社内ツール"), project(2, "A 社サイト改修")]}
    />,
  );

  expect(screen.getByRole("heading", { name: t.formHeading })).toBeDefined();
  expect(screen.getByRole("button", { name: t.actions.create })).toBeDefined();
  const list = screen.getByRole("region", { name: t.listHeading });
  expect(
    within(list)
      .getAllByRole("listitem")
      .map((li) => li.querySelector("a")?.textContent),
  ).toEqual(["社内ツール", "A 社サイト改修"]);
  expect(screen.queryByText(t.empty)).toBeNull();
});

test("プロジェクトがなければ、ないことを伝える", () => {
  render(<ProjectsContent projects={[]} />);

  expect(screen.getByText(t.empty)).toBeDefined();
  expect(screen.queryByRole("list")).toBeNull();
});
