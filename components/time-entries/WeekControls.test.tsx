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
const week = (value: string) =>
  resolveHistoryPageQuery({ week: value }, now, "list") as WeekView;

test("前の週・次の週へのリンクを置く", () => {
  render(<WeekControls view={week("2026-11-16")} />);

  expect(screen.getByRole("navigation", { name: t.weekNav })).toBeDefined();
  expect(
    screen.getByRole("link", { name: t.prevWeek }).getAttribute("href"),
  ).toBe("/history?week=2026-11-09");
  expect(
    screen.getByRole("link", { name: t.nextWeek }).getAttribute("href"),
  ).toBe("/history?week=2026-11-23");
});

test("今週は次の週へ進めない", () => {
  render(<WeekControls view={week("2026-11-23")} />);

  expect(screen.queryByRole("link", { name: t.nextWeek })).toBeNull();
  expect(
    screen.getByRole("button", { name: t.nextWeek }).hasAttribute("disabled"),
  ).toBe(true);
});
