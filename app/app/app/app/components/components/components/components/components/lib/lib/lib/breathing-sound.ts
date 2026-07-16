import type { Technique } from "@/lib/techniques";

export type BreathingCycleType = "short" | "long";

export interface CycleConfig {
  label: string;
  labelShort: string;
  inhaleMs: number;
  exhaleMs: number;
  pauseAfterInhaleMs: number;
  pauseAfterExhaleMs: number;
}

export const CYCLE_OPTIONS: Record<BreathingCycleType, CycleConfig> = {
  short: {
    label: "Короткий цикл",
    labelShort: "Короткий",
    inhaleMs: 1800,
    exhaleMs: 2200,
    pauseAfterInhaleMs: 0,
    pauseAfterExhaleMs: 0,
  },
  long: {
    label: "Длинный цикл",
    labelShort: "Длинный",
    inhaleMs: 3500,
    exhaleMs: 4000,
    pauseAfterInhaleMs: 800,
    pauseAfterExhaleMs: 400,
  },
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let noiseSource: AudioBufferSourceNode | null = null;
let bodyOsc: OscillatorNode | null = null;
let breathGain: GainNode | null = null;
let bodyGain: GainNode | null = null;
let bandpass: BiquadFilterNode | null = null;
let lowpass: BiquadFilterNode | null = null;
let _activeType: BreathingCycleType = "short";
let _isPlaying = false;
let scheduleInterval: ReturnType<typeof setInterval> | null = null;
let nextScheduledCycle = 0;

function createBrownNoiseBuffer(sampleRate: number): AudioBuffer {
  const length = sampleRate * 4;
  const buffer = ctx!.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.015 * white) / 1.015;
    lastOut = data[i];
    data[i] *= 2.5;
  }
  return buffer;
}

