// Pocket Vanguards: gameplay sounds. Uses PVSynth (web/audio.js). Each entry renders into an OfflineAudioContext.
const HUD_SR = 44100;
const DREAM_L = 24; // dream-world loop length (seconds)

function hudRender(seconds, fn, seed) {
  const ac = new OfflineAudioContext(2, Math.ceil(seconds * HUD_SR), HUD_SR);
  fn(new PVSynth(ac, seed || 7), ac);
  return ac.startRendering().then((buf) => {   // keep a little headroom, never clip
    let pk = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); }
    if (pk > 0.92) for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c), k = 0.92 / pk; for (let i = 0; i < d.length; i++) d[i] *= k; }
    return buf;
  });
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


// the trainer battle keeps going after the intro: 150 BPM groove in D minor, 8 bars, loops forever
const TR_G0 = 2.32, TR_BEAT = 0.4, TR_LOOP = 8 * 4 * TR_BEAT;   // loop region = [TR_G0 + TR_LOOP, TR_G0 + 2 * TR_LOOP]
const TR_BASS = [73.42, 73.42, 58.27, 65.41, 73.42, 73.42, 98, 110];
const TR_CH = [[293.66, 349.23, 440], [293.66, 349.23, 440], [233.08, 293.66, 349.23], [261.63, 329.63, 392], [293.66, 349.23, 440], [293.66, 349.23, 440], [196, 233.08, 293.66], [220, 277.18, 329.63]];
const TR_MEL = [[[0, 0, 1.5], [1.5, 3, .5], [2, 5, 1], [3, 7, 1]], [[0, 8, 1.5], [1.5, 7, .5], [2, 5, 1], [3, 3, 1]], [[0, 5, 1], [1, 3, .5], [1.5, 2, .5], [2, -2, 2]], [[0, -2, .5], [.5, 0, .5], [1, 2, 1], [2, 3, 1], [3, 5, 1]],
  [[0, 7, 1.5], [1.5, 5, .5], [2, 7, 1], [3, 12, 1]], [[0, 10, 1], [1, 8, 1], [2, 7, 1], [3, 5, 1]], [[0, 3, 1.5], [1.5, 5, .5], [2, 7, 1], [3, 10, 1]], [[0, 9, 2], [2, 4, 1], [3, 1, 1]]];
function trainerGroove(x, ac, g0, cycles) {
  const B = TR_BEAT;
  for (let c = 0; c < cycles; c++) for (let bar = 0; bar < 8; bar++) {
    const t0 = g0 + (c * 8 + bar) * 4 * B;
    [0, 1.5, 2].forEach((b) => kick(x, t0 + b * B, 0.2));
    [1, 3].forEach((b) => snare(x, t0 + b * B, 0.09));
    if (bar === 7) [3.25, 3.5, 3.75].forEach((b, i) => tom(x, t0 + b * B, 196 - i * 30, 0.14));
    for (let h = 0; h < 8; h++) x.noise(t0 + h * B / 2, 0.035, { ft: 'highpass', f0: 7000, vol: h % 2 ? 0.018 : 0.03, a: 0.001 });
    const bf = TR_BASS[bar];
    for (let e = 0; e < 8; e++) { const f = e % 4 === 3 ? bf * 2 : bf; x.tone(t0 + e * B / 2, f, f, B / 2 * 0.9, { vol: 0.08, type: "sawtooth", lp: 500, a: 0.004 }); }
    [3.5, 0].forEach((b, k) => { if (k === 0 || bar % 2 === 0) stab(x, ac, t0 + b * B, TR_CH[bar], 0.22, 0.025, 2600); });
    TR_MEL[bar].forEach(([b, st, len]) => { const f = 587.33 * Math.pow(2, st / 12); x.tone(t0 + b * B, f, f, len * B * 0.92, { vol: 0.045, type: 'square', lp: 2800, a: 0.006, wet: 0.2 }); });
  }
}

