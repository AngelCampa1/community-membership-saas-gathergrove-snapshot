import { Lightbulb } from "lucide-react";

interface KeyTakeawaysProps {
  takeaways: string[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  return (
    <div id="key-takeaways" className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6 mb-12">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">Key Takeaways</h2>
      </div>
      <ul className="space-y-2">
        {takeaways.map((takeaway) => (
          <li key={takeaway} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-primary font-bold mt-0.5">•</span>
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
