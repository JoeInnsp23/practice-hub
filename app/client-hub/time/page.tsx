import { Button } from "@/components/ui/button";

export default function TimePage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-card-foreground">
          Time Tracking
        </h1>
        <Button
          type="button"
          className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Start Timer
        </Button>
      </div>
      <div className="bg-card rounded-lg shadow dark:shadow-slate-900/50">
        <div className="px-6 py-4 border-b border">
          <p className="text-muted-foreground dark:text-muted-foreground">
            No time entries yet. Start tracking time for your tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
