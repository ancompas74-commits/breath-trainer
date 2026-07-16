"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { techniques, type Technique } from "@/lib/techniques";
import {
  Square,
  Timer,
  Flower2,
  Zap,
  CircleDot,
  Wind,
  Play,
} from "lucide-react";

const techniqueIcons: Record<string, React.ElementType> = {
  square: Square,
  relaxing: Timer,
  pranayama: Flower2,
  power: Zap,
  coherent: CircleDot,
  free: Wind,
};

interface TechniqueSelectorProps {
  onStartPractice?: (technique: Technique) => void;
}

export function TechniqueSelector({ onStartPractice }: TechniqueSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-light tracking-wide text-foreground/90">
          Техники дыхания
        </h2>
        <p className="text-sm text-muted-foreground/70 font-light">
          Выберите технику для практики
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {techniques.map((t) => {
          const Icon = techniqueIcons[t.id];
          const isSelected = selectedId === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setSelectedId(isSelected ? null : t.id)}
              className={cn(
                "flex items-start gap-4 rounded-xl p-4 text-left transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isSelected
                  ? "bg-foreground/8 ring-1 ring-foreground/20"
                  : "ring-1 ring-foreground/8 hover:ring-foreground/15 hover:bg-foreground/4"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/8 text-foreground/50"
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-medium text-foreground/90">
                  {t.name}
                </div>
                <div className="text-xs text-muted-foreground/70 font-light leading-relaxed">
                  {t.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedId && (
        <div className="flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => {
              const t = techniques.find((x) => x.id === selectedId);
              if (t) onStartPractice?.(t);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
              "bg-primary text-primary-foreground",
              "transition-all duration-300 hover:scale-[1.02]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            )}
          >
            <Play className="size-4" />
            Начать практику
          </button>
        </div>
      )}
    </div>
  );
}
