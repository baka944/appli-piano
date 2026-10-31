// Sons générés dans le navigateur (Web Audio) : piano simplifié et métronome.
let ctx = null;
let master = null;

export function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  return ctx;
}

// À appeler depuis un clic : les navigateurs ne jouent du son qu'après une action de l'utilisateur.
export async function unlock() {
  const c = getCtx();
  if (c.state !== 'running') await c.resume();
  return c;
}

const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function tone(midi, when, dur = 1.4, vel = 0.7) {
  const c = getCtx();
  const t = Math.max(when ?? c.currentTime, c.currentTime);
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = Math.min(9000, freq(midi) * 6);
  const o1 = c.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = freq(midi);
  const o2 = c.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = freq(midi) * 2;
  const g2 = c.createGain();
  g2.gain.value = 0.22;
  o1.connect(g);
  o2.connect(g2);
  g2.connect(g);
  g.connect(f);
  f.connect(master);
  const peak = 0.3 * vel;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o1.start(t);
  o2.start(t);
  o1.stop(t + dur + 0.05);
  o2.stop(t + dur + 0.05);
}

export function chord(midis, when, dur = 1.6, vel = 0.7) {
  const v = vel / Math.sqrt(midis.length) * 1.2;
  midis.forEach((m) => tone(m, when, dur, v));
}

export function click(when, kind = 'beat') {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = kind === 'accent' ? 1600 : kind === 'count' ? 880 : 1200;
  const v = kind === 'accent' ? 0.2 : 0.12;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(v, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  o.connect(g);
  g.connect(master);
  o.start(when);
  o.stop(when + 0.06);
}

// Convertit un instant de l'horloge audio en instant performance.now(), au moment où le son sort réellement.
export function clockMap() {
  const c = getCtx();
  let ts = null;
  try { ts = c.getOutputTimestamp ? c.getOutputTimestamp() : null; } catch (e) { ts = null; }
  if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
    return (t) => ts.performanceTime + (t - ts.contextTime) * 1000;
  }
  const c0 = c.currentTime;
  const p0 = performance.now();
  const lat = ((c.outputLatency || 0) + (c.baseLatency || 0)) * 1000;
  return (t) => p0 + (t - c0) * 1000 + lat;
}
