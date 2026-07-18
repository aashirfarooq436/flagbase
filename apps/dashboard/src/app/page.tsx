import { Button } from "@flagbase/ui/components/button";

export default function Home() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">FlagBase</h1>
      <div className="flex gap-3">
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
      </div>
    </main>
  );
}
