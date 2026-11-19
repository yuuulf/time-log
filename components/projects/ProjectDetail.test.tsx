import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { projectColorName } from "@/lib/projects/colors";
import { ProjectDetail, ProjectNotFound } from "./ProjectDetail";

vi.mock("@/lib/projects/actions", () => ({
  updateProjectAction: vi.fn(),
}));

const t = messages.projects;
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
