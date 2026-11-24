import { Suspense } from "react";
import { TimeTracker } from "@/components/time-entries/TimeTracker";
import { messages } from "@/lib/messages";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6">
      {/* アプリ名はサイドバーにあるので、見出しは読み上げ用にだけ置く */}
      <h1 className="sr-only">{messages.nav.home}</h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted">{messages.timeEntries.loading}</p>
        }
      >
        <TimeTracker />
      </Suspense>
    </main>
  );
}
