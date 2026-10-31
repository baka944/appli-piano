// Clavier à l'écran (quand le piano n'est pas branché) et regroupement des notes en accords.
import { h } from './ui.js';
import * as midi from './midi.js';
import * as audio from './audio.js';

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const NAMES = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];

// low = note MIDI de départ (un do), octaves = nombre d'octaves affichées
export function screenKeyboard({ low = 60, octaves = 2, sound = true } = {}) {
  const wrap = h('div', { class: 'kb-wrap' });
  const kb = h('div', { class: 'kb', role: 'group', 'aria-label': 'Clavier à l’écran' });
  const whites = [];
  for (let o = 0; o < octaves; o++) WHITE.forEach((w) => whites.push(low + o * 12 + w));
  whites.push(low + octaves * 12);
  const n = whites.length;
  whites.forEach((m, i) => {
    kb.append(h('button', {
      type: 'button', class: 'kw', 'data-note': m, 'aria-label': NAMES[m % 12], style: { left: `${(i / n) * 100}%`, width: `${100 / n}%` },
      onpointerdown: (e) => { e.preventDefault(); press(m, e.timeStamp); },
    }, m % 12 === 0 ? h('span', null, `do${Math.floor(m / 12) - 2}`) : null));
    const pcw = m % 12;
    if (i < n - 1 && pcw !== 4 && pcw !== 11) {
      const b = m + 1;
      kb.append(h('button', {
        type: 'button', class: 'kbk', 'data-note': b, 'aria-label': NAMES[b % 12], style: { left: `${((i + 1) / n) * 100 - 100 / n / 3}%`, width: `${(100 / n) * 0.66}%` },
        onpointerdown: (e) => { e.preventDefault(); press(b, e.timeStamp); },
      }));
    }
  });
  function press(m, t) {
    if (sound) { audio.unlock().then(() => audio.tone(m, null, 0.9, 0.6)); }
    midi.emitNote(m, t);
  }
  wrap.append(kb);
  // éclaire les touches jouées (au piano comme à l'écran)
  const off = midi.onNote((e) => {
    if (e.note == null) return;
    const k = kb.querySelector(`[data-note="${e.note}"]`) || kb.querySelector(`[data-note="${low + (e.note % 12)}"]`);
    if (!k) return;
    k.classList.add('down');
    setTimeout(() => k.classList.remove('down'), 250);
  });
  wrap.destroy = off;
  return wrap;
}

export function mark(kbWrap, notes, cls) {
  kbWrap.querySelectorAll(`.${cls}`).forEach((k) => k.classList.remove(cls));
  notes.forEach((m) => kbWrap.querySelector(`[data-note="${m}"]`)?.classList.add(cls));
}

// Regroupe les notes jouées presque ensemble en un accord. Au piano : 150 ms ; à l'écran : bouton « Valider ».
export function chordCollector(onChord, windowMs = 150) {
  let buf = [];
  let timer = null;
  let screenMode = false;
  const flush = () => {
    if (!buf.length) return;
    const notes = buf.slice();
    buf = [];
    onChord(notes);
  };
  const off = midi.onNote((e) => {
    if (e.note == null) return;
    if (e.source === 'screen') { screenMode = true; buf.push(e.note); return; }
    buf.push(e.note);
    clearTimeout(timer);
    timer = setTimeout(flush, windowMs);
  });
  return {
    validate: flush,
    clear: () => { buf = []; },
    pending: () => buf.slice(),
    isScreen: () => screenMode,
    destroy: () => { off(); clearTimeout(timer); },
  };
}
