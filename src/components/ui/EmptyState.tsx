import { Card } from "./Card";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h1 className="text-3xl">{title}</h1>
      <Card className="mt-6 max-w-xl">
        <p className="text-sm text-charcoal/70">{body}</p>
      </Card>
    </div>
  );
}
