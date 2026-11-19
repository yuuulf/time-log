import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ProjectIcon } from "./ProjectIcon";

test("プロジェクト名で読み上げられ、ポインタを合わせると名前が出る", () => {
  render(<ProjectIcon name="社内ツール" color="teal" />);

  const icon = screen.getByRole("img", { name: "社内ツール" });
  expect(icon.getAttribute("title")).toBe("社内ツール");
  expect(icon.className).toContain("text-project-teal");
  // 塗りつぶしたフォルダのアイコン
  const svg = icon.querySelector("svg")!;
  expect(svg.getAttribute("class")).toContain("lucide-folder");
  expect(svg.getAttribute("fill")).toBe("currentColor");
});

test("decorative なら読み上げの対象から外し、title は残す", () => {
  const { container } = render(
    <ProjectIcon name="社内ツール" color="teal" decorative />,
  );

  expect(screen.queryByRole("img")).toBeNull();
  const icon = container.querySelector("span")!;
  expect(icon.getAttribute("aria-hidden")).toBe("true");
  expect(icon.getAttribute("title")).toBe("社内ツール");
});