function scheduleCycle(config: CycleConfig, from: number) {
  if (!bandpass || !breathGain || !bodyGain || !lowpass || !bodyOsc || !ctx)
    return;

  const now = ctx.currentTime;
  const start = Math.max(now, from);

  const inhale = config.inhaleMs / 1000;
  const pauseIn = config.pauseAfterInhaleMs / 1000;
  const exhale = config.exhaleMs / 1000;
  const pauseOut = config.pauseAfterExhaleMs / 1000;
  const total = inhale + pauseIn + exhale + pauseOut;

  const exStart = start + inhale + pauseIn;
  const end = start + total;

  const punchEnd = start + Math.min(0.08, inhale * 0.06);
  const inhaleMid = start + inhale * 0.45;
  const inhaleEnd = start + inhale;
  const exhaleDropEnd = exStart + exhale * 0.1;
  const exhaleMid = exStart + exhale * 0.55;
  const sighStart = exStart + exhale * 0.82;
  const sighPeak = sighStart + (end - sighStart) * 0.35;
  const exhaleEnd = end;

  bandpass.frequency.setValueAtTime(90, start);
  bandpass.frequency.linearRampToValueAtTime(160, punchEnd);
  bandpass.frequency.linearRampToValueAtTime(850, inhaleMid);
  bandpass.frequency.linearRampToValueAtTime(1050, inhaleEnd);

  if (pauseIn > 0) {
    bandpass.frequency.setValueAtTime(1050, inhaleEnd);
    bandpass.frequency.linearRampToValueAtTime(700, exStart);
  }

  bandpass.frequency.setValueAtTime(700, exStart);
  bandpass.frequency.linearRampToValueAtTime(200, exhaleDropEnd);
  bandpass.frequency.linearRampToValueAtTime(140, exhaleMid);
  bandpass.frequency.linearRampToValueAtTime(80, exhaleEnd);

  bandpass.Q.setValueAtTime(0.2, start);
  bandpass.Q.linearRampToValueAtTime(0.5, punchEnd);
  bandpass.Q.linearRampToValueAtTime(0.8, inhaleMid);
  bandpass.Q.linearRampToValueAtTime(0.6, inhaleEnd);

  if (pauseIn > 0) {
    bandpass.Q.linearRampToValueAtTime(0.4, exStart);
  }

  bandpass.Q.setValueAtTime(0.4, exStart);
  bandpass.Q.linearRampToValueAtTime(0.8, exhaleDropEnd);
  bandpass.Q.linearRampToValueAtTime(1.2, exhaleMid);
  bandpass.Q.linearRampToValueAtTime(0.2, exhaleEnd);

  lowpass.frequency.setValueAtTime(2200, start);
  lowpass.frequency.linearRampToValueAtTime(4000, inhaleMid);
  lowpass.frequency.linearRampToValueAtTime(4500, inhaleEnd);

  if (pauseIn > 0) {
    lowpass.frequency.setValueAtTime(4500, inhaleEnd);
    lowpass.frequency.linearRampToValueAtTime(3000, exStart);
  }

  lowpass.frequency.setValueAtTime(3000, exStart);
  lowpass.frequency.linearRampToValueAtTime(1800, exhaleMid);
  lowpass.frequency.linearRampToValueAtTime(1400, exhaleEnd);

  breathGain.gain.setValueAtTime(0, start);
  breathGain.gain.linearRampToValueAtTime(0.28, punchEnd);
  breathGain.gain.linearRampToValueAtTime(0.55, inhaleMid);
  breathGain.gain.linearRampToValueAtTime(1.0, inhaleEnd);

  if (pauseIn > 0) {
    breathGain.gain.setValueAtTime(1.0, inhaleEnd);
    breathGain.gain.linearRampToValueAtTime(0.25, exStart);
  }

  breathGain.gain.setValueAtTime(0.25, exStart);
  breathGain.gain.linearRampToValueAtTime(0.08, exhaleDropEnd);
  breathGain.gain.linearRampToValueAtTime(0.03, exhaleMid);
  breathGain.gain.linearRampToValueAtTime(0.02, sighStart);
  breathGain.gain.setValueAtTime(0.02, sighStart);
  breathGain.gain.linearRampToValueAtTime(0.08, sighPeak);
  breathGain.gain.linearRampToValueAtTime(0, exhaleEnd);

  bodyGain.gain.setValueAtTime(0, start);
  bodyGain.gain.linearRampToValueAtTime(0.18, punchEnd);
  bodyGain.gain.linearRampToValueAtTime(0.04, inhaleMid);
  bodyGain.gain.linearRampToValueAtTime(0.1, inhaleEnd);

  if (pauseIn > 0) {
    bodyGain.gain.linearRampToValueAtTime(0.02, exStart);
  }

  bodyGain.gain.setValueAtTime(0.02, exStart);
  bodyGain.gain.linearRampToValueAtTime(0.008, exhaleMid);
  bodyGain.gain.linearRampToValueAtTime(0.005, sighStart);
  bodyGain.gain.setValueAtTime(0.005, sighStart);
  bodyGain.gain.linearRampToValueAtTime(0.07, sighPeak);
  bodyGain.gain.linearRampToValueAtTime(0, exhaleEnd);

  bodyOsc.frequency.setValueAtTime(65, start);
  bodyOsc.frequency.linearRampToValueAtTime(85, inhaleMid);
  bodyOsc.frequency.linearRampToValueAtTime(92, inhaleEnd);

  if (pauseIn > 0) {
    bodyOsc.frequency.linearRampToValueAtTime(82, exStart);
  }

  bodyOsc.frequency.setValueAtTime(82, exStart);
  bodyOsc.frequency.linearRampToValueAtTime(72, exhaleMid);
  bodyOsc.frequency.linearRampToValueAtTime(55, exhaleEnd);

  return end;
}

function startScheduling(config: CycleConfig) {
  if (!ctx) return;
  nextScheduledCycle = ctx.currentTime + 0.1;

  const advance = () => {
    if (!_isPlaying || !ctx) return;

    const now = ctx.currentTime;
    const lookAhead = 2;
    const safety = 0.1;

    while (nextScheduledCycle < now + lookAhead) {
      if (!_isPlaying) break;
      nextScheduledCycle =
        scheduleCycle(config, nextScheduledCycle) ?? nextScheduledCycle + 4;
      if (!nextScheduledCycle || nextScheduledCycle <= now + safety) {
        nextScheduledCycle = now + 4;
        break;
      }
    }

    if (_isPlaying) {
      scheduleInterval = setTimeout(advance, 200);
    }
  };

  advance();
}

