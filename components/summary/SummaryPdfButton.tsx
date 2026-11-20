"use client";

import { FileDown } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { messages } from "@/lib/messages";

const t = messages.summary;

/**
 * 集計を PDF に出力するボタン。ブラウザの印刷ダイアログを開き、「PDF に保存」で保存してもらう。
 * 保存の既定のファイル名にはタブのタイトルが使われるので、印刷のあいだだけ期間の分かるタイトルにする
 */
export function SummaryPdfButton({
  heading,
}: {
  /** 期間の見出し（例: 「2026年11月」） */
  heading: string;
}) {
  const print = () => {
    const originalTitle = document.title;
    // window.print() が同期で戻るブラウザでも afterprint はそのあとに来るので、戻すのは afterprint に任せる
    window.addEventListener(
      "afterprint",
      () => {
        document.title = originalTitle;
      },
      { once: true },
    );
    document.title = t.pdfTitle(heading);
    window.print();
  };

  return (
    <IconButton
      icon={FileDown}
      label={t.pdf}
      onClick={print}
      className="print:hidden"
    />
  );
}
