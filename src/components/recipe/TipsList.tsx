import { Lightbulb } from "lucide-react";

export function TipsList({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {tips.map((tip, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4"
        >
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" />
          <p className="text-sm leading-7 text-ink/90">{tip}</p>
        </li>
      ))}
    </ul>
  );
}
