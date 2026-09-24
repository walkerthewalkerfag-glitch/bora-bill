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

// grains of leaf noise shaped by an envelope of shakes: sounds like a bush being pushed
function rustle(x, ac, t0, shakes, vol) {
  const sr = ac.sampleRate, dur = shakes[shakes.length - 1][0] + shakes[shakes.length - 1][1] + 0.1;
  const buf = ac.createBuffer(1, Math.ceil(dur * sr), sr), d = buf.getChannelData(0), r = x.rnd;
  for (const [st, len, dens] of shakes) {
    const n = Math.floor(len * dens);
    for (let g = 0; g < n; g++) {
      const u = r(), at = st + u * len, env = Math.sin(Math.PI * u), gl = Math.floor((0.004 + r() * 0.012) * sr), s0 = Math.floor(at * sr), a = (0.3 + r() * 0.7) * env;
      for (let i = 0; i < gl && s0 + i < d.length; i++) d[s0 + i] += (r() * 2 - 1) * a * Math.exp(-i / (gl * 0.3));
    }
  }
  const src = ac.createBufferSource(); src.buffer = buf;
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
  const pk = ac.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 3800; pk.Q.value = 0.8; pk.gain.value = 6;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(hp); hp.connect(pk); pk.connect(g); x.send(g, 0.15); src.start(t0);
}
function drive(ac, amt) {
  const w = ac.createWaveShaper(), n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = i / (n - 1) * 2 - 1; c[i] = Math.tanh(v * amt) / Math.tanh(amt); }
  w.curve = c; return w;
}
function stab(x, ac, t, freqs, dur, vol, cut) {
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(cut || 3200, t + 0.04); f.frequency.exponentialRampToValueAtTime(700, t + dur);
  const g = ac.createGain(); x.env(g, t, 0.006, vol, t + dur); f.connect(g); x.send(g, 0.3);
  freqs.forEach((fr) => [-9, 9].forEach((dt) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + 0.05); }));
}
function kick(x, t, v) { x.tone(t, 160, 38, 0.35, { vol: v, glide: 0.12, a: 0.002 }); x.noise(t, 0.03, { ft: 'highpass', f0: 3000, vol: v * 0.25 }); }
function snare(x, t, v) { x.noise(t, 0.14, { f0: 1800, q: 0.6, vol: v, a: 0.002 }); x.tone(t, 220, 180, 0.08, { vol: v * 0.6, a: 0.002 }); }
function tom(x, t, f, v) { x.tone(t, f * 1.5, f, 0.22, { vol: v, glide: 0.08, a: 0.002 }); x.noise(t, 0.05, { f0: 900, q: 0.8, vol: v * 0.3 }); }

