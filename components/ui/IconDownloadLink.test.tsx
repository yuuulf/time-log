import { render, screen } from "@testing-library/react";
import { FileSpreadsheet } from "lucide-react";
import { expect, test } from "vitest";
import { IconDownloadLink } from "./IconDownloadLink";

test("名前を読み上げ用と説明の両方に付けた、ダウンロードのリンクを出す", () => {
  render(
    <IconDownloadLink
      href="/history/export?month=2026-11"
      icon={FileSpreadsheet}
      label="CSV 出力"
    />,
  );

  const link = screen.getByRole("link", { name: "CSV 出力" });
  expect(link.getAttribute("href")).toBe("/history/export?month=2026-11");
  expect(link.getAttribute("title")).toBe("CSV 出力");
  expect(link.hasAttribute("download")).toBe(true);
  expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
});
