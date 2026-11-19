import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import ProjectDetailPage, { metadata } from "./page";

// ProjectDetailView は DB を読む async の Server Component で、Vitest では描画できないため差し替える
vi.mock("@/components/projects/ProjectDetailView", () => ({
  ProjectDetailView: () => <div data-testid="project-detail-view" />,
}));

test("詳細の中身を置き、タイトルは「プロジェクト」にする", () => {
  render(
    <ProjectDetailPage
      params={Promise.resolve({ id: "1" })}
      searchParams={Promise.resolve({})}
    />,
  );

  expect(screen.getByRole("main")).toBeDefined();
  expect(screen.getByTestId("project-detail-view")).toBeDefined();
  expect(metadata.title).toBe(messages.projects.title);
});
