/**
 * Kitchen sound: one AudioContext, three buses (ambient / ui / voice), a looped
 * ambience bed that changes character by place, and a small vocabulary of
 * generated interaction sounds. Nothing here plays until `unlock()` has been
 * called from a user gesture, which the browser's autoplay policy requires.
 *
 * Usage from the UI:
 *   kitchenAudio.unlock();            // inside a click/tap handler (the "clock on" button)
 *   kitchenAudio.setPlace('corridor'); // when the student arrives somewhere
 *   kitchenAudio.play('door');         // paired with the visual, same frame
 *   kitchenAudio.setMuted(true);       // persisted for the session and beyond
 */

import type { PlaceId } from '@/content/kitchen';

export type SoundName =
  | 'tap' // selecting an object or option
  | 'confirm' // a row written, a step done
  | 'complete' // a task signed off
  | 'wrong' // a wrong reading or choice; soft, never harsh
  | 'page' // a clipboard page or notepad turning
  | 'door' // a fridge or chiller door opening
  | 'doorClose'
  | 'probe' // probe settled
  | 'write' // pencil on paper
  | 'step' // one footstep while moving about the kitchen
  | 'radio' // radio squelch before Marcus answers
  | 'scale'; // scales settling

const MUTE_KEY = 'springpod:mar-try-day:sound-muted';

/** How the bed sounds in each part of the kitchen: lowpass cutoff (Hz) and gain. */
const PLACE_TONE: Record<PlaceId, { cutoff: number; gain: number }> = {
  pass: { cutoff: 1400, gain: 0.55 },
  corridor: { cutoff: 700, gain: 0.7 },
  'goods-in': { cutoff: 3200, gain: 0.6 },
  bench: { cutoff: 1800, gain: 0.6 },
  events: { cutoff: 900, gain: 0.35 },
};

/** The saved mute choice; storage can be blocked (a strict private mode, a locked-down embed), and sound must not take the page down with it. */
function readMutePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

class KitchenAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private uiBus: GainNode | null = null;
  private bedFilter: BiquadFilterNode | null = null;
  private bedGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private bedStarted = false;
  private muted: boolean;
  private place: PlaceId = 'pass';
  private listeners = new Set<(muted: boolean) => void>();
  private eventTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.muted = readMutePreference();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) void this.ctx.suspend();
        else if (!this.muted) void this.ctx.resume();
      });
    }
  }

  get isMuted() {
    return this.muted;
  }

  get isUnlocked() {
    return this.ctx !== null;
  }

  /** Subscribe to mute changes; returns an unsubscribe function. */
  onMuteChange(fn: (muted: boolean) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(ctx.destination);
      this.ambientBus = ctx.createGain();
      this.ambientBus.gain.value = 1;
      this.ambientBus.connect(this.master);
      this.uiBus = ctx.createGain();
      this.uiBus.gain.value = 1;
      this.uiBus.connect(this.master);
      this.noiseBuffer = makeNoise(ctx, 2, 'brown');
      void this.startBed();
    }
    if (this.ctx.state === 'suspended' && !this.muted) void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // Storage blocked: the choice still holds for this visit.
    }
    if (this.ctx && this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.8, t + 0.2);
      if (!muted && this.ctx.state === 'suspended') void this.ctx.resume();
    }
    this.listeners.forEach((fn) => fn(muted));
  }

  toggleMuted() {
    this.setMuted(!this.muted);
  }

  /** Ramp the bed to the character of a place. */
  setPlace(place: PlaceId) {
    this.place = place;
    if (!this.ctx || !this.bedFilter || !this.bedGain) return;
    const tone = PLACE_TONE[place];
    const t = this.ctx.currentTime;
    this.bedFilter.frequency.cancelScheduledValues(t);
    this.bedFilter.frequency.setValueAtTime(this.bedFilter.frequency.value, t);
    this.bedFilter.frequency.linearRampToValueAtTime(tone.cutoff, t + 0.7);
    this.bedGain.gain.cancelScheduledValues(t);
    this.bedGain.gain.setValueAtTime(this.bedGain.gain.value, t);
    this.bedGain.gain.linearRampToValueAtTime(tone.gain, t + 0.7);
  }

  /** Pull the ambience down while someone is talking. */
  duck(on: boolean) {
    if (!this.ctx || !this.ambientBus) return;
    const t = this.ctx.currentTime;
    this.ambientBus.gain.cancelScheduledValues(t);
    this.ambientBus.gain.setValueAtTime(this.ambientBus.gain.value, t);
    this.ambientBus.gain.linearRampToValueAtTime(on ? 0.4 : 1, t + 0.4);
  }

  play(name: SoundName) {
    if (!this.ctx || !this.uiBus || this.muted) return;
    const ctx = this.ctx;
    const out = this.uiBus;
    switch (name) {
      case 'tap':
        blip(ctx, out, 880, 0.06, 'sine', 0.05);
        break;
      case 'confirm':
        blip(ctx, out, 660, 0.09, 'sine', 0.06);
        setTimeout(() => blip(ctx, out, 990, 0.12, 'sine', 0.06), 90);
        break;
      case 'complete':
        blip(ctx, out, 523, 0.1, 'sine', 0.06);
        setTimeout(() => blip(ctx, out, 659, 0.1, 'sine', 0.06), 110);
        setTimeout(() => blip(ctx, out, 784, 0.22, 'sine', 0.07), 220);
        break;
      case 'wrong':
        blip(ctx, out, 220, 0.15, 'triangle', 0.045);
        break;
      case 'page':
        noiseBurst(ctx, out, this.noiseBuffer, 0.12, 2400, 'highpass', 0.12);
        break;
      case 'write':
        noiseBurst(ctx, out, this.noiseBuffer, 0.18, 1800, 'bandpass', 0.07);
        break;
      case 'door':
        noiseBurst(ctx, out, this.noiseBuffer, 0.35, 900, 'lowpass', 0.22); // seal breaking
        setTimeout(() => noiseBurst(ctx, out, this.noiseBuffer, 0.5, 4000, 'highpass', 0.05), 120); // cold air hiss
        break;
      case 'doorClose':
        noiseBurst(ctx, out, this.noiseBuffer, 0.12, 300, 'lowpass', 0.3);
        break;
      case 'probe':
        blip(ctx, out, 1760, 0.07, 'square', 0.025);
        setTimeout(() => blip(ctx, out, 1760, 0.07, 'square', 0.025), 120);
        break;
      case 'step':
        noiseBurst(ctx, out, this.noiseBuffer, 0.07, 400, 'lowpass', 0.14);
        break;
      case 'radio':
        noiseBurst(ctx, out, this.noiseBuffer, 0.16, 2200, 'bandpass', 0.1);
        setTimeout(() => blip(ctx, out, 1200, 0.05, 'square', 0.02), 160);
        break;
      case 'scale':
        blip(ctx, out, 1320, 0.05, 'square', 0.02);
        break;
    }
  }

  /** A short walk: a few footsteps spaced like a person crossing a kitchen. */
  footsteps(count = 4, gapMs = 380) {
    for (let i = 0; i < count; i++) setTimeout(() => this.play('step'), i * gapMs + Math.random() * 40);
  }

  private async startBed() {
    if (!this.ctx || !this.ambientBus || this.bedStarted) return;
    this.bedStarted = true;
    const ctx = this.ctx;
    const tone = PLACE_TONE[this.place];
    this.bedFilter = ctx.createBiquadFilter();
    this.bedFilter.type = 'lowpass';
    this.bedFilter.frequency.value = tone.cutoff;
    this.bedGain = ctx.createGain();
    this.bedGain.gain.value = 0;
    this.bedFilter.connect(this.bedGain);
    this.bedGain.connect(this.ambientBus);

    // The room itself: a generated ambience loop when it is available, a filtered
    // brown-noise hum with a faint mains tone underneath either way.
    const hum = ctx.createBufferSource();
    hum.buffer = this.noiseBuffer;
    hum.loop = true;
    const humLp = ctx.createBiquadFilter();
    humLp.type = 'lowpass';
    humLp.frequency.value = 180;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humLp);
    humLp.connect(humGain);
    humGain.connect(this.bedFilter);
    hum.start();

    const mains = ctx.createOscillator();
    mains.type = 'sine';
    mains.frequency.value = 100;
    const mainsGain = ctx.createGain();
    mainsGain.gain.value = 0.008;
    mains.connect(mainsGain);
    mainsGain.connect(this.bedFilter);
    mains.start();

    try {
      const url = `${import.meta.env.BASE_URL}audio/kitchen-ambience.mp3`;
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.value = 0.5;
        src.connect(g);
        g.connect(this.bedFilter);
        src.start();
      }
    } catch {
      // The generated hum carries the room on its own.
    }

    const t = ctx.currentTime;
    this.bedGain.gain.setValueAtTime(0, t);
    this.bedGain.gain.linearRampToValueAtTime(tone.gain, t + 2.5);
    this.scheduleEvent();
  }

  /** Sparse life in the room: a distant pan, a door, a printer. Skips some slots on purpose. */
  private scheduleEvent() {
    if (this.eventTimer) clearTimeout(this.eventTimer);
    const wait = 15000 + Math.random() * 25000;
    this.eventTimer = setTimeout(() => {
      if (this.ctx && this.ambientBus && !this.muted && Math.random() > 0.4) {
        const pick = Math.random();
        if (pick < 0.4) noiseBurst(this.ctx, this.ambientBus, this.noiseBuffer, 0.25, 500, 'lowpass', 0.08); // a door somewhere
        else if (pick < 0.75) blip(this.ctx, this.ambientBus, 2200 + Math.random() * 600, 0.05, 'triangle', 0.012); // a pan set down
        else noiseBurst(this.ctx, this.ambientBus, this.noiseBuffer, 0.6, 3000, 'bandpass', 0.02); // the ticket printer
      }
      this.scheduleEvent();
    }, wait);
  }
}

function makeNoise(ctx: AudioContext, seconds: number, kind: 'brown' | 'white'): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') {
      d[i] = w;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buf;
}

function blip(ctx: AudioContext, out: AudioNode, freq: number, dur: number, type: OscillatorType, gain: number) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noiseBurst(
  ctx: AudioContext,
  out: AudioNode,
  buffer: AudioBuffer | null,
  dur: number,
  freq: number,
  type: BiquadFilterType,
  gain: number,
) {
  if (!buffer) return;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.loopStart = Math.random() * (buffer.duration - dur - 0.05);
  src.loopEnd = buffer.duration;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = type === 'bandpass' ? 0.9 : 0.7;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t, src.loopStart);
  src.stop(t + dur + 0.05);
}

export const kitchenAudio = new KitchenAudio();
