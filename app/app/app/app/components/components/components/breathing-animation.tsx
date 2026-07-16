"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Technique } from "@/lib/techniques";
import { cn } from "@/lib/utils";
import { playTechniqueBreathing, stopBreathing } from "@/lib/breathing-sound";
import type { SessionStats } from "@/components/session-summary";
import { Volume2, VolumeX } from "lucide-react";

interface BreathingAnimationProps {
  technique: Technique;
  sessionDurationSeconds: number;
  onComplete: (stats: SessionStats) => void;
}

const SCALE_MIN = 0.45;
const SCALE_MAX = 1;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function phaseColor(phaseName: string): string {
  switch (phaseName) {
    case "Вдох":
      return "rgba(96, 165, 250, 0.15)";
    case "Выдох":
      return "rgba(167, 139, 250, 0.15)";
    case "Задержка":
      return "rgba(148, 163, 184, 0.10)";
    default:
      return "rgba(148, 163, 184, 0.10)";
  }
}

function phaseBorderColor(phaseName: string): string {
  switch (phaseName) {
    case "Вдох":
      return "rgba(96, 165, 250, 0.5)";
    case "Выдох":
      return "rgba(167, 139, 250, 0.5)";
    case "Задержка":
      return "rgba(148, 163, 184, 0.3)";
    default:
      return "rgba(148, 163, 184, 0.3)";
  }
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BreathingAnimation({
  technique,
  sessionDurationSeconds,
  onComplete,
}: BreathingAnimationProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(SCALE_MIN);
  const [remainingSeconds, setRemainingSeconds] = useState(
    sessionDurationSeconds
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tempo, setTempo] = useState(1);

  const startTimeRef = useRef(0);
  const sessionStartRef = useRef(0);
  const sessionElapsedRef = useRef(0);
  const rafRef = useRef<number>(0);
  const cycleCountRef = useRef(0);
  const gracefulStopRef = useRef(false);
  const stoppedRef = useRef(false);
  const soundEnabledRef = useRef(true);
  const isFree = technique.id === "free";

  const animateRef = useRef<((ts: number) => void) | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finish = useCallback(
    (naturally: boolean) => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      stopBreathing();
      const elapsed = Math.min(
        sessionDurationSeconds,
        Math.round(sessionElapsedRef.current)
      );
      onCompleteRef.current({
        cycles: isFree ? 0 : cycleCountRef.current,
        techniqueName: technique.name,
        durationSeconds: elapsed,
        completedNaturally: naturally,
      });
    },
    [sessionDurationSeconds, isFree, technique.name]
  );

  const toggleSound = useCallback(() => {
    if (soundEnabledRef.current) {
      stopBreathing();
    } else {
      playTechniqueBreathing(technique, tempo);
    }
    soundEnabledRef.current = !soundEnabledRef.current;
    setSoundEnabled((prev) => !prev);
  }, [technique, tempo]);

  const changeTempo = useCallback(
    (delta: number) => {
      setTempo((prev) => {
        const next = Math.round(Math.max(0.5, Math.min(2, prev + delta)) * 100) / 100;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (soundEnabledRef.current && !stoppedRef.current) {
      stopBreathing();
      playTechniqueBreathing(technique, tempo);
    }
  }, [tempo, technique]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (stoppedRef.current) return;

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        sessionStartRef.current = timestamp;
      }

      const sessionElapsed = (timestamp - sessionStartRef.current) / 1000;
      sessionElapsedRef.current = sessionElapsed;
      const timeLeft = Math.max(0, sessionDurationSeconds - sessionElapsed);
      setRemainingSeconds(Math.ceil(timeLeft));

      if (timeLeft <= 0 && !gracefulStopRef.current && !stoppedRef.current) {
        gracefulStopRef.current = true;
        setIsCompleting(true);
      }

      const phases = technique.phases;
      if (phases.length === 0) {
        if (gracefulStopRef.current && !stoppedRef.current) {
          finish(true);
          return;
        }
        const gentle = 0.5 + 0.15 * Math.sin(timestamp * 0.001);
        setScale(gentle);
        rafRef.current = requestAnimationFrame(animateRef.current!);
        return;
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000;

      let accumulated = 0;
      let idx = -1;
      for (let i = 0; i < phases.length; i++) {
        if (elapsed < accumulated + phases[i].duration / tempo) {
          idx = i;
          break;
        }
        accumulated += phases[i].duration / tempo;
      }

      if (idx < 0) {
        cycleCountRef.current++;
        if (gracefulStopRef.current && !stoppedRef.current) {
          finish(true);
          return;
        }
        startTimeRef.current = timestamp;
        elapsed = 0;
        accumulated = 0;
        idx = 0;
      }

      const phaseDuration = phases[idx].duration / tempo;
      const phaseElapsed = elapsed - accumulated;
      const rawProgress = Math.min(phaseElapsed / phaseDuration, 1);
      const easedProgress = easeInOut(rawProgress);

      setPhaseIndex(idx);
      setProgress(easedProgress);

      let s: number;
      switch (phases[idx].name) {
        case "Вдох":
          s = SCALE_MIN + (SCALE_MAX - SCALE_MIN) * easedProgress;
          break;
        case "Выдох":
          s = SCALE_MIN + (SCALE_MAX - SCALE_MIN) * (1 - easedProgress);
          break;
        case "Задержка":
          s = SCALE_MAX;
          break;
        default:
          s = SCALE_MIN;
      }
      setScale(s);

      rafRef.current = requestAnimationFrame(animateRef.current!);
    };

    animateRef.current = animate;

    stoppedRef.current = false;
    gracefulStopRef.current = false;
    startTimeRef.current = 0;
    soundEnabledRef.current = true;
    rafRef.current = requestAnimationFrame(animate);
    playTechniqueBreathing(technique, tempo);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      stoppedRef.current = true;
      stopBreathing();
    };
  }, [technique, sessionDurationSeconds, finish, tempo]);

  const currentPhase = isFree ? null : technique.phases[phaseIndex];
  const bgColor = currentPhase
    ? phaseColor(currentPhase.name)
    : "rgba(148, 163, 184, 0.08)";
  const borderColor = currentPhase
    ? phaseBorderColor(currentPhase.name)
    : "rgba(148, 163, 184, 0.2)";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-1">
          <span
            className={cn(
              "text-3xl font-light tabular-nums tracking-wider transition-colors duration-500",
              isCompleting ? "text-primary/60" : "text-foreground/70"
            )}
          >
            {formatRemaining(remainingSeconds)}
          </span>
          {isCompleting && (
            <span className="text-xs text-primary/50 font-light animate-in fade-in slide-in-from-bottom-1 duration-500">
              Завершение сессии...
            </span>
          )}
        </div>

        <div
          className="rounded-full will-change-transform"
          style={{
            width: "280px",
            height: "280px",
            transform: `scale(${scale})`,
            backgroundColor: bgColor,
            border: `1.5px solid ${borderColor}`,
          }}
        />

        <div className="flex flex-col items-center gap-2">
          {currentPhase ? (
            <>
              <span className="text-lg font-light tracking-wide text-foreground/80">
                {currentPhase.name}
              </span>
              <span className="text-xs text-muted-foreground/50 font-light tabular-nums">
                {Math.ceil(currentPhase.duration / tempo - progress * currentPhase.duration / tempo)}
                с
              </span>
            </>
          ) : (
            <span className="text-lg font-light tracking-wide text-foreground/50">
              Свободное дыхание
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-light text-muted-foreground/60">
            {technique.name}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => changeTempo(-0.25)}
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-full text-sm font-light",
                "bg-foreground/8 text-foreground/60 ring-1 ring-foreground/10",
                "transition-all duration-300 hover:bg-foreground/12 hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
              aria-label="Замедлить"
            >
              −
            </button>
            <span className="text-xs text-muted-foreground/50 font-light tabular-nums w-10 text-center">
              {tempo.toFixed(2)}×
            </span>
            <button
              onClick={() => changeTempo(0.25)}
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-full text-sm font-light",
                "bg-foreground/8 text-foreground/60 ring-1 ring-foreground/10",
                "transition-all duration-300 hover:bg-foreground/12 hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
              aria-label="Ускорить"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-light tracking-wide",
                "bg-foreground/8 text-foreground/60 ring-1 ring-foreground/10",
                "transition-all duration-300 hover:bg-foreground/12 hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
              aria-label={soundEnabled ? "Выключить звук" : "Включить звук"}
            >
              {soundEnabled ? (
                <Volume2 className="size-4" />
              ) : (
                <VolumeX className="size-4" />
              )}
              <span>Звук</span>
            </button>
            <button
              onClick={() => finish(false)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-light tracking-wide",
                "bg-primary/15 text-primary ring-1 ring-primary/30",
                "transition-all duration-300 hover:bg-primary/20 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
            >
              Завершить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
