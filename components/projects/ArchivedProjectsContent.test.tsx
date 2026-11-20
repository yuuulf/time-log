import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { ArchivedProjectsContent } from "./ArchivedProjectsContent";

vi.mock("@/lib/projects/actions", () => ({
  archiveProjectAction: vi.fn(),
  unarchiveProjectAction: vi.fn(),
  deleteProjectAction: vi.fn(),
}));

const t = messages.projects;
const project = (id: number, name: string, clientName = "") => ({
  id,
  name,
  color: "teal",
  clientName,
});

test("アーカイブしたプロジェクトを渡した順に、名前のリンクとクライアント名付きで並べる", () => {
  render(
    <ArchivedProjectsContent
      projects={[project(1, "社内ツール", "自社"), project(4, "旧案件")]}
    />,
  );

  const list = screen.getByRole("list", { name: t.archived.title });
  const links = within(list).getAllByRole("link");
  expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
    ["社内ツール", "/projects/1"],
    ["旧案件", "/projects/4"],
  ]);
  expect(within(list).getByText("自社")).toBeDefined();
});

test("各行のメニューは「アーカイブ解除」と「削除」", () => {
  render(<ArchivedProjectsContent projects={[project(1, "社内ツール")]} />);

  fireEvent.click(screen.getByRole("button", { name: t.actions.more }));

  expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
    t.actions.unarchive,
    t.actions.delete,
  ]);
});

test("アーカイブしたプロジェクトがなければ、ないことを伝える", () => {
  render(<ArchivedProjectsContent projects={[]} />);

  expect(screen.getByText(t.archived.empty)).toBeDefined();
  expect(screen.queryByRole("list")).toBeNull();
});
