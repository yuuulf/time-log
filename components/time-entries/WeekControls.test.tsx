import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import {
  resolveHistoryPageQuery,
  type WeekView,
} from "@/lib/time-entries/history";
import { WeekControls } from "./WeekControls";

const t = messages.history;
const now = new Date("2026-11-24T15:00:00+09:00");
const thisWeek = new Date("2026-11-23T00:00:00+09:00");
const week = (value: string) =>
  resolveHistoryPageQuery({ week: value }, now, "list") as WeekView;

test("前の週・次の週へのリンクを置く", () => {
  render(<WeekControls view={week("2026-11-16")} thisWeek={thisWeek} />);

  expect(screen.getByRole("navigation", { name: t.weekNav })).toBeDefined();
  expect(
    screen.getByRole("link", { name: t.prevWeek }).getAttribute("href"),
  ).toBe("/history?week=2026-11-09");
  expect(
    screen.getByRole("link", { name: t.nextWeek }).getAttribute("href"),
  ).toBe("/history?week=2026-11-23");
});

test("今週は次の週へ進めない", () => {
  render(<WeekControls view={week("2026-11-23")} thisWeek={thisWeek} />);

  expect(screen.queryByRole("link", { name: t.nextWeek })).toBeNull();
  expect(
    screen.getByRole("button", { name: t.nextWeek }).hasAttribute("disabled"),
  ).toBe(true);
});

test("週の入力欄に表示中の週を出し、「表示」で /history に週を送るフォームにする", () => {
  const { container } = render(
    <WeekControls view={week("2026-11-16")} thisWeek={thisWeek} />,
  );

  expect(
    screen.getByRole<HTMLInputElement>("textbox", { name: t.weekPicker.label })
      .value,
  ).toBe("2026年11月16日〜2026年11月22日");
  const form = container.querySelector("form")!;
  expect(form.getAttribute("action")).toBe("/history");
  expect(
    (form.querySelector('input[name="week"]') as HTMLInputElement).value,
  ).toBe("2026-11-16");
  expect(
    screen.getByRole("button", { name: t.show }).getAttribute("type"),
  ).toBe("submit");
});

const navNames = () =>
  [
    ...screen
      .getByRole("navigation", { name: t.weekNav })
      .querySelectorAll("a, button"),
  ].map((el) => el.getAttribute("aria-label") ?? el.textContent);

test("前後の週の右に「今週」を置き、今週を行き先にする", () => {
  render(<WeekControls view={week("2026-10-12")} thisWeek={thisWeek} />);

  expect(navNames()).toEqual([t.prevWeek, t.nextWeek, t.thisWeek]);
  expect(
    screen.getByRole("link", { name: t.thisWeek }).getAttribute("href"),
  ).toBe("/history?week=2026-11-23");
});

test("今週を表示しているときは「今週」を押せない", () => {
  render(<WeekControls view={week("2026-11-23")} thisWeek={thisWeek} />);

  expect(screen.queryByRole("link", { name: t.thisWeek })).toBeNull();
  expect(
    screen.getByRole("button", { name: t.thisWeek }).hasAttribute("disabled"),
  ).toBe(true);
});
