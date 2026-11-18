import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import Home from "./page";

test("アプリ名と説明が表示される", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: messages.app.name }),
  ).toBeDefined();
  expect(screen.getByText(messages.app.description)).toBeDefined();
});

test("Next.js の初期テンプレートの表示が残っていない", () => {
  const { container } = render(<Home />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).not.toMatch(/To get started|Deploy Now/);
});
