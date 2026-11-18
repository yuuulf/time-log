import { messages } from "@/lib/messages";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">
        {messages.app.name}
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        {messages.app.description}
      </p>
    </main>
  );
}
