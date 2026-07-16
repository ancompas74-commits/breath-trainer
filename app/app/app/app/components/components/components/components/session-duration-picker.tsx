"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { type Technique } from "@/lib/techniques";
import { Clock, ArrowLeft, Play } from "lucide-react";

const DURATIONS = [3, 5, 10, 15, 20];

interface SessionDurationPickerProps {
  technique: Technique;
  onSelect: (durationMinutes: number) => void;
  onBack: () => void;
}

export function SessionDurationPicker({
  technique,
  onSelect,
  onBack,
}: SessionDurationPickerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center gap-10 max-w-sm w-full px-6">
        <button
          onClick={onBack}
          className={cn(
            "absolute -top-2 left-6 inline-flex items-center gap-1.5 text-sm font-light",
            "text-muted-foreground/50 transition-colors duration-300 hover:text-foreground/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg px-2 py-1"
          )}
        >
          <ArrowLeft className="size-4" />
          Назад
        </button>

        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-light tracking-wide text-foreground/90">
            Длительность сессии
          </h2>
          <p className="text-sm text-muted-foreground/60 font-light">
            {technique.name}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {DURATIONS.map((min) => {
            const isSelected = selectedMinutes === min;
            return (
              <button
                key={min}
                onClick={() => setSelectedMinutes(min)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl py-4 transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/40"
                    : "ring-1 ring-foreground/8 hover:ring-foreground/15 hover:bg-foreground/4"
                )}
              >
                <Clock
                  className={cn(
                    "size-5 transition-colors duration-300",
                    isSelected ? "text-primary" : "text-muted-foreground/40"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isSelected ? "text-foreground/90" : "text-foreground/60"
                  )}
                >
                  {min}
                </span>
                <span className="text-[10px] text-muted-foreground/40 font-light">
                  мин
                </span>
              </button>
            );
          })}
        </div>

        {selectedMinutes && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => onSelect(selectedMinutes)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
                "bg-primary text-primary-foreground",
                "transition-all duration-300 hover:scale-[1.02]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
            >
              <Play className="size-4" />
              Начать {selectedMinutes} мин
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
