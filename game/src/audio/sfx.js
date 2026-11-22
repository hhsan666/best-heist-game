// Every sound in HUSHLINE is synthesised here with the Web Audio API: no sound files.
// The context starts on the first key press or click, as browsers require.

let ac = null;
let master = null;
let muted = false;

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ac = new Ctx();
  master = ac.createGain();
  master.gain.value = 0.55;
  master.connect(ac.destination);
}

export function audioContext() { return ac; }
export function masterBus() { return master; }

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.55;
  return muted;
}

function tone(freq, dur, { type = 'sine', gain = 0.2, slide = 0, delay = 0, attack = 0.005 } = {}) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noiseBurst(dur, { gain = 0.15, freq = 900, q = 1.2, delay = 0 } = {}) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    data[i] = ((seed / 4294967296) * 2 - 1) * (1 - i / len);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

export const sfx = {
  step: () => noiseBurst(0.06, { gain: 0.12, freq: 420, q: 2 }),
  coin: () => { tone(2350, 0.12, { type: 'triangle', gain: 0.12 }); tone(3100, 0.25, { type: 'sine', gain: 0.08, delay: 0.09 }); tone(2700, 0.2, { gain: 0.06, delay: 0.2 }); },
  smoke: () => noiseBurst(0.7, { gain: 0.25, freq: 600, q: 0.5 }),
  jam: () => { tone(180, 0.35, { type: 'square', gain: 0.07, slide: -120 }); noiseBurst(0.3, { gain: 0.1, freq: 3000, q: 4 }); },
  denied: () => tone(140, 0.12, { type: 'square', gain: 0.06 }),
  huh: () => tone(520, 0.22, { type: 'triangle', gain: 0.12, slide: 260 }),
  heard: () => tone(380, 0.18, { type: 'triangle', gain: 0.1, slide: 120 }),
  spotted: () => { tone(880, 0.12, { type: 'sawtooth', gain: 0.16 }); tone(660, 0.3, { type: 'sawtooth', gain: 0.14, delay: 0.1, slide: -200 }); },
  lost: () => tone(300, 0.4, { type: 'triangle', gain: 0.08, slide: -120 }),
  camera: () => { tone(1500, 0.07, { type: 'square', gain: 0.07 }); tone(1500, 0.07, { type: 'square', gain: 0.07, delay: 0.12 }); },
  tick: () => tone(1900, 0.03, { type: 'square', gain: 0.05 }),
  loot: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', gain: 0.12, delay: i * 0.07 })),
  escaped: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, { type: 'triangle', gain: 0.13, delay: i * 0.09 })),
  caught: () => { tone(220, 0.6, { type: 'sawtooth', gain: 0.16, slide: -140 }); noiseBurst(0.3, { gain: 0.15, freq: 200 }); },
  lockdown: () => { for (let i = 0; i < 4; i++) tone(i % 2 ? 640 : 820, 0.24, { type: 'square', gain: 0.1, delay: i * 0.25 }); },
  select: () => tone(990, 0.05, { type: 'triangle', gain: 0.08 }),
  confirm: () => { tone(660, 0.08, { type: 'triangle', gain: 0.1 }); tone(990, 0.12, { type: 'triangle', gain: 0.1, delay: 0.07 }); },
  siren: (level) => tone(level > 85 ? 900 : 700, 0.2, { type: 'square', gain: 0.035, slide: -200 }),
};

export function playEvents(events) {
  for (const e of events) {
    const play = sfx[e.type];
    if (play) play(e);
  }
}
