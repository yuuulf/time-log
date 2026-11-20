import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SummaryPdfButton } from "./SummaryPdfButton";

afterEach(() => {
  vi.restoreAllMocks();
  document.title = "";
});

test("「PDF 出力」の名前で読み上げられ、ポインタを合わせたときの説明にも名前が出る", () => {
  render(<SummaryPdfButton heading="2026年11月" />);

  const button = screen.getByRole("button", { name: "PDF 出力" });
  expect(button.getAttribute("title")).toBe("PDF 出力");
});

test("押すと、タブのタイトルを期間の分かるものにして印刷ダイアログを開き、印刷が終わったら戻す", () => {
  document.title = "TimeLog";
  let titleWhilePrinting = "";
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    titleWhilePrinting = document.title;
  });
  render(<SummaryPdfButton heading="2026年11月" />);

  fireEvent.click(screen.getByRole("button", { name: "PDF 出力" }));

  expect(print).toHaveBeenCalledOnce();
  expect(titleWhilePrinting).toBe("集計 2026年11月");
  // 印刷ダイアログを閉じるまでは、保存のファイル名に使うタイトルのまま
  expect(document.title).toBe("集計 2026年11月");

  window.dispatchEvent(new Event("afterprint"));

  expect(document.title).toBe("TimeLog");
});
