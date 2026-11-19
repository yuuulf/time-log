import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import NewProjectPage, { metadata } from "./page";

vi.mock("@/components/projects/ProjectForm", () => ({
  ProjectForm: () => <div data-testid="project-form" />,
}));

test("登録のフォームを置き、タイトルは「プロジェクトの登録」にする", () => {
  render(<NewProjectPage />);

  expect(screen.getByRole("main")).toBeDefined();
  expect(screen.getByTestId("project-form")).toBeDefined();
  expect(metadata.title).toBe(messages.projects.formHeading);
});
