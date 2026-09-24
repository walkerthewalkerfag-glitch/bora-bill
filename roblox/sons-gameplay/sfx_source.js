// Pocket Vanguards: gameplay sounds. Uses PVSynth (web/audio.js). Each entry renders into an OfflineAudioContext.
const HUD_SR = 44100;
const DREAM_L = 24; // dream-world loop length (seconds)

function hudRender(seconds, fn, seed) {
  const ac = new OfflineAudioContext(2, Math.ceil(seconds * HUD_SR), HUD_SR);
  fn(new PVSynth(ac, seed || 7), ac);
  return ac.startRendering();
}

// bell-ish music box for melodies
function mbox(x, t, f, v, d) { x.pluck(t, f, { vol: v || 0.035, dur: d || 1.6, wet: 0.55 }); }

const HUD_SFX = {
  // monster jumps out of the tall grass: three rustles, a bright two-note alert, a short rise
  encounter: [2.4, (x) => {
    [0, 0.09, 0.2].forEach((t, i) => x.noise(t, 0.12, { f0: 2600 + i * 500, f1: 1400, q: 1.6, vol: 0.08 }));
    x.noise(0.3, 0.35, { ft: 'lowpass', f0: 400, f1: 3200, vol: 0.05, a: 0.3, cut: true });
    x.tone(0.62, 880, 880, 0.18, { vol: 0.09, type: 'triangle', lp: 3000 });
    x.tone(0.74, 1318.51, 1318.51, 0.5, { vol: 0.09, type: 'triangle', lp: 3000, wet: 0.35 });
    x.tone(0.62, 110, 55, 0.5, { vol: 0.22, lp: 400 });
    x.bell(0.74, 1760, { vol: 0.02, dur: 1.4 });
  }],
  // trainer battle: whoosh, low hit, minor stab, rising arpeggio
  trainer: [3, (x) => {
    x.noise(0, 0.45, { f0: 300, f1: 4200, q: 0.8, vol: 0.07, a: 0.42, cut: true });
    x.tone(0.45, 98, 49, 0.7, { vol: 0.34, lp: 300 });
    x.noise(0.45, 0.25, { ft: 'lowpass', f0: 2400, f1: 300, vol: 0.09 });
    [146.83, 174.61, 220, 293.66].forEach((f) => x.tone(0.45, f, f, 0.9, { vol: 0.04, type: 'sawtooth', lp: 1400, a: 0.01, wet: 0.3 }));
    [587.33, 698.46, 880, 1174.66].forEach((f, i) => x.tone(0.9 + i * 0.07, f, f, 0.35, { vol: 0.05, type: 'square', lp: 2400, wet: 0.25 }));
    x.tone(1.2, 1174.66, 1174.66, 1.2, { vol: 0.03, type: 'triangle', wet: 0.5 });
  }],
  // choosing the starter: warm major arpeggio, sparkle, a little slime boing
  starter: [3, (x) => {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => mbox(x, i * 0.08, f, 0.045, 2));
    x.tone(0, 261.63, 261.63, 1.6, { vol: 0.05, type: 'triangle', a: 0.05, wet: 0.5 });
    x.noise(0.3, 0.8, { ft: 'highpass', f0: 5500, vol: 0.012, a: 0.3, wet: 0.6 });
    x.bell(0.42, 2093, { vol: 0.02, dur: 2 });
    x.boing(0.55, 260, 620, { vol: 0.08, glide: 0.1, dur: 0.35, depth: 0.08, rate: 16 });
  }],
  // dream move: reversed-feeling swell, detuned bell cluster, deep bloom
  dream: [3.2, (x, ac) => {
    x.noise(0, 0.9, { f0: 600, f1: 5200, q: 0.7, vol: 0.06, a: 0.88, cut: true, wet: 0.6 });
    [1, 1.5, 2, 2.5].forEach((m, i) => x.tone(0.05, 330 * m, 330 * m * 1.01, 0.85, { vol: 0.012, a: 0.8, wet: 0.7 }));
    x.bell(0.9, 987.77, { vol: 0.05, dur: 2.4 });
    x.bell(0.93, 1318.51, { vol: 0.035, dur: 2.2 });
    x.bell(0.97, 1661.22, { vol: 0.025, dur: 2 });
    x.tone(0.9, 82.41, 65.41, 1.8, { vol: 0.2, a: 0.03, lp: 400 });
    const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    o.frequency.value = 659.25; l.frequency.value = 5.5; lg.gain.value = 9;
    l.connect(lg); lg.connect(o.frequency);
    x.env(g, 0.9, 0.2, 0.025, 2.9); o.connect(g); x.send(g, 0.8);
    [o, l].forEach((n) => { n.start(0.9); n.stop(3); });
  }],
};

