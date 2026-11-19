import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import ProjectsPage, { metadata } from "./page";

// ProjectsView は DB を読む async の Server Component で、Vitest では描画できないため差し替える
vi.mock("@/components/projects/ProjectsView", () => ({
  ProjectsView: () => <div data-testid="projects-view" />,
}));

test("ページ見出しの下にプロジェクトを置き、タイトルにも使う", () => {
  render(<ProjectsPage />);

  expect(
    screen.getByRole("heading", { level: 1, name: messages.projects.title }),
  ).toBeDefined();
  expect(screen.getByTestId("projects-view")).toBeDefined();
  expect(metadata.title).toBe(messages.projects.title);
});
