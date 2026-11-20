import { Suspense } from "react";
import { EntryHistory } from "@/components/time-entries/EntryHistory";
import { messages } from "@/lib/messages";

/** 過去の記録。月ごと、または指定した期間の記録を表示する */
export default function HistoryPage({ searchParams }: PageProps<"/history">) {
  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">
        {messages.history.title}
      </h1>
      <div className="mt-8">
        {/* searchParams はリクエスト時の値なので、await は <Suspense> の中の EntryHistory で行う */}
        <Suspense
          fallback={
            <p className="text-sm text-muted">{messages.timeEntries.loading}</p>
          }
        >
          <EntryHistory searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
