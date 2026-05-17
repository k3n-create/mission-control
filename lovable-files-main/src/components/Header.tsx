import { Bot } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-surface px-8 py-4 border-b-2 border-primary shadow-sm">
      <div className="flex items-center gap-2 text-[1.25rem] font-extrabold tracking-wide">
        <Bot className="h-5 w-5 text-foreground" aria-hidden />
        <span className="text-foreground">AGENTIC LABS</span>
        <span className="text-primary">| TRACKER</span>
      </div>
    </header>
  );
}