const HUD_SFX = {
  // bush rustle building up, a hard shake, then the monster pops out with a short sting
  encounter: [2.6, (x, ac) => {
    rustle(x, ac, 0, [[0, 0.28, 90], [0.34, 0.22, 110], [0.62, 0.42, 220]], 0.5);
    x.noise(0.62, 0.35, { f0: 700, f1: 300, q: 0.7, vol: 0.05 });           // branches bend
    x.tone(1.02, 180, 520, 0.12, { vol: 0.16, glide: 0.09, lp: 1600 });     // pop out
    x.noise(1.02, 0.08, { ft: 'highpass', f0: 2500, vol: 0.12 });
    stab(x, ac, 1.08, [293.66, 349.23, 440, 587.33], 0.5, 0.05, 4200);
    x.tone(1.08, 1174.66, 1174.66, 0.12, { vol: 0.07, type: 'square', lp: 3000 });
    x.tone(1.2, 1567.98, 1567.98, 0.45, { vol: 0.06, type: 'square', lp: 3000, wet: 0.3 });
    x.tone(1.08, 73.42, 55, 0.6, { vol: 0.3, lp: 300 });
  }],
  // trainer battle: riser, big hit, accelerating drum roll, second hit and brass climb, crash
  trainer: [3.6, (x, ac) => {
    x.noise(0, 0.6, { f0: 400, f1: 7000, q: 0.9, vol: 0.09, a: 0.58, cut: true });
    x.tone(0, 110, 440, 0.6, { vol: 0.05, type: 'sawtooth', a: 0.55, lp: 2000 });
    kick(x, 0.6, 0.55); snare(x, 0.6, 0.25);
    stab(x, ac, 0.6, [146.83, 220, 293.66, 349.23], 0.55, 0.06);
    x.noise(0.6, 1.4, { ft: 'highpass', f0: 5000, vol: 0.06, a: 0.005, wet: 0.4 });
    let t = 0.95; const toms = [196, 196, 174.6, 174.6, 146.8, 146.8, 130.8, 110, 98, 87.3];
    toms.forEach((f, i) => { tom(x, t, f, 0.22); snare(x, t + 0.02, 0.06); t += 0.11 - i * 0.006; });
    kick(x, 1.85, 0.6); snare(x, 1.85, 0.3);
    stab(x, ac, 1.85, [174.61, 261.63, 349.23, 440], 0.4, 0.06);
    [587.33, 698.46, 880, 1174.66].forEach((f, i) => stab(x, ac, 2.05 + i * 0.09, [f / 2, f], 0.25 + (i === 3 ? 0.7 : 0), 0.035, 5000));
    x.noise(2.32, 1.2, { ft: 'highpass', f0: 4200, vol: 0.09, a: 0.004, wet: 0.5 });
    kick(x, 2.32, 0.4);
  }],
  // starter pick (approved): warm major arpeggio, sparkle, a little slime boing
  starter: [3, (x) => {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => mbox(x, i * 0.08, f, 0.045, 2));
    x.tone(0, 261.63, 261.63, 1.6, { vol: 0.05, type: 'triangle', a: 0.05, wet: 0.5 });
    x.noise(0.3, 0.8, { ft: 'highpass', f0: 5500, vol: 0.012, a: 0.3, wet: 0.6 });
    x.bell(0.42, 2093, { vol: 0.02, dur: 2 });
    x.boing(0.55, 260, 620, { vol: 0.08, glide: 0.1, dur: 0.35, depth: 0.08, rate: 16 });
  }],
  // dream move = waking from a nightmare: drone and dissonance close in, heartbeat speeds up,
  // everything is sucked in, then a violent jolt, a gasp, and a low ringing afterwards
  dream: [4.2, (x, ac) => {
    const dr = drive(ac, 3), dg = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(200, 0); lp.frequency.exponentialRampToValueAtTime(1800, 1.4);
    x.env(dg, 0, 1.3, 0.09, 1.52); dr.connect(lp); lp.connect(dg); x.send(dg, 0.4);
    [55, 58.27, 82.41, 116.54].forEach((f) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, 0); o.frequency.exponentialRampToValueAtTime(f * 1.06, 1.45); o.connect(dr); o.start(0); o.stop(1.55); });
    [[1244.5, 1318.5], [1760, 1864.7], [2489, 2637]].forEach(([a, b]) => { x.tone(0.2, a, a * 1.03, 1.3, { vol: 0.012, a: 1.2, wet: 0.6 }); x.tone(0.2, b, b * 0.98, 1.3, { vol: 0.012, a: 1.2, wet: 0.6 }); });
    [0.1, 0.55, 0.9, 1.12, 1.28].forEach((t) => { x.tone(t, 70, 45, 0.16, { vol: 0.28, a: 0.004, lp: 200 }); x.tone(t + 0.1, 62, 40, 0.14, { vol: 0.2, a: 0.004, lp: 200 }); });
    x.noise(0.2, 1.3, { f0: 300, f1: 6000, q: 0.8, vol: 0.09, a: 1.28, cut: true, wet: 0.5 });
    // THE jolt
    const T = 1.52;
    x.tone(T, 140, 28, 1.1, { vol: 0.6, glide: 0.5, a: 0.002 });
    x.noise(T, 0.35, { ft: 'lowpass', f0: 5000, f1: 300, vol: 0.28, a: 0.002 });
    const sg = ac.createGain(), sd = drive(ac, 6), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(1800, T); bp.frequency.exponentialRampToValueAtTime(3600, T + 0.5);
    x.env(sg, T, 0.004, 0.07, T + 0.6); sd.connect(bp); bp.connect(sg); x.send(sg, 0.5);
    [880, 931.3, 1244.5].forEach((f) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, T); o.frequency.exponentialRampToValueAtTime(f * 1.9, T + 0.5); o.connect(sd); o.start(T); o.stop(T + 0.65); });
    x.noise(T + 0.04, 0.25, { f0: 900, f1: 2400, q: 4, vol: 0.06, a: 0.02 });             // gasp
    x.bell(T + 0.3, 164.81, { vol: 0.08, dur: 2.4, wet: 0.8 });
    x.bell(T + 0.3, 233.08, { vol: 0.05, dur: 2.2, wet: 0.8 });
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

// talking voices: formant syllables (sawtooth through two vowel filters), indie-RPG style
const HUD_VOWELS = [[800, 1200], [400, 2300], [300, 2800], [500, 900], [350, 700], [650, 1700]];
const HUD_VOICES = {
  mina: { base: 392, steps: [0, 2, 4, 7, 9, 5], len: 0.07, gain: 0.2 },
  jinwoo: { base: 130.81, steps: [0, 3, 5, 0, 7, 3], len: 0.085, gain: 0.26 },
  nico: { base: 261.63, steps: [0, 4, 7, 2, 9, 5], len: 0.06, gain: 0.22 },
  eco: { base: 196, steps: [0, 1, 6, 7, 11, 13], len: 0.09, gain: 0.22, wob: 30 },
};
function hudBlip(x, t, voice, i) {
  const ac = x.ac, v = HUD_VOICES[voice], f = v.base * Math.pow(2, v.steps[i % 6] / 12), vw = HUD_VOWELS[i % 6];
  const o = ac.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(f * 1.08, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.025); o.frequency.exponentialRampToValueAtTime(f * 0.94, t + v.len);
  if (v.wob) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = v.wob; lg.gain.value = f * 0.06; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + v.len + 0.03); }
  const g = ac.createGain(); x.env(g, t, 0.006, v.gain, t + v.len);
  vw.forEach((F, k) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = F; bp.Q.value = 5; const bg = ac.createGain(); bg.gain.value = k ? 0.6 : 1; o.connect(bp); bp.connect(bg); bg.connect(g); });
  x.send(g, 0.08); o.start(t); o.stop(t + v.len + 0.03);
}
