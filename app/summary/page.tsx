import { Suspense } from "react";
import { SummaryView } from "@/components/summary/SummaryView";
import { messages } from "@/lib/messages";

/** 集計。月ごと、または指定した期間の記録の合計時間・稼働日数などを表示する */
export default function SummaryPage({ searchParams }: PageProps<"/summary">) {
  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 flex-1 px-4 py-12 print:px-0 print:py-0">
      <h1 className="text-3xl font-bold text-foreground print:hidden">
        {messages.summary.title}
      </h1>
      <div className="mt-8 print:mt-0">
        {/* searchParams はリクエスト時の値なので、await は <Suspense> の中の SummaryView で行う */}
        <Suspense
          fallback={
            <p className="text-sm text-muted">{messages.timeEntries.loading}</p>
          }
        >
          <SummaryView searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
