"use client";

import { useState } from "react";
import { BreathingPlayer } from "@/components/breathing-player";
import { TechniqueSelector } from "@/components/technique-selector";
import { BreathingAnimation } from "@/components/breathing-animation";
import { SessionDurationPicker } from "@/components/session-duration-picker";
import {
  SessionSummary,
  type SessionStats,
} from "@/components/session-summary";
import { type Technique } from "@/lib/techniques";

export default function HomePage() {
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(
    null
  );
  const [sessionMinutes, setSessionMinutes] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  const handleStartPractice = (technique: Technique) => {
    setSelectedTechnique(technique);
    setSessionMinutes(null);
    setSessionStats(null);
  };

  const handleDurationSelect = (minutes: number) => {
    setSessionMinutes(minutes);
  };

  const handleSessionComplete = (stats: SessionStats) => {
    setSessionStats(stats);
  };

  const handleBack = () => {
    setSelectedTechnique(null);
    setSessionMinutes(null);
    setSessionStats(null);
  };

  if (sessionStats) {
    return <SessionSummary stats={sessionStats} onHome={handleBack} />;
  }

  if (selectedTechnique && sessionMinutes) {
    return (
      <BreathingAnimation
        technique={selectedTechnique}
        sessionDurationSeconds={sessionMinutes * 60}
        onComplete={handleSessionComplete}
      />
    );
  }

  if (selectedTechnique) {
    return (
      <SessionDurationPicker
        technique={selectedTechnique}
        onSelect={handleDurationSelect}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="px-4 py-12 space-y-16">
      <section className="flex flex-col items-center gap-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-3">
          <h1 className="text-4xl font-light tracking-wide text-foreground/90 sm:text-5xl">
            Дыхание
          </h1>
          <p className="text-base text-muted-foreground/70 font-light leading-relaxed max-w-xs mx-auto">
            Эталонный звук человеческого дыхания
          </p>
        </div>

        <BreathingPlayer />

        <p className="text-xs text-muted-foreground/40 font-light max-w-[200px]">
          Дышите в такт или просто слушайте
        </p>
      </section>

      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <TechniqueSelector onStartPractice={handleStartPractice} />
      </section>
    </div>
  );
}
