import { cn } from "@/lib/utils";

export function TypingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="يكتب">
      <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-primary-400 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-primary-400 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-primary-400" />
    </div>
  );
}
