"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  playBreathing,
  stopBreathing,
  setBreathingType,
  isPlaying,
  getActiveType,
  CYCLE_OPTIONS,
  type BreathingCycleType,
} from "@/lib/breathing-sound";

export function BreathingPlayer() {
  const [playing, setPlaying] = useState(false);
  const [cycleType, setCycleType] =
    useState<BreathingCycleType>(getActiveType());

  useEffect(() => {
    return () => {
      if (isPlaying()) {
        stopBreathing();
      }
    };
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      stopBreathing();
      setPlaying(false);
    } else {
      playBreathing(cycleType);
      setPlaying(true);
    }
  }, [playing, cycleType]);

  const changeCycle = useCallback(
    (type: BreathingCycleType) => {
      setCycleType(type);
      if (playing) {
        setBreathingType(type);
      }
    },
    [playing]
  );

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        onClick={toggle}
        className={cn(
          "size-40 rounded-full border transition-all duration-700",
          "flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          playing
            ? "border-foreground/30 scale-105"
            : "border-border/40 hover:border-foreground/30 hover:scale-[1.02]"
        )}
        aria-label={playing ? "Остановить" : "Воспроизвести эталонный звук"}
      >
        {playing ? (
          <Pause className="size-10 text-foreground/70" />
        ) : (
          <Play className="size-10 text-foreground/70 ml-1" />
        )}
      </button>

      <div className="flex gap-2">
        {(Object.entries(CYCLE_OPTIONS) as [BreathingCycleType, (typeof CYCLE_OPTIONS)[BreathingCycleType]][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => changeCycle(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-light transition-all duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              cycleType === key
                ? "bg-foreground/10 text-foreground/80"
                : "text-muted-foreground/50 hover:text-foreground/60"
            )}
          >
            {config.labelShort}
          </button>
        ))}
      </div>
    </div>
  );
}