const HUD_SFX = {
  // wild encounter, handheld-RPG style: a soft swish in the grass, a spinning chip-tune swirl
  // (the screen transition) and a short battle-ready fanfare. All square/triangle, gently filtered.
  encounter: [2.6, (x, ac) => {
    x.noise(0, 0.22, { ft: 'lowpass', f0: 2200, f1: 900, vol: 0.05, a: 0.03 });
    x.noise(0.16, 0.18, { ft: 'lowpass', f0: 2000, f1: 800, vol: 0.04, a: 0.03 });
    const sw = [0, 3, 7, 12, 15, 19, 24, 19, 15, 12, 7, 3];
    for (let k = 0; k < 24; k++) {
      const f = 293.66 * Math.pow(2, (sw[k % 12] + Math.floor(k / 12) * 2) / 12);
      x.tone(0.3 + k * 0.028, f, f, 0.05, { vol: 0.045, type: 'square', lp: 3200, a: 0.002 });
    }
    x.tone(0.3, 180, 900, 0.68, { vol: 0.035, type: 'triangle', glide: 0.68, a: 0.02 });
    const T = 1.02;
    [[0, 587.33], [0.1, 587.33], [0.2, 880], [0.34, 1174.66]].forEach(([d, f], i) => {
      x.tone(T + d, f, f, i === 3 ? 0.6 : 0.09, { vol: 0.06, type: 'square', lp: 3600, a: 0.003, wet: i === 3 ? 0.25 : 0.05 });
      x.tone(T + d, f / 2, f / 2, i === 3 ? 0.6 : 0.09, { vol: 0.04, type: 'triangle', a: 0.003 });
    });
    x.tone(T + 0.34, 146.83, 146.83, 0.6, { vol: 0.12, type: 'triangle', a: 0.004 });
    x.noise(T + 0.34, 0.12, { ft: 'lowpass', f0: 3000, vol: 0.05, a: 0.002 });
  }],
  // trainer battle: riser, big hit, accelerating drum roll, second hit and brass climb, crash
  trainer: [TR_G0 + 2 * TR_LOOP + 0.3, (x, ac) => {
    x.noise(0, 0.6, { f0: 400, f1: 7000, q: 0.9, vol: 0.09, a: 0.58, cut: true });
    x.tone(0, 110, 440, 0.6, { vol: 0.05, type: 'sawtooth', a: 0.55, lp: 2000 });
    kick(x, 0.6, 0.4); snare(x, 0.6, 0.25);
    stab(x, ac, 0.6, [146.83, 220, 293.66, 349.23], 0.55, 0.06);
    x.noise(0.6, 1.4, { ft: 'highpass', f0: 5000, vol: 0.06, a: 0.005, wet: 0.4 });
    let t = 0.95; const toms = [196, 196, 174.6, 174.6, 146.8, 146.8, 130.8, 110, 98, 87.3];
    toms.forEach((f, i) => { tom(x, t, f, 0.22); snare(x, t + 0.02, 0.06); t += 0.11 - i * 0.006; });
    kick(x, 1.85, 0.42); snare(x, 1.85, 0.3);
    stab(x, ac, 1.85, [174.61, 261.63, 349.23, 440], 0.4, 0.06);
    [587.33, 698.46, 880, 1174.66].forEach((f, i) => stab(x, ac, 2.05 + i * 0.09, [f / 2, f], 0.25 + (i === 3 ? 0.7 : 0), 0.035, 5000));
    x.noise(2.32, 1.2, { ft: 'highpass', f0: 4200, vol: 0.09, a: 0.004, wet: 0.5 });
    kick(x, 2.32, 0.4);
    trainerGroove(x, ac, TR_G0, 2);
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

// in-battle music: 168 BPM, E minor, 16 bars. Handheld-battle energy (driving bass, fast lead, stabs)
// with a remix feel (four-on-the-floor, pumping sidechain, supersaw chords, 16th chip arps). Original melody.
const BT_BPM = 168, BT_B = 60 / BT_BPM, BT_BARS = 16, BT_LOOP = BT_BARS * 4 * BT_B;
const BT_CH = [['Em', 164.81, [0, 3, 7]], ['Em', 164.81, [0, 3, 7]], ['C', 130.81, [0, 4, 7]], ['D', 146.83, [0, 4, 7]], ['Em', 164.81, [0, 3, 7]], ['Em', 164.81, [0, 3, 7]], ['C', 130.81, [0, 4, 7]], ['B', 123.47, [0, 4, 7]],
  ['Am', 110, [0, 3, 7]], ['Am', 110, [0, 3, 7]], ['Em', 164.81, [0, 3, 7]], ['Em', 164.81, [0, 3, 7]], ['C', 130.81, [0, 4, 7]], ['D', 146.83, [0, 4, 7]], ['B', 123.47, [0, 4, 7]], ['B', 123.47, [0, 4, 7]]];
const BT_MEL = [
  [[0, 0, .5], [.5, 3, .5], [1, 7, 1], [2, 5, .5], [2.5, 7, .5], [3, 10, .5], [3.5, 12, .5]], [[0, 14, 1.5], [1.5, 12, .5], [2, 10, 1], [3, 7, 1]],
  [[0, 8, .5], [.5, 7, .5], [1, 8, .5], [1.5, 12, 1.5], [3, 10, .5], [3.5, 8, .5]], [[0, 10, 1], [1, 9, .5], [1.5, 10, .5], [2, 14, 2]],
  [[0, 0, .5], [.5, 3, .5], [1, 7, 1], [2, 5, .5], [2.5, 7, .5], [3, 10, .5], [3.5, 12, .5]], [[0, 14, .5], [.5, 15, .5], [1, 17, 1], [2, 15, .5], [2.5, 14, .5], [3, 12, 1]],
  [[0, 12, .5], [.5, 10, .5], [1, 8, 1], [2, 7, .5], [2.5, 8, .5], [3, 7, .5], [3.5, 6, .5]], [[0, 6, 2], [2, 3, 1], [3, -1, 1]],
  [[0, 5, 1.5], [1.5, 7, .5], [2, 8, 1], [3, 12, 1]], [[0, 10, .75], [.75, 8, .75], [1.5, 7, .5], [2, 5, 2]],
  [[0, 3, 1.5], [1.5, 5, .5], [2, 7, 1], [3, 12, 1]], [[0, 10, .5], [.5, 12, .5], [1, 15, 2], [3, 14, 1]],
  [[0, 12, 1], [1, 8, 1], [2, 15, 1], [3, 12, 1]], [[0, 14, 1], [1, 10, 1], [2, 17, 1], [3, 14, 1]],
  [[0, 15, .5], [.5, 14, .5], [1, 11, .5], [1.5, 6, .5], [2, 11, .5], [2.5, 14, .5], [3, 15, .5], [3.5, 18, .5]], [[0, 18, 2], [2, 15, .5], [2.5, 11, .5], [3, 6, 1]]];
function hudBattle(x, ac) {
  const B = BT_B, cycles = 2, total = cycles * BT_BARS * 4;
  // sidechain bus: ducks on every kick
  const sc = ac.createGain(); sc.gain.value = 1; x.send(sc, 0.12);
  for (let k = 0; k < total; k++) { const t = k * B; sc.gain.setValueAtTime(0.35, t); sc.gain.linearRampToValueAtTime(1, t + B * 0.6); }
  const saw = (t, f, dur, vol, cut, dest) => {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 1.2;
    const g = ac.createGain(); x.env(g, t, 0.005, vol, t + dur); lp.connect(g); g.connect(dest);
    [-12, 0, 12].forEach((dt) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.03); });
  };
  for (let c = 0; c < cycles; c++) for (let bar = 0; bar < BT_BARS; bar++) {
    const t0 = (c * BT_BARS + bar) * 4 * B, [, root, tri] = BT_CH[bar];
    for (let b = 0; b < 4; b++) kick(x, t0 + b * B, 0.24);
    [1, 3].forEach((b) => { snare(x, t0 + b * B, 0.1); x.noise(t0 + b * B, 0.09, { f0: 1400, q: 1.2, vol: 0.06, a: 0.001, wet: 0.2 }); });
    for (let h = 0; h < 16; h++) x.noise(t0 + h * B / 4, h % 4 === 2 ? 0.12 : 0.03, { ft: 'highpass', f0: 7500, vol: h % 4 === 2 ? 0.03 : 0.014, a: 0.001 });
    if (bar % 8 === 7) [2.5, 2.75, 3, 3.25, 3.5, 3.75].forEach((b, i) => snare(x, t0 + b * B, 0.05 + i * 0.012));
    // octave-bounce bass (8ths)
    for (let e = 0; e < 8; e++) { const f = root / 2 * (e % 2 ? 2 : 1); saw(t0 + e * B / 2, f, B / 2 * 0.85, 0.06, 700, sc); }
    // supersaw chord stabs on the offbeats
    [0.5, 1.5, 2.5, 3.5].forEach((b) => tri.forEach((st) => saw(t0 + b * B, root * 2 * Math.pow(2, st / 12), B * 0.35, 0.012, 3000, sc)));
    // 16th chip arpeggio
    for (let a = 0; a < 16; a++) { const st = [0, 7, 12, 7][a % 4] + tri[Math.floor(a / 4) % 3] - tri[0]; const f = root * 4 * Math.pow(2, st / 12); x.tone(t0 + a * B / 4, f, f, B / 4 * 0.7, { vol: 0.012, type: 'square', lp: 4000, a: 0.002 }); }
    // lead: square with a little vibrato feel via two detuned voices
    BT_MEL[bar].forEach(([b, st, len]) => {
      const f = 659.25 * Math.pow(2, st / 12);
      x.tone(t0 + b * B, f, f, len * B * 0.9, { vol: 0.042, type: 'square', lp: 3400, a: 0.004, wet: 0.18 });
      x.tone(t0 + b * B, f * 1.004, f * 1.004, len * B * 0.9, { vol: 0.018, type: 'sawtooth', lp: 2600, a: 0.004 });
    });
    if (bar % 4 === 0) x.noise(t0, 1.2, { ft: 'highpass', f0: 5000, vol: 0.04, a: 0.002, wet: 0.4 });
  }
}
