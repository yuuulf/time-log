import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import * as page from "./page";
import ProjectsPage from "./page";

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
});

test("タブのタイトルはページで設定せず、レイアウトの「TimeLog」だけにする", () => {
  expect("metadata" in page).toBe(false);
});

test("見出しと余白は過去の記録と同じ大きさ", () => {
  const { container } = render(<ProjectsPage />);

  expect(screen.getByRole("heading", { level: 1 }).className).toContain(
    "text-xl",
  );
  expect(container.querySelector("main")?.className).toContain("py-6");
});
