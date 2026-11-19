import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { ProjectSelect } from "./ProjectSelect";

const projects = [
  { id: 1, name: "社内ツール" },
  { id: 2, name: "A 社サイト改修" },
];

test("先頭が「プロジェクトなし」で、続けて渡した順にプロジェクトを並べる", () => {
  render(<ProjectSelect aria-label="プロジェクト" projects={projects} />);

  const select = screen.getByRole<HTMLSelectElement>("combobox");
  expect(select.name).toBe("projectId");
  expect([...select.options].map((o) => [o.value, o.textContent])).toEqual([
    ["", messages.timeEntries.noProject],
    ["1", "社内ツール"],
    ["2", "A 社サイト改修"],
  ]);
  expect(select.value).toBe("");
});

test("値を指定すればそのプロジェクトを選ぶ", () => {
  render(
    <ProjectSelect
      aria-label="プロジェクト"
      projects={projects}
      defaultValue="2"
    />,
  );

  expect(screen.getByRole<HTMLSelectElement>("combobox").value).toBe("2");
});
