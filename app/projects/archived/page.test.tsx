import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import * as page from "./page";
import ArchivedProjectsPage from "./page";

// ArchivedProjectsView は DB を読む async の Server Component で、Vitest では描画できないため差し替える
vi.mock("@/components/projects/ArchivedProjectsView", () => ({
  ArchivedProjectsView: () => <div data-testid="archived-projects-view" />,
}));

const t = messages.projects;

test("一覧へ戻るリンクと見出しの下に、アーカイブしたプロジェクトを置く", () => {
  render(<ArchivedProjectsPage />);

  expect(
    screen
      .getByRole("link", { name: t.detail.backToList })
      .getAttribute("href"),
  ).toBe("/projects");
  expect(
    screen.getByRole("heading", { level: 1, name: t.archived.title }),
  ).toBeDefined();
  expect(screen.getByTestId("archived-projects-view")).toBeDefined();
});

test("タブのタイトルはページで設定せず、レイアウトの「TimeLog」だけにする", () => {
  expect("metadata" in page).toBe(false);
});