function buildAudioGraph() {
  if (!ctx) return;
  ctx.resume();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(ctx.destination);

  compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 6;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.05;
  compressor.connect(masterGain);

  const noiseBuffer = createBrownNoiseBuffer(ctx.sampleRate);
  noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 200;
  bandpass.Q.value = 0.7;

  lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3000;

  breathGain = ctx.createGain();
  breathGain.gain.value = 0;

  noiseSource.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(breathGain);
  breathGain.connect(compressor);

  bodyOsc = ctx.createOscillator();
  bodyOsc.type = "sine";
  bodyOsc.frequency.value = 90;

  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.value = 200;

  bodyGain = ctx.createGain();
  bodyGain.gain.value = 0;

  bodyOsc.connect(bodyFilter);
  bodyFilter.connect(bodyGain);
  bodyGain.connect(compressor);

  noiseSource.start();
  bodyOsc.start();
}

function teardownAudioGraph() {
  if (scheduleInterval) {
    clearTimeout(scheduleInterval);
    scheduleInterval = null;
  }

  try { noiseSource?.stop(); } catch {}
  try { bodyOsc?.stop(); } catch {}

  noiseSource?.disconnect();
  bodyOsc?.disconnect();
  bandpass?.disconnect();
  lowpass?.disconnect();
  breathGain?.disconnect();
  bodyGain?.disconnect();
  compressor?.disconnect();
  masterGain?.disconnect();

  noiseSource = null;
  bodyOsc = null;
  bandpass = null;
  lowpass = null;
  breathGain = null;
  bodyGain = null;
  compressor = null;
  masterGain = null;
  nextScheduledCycle = 0;
}

function ensureContext(): AudioContext {
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioContext();
  }
  return ctx;
}

export function playBreathing(type: BreathingCycleType = "short") {
  if (_isPlaying) return;
  _activeType = type;
  _isPlaying = true;
  ensureContext();
  buildAudioGraph();
  const config = CYCLE_OPTIONS[type];
  startScheduling(config);
}

export function stopBreathing() {
  _isPlaying = false;
  teardownAudioGraph();
}

export function setBreathingType(type: BreathingCycleType) {
  if (_isPlaying && type !== _activeType) {
    _activeType = type;
    teardownAudioGraph();
    ensureContext();
    buildAudioGraph();
    const config = CYCLE_OPTIONS[type];
    startScheduling(config);
  } else {
    _activeType = type;
  }
}

export function isPlaying(): boolean {
  return _isPlaying;
}

export function getActiveType(): BreathingCycleType {
  return _activeType;
}

export function playTechniqueBreathing(
  technique: Technique,
  tempo: number = 1
): void {
  if (_isPlaying) return;

  const phases = technique.phases;
  if (phases.length === 0) {
    playBreathing("short");
    return;
  }

  let inhaleMs = 0;
  let exhaleMs = 0;
  let pauseAfterInhaleMs = 0;
  let pauseAfterExhaleMs = 0;

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const durationMs = (phase.duration / tempo) * 1000;

    if (phase.name === "Вдох") {
      inhaleMs = durationMs;
    } else if (phase.name === "Выдох") {
      exhaleMs = durationMs;
    } else if (phase.name === "Задержка") {
      if (pauseAfterInhaleMs === 0 && exhaleMs === 0) {
        pauseAfterInhaleMs = durationMs;
      } else {
        pauseAfterExhaleMs = durationMs;
      }
    }
  }

  if (inhaleMs === 0 && exhaleMs === 0) {
    playBreathing("short");
    return;
  }

  const config: CycleConfig = {
    label: technique.name,
    labelShort: technique.name,
    inhaleMs: inhaleMs || 2000,
    exhaleMs: exhaleMs || 2000,
    pauseAfterInhaleMs,
    pauseAfterExhaleMs,
  };

  _isPlaying = true;
  ensureContext();
  buildAudioGraph();
  startScheduling(config);
}
