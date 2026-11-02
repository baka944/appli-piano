// Accompagnement généré à partir d'une grille : basse, accords sur un rythme de comping, métronome.
// Peut aussi enregistrer ce que tu joues au piano (MIDI) pour le réécouter sur l'accompagnement.
import * as audio from './audio.js';
import * as midi from './midi.js';
import { posBeats } from './rythme.js';

function durations(k, meter) {
  if (k === 1) return [meter];
  if (k === 2) return meter === 3 ? [2, 1] : [meter / 2, meter / 2];
  if (k === 3 && meter === 4) return [2, 1, 1];
  if (k === 2 && meter % 2) return [Math.ceil(meter / 2), Math.floor(meter / 2)];
  return Array(k).fill(meter / k);
}

export function compVoicing(rootPc, semis) {
  let tones = semis.filter((s) => s % 12 !== 0).map((s) => (rootPc + s) % 12);
  if (tones.length < 3) tones = [rootPc, ...tones];
  const out = tones.map((p) => { let m = 52 + ((p - 52 % 12 + 12) % 12); return m; }).sort((a, b) => a - b);
  return [...new Set(out)];
}
export function bassNote(pc) { let b = 36 + pc; if (b > 44) b -= 12; return b; }

// Calcule les événements d'une mesure (en temps, à partir du début de la mesure).
export function barEvents(bar, meter, compPattern, swing, opts) {
  const ev = [];
  const durs = durations(bar.chords.length, meter);
  let t = 0;
  const segs = bar.chords.map((c, i) => { const s = { c, start: t, end: t + durs[i] }; t += durs[i]; return s; });
  if (opts.bass) segs.forEach((sg) => {
    ev.push({ t: sg.start, kind: 'bass', note: bassNote(sg.c.bass), dur: Math.min(sg.end - sg.start, 2) });
    if (sg.end - sg.start >= 2 && meter >= 4) ev.push({ t: sg.start + 2, kind: 'bass', note: bassNote((sg.c.root + 7) % 12), dur: sg.end - sg.start - 2 });
  });
  if (opts.comp) {
    compPattern.filter((p) => p < meter * 2).forEach((p) => {
      const at = posBeats(p, swing);
      const sg = segs.find((x) => at >= x.start - 0.01 && at < x.end - 0.01) || segs[segs.length - 1];
      // une attaque anticipée (sur un « et » juste avant un changement) prend l'accord suivant
      const nxt = segs.find((x) => Math.abs(x.start - (Math.floor(at) + 1)) < 0.01);
      const chord = p % 2 && nxt && at > nxt.start - 0.5 ? nxt.c : sg.c;
      ev.push({ t: at, kind: 'comp', notes: compVoicing(chord.root, chord.semis), dur: 0.9 });
    });
  }
  if (opts.click !== 'aucun') {
    for (let b = 0; b < meter; b++) {
      const offbeat = meter === 3 ? b > 0 : b % 2 === 1;
      if (opts.click === 'tous' || (opts.click === '2-4' && offbeat)) ev.push({ t: b, kind: 'click', accent: b === 0 });
    }
  }
  return ev;
}

export function start({ bars, meter = 4, bpm = 100, swing = true, compPattern = [1, 3], opts, loops = 2, onBar, onEnd, record = false, takeToReplay = null }) {
  const c = audio.getCtx();
  const beat = 60 / bpm;
  const m0 = bars[0].meter || meter;
  const t0 = c.currentTime + 0.3;
  const songStart = t0 + m0 * beat;
  const total = bars.length * loops;
  // début de chaque mesure (les mesures peuvent avoir des longueurs différentes : 5/4, 6/4…)
  const starts = [];
  let acc = songStart;
  for (let k = 0; k <= total; k++) { starts.push(acc); acc += (bars[k % bars.length].meter || meter) * beat; }
  const end = starts[total];
  let nextBar = 0;
  let stopped = false;
  for (let i = 0; i < m0; i++) audio.click(t0 + i * beat, i === 0 ? 'accent' : 'count');

  const scheduleBar = (k) => {
    const bar = bars[k % bars.length];
    const at = starts[k];
    barEvents(bar, bar.meter || meter, compPattern, swing, opts).forEach((e) => {
      const when = at + e.t * beat;
      if (e.kind === 'bass') audio.tone(e.note, when, Math.max(0.3, e.dur * beat * 0.95), 0.9);
      else if (e.kind === 'comp') audio.chord(e.notes, when, Math.max(0.25, e.dur * beat), 0.55);
      else if (e.kind === 'click') audio.click(when, e.accent ? 'accent' : 'beat');
    });
  };
  if (takeToReplay) takeToReplay.notes.forEach((n) => audio.tone(n.note, songStart + n.start, Math.max(0.15, n.dur), Math.min(1, n.vel / 110)));

  const timer = setInterval(() => {
    if (stopped) return;
    while (nextBar < total && starts[nextBar] < c.currentTime + 0.6) { scheduleBar(nextBar); nextBar++; }
  }, 50);

  // enregistrement
  const take = { notes: [], bpm, meter };
  const open = new Map();
  let map = null;
  setTimeout(() => { map = audio.clockMap(); }, 120);
  const offOn = record ? midi.onNote((e) => {
    if (e.note == null || !map) return;
    const tSec = (e.t - map(songStart)) / 1000;
    if (tSec < -0.5) return;
    open.set(e.note, { note: e.note, start: tSec, vel: e.vel });
  }) : () => {};
  const offOff = record ? midi.onNoteOff((e) => {
    const n = open.get(e.note);
    if (!n || !map) return;
    n.dur = Math.max(0.05, (e.t - map(songStart)) / 1000 - n.start);
    take.notes.push(n);
    open.delete(e.note);
  }) : () => {};

  let raf = 0;
  let lastBar = -2;
  const tick = () => {
    if (stopped) return;
    const now = c.currentTime;
    let k = -1;
    if (now >= songStart) { k = 0; while (k < total - 1 && starts[k + 1] <= now) k++; }
    if (k !== lastBar) { lastBar = k; onBar && onBar(k < 0 ? -1 : k % bars.length, k, now < songStart ? Math.ceil((songStart - now) / beat) : null); }
    if (now >= end + 0.2) { finish(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  function finish() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    cancelAnimationFrame(raf);
    open.forEach((n) => { n.dur = 0.5; take.notes.push(n); });
    offOn(); offOff();
    onEnd && onEnd(take);
  }
  return { stop: finish, take };
}
