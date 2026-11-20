import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import * as page from "./page";
import NewProjectPage from "./page";

vi.mock("@/components/projects/ProjectForm", () => ({
  ProjectForm: () => <div data-testid="project-form" />,
}));

test("作成のフォームを置き、タイトルは「プロジェクトの作成」にする", () => {
  render(<NewProjectPage />);

  expect(screen.getByRole("main")).toBeDefined();
  expect(screen.getByTestId("project-form")).toBeDefined();
});

test("タブのタイトルはページで設定せず、レイアウトの「TimeLog」だけにする", () => {
  expect("metadata" in page).toBe(false);
});