// dream world soundtrack: Fmaj7 / Ebmaj9 lydian drift, music box, soft air. Loops every DREAM_L seconds.
function hudDreamWorld(x, ac) {
  const L = DREAM_L;
  const bus = ac.createGain(); bus.gain.value = 1;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.4;
  const lfo = ac.createOscillator(), lfg = ac.createGain(); lfo.frequency.value = 1 / (L / 2); lfg.gain.value = 300;
  lfo.connect(lfg); lfg.connect(lp.frequency); lfo.start(0);
  bus.connect(lp); const pg = ac.createGain(); pg.gain.value = 0.05; lp.connect(pg); x.send(pg, 0.65);
  const chords = [[87.31, 130.81, 164.81, 220, 261.63, 329.63], [77.78, 116.54, 155.56, 196, 233.08, 293.66]];
  for (let c = 0; c < 4; c++) {                       // 2 loops of 2 chords, 12 s each
    const t0 = c * (L / 2), ch = chords[c % 2];
    ch.forEach((f, i) => [-6, 6].forEach((dt) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = dt;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(i < 2 ? 0.9 : 0.5, t0 + 2.5);
      g.gain.setValueAtTime(i < 2 ? 0.9 : 0.5, t0 + L / 2 - 1); g.gain.exponentialRampToValueAtTime(0.0001, t0 + L / 2 + 2);
      o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + L / 2 + 2.1);
    }));
  }
  const mel = [[0, 1046.5], [1.5, 880], [3, 783.99], [4.5, 659.25], [7.5, 987.77], [9, 880], [12, 932.33], [13.5, 783.99],
    [15, 698.46], [16.5, 587.33], [19.5, 783.99], [21, 698.46], [22.5, 659.25]];
  for (let k = 0; k < 2; k++) mel.forEach(([p, f]) => { mbox(x, k * L + p + 0.2, f, 0.028, 2.4); mbox(x, k * L + p + 0.2, f / 2, 0.012, 2.4); });
  for (let k = 0; k < 8; k++) x.noise(k * 6 + 1, 5, { ft: 'bandpass', f0: 900, f1: 2400, q: 0.5, vol: 0.008, a: 2.4, wet: 0.7 });
}

// talking blips (indie-game voices): 6 syllables per voice
const HUD_VOICES = {
  mina: { base: 523.25, type: 'triangle', lp: 3200, steps: [0, 2, 4, 7, 9, 12] },
  jinwoo: { base: 196, type: 'square', lp: 1300, steps: [0, 3, 5, 7, 10, 12] },
  nico: { base: 349.23, type: 'square', lp: 2200, steps: [0, 2, 5, 7, 9, 11] },
  eco: { base: 261.63, type: 'sine', lp: 2600, steps: [0, 1, 6, 7, 11, 13] },
};
function hudBlip(x, t, voice, i) {
  const v = HUD_VOICES[voice], f = v.base * Math.pow(2, v.steps[i % v.steps.length] / 12);
  x.tone(t, f * 1.06, f, 0.055, { vol: 0.07, type: v.type, lp: v.lp, glide: 0.03, a: 0.003 });
}
