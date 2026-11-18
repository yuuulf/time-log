import Link from "next/link";
import { messages } from "@/lib/messages";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label={messages.nav.label}
        className="mx-auto flex w-full max-w-3xl items-center px-4 py-3"
      >
        <Link href="/" className="text-lg font-semibold text-foreground">
          {messages.app.name}
        </Link>
      </nav>
    </header>
  );
}
