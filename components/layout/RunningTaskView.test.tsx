import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { RunningTaskView } from "./RunningTaskView";

const t = messages.timeEntries;

const navigation = vi.hoisted(() => ({ pathname: "/history" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = "/history";
});

const running = {
  taskName: "資料作成",
  startedAt: new Date("2026-11-19T09:00:00+09:00"),
};

test("記録中のタスク名と開始時刻を表示する", () => {
  render(
    <RunningTaskView
      running={{
        taskName: "資料作成",
        startedAt: new Date("2026-11-19T09:00:00+09:00"),
      }}
    />,
  );

  const section = screen.getByRole("region", { name: t.runningHeading });
  expect(section.textContent).toContain("資料作成");
  expect(section.textContent).toContain(`${t.startedAt} 09:00`);
  expect(screen.queryByText(messages.nav.noRunning)).toBeNull();
});

test("タスク名が空なら「（タスク名なし）」を表示する", () => {
  render(
    <RunningTaskView
      running={{
        taskName: "",
        startedAt: new Date("2026-11-19T09:00:00+09:00"),
      }}
    />,
  );

  expect(screen.getByText(t.untitled)).toBeDefined();
});

test("記録中のタスクがなければ、ないことを伝える", () => {
  render(<RunningTaskView running={null} />);

  expect(screen.getByText(messages.nav.noRunning)).toBeDefined();
  expect(screen.queryByText(new RegExp(t.startedAt))).toBeNull();
});

test("プロジェクトの紐づいた記録中のタスクは、タスク名の左側にアイコンを出す", () => {
  render(
    <RunningTaskView
      running={{
        taskName: "資料作成",
        startedAt: new Date("2026-11-19T09:00:00+09:00"),
        project: { id: 1, name: "社内ツール", color: "teal" },
      }}
    />,
  );

  const icon = screen.getByRole("img", { name: "社内ツール" });
  expect(icon.getAttribute("title")).toBe("社内ツール");
  // アイコンがタスク名より前にあり、読み上げはプロジェクト名 → タスク名の順
  const row = icon.closest("p")!;
  expect(row.firstElementChild?.contains(icon)).toBe(true);
  expect(row.firstChild).toBe(row.firstElementChild);
  expect(row.textContent).toBe("資料作成");
  // サイドバーでは名前を文字で出さない
  expect(screen.queryByText("社内ツール")).toBeNull();
});

test("プロジェクトのない記録中のタスクにはアイコンを出さない", () => {
  render(
    <RunningTaskView
      running={{
        taskName: "資料作成",
        startedAt: new Date("2026-11-19T09:00:00+09:00"),
        project: null,
      }}
    />,
  );

  expect(screen.queryByRole("img")).toBeNull();
});

test("開始時刻は見出しの次にあり、プロジェクトとタスク名より前にある", () => {
  render(
    <RunningTaskView
      running={{
        taskName: "資料作成",
        startedAt: new Date("2026-11-19T09:00:00+09:00"),
        project: { id: 1, name: "社内ツール", color: "teal" },
      }}
    />,
  );
  const section = screen.getByRole("region", { name: t.runningHeading });
  const heading = within(section).getByRole("heading");
  const time = within(section).getByText(`${t.startedAt} 09:00`);
  const task = within(section).getByText("資料作成");
  const follows = (a: Node, b: Node) =>
    Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  expect(follows(heading, time)).toBe(true);
  expect(follows(time, task)).toBe(true);
  expect(follows(time, within(section).getByTitle("社内ツール"))).toBe(true);
});

test("記録中のタスクがあるとき、枠全体がトップページへのリンクになる", () => {
  render(<RunningTaskView running={running} />);

  const section = screen.getByRole("region", { name: t.runningHeading });
  const link = within(section).getByRole("link");
  expect(link.getAttribute("href")).toBe("/");
  // 見出し → 開始時刻 → タスク名の順で、すべてリンクの中にある
  expect(link.textContent).toBe(
    `${t.runningHeading}${t.startedAt} 09:00資料作成`,
  );
});

test("記録中のタスクがないときも、枠全体がトップページへのリンクになる", () => {
  render(<RunningTaskView running={null} />);

  const link = screen.getByRole("link");
  expect(link.getAttribute("href")).toBe("/");
  expect(link.textContent).toBe(`${t.runningHeading}${messages.nav.noRunning}`);
});

test("トップページでは枠が選ばれている表示になり、ほかのページではならない", () => {
  navigation.pathname = "/";
  const { unmount } = render(<RunningTaskView running={running} />);
  expect(screen.getByRole("link").getAttribute("aria-current")).toBe("page");
  unmount();

  navigation.pathname = "/summary";
  render(<RunningTaskView running={running} />);
  expect(screen.getByRole("link").hasAttribute("aria-current")).toBe(false);
});
