"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Home } from "lucide-react";

export interface SessionStats {
  cycles: number;
  techniqueName: string;
  durationSeconds: number;
  completedNaturally: boolean;
}

interface SessionSummaryProps {
  stats: SessionStats;
  onHome: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} с`;
  if (s === 0) return `${m} мин`;
  return `${m} мин ${s} с`;
}

export function SessionSummary({ stats, onHome }: SessionSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full px-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="size-8 text-primary" />
        </div>

        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-light tracking-wide text-foreground/90">
            {stats.completedNaturally ? "Сессия завершена" : "Сессия прервана"}
          </h2>
          <p className="text-sm text-muted-foreground/60 font-light">
            {stats.techniqueName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-2xl font-light text-foreground/80 tabular-nums">
              {stats.cycles}
            </span>
            <span className="text-xs text-muted-foreground/50 font-light">
              циклов
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-2xl font-light text-foreground/80 tabular-nums">
              {formatDuration(stats.durationSeconds)}
            </span>
            <span className="text-xs text-muted-foreground/50 font-light">
              длительность
            </span>
          </div>
        </div>

        <button
          onClick={onHome}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-light tracking-wide",
            "bg-foreground/8 text-foreground/60 ring-1 ring-foreground/10",
            "transition-all duration-300 hover:bg-foreground/12 hover:text-foreground/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          )}
        >
          <Home className="size-4" />
          На главную
        </button>
      </div>
    </div>
  );
}
