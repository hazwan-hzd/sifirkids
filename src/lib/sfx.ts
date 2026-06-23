/*
  Lightweight pack-opening sound effects, synthesized with the Web Audio API.
  No audio files to host or ship. Swap to recorded samples later by replacing
  the bodies of these functions with buffer playback if desired.

  AudioContext is created lazily on first call so it starts inside a user
  gesture (tapping the pack), which browsers require for audio to play.
*/

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Wave = OscillatorType;

function tone(
  freq: number,
  start: number,
  dur: number,
  gain: number,
  wave: Wave = "sine",
  glideTo?: number,
) {
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur: number, gain: number) {
  const ac = ensureCtx();
  if (!ac) return;
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // fade the noise out so it reads as a "tear"
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ac.createBufferSource();
  const g = ac.createGain();
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1200;
  src.buffer = buffer;
  g.gain.value = gain;
  src.connect(hp).connect(g).connect(ac.destination);
  src.start();
}

/** Wrapper tear: a short filtered noise rip. */
export function playRip() {
  noiseBurst(0.32, 0.25);
  tone(180, 0.0, 0.18, 0.12, "sawtooth", 90);
}

/** Card flip: a soft swoosh-click. */
export function playFlip() {
  tone(520, 0, 0.09, 0.08, "triangle", 760);
}

/** Reveal sting, pitched by rarity. */
export function playReveal(rarity: string) {
  switch (rarity) {
    case "rare":
      tone(523, 0, 0.16, 0.1, "triangle", 784); // C5 -> G5
      break;
    case "ultra_rare":
      tone(659, 0, 0.14, 0.11, "triangle");
      tone(988, 0.08, 0.18, 0.1, "sine");
      break;
    case "secret_gold":
      // handled by playGold for the cinematic
      break;
    case "uncommon":
      tone(440, 0, 0.12, 0.07, "triangle", 554);
      break;
    default:
      tone(392, 0, 0.1, 0.06, "sine"); // gentle G4
  }
}

/** Legendary chime: a rising golden arpeggio. */
export function playGold() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
  notes.forEach((f, i) => tone(f, i * 0.12, 0.5, 0.12, "triangle"));
  tone(1318.5, 0.5, 0.9, 0.09, "sine"); // shimmering high E
}

/** Light haptic tap on supported devices. */
export function haptic(pattern: number | number[] = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
