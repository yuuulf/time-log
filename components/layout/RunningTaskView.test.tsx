import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { RunningTaskView } from "./RunningTaskView";

const t = messages.timeEntries;

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
