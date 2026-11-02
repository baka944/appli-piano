// V3 : licks et relevés, voicings et fioritures, impro guidée, dictée de motifs.
import { h, svg, toast, pick, weightedPick, shuffle, sleep } from './ui.js';
import * as store from './store.js';
import * as audio from './audio.js';
import * as midi from './midi.js';
import { screenKeyboard, chordCollector, mark } from './keyboard.js';
import { KEYS, CIRCLE_FOURTHS, nameFr, pc, majorScale, parseGrid, PROGRESSIONS, realize } from './music.js';
import { LICKS, CONTEXTS, FIORITURES, VOICINGS, QUAL, CONSIGNES } from './licks-data.js';
import * as playalong from './playalong.js';
import { allPatterns } from './rythme.js';

const PC = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const keyLabel = (k) => nameFr(k);
function inputHint() {
  return h('p', { class: 'muted small' }, midi.isOn() ? 'Joue au piano (n’importe quelle octave). Le clavier à l’écran reste disponible.' : 'Piano non connecté : utilise le clavier à l’écran.');
}
function keySelect(id, value, onchange, keys = KEYS) {
  return h('select', { id, onchange }, keys.map((k, i) => h('option', { value: i, selected: i === value }, keyLabel(k))));
}

// Joue un contexte harmonique + une ligne mélodique
function playLine(notes, ctxKey, tonicPc, { bpm = 120, swing = true, oct = false, withBacking = true } = {}) {
  const c = audio.getCtx();
  const beat = 60 / bpm;
  const t0 = c.currentTime + 0.1;
  const base = 60 + tonicPc;
  if (withBacking && CONTEXTS[ctxKey]) {
    let t = t0;
    CONTEXTS[ctxKey].chords.forEach(([r, semis, , bars]) => {
      const root = 48 + ((tonicPc + r) % 12);
      audio.tone(root - 12, t, bars * 4 * beat * 0.95, 0.7);
      audio.chord(semis.slice(1).map((s) => root + s), t, bars * 4 * beat * 0.9, 0.35);
      t += bars * 4 * beat;
    });
  }
  let t = t0;
  let eighth = 0;
  notes.forEach(([s, d]) => {
    const swingOff = swing && eighth % 1 === 0 && Math.floor(eighth) % 2 === 1 ? beat * 0.16 : 0;
    const when = t + swingOff;
    audio.tone(base + s, when, Math.max(0.15, d * beat * 0.5 * 0.95), 0.85);
    if (oct) audio.tone(base + s - 12, when, Math.max(0.15, d * beat * 0.5 * 0.95), 0.6);
    t += d * beat * 0.5;
    eighth += d;
  });
}

// ---------- Main gauche / main droite ----------
// Le lick se joue à la main droite pendant que la main gauche plaque l'accord.
// 1) Les notes sous le point de partage sont la main gauche : ignorées.
// 2) Les notes frappées ensemble (moins de 35 ms d'écart) forment un accord : on ne garde que la note du haut,
//    et seulement si c'est la note attendue (cas d'une octave à la main droite, ou d'une note jouée avec l'accord).
export const SPLITS = [[60, 'Sous le do central (do3)'], [55, 'Sous sol2'], [64, 'Sous mi3'], [0, 'Aucun : tout compte']];
const splitOf = () => store.get().settings.lickSplit ?? 60;
const pcList = (notes) => [...new Set(notes.map((m) => PC[m % 12]))].join(' ');
function handFilter(onRH, { expected = () => null, onLH = () => {} } = {}) {
  const split = splitOf();
  let buf = [];
  let timer = null;
  const flush = () => {
    const g = buf;
    buf = [];
    timer = null;
    const low = g.filter((e) => e.note < split);
    const high = g.filter((e) => e.note >= split);
    const ignored = low.map((e) => e.note);
    if (g.length === 1 && high.length) onRH(high[0]);
    else if (high.length) {
      const top = high.reduce((a, b) => (b.note > a.note ? b : a));
      const exp = expected();
      if (exp != null && top.note % 12 === exp) {
        onRH(top);
        high.forEach((e) => { if (e !== top && e.note % 12 !== exp) ignored.push(e.note); });
      } else high.forEach((e) => ignored.push(e.note));
    }
    if (ignored.length) onLH(ignored.sort((a, b) => a - b));
  };
  const off = midi.onNote((e) => {
    if (e.note == null) return;
    if (e.source === 'screen') { onRH(e); return; }
    buf.push(e);
    if (!timer) timer = setTimeout(flush, 35);
  });
  return () => { off(); clearTimeout(timer); };
}
function lhLine() {
  const el = h('p', { class: 'muted small lh-line' }, splitOf() ? `Main gauche (ignorée) : sous ${PC[splitOf() % 12]}${Math.floor(splitOf() / 12) - 2}.` : 'Main gauche : les accords plaqués sont ignorés.');
  return { el, show: (notes) => { el.textContent = `Main gauche (ignorée) : ${pcList(notes)}`; } };
}

// Vérifie une suite de classes de hauteur jouée note à note (à ton rythme)
function sequenceDrill(container, expectedPcs, { onDone, labelOf = (p) => PC[p], showNames = true } = {}) {
  let i = 0;
  let errors = 0;
  const chips = h('div', { class: 'chips seq' }, expectedPcs.map((p, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, showNames ? labelOf(p) : '?')));
  const msg = h('p', { 'aria-live': 'polite' }, showNames ? `Commence par ${labelOf(expectedPcs[0])}.` : 'À toi de jouer.');
  const kb = screenKeyboard({ low: 48, octaves: 2 });
  const lh = lhLine();
  container.append(chips, msg, lh.el, kb, inputHint());
  const off = handFilter((e) => {
    if (i >= expectedPcs.length) return;
    if (e.note % 12 === expectedPcs[i]) {
      const chip = chips.querySelector(`[data-k="${i}"]`);
      chip.className = 'chip done';
      chip.textContent = labelOf(expectedPcs[i]);
      i++;
      if (i >= expectedPcs.length) { cleanup(); onDone(errors); return; }
      chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
      msg.textContent = 'Bien.';
    } else {
      errors++;
      msg.textContent = `Pas cette note (${PC[e.note % 12]}).`;
    }
  }, { expected: () => expectedPcs[i], onLH: lh.show });
  const cleanup = () => { off(); kb.destroy && kb.destroy(); };
  return cleanup;
}

// ---------- Rythme des licks ----------
const DUREES = { 0.5: 'double croche', 1: 'croche', 1.5: 'croche pointée', 2: 'noire', 3: 'noire pointée', 4: 'blanche', 6: 'blanche pointée', 8: 'ronde' };
const SUB = { 0: '', 0.5: 'e', 1: 'et', 1.5: 'a' };
// Où tombe chaque note : temps 1 à 4, « et » = la croche entre deux temps, « e » et « a » = les doubles croches.
function lickPositions(notes) {
  let cum = 0;
  return notes.map(([, d]) => {
    const p = cum;
    cum += d;
    const beat = Math.floor(p / 2) % 4 + 1;
    const sub = SUB[Math.round((p % 2) * 2) / 2] ?? '';
    return { p, d, count: sub ? `${beat} ${sub}` : String(beat), bar: Math.floor(p / 8) };
  });
}
export const lickSwings = (l) => !/funk|latin|ballade|classique/i.test(l.style);
// Frise : une case par note, longueur = durée, avec les temps numérotés. Renvoie l'élément et une fonction de mise à jour.
function lickTimeline(l, tpc) {
  const pos = lickPositions(l.notes);
  const total = pos.length ? pos[pos.length - 1].p + pos[pos.length - 1].d : 8;
  const beats = Math.max(4, Math.ceil(total / 2 / 4) * 4);
  const U = 26; // pixels par croche
  const W = beats * 2 * U + 8;
  let m = `<svg class="lick-tl" viewBox="0 0 ${W} 74" width="${W}" height="74" role="img" aria-label="Rythme du lick">`;
  for (let b = 0; b <= beats; b++) {
    const x = 4 + b * 2 * U;
    m += `<line x1="${x}" y1="${b % 4 === 0 ? 4 : 14}" x2="${x}" y2="58" class="${b % 4 === 0 ? 'tl-bar' : 'tl-beat'}"/>`;
    if (b < beats) m += `<text x="${x + 3}" y="70" class="tl-num">${b % 4 + 1}</text><text x="${x + U + 2}" y="70" class="tl-num et">et</text>`;
  }
  pos.forEach((q, k) => {
    const x = 4 + q.p * U;
    m += `<g data-k="${k}"><rect x="${x + 1}" y="20" width="${Math.max(8, q.d * U - 2)}" height="30" rx="4" class="tl-note"/><text x="${x + 4}" y="40" class="tl-name">${PC[(tpc + l.notes[k][0]) % 12]}</text></g>`;
  });
  m += `<line x1="4" y1="2" x2="4" y2="60" class="tl-head" visibility="hidden"/></svg>`;
  const el = svg(m);
  const wrap = h('div', { class: 'tl-wrap' }, el);
  return {
    el: wrap, pos, beats, U,
    grade: (k, cls, txt) => { const g = el.querySelector(`[data-k="${k}"]`); if (!g) return; g.querySelector('rect').setAttribute('class', `tl-note ${cls}`); if (txt) { const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('x', g.querySelector('rect').getAttribute('x')); t.setAttribute('y', 14); t.setAttribute('class', 'tl-dev'); t.textContent = txt; el.append(t); } },
    head: (eighths) => { const ln = el.querySelector('.tl-head'); if (eighths == null) { ln.setAttribute('visibility', 'hidden'); return; } ln.setAttribute('visibility', 'visible'); const x = 4 + eighths * U; ln.setAttribute('x1', x); ln.setAttribute('x2', x); },
    reset: () => { el.querySelectorAll('.tl-dev').forEach((t) => t.remove()); el.querySelectorAll('rect.tl-note').forEach((r) => r.setAttribute('class', 'tl-note')); },
  };
}
function rhythmText(l) {
  return lickPositions(l.notes).map((q, k) => `${PC[l.notes[k][0] % 12]} : ${DUREES[q.d] || `${q.d} croches`}, sur « ${q.count} »`);
}

// Exercice en rythme : décompte d'une mesure, métronome, puis chaque note est notée sur la hauteur et la mise en place.
function rhythmDrill(container, l, tpc, { bpm, swing, backing, onDone }) {
  const s = store.get();
  const pcs = l.notes.map(([x]) => (tpc + x) % 12);
  const tl = lickTimeline(l, tpc);
  const big = h('div', { class: 'beat-big' }, '…');
  const msg = h('p', { 'aria-live': 'polite' }, 'Décompte d’une mesure, puis joue le lick avec le métronome.');
  const lh = lhLine();
  const kb = screenKeyboard({ low: 48, octaves: 2 });
  container.append(big, tl.el, msg, lh.el, kb, inputHint());
  let stopped = false;
  let off = () => {};
  const cleanup = () => { stopped = true; off(); kb.destroy && kb.destroy(); };
  (async () => {
    const c = await audio.unlock();
    const beat = 60 / bpm;
    const e8 = beat / 2;
    const start = c.currentTime + 0.4;
    const rec = start + 4 * beat;
    const totalBeats = 4 + tl.beats;
    for (let b = 0; b < totalBeats; b++) audio.click(start + b * beat, b % 4 === 0 ? 'accent' : 'beat');
    if (backing && CONTEXTS[l.over]) {
      let t = rec;
      CONTEXTS[l.over].chords.forEach(([r, semis, , bars]) => {
        const root = 48 + ((tpc + r) % 12);
        audio.tone(root - 12, t, bars * 4 * beat * 0.95, 0.6);
        audio.chord(semis.slice(1).map((x) => root + x), t, bars * 4 * beat * 0.9, 0.3);
        t += bars * 4 * beat;
      });
    }
    const onsetCtx = tl.pos.map((q) => rec + q.p * e8 + (swing && q.p % 1 === 0 && q.p % 2 === 1 ? beat * 0.16 : 0));
    await sleep(150);
    if (stopped) return;
    const map = audio.clockMap();
    const lat = s.settings.latencyMs || 0;
    const exp = onsetCtx.map((t) => map(t) + lat);
    const recPerf = map(rec) + lat;
    const tol = Math.min(90, Math.max(40, beat * 1000 * 0.12));
    const res = pcs.map(() => null);
    let i = 0;
    off = handFilter((e) => {
      if (stopped || i >= pcs.length) return;
      if (e.t < recPerf - beat * 1000 * 0.75) return; // pendant le décompte
      while (i < pcs.length - 1 && e.t - exp[i] > (exp[i + 1] - exp[i]) * 0.6) { tl.grade(i, 'g-loin', 'oubliée'); i++; }
      const dev = e.t - exp[i];
      const okPitch = e.note % 12 === pcs[i];
      res[i] = { dev, okPitch, note: e.note };
      const a = Math.abs(dev);
      const cls = !okPitch ? 'g-loin' : a <= tol * 0.5 ? 'g-parfait' : a <= tol ? 'g-bien' : a <= tol * 2 ? 'g-juste' : 'g-loin';
      tl.grade(i, cls, !okPitch ? PC[e.note % 12] : a <= tol * 0.5 ? '' : `${dev > 0 ? '+' : '−'}${Math.round(a)}`);
      i++;
    }, { expected: () => pcs[i], onLH: lh.show });
    const lastEnd = rec + (tl.pos.length ? (tl.pos[tl.pos.length - 1].p + tl.pos[tl.pos.length - 1].d) : 8) * e8;
    const endT = Math.max(lastEnd, rec + tl.beats * beat) + beat * 0.5;
    const tick = () => {
      if (stopped) return;
      const now = c.currentTime;
      if (now < rec) { big.textContent = now < start ? '…' : String(Math.floor((now - start) / beat) + 1); tl.head(null); }
      else if (now < endT) { const el = (now - rec) / e8; big.textContent = String(Math.floor(el / 2) % 4 + 1); tl.head(Math.min(el, tl.beats * 2)); }
      if (now < endT) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await sleep((endT - c.currentTime) * 1000 + 200);
    if (stopped) return;
    off();
    tl.head(null);
    res.forEach((r, k) => { if (!r) tl.grade(k, 'g-loin', k >= i ? 'oubliée' : ''); });
    const hits = res.filter((r) => r && r.okPitch);
    const inTime = hits.filter((r) => Math.abs(r.dev) <= tol).length;
    const mean = hits.length ? hits.reduce((a, r) => a + r.dev, 0) / hits.length : null;
    big.textContent = 'Fin';
    msg.textContent = `Bonnes notes : ${hits.length}/${pcs.length} · en place (±${Math.round(tol)} ms) : ${inTime}/${pcs.length}.`
      + (mean == null ? '' : Math.abs(mean) <= tol / 2 ? ' Tu es bien centré sur le temps.' : mean < 0 ? ` Tu joues en avance (${Math.round(-mean)} ms en moyenne).` : ` Tu joues en retard (${Math.round(mean)} ms en moyenne).`);
    cleanup();
    onDone({ n: pcs.length, notesOk: hits.length, inTime, mean });
  })();
  return cleanup;
}

// ---------- Licks et relevés ----------
export function licks(root, app) {
  const s = store.get();
  let cleanup = () => {};
  let view = 'biblio';
  function header() {
    return h('div', { class: 'stack' },
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Licks'),
        h('p', { class: 'lead' }, 'Du vocabulaire à écouter, jouer au piano et transposer dans les 12 tonalités. Les licks sont écrits pour l’appli, dans le style des musiciens que tu aimes.')),
      h('div', { class: 'seg', role: 'tablist' }, [['biblio', 'Bibliothèque'], ['releves', 'Mes relevés']].map(([id, l]) =>
        h('button', { type: 'button', role: 'tab', 'aria-selected': view === id ? 'true' : 'false', class: view === id ? 'on' : '', onclick: () => { view = id; home(); } }, l))));
  }
  function home() {
    cleanup();
    root.replaceChildren(header());
    if (view === 'releves') return releves();
    const styles = [...new Set(LICKS.map((l) => l.style))];
    styles.forEach((st) => {
      root.append(h('h2', { class: 'hand-title' }, st));
      LICKS.filter((l) => l.style === st).forEach((l) => {
        const best = store.getBest(`lick:${l.id}`);
        const bestR = store.getBest(`lick:${l.id}:rythme`);
        root.append(h('button', { type: 'button', class: 'card pick', onclick: () => detail(l) },
          h('span', { class: 'pick-title' }, l.name),
          h('span', { class: 'muted small' }, `Sur ${CONTEXTS[l.over].label} · ${l.notes.length} notes${best != null ? ` · notes : ${best} %` : ''}${bestR != null ? ` · en rythme : ${bestR} %` : ''}`)));
      });
    });
  }
  function detail(l, keyIdx = 0) {
    cleanup();
    const k = KEYS[keyIdx];
    const tpc = pc(k);
    const st = s.settings;
    const opt = { bpm: st.lickBpm || 80, swing: lickSwings(l), backing: !!st.lickBacking };
    const bpmOut = h('output', { class: 'num' }, opt.bpm);
    const tl = lickTimeline(l, tpc);
    root.replaceChildren(
      h('button', { class: 'back', type: 'button', onclick: home }, '← Tous les licks'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, l.name), h('p', { class: 'lead' }, `${l.style} · sur ${CONTEXTS[l.over].label}`)),
      h('section', { class: 'card stack' },
        h('p', null, l.inspi),
        h('div', { class: 'row wrap' }, h('label', { for: 'lk-key' }, 'Tonalité'), keySelect('lk-key', keyIdx, (e) => detail(l, +e.target.value))),
        h('h2', { class: 'hand-title sm' }, 'Notes et rythme'),
        tl.el,
        h('details', null, h('summary', null, 'Le rythme note par note'),
          h('ul', { class: 'small' }, rhythmText({ ...l, notes: l.notes.map(([x, d]) => [(tpc + x) % 12, d]) }).map((t) => h('li', null, t)))),
        h('p', { class: 'muted small' }, `Chaque case dure le temps de la note ; « et » = la croche entre deux temps.${opt.swing ? ' Croches swing : la croche sur le « et » arrive un peu en retard.' : ' Croches droites.'}`),
        h('div', { class: 'row wrap' },
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await audio.unlock(); playLine(l.notes, l.over, tpc, { oct: l.oct, swing: opt.swing }); } }, 'Écouter avec l’accompagnement'),
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await audio.unlock(); playLine(l.notes, l.over, tpc, { oct: l.oct, withBacking: false, bpm: opt.bpm, swing: opt.swing }); } }, 'Écouter au tempo choisi'))),
      h('section', { class: 'card stack' },
        h('h2', { class: 'hand-title sm' }, 'Réglages'),
        h('label', { for: 'lk-bpm' }, 'Tempo ', bpmOut, ' BPM'),
        h('input', { id: 'lk-bpm', type: 'range', min: 40, max: 200, step: 2, value: opt.bpm, oninput: (e) => { opt.bpm = +e.target.value; bpmOut.textContent = opt.bpm; store.setSetting('lickBpm', opt.bpm); } }),
        h('label', { class: 'check' }, h('input', { id: 'lk-swing', type: 'checkbox', checked: opt.swing, onchange: (e) => { opt.swing = e.target.checked; } }), 'Croches swing'),
        h('label', { class: 'check' }, h('input', { id: 'lk-back', type: 'checkbox', checked: opt.backing, onchange: (e) => { opt.backing = e.target.checked; store.setSetting('lickBacking', opt.backing); } }), 'L’appli joue aussi l’accord (décoche si tu le joues à la main gauche)'),
        h('label', { for: 'lk-split' }, 'Main gauche : notes ignorées'),
        h('select', { id: 'lk-split', onchange: (e) => store.setSetting('lickSplit', +e.target.value) }, SPLITS.map(([v, t]) => h('option', { value: v, selected: v === splitOf() }, t))),
        h('p', { class: 'muted small' }, 'Joue le lick à la main droite au-dessus de ce point. Les notes en dessous, et les accords plaqués (plusieurs notes frappées ensemble), ne comptent pas comme notes du lick.'),
        h('div', { class: 'row wrap' },
          h('button', { class: 'btn', type: 'button', onclick: () => practice(l, [k], 'rythme', opt) }, 'Jouer en rythme'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => practice(l, [k], 'notes', opt) }, 'Notes seules, à ton rythme')),
        h('div', { class: 'row wrap' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => practice(l, CIRCLE_FOURTHS, 'rythme', opt) }, '12 tonalités en rythme'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => practice(l, CIRCLE_FOURTHS, 'notes', opt) }, '12 tonalités, notes seules'))));
  }
  function practice(l, keys, mode = 'notes', opt = { bpm: 80, swing: true, backing: false }) {
    cleanup();
    let ki = 0;
    let totalErr = 0;
    const agg = { n: 0, notesOk: 0, inTime: 0 };
    const box = h('section', { class: 'card stack' });
    const finish = () => {
      let score;
      let label;
      if (mode === 'rythme') {
        score = Math.round(((agg.notesOk + agg.inTime) / (2 * agg.n)) * 100);
        label = `Notes justes : ${Math.round((agg.notesOk / agg.n) * 100)} % · en place : ${Math.round((agg.inTime / agg.n) * 100)} %`;
        store.setBest(`lick:${l.id}:rythme`, score);
      } else {
        const n = l.notes.length * keys.length;
        score = Math.round((n / (n + totalErr)) * 100);
        label = 'Notes justes du premier coup';
        store.setBest(`lick:${l.id}`, score);
      }
      const out = store.award('licks', Math.min(40, 6 + keys.length * 3) + (score >= 90 ? 4 : 0) + (mode === 'rythme' ? 3 : 0), { activity: 'licks', label: `Lick ${l.name}${mode === 'rythme' ? ' en rythme' : ''}${keys.length > 1 ? ' · 12 tonalités' : ''}${mode === 'rythme' ? ` · ${opt.bpm} BPM` : ''}`, score });
      app.celebrate(out);
      box.replaceChildren(h('div', { class: 'score' }, `${score} %`), h('p', { class: 'muted' }, label), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => detail(l) }, 'Retour'), h('button', { class: 'btn', type: 'button', onclick: () => practice(l, keys, mode, opt) }, 'Rejouer')));
    };
    const run = () => {
      const tpc = pc(keys[ki]);
      box.replaceChildren(h('p', { class: 'hand-title sm' }, `${l.name} · en ${keyLabel(keys[ki])} (${ki + 1}/${keys.length})${mode === 'rythme' ? ` · ${opt.bpm} BPM` : ''}`),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); playLine(l.notes, l.over, tpc, { oct: l.oct, withBacking: false, bpm: mode === 'rythme' ? opt.bpm : 90, swing: opt.swing }); } }, 'Écouter'));
      if (mode === 'rythme') {
        cleanup = rhythmDrill(box, l, tpc, { ...opt, onDone: (r) => {
          agg.n += r.n; agg.notesOk += r.notesOk; agg.inTime += r.inTime;
          const last = ki + 1 >= keys.length;
          box.append(h('div', { class: 'row' },
            h('button', { class: 'btn ghost', type: 'button', onclick: () => { agg.n -= r.n; agg.notesOk -= r.notesOk; agg.inTime -= r.inTime; run(); } }, 'Réessayer'),
            h('button', { class: 'btn', type: 'button', onclick: () => { if (last) finish(); else { ki++; run(); } } }, last ? 'Terminer' : `Suivant : ${keyLabel(keys[ki + 1])}`)));
        } });
      } else {
        cleanup = sequenceDrill(box, l.notes.map(([x]) => (tpc + x) % 12), {
          onDone: (err) => {
            totalErr += err;
            ki++;
            if (ki < keys.length) { toast(`Bien ! Maintenant en ${keyLabel(keys[ki])}.`); run(); return; }
            finish();
          },
        });
      }
    };
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: () => detail(l) }, '← Retour'), box);
    run();
  }

  // ---------- Mes relevés ----------
  function releves() {
    const list = s.releves || (s.releves = []);
    root.append(h('section', { class: 'card stack' },
      h('h2', null, 'Enregistrer une phrase relevée'),
      h('p', { class: 'muted' }, 'Relève une phrase à l’oreille, puis joue-la ici : l’appli la garde, te la fait rejouer et transposer dans les 12 tonalités.'),
      h('button', { class: 'btn', type: 'button', onclick: record }, 'Enregistrer une phrase')));
    if (!list.length) root.append(h('p', { class: 'muted small' }, 'Aucun relevé pour l’instant.'));
    list.forEach((r) => root.append(h('section', { class: 'card stack' },
      h('div', { class: 'card-head' }, h('strong', null, r.name), h('span', { class: 'muted small' }, r.song ? s.songs.find((x) => x.id === r.song)?.title || '' : '')),
      h('p', { class: 'hand' }, r.notes.map((n) => PC[n.m % 12]).join('  ')),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; r.notes.forEach((n) => audio.tone(n.m, t + n.t, Math.max(0.15, n.d), 0.8)); } }, 'Écouter'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => practiceReleve(r, [0]) }, 'Rejouer'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => practiceReleve(r, CIRCLE_FOURTHS.map((k) => (pc(k) - (r.notes[0].m % 12) + 12) % 12)) }, '12 tonalités'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { s.releves = list.filter((x) => x.id !== r.id); store.save(); home(); } }, 'Supprimer')))));
  }
  function record() {
    cleanup();
    const notes = [];
    let t0 = null;
    const open = new Map();
    const status = h('p', { class: 'hand big-notes', 'aria-live': 'polite' }, '…');
    const kb = screenKeyboard({ low: 48, octaves: 2 });
    const lh = lhLine();
    const offOn = handFilter((e) => {
      if (t0 == null) t0 = e.t;
      const n = { m: e.note, t: (e.t - t0) / 1000, d: 0.3 };
      notes.push(n);
      open.set(e.note, n);
      status.textContent = notes.map((x) => PC[x.m % 12]).join('  ');
    }, { onLH: lh.show });
    const offOff = midi.onNoteOff((e) => { const n = open.get(e.note); if (n && t0 != null) { n.d = Math.max(0.08, (e.t - t0) / 1000 - n.t); open.delete(e.note); } });
    cleanup = () => { offOn(); offOff(); kb.destroy && kb.destroy(); };
    const nameIn = h('input', { id: 'rel-name', type: 'text', placeholder: 'Ex. : phrase de Wes, mesure 5', autocomplete: 'off' });
    const songSel = h('select', { id: 'rel-song' }, h('option', { value: '' }, 'Aucun'), s.songs.map((x) => h('option', { value: x.id }, x.title)));
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: home }, '← Retour'),
      h('section', { class: 'card stack' }, h('h2', null, 'Joue ta phrase'), status, lh.el, kb, inputHint(),
        h('label', { for: 'rel-name' }, 'Nom'), nameIn, h('label', { for: 'rel-song' }, 'Morceau'), songSel,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => record() }, 'Recommencer'),
          h('button', { class: 'btn', type: 'button', onclick: () => {
            if (notes.length < 2) { toast('Joue au moins deux notes.', 'bad'); return; }
            (s.releves = s.releves || []).unshift({ id: `rel-${Date.now().toString(36)}`, name: nameIn.value.trim() || 'Ma phrase', song: songSel.value, notes: notes.map((n) => ({ ...n })) });
            store.save();
            const out = store.award('licks', 8, { activity: 'licks', label: `Relevé : ${nameIn.value.trim() || 'Ma phrase'}` });
            app.celebrate(out);
            toast('Relevé enregistré.');
            home();
          } }, 'Enregistrer'))));
  }
  function practiceReleve(r, shifts) {
    cleanup();
    let i = 0;
    let errs = 0;
    const box = h('section', { class: 'card stack' });
    const run = () => {
      const sh = shifts[i];
      const label = shifts.length > 1 ? `En partant de ${PC[(r.notes[0].m + sh) % 12]} (${i + 1}/${shifts.length})` : r.name;
      box.replaceChildren(h('p', { class: 'hand-title sm' }, label),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; r.notes.forEach((n) => audio.tone(n.m + sh, t + n.t, Math.max(0.15, n.d), 0.8)); } }, 'Écouter'));
      cleanup = sequenceDrill(box, r.notes.map((n) => (n.m + sh) % 12), {
        onDone: (e) => {
          errs += e;
          i++;
          if (i < shifts.length) { run(); return; }
          const n = r.notes.length * shifts.length;
          const score = Math.round((n / (n + errs)) * 100);
          const out = store.award('licks', Math.min(40, 5 + shifts.length * 3), { activity: 'licks', label: `Relevé ${r.name}${shifts.length > 1 ? ' · 12 tonalités' : ''}`, score });
          app.celebrate(out);
          box.replaceChildren(h('div', { class: 'score' }, `${score} %`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`), h('button', { class: 'btn', type: 'button', onclick: home }, 'Retour'));
        },
      });
    };
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: home }, '← Retour'), box);
    run();
  }

  home();
  return () => cleanup();
}

// ---------- Voicings et fioritures ----------
export function voicings(root, app) {
  const st = store.get().settings;
  let cleanup = () => {};
  let vId = VOICINGS.some((x) => x.id === st.voicing) ? st.voicing : 'shell';
  let keyIdx = st.voicingKey ?? 0;
  let progId = st.voicingProg || 'ii-v-i';
  let cycle = st.voicingCycle || 'one';
  const save = () => { Object.assign(st, { voicing: vId, voicingKey: keyIdx, voicingProg: progId, voicingCycle: cycle }); store.save(); };

  function chordList(v) {
    const keys = cycle === 'all' ? CIRCLE_FOURTHS : [KEYS[keyIdx]];
    if (v.on === 'prog') {
      const p = PROGRESSIONS.find((x) => x.id === progId);
      return keys.flatMap((k) => realize(p, k)).map((c) => ({ symbol: c.symbol, rootPc: c.rootPc, rel: v.build(QUAL[c.q]) }));
    }
    return keys.map((k) => ({ symbol: nameFr(k) + ' ' + v.sym, rootPc: pc(k), rel: v.build(QUAL[v.on]) }));
  }

  function home() {
    cleanup();
    const v = VOICINGS.find((x) => x.id === vId);
    const groups = [...new Set(VOICINGS.map((x) => x.group))];
    const ex = chordList(v)[0];
    const exNotes = ex.rel.map((x) => PC[(((ex.rootPc + x) % 12) + 12) % 12]);
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Voicings et fioritures'),
        h('p', { class: 'lead' }, 'Les voicings jazz les plus utilisés, à une et à deux mains, vérifiés au piano.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'vc-type' }, 'Voicing'),
        h('select', { id: 'vc-type', onchange: (e) => { vId = e.target.value; save(); home(); } },
          groups.map((g) => h('optgroup', { label: g }, VOICINGS.filter((x) => x.group === g).map((x) => h('option', { value: x.id, selected: x.id === vId }, x.name))))),
        h('p', null, v.desc),
        v.source ? h('a', { class: 'small', href: v.source.url, target: '_blank', rel: 'noopener' }, `Source : ${v.source.label}`) : null,
        h('p', { class: 'hand big-notes' }, `${ex.symbol} : ${exNotes.join(' – ')}`),
        v.on === 'prog' ? [h('label', { for: 'vc-prog' }, 'Progression'),
          h('select', { id: 'vc-prog', onchange: (e) => { progId = e.target.value; save(); home(); } },
            PROGRESSIONS.filter((p) => p.chords.every((c) => QUAL[c.q])).map((p) => h('option', { value: p.id, selected: p.id === progId }, p.name)))]
          : h('p', { class: 'muted small' }, `Sur un accord ${v.sym}, dans une tonalité ou dans les 12.`),
        h('label', { for: 'vc-cycle' }, 'Tonalités'),
        h('select', { id: 'vc-cycle', onchange: (e) => { cycle = e.target.value; save(); home(); } }, [['one', 'Une tonalité'], ['all', 'Les 12, par quartes']].map(([k, l]) => h('option', { value: k, selected: k === cycle }, l))),
        cycle === 'one' ? h('select', { id: 'vc-key', 'aria-label': 'Tonalité', onchange: (e) => { keyIdx = +e.target.value; save(); home(); } }, KEYS.map((k, i) => h('option', { value: i, selected: i === keyIdx }, nameFr(k)))) : null,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await audio.unlock(); const base = (v.two ? 36 : 48) + ex.rootPc; audio.chord(ex.rel.map((x) => base + x), null, 2, 0.8); } }, 'Écouter'),
          h('button', { class: 'btn', type: 'button', onclick: drill }, 'Commencer'))),
      h('h2', { class: 'hand-title' }, 'Fioritures'),
      h('p', { class: 'muted small' }, 'Associer un ornement à un style relève de la pratique des musiciens et des enseignants ; je n’ai pas de source écrite pour chacun. Niveau de preuve : avis d’experts.'),
      h('div', { class: 'grid2' }, FIORITURES.map((f) => h('section', { class: 'card stack' },
        h('strong', null, f.name), h('span', { class: 'muted small' }, f.how),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => {
          await audio.unlock();
          const t = audio.getCtx().currentTime + 0.1;
          audio.chord(f.chord[1].map((x) => 48 + x), t, 2.2, 0.4);
          let tt = t;
          f.demo.forEach(([n, d]) => { audio.tone(60 + n, tt, Math.max(0.1, d + 0.1), 0.8); tt += d; });
        } }, 'Écouter')))));
  }

  function drill() {
    cleanup();
    const v = VOICINGS.find((x) => x.id === vId);
    const low = v.two ? 36 : 48;
    const chords = chordList(v).map((c) => ({
      symbol: c.symbol,
      pcs: [...new Set(c.rel.map((x) => (((c.rootPc + x) % 12) + 12) % 12))],
      bass: (((c.rootPc + c.rel[0]) % 12) + 12) % 12,
      notes: c.rel.map((x) => low + c.rootPc + x).map((m) => (m < low ? m + 12 : m)),
    }));
    let i = 0;
    let first = 0;
    let tried = false;
    const chips = h('div', { class: 'chips seq hand big' }, chords.map((c, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, c.symbol)));
    const msg = h('p', { 'aria-live': 'polite' }, `Joue ${chords[0].symbol}, note du bas : ${PC[chords[0].bass]}.`);
    const kb = screenKeyboard({ low, octaves: v.two ? 3 : 2 });
    const col = chordCollector((notes) => {
      const c = chords[i];
      const set = new Set(notes.map((m) => m % 12));
      const lowest = Math.min(...notes) % 12;
      const missing = c.pcs.filter((x) => !set.has(x));
      if (!missing.length && lowest === c.bass) {
        if (!tried) first++;
        chips.querySelector(`[data-k="${i}"]`).className = 'chip done';
        mark(kb, [], 'hint');
        i++; tried = false;
        if (i >= chords.length) return done();
        chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
        msg.textContent = `Bien. ${chords[i].symbol}, note du bas : ${PC[chords[i].bass]}.`;
      } else {
        tried = true;
        msg.textContent = missing.length ? `Il manque : ${missing.map((x) => PC[x]).join(', ')}.` : `Les notes y sont, mais la note du bas doit être ${PC[c.bass]}.`;
      }
    }, v.two ? 220 : 150);
    cleanup = () => { col.destroy(); kb.destroy && kb.destroy(); };
    function done() {
      cleanup();
      const score = Math.round((first / chords.length) * 100);
      store.setBest(`voicing:${vId}`, score);
      const out = store.award('harmonie', Math.min(40, 8 + chords.length) + (score >= 85 ? 5 : 0), { activity: 'voicings', label: `Voicing ${v.name}${cycle === 'all' ? ' · 12 tonalités' : ''}`, score });
      app.celebrate(out);
      root.replaceChildren(h('section', { class: 'card stack center' }, h('div', { class: 'score' }, `${score} %`), h('p', { class: 'muted' }, 'Accords trouvés du premier coup.'), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
        h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: home }, 'Retour'), h('button', { class: 'btn', type: 'button', onclick: drill }, 'Rejouer'))));
    }
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: home }, '← Retour'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, v.name), h('p', { class: 'lead' }, v.two ? 'À deux mains : joue tout l’accord d’un coup.' : 'À une main.')),
      h('section', { class: 'card stack' }, chips, msg, kb,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => col.validate() }, 'Valider l’accord'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { tried = true; mark(kb, chords[i].notes, 'hint'); audio.unlock().then(() => audio.chord(chords[i].notes, null, 1.6)); } }, 'Montrer et écouter')),
        inputHint()));
  }
  home();
  return () => cleanup();
}

// ---------- Impro guidée ----------
const CHANGE_EVERY = [['never', 'Jamais : une seule contrainte pour toute la session'], ['tours:1', 'À chaque tour de grille'], ['tours:2', 'Tous les 2 tours'], ['tours:4', 'Tous les 4 tours'], ['bars:4', 'Toutes les 4 mesures'], ['bars:8', 'Toutes les 8 mesures'], ['bars:16', 'Toutes les 16 mesures']];
export function impro(root, app) {
  const s = store.get();
  let session = null;
  const withGrid = s.songs.filter((x) => parseGrid(x.grid).bars.length);
  function stop() { if (session) { session.stop(); session = null; } }
  function home() {
    stop();
    const st = s.settings;
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Impro guidée'),
        h('p', { class: 'lead' }, 'L’appli joue la grille et te donne une contrainte. Tu choisis laquelle, et tous les combien elle change.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'im-src' }, 'Sur quoi improviser'),
        h('select', { id: 'im-src' },
          withGrid.map((x) => h('option', { value: `song:${x.id}`, selected: st.improSrc === `song:${x.id}` }, x.title)),
          PROGRESSIONS.map((p) => h('option', { value: `prog:${p.id}`, selected: st.improSrc === `prog:${p.id}` }, `${p.name} (en do)`))),
        h('label', { for: 'im-tempo' }, 'Tempo'),
        h('select', { id: 'im-tempo' }, [80, 100, 120, 140, 160, 200].map((b) => h('option', { value: b, selected: (st.improTempo || 100) === b }, `${b} BPM`))),
        h('label', { for: 'im-tours' }, 'Nombre de tours'),
        h('select', { id: 'im-tours' }, [2, 4, 6, 8, 12, 16, 32].map((n) => h('option', { value: n, selected: (st.improTours || 4) === n }, `${n} tours`))),
        h('label', { for: 'im-cons' }, 'Contrainte'),
        h('select', { id: 'im-cons' }, h('option', { value: '-1', selected: (st.improCons ?? -1) === -1 }, 'Au hasard'),
          CONSIGNES.map((c, i) => h('option', { value: i, selected: st.improCons === i }, c))),
        h('label', { for: 'im-every' }, 'La contrainte change'),
        h('select', { id: 'im-every' }, CHANGE_EVERY.map(([v, l]) => h('option', { value: v, selected: (st.improEvery || 'never') === v }, l))),
        h('p', { class: 'muted small' }, 'Si tu choisis une contrainte précise, elle sert en premier, puis les suivantes arrivent au hasard quand elle change.'),
        h('button', { class: 'btn', type: 'button', onclick: go }, 'Lancer')));
  }
  async function go() {
    await audio.unlock();
    const st = s.settings;
    st.improSrc = document.getElementById('im-src').value;
    st.improTempo = +document.getElementById('im-tempo').value;
    st.improTours = +document.getElementById('im-tours').value;
    st.improCons = +document.getElementById('im-cons').value;
    st.improEvery = document.getElementById('im-every').value;
    store.save();
    let bars;
    let meter = 4;
    let title;
    const [kind, id] = st.improSrc.split(':');
    if (kind === 'song') {
      const song = s.songs.find((x) => x.id === id);
      bars = parseGrid(song.grid).bars;
      meter = song.meter;
      title = song.title;
    } else {
      const p = PROGRESSIONS.find((x) => x.id === id);
      bars = realize(p, KEYS[0]).map((c) => ({ chords: [{ name: c.symbol, root: c.rootPc, semis: c.semis, bass: c.rootPc }] }));
      title = p.name;
    }
    const first = st.improCons >= 0 ? CONSIGNES[st.improCons] : null;
    const consignes = first ? [first, ...shuffle(CONSIGNES.filter((c) => c !== first))] : shuffle(CONSIGNES);
    const [unit, nStr] = st.improEvery === 'never' ? ['never', '0'] : st.improEvery.split(':');
    const span = unit === 'bars' ? +nStr : unit === 'tours' ? +nStr * bars.length : Infinity; // mesures par contrainte
    const nextEl = h('p', { class: 'muted small' }, '');
    const big = h('p', { class: 'consigne' }, consignes[0]);
    const info = h('p', { class: 'muted small' }, 'Décompte…');
    const chordNow = h('p', { class: 'hand big-notes' }, '');
    const started = performance.now();
    root.replaceChildren(h('section', { class: 'card stack center' }, h('span', { class: 'muted small' }, title), big, nextEl, chordNow, info,
      h('button', { class: 'btn ghost', type: 'button', onclick: () => stop() }, 'Arrêter')));
    const pat = allPatterns().find((x) => x.id === (st.paPattern || 'charleston')) || allPatterns()[0];
    session = playalong.start({
      bars, meter, bpm: st.improTempo, swing: true, compPattern: pat.bars[0], opts: { bass: true, comp: true, click: '2-4' }, loops: st.improTours,
      onBar: (b, k, count) => {
        if (b < 0) { info.textContent = `Décompte : ${count}`; return; }
        const tour = Math.floor(k / bars.length);
        const ci = span === Infinity ? 0 : Math.floor(k / span);
        big.textContent = consignes[ci % consignes.length];
        const left = span === Infinity ? null : span - (k % span);
        const totalLeft = st.improTours * bars.length - k;
        nextEl.textContent = left == null || left >= totalLeft ? 'Même contrainte jusqu’à la fin.'
          : left === 1 ? `Dernière mesure. Ensuite : ${consignes[(ci + 1) % consignes.length]}` : `Nouvelle contrainte dans ${left} mesures.`;
        chordNow.textContent = bars[b].chords.map((c) => c.name).join('  ');
        info.textContent = `Tour ${tour + 1} / ${st.improTours} · mesure ${b + 1}`;
      },
      onEnd: () => {
        session = null;
        const mins = Math.max(1, Math.round((performance.now() - started) / 60000));
        const out = store.award('impro', Math.min(40, mins * 3), { activity: 'impro', label: `Impro guidée · ${title}`, minutes: mins, song: kind === 'song' ? id : null });
        app.celebrate(out);
        toast(`+${out.gained} XP`);
        home();
      },
    });
  }
  home();
  return stop;
}

// ---------- Dictée de motifs (Oreille) ----------
export const MOTIF_LEVELS = [
  { n: 1, name: '3 notes conjointes', desc: 'Gamme majeure, notes voisines', len: 3, pool: 'major', steps: [1, 2] },
  { n: 2, name: '4 notes, petits sauts', desc: 'Gamme majeure, sauts jusqu’à la quinte', len: 4, pool: 'major', steps: [1, 2, 3, 4] },
  { n: 3, name: 'Arpèges', desc: 'Notes de maj7, m7 ou 7', len: 4, pool: 'arp' },
  { n: 4, name: 'Gamme blues', desc: '5 notes dans la gamme blues', len: 5, pool: 'blues', steps: [1, 2, 3] },
  { n: 5, name: 'Chromatisme bebop', desc: '6 notes avec notes de passage', len: 6, pool: 'chroma', steps: [1, 2, 3] },
];

function makeMotif(L) {
  const tonic = 60 + Math.floor(Math.random() * 7) - 3;
  if (L.pool === 'arp') {
    const q = pick([[0, 4, 7, 11], [0, 3, 7, 10], [0, 4, 7, 10]]);
    const order = pick([[0, 1, 2, 3], [3, 2, 1, 0], [0, 2, 1, 3], [1, 2, 3, 0]]);
    return order.map((i) => tonic + q[i] - (order[0] === 3 && i === 0 ? 0 : 0));
  }
  const scale = L.pool === 'blues' ? [0, 3, 5, 6, 7, 10, 12, 15] : L.pool === 'chroma' ? [...Array(13).keys()] : [0, 2, 4, 5, 7, 9, 11, 12, 14];
  let idx = Math.floor(Math.random() * Math.max(1, scale.length - 4));
  const out = [tonic + scale[idx]];
  while (out.length < L.len) {
    const step = pick(L.steps) * (Math.random() < 0.5 ? -1 : 1);
    idx = Math.max(0, Math.min(scale.length - 1, idx + step));
    const m = tonic + scale[idx];
    if (m !== out[out.length - 1]) out.push(m);
  }
  return out;
}

export function motifs(stage, app, L, onBack) {
  let n = 0;
  let correct = 0;
  let cleanup = () => {};
  const SESSION = 8;
  function next() {
    cleanup();
    if (n >= SESSION) return finish();
    n++;
    const m = makeMotif(L);
    const play = () => { const t = audio.getCtx().currentTime + 0.1; m.forEach((x, i) => audio.tone(x, t + i * 0.45, 0.6, 0.8)); };
    stage.replaceChildren(
      h('div', { class: 'muted small' }, `Niveau ${L.n} · motif ${n} / ${SESSION} · ${correct} réussi${correct > 1 ? 's' : ''}`),
      h('p', null, `Écoute le motif, puis rejoue-le. La première note est ${PC[m[0] % 12]}.`),
      h('div', { class: 'row center' }, h('button', { class: 'btn big', type: 'button', onclick: play }, 'Écouter')));
    let errors = 0;
    cleanup = sequenceDrill(stage, m.map((x) => x % 12), {
      showNames: false,
      onDone: (err) => {
        errors = err;
        if (errors === 0) correct++;
        stage.append(h('p', { class: errors === 0 ? 'good' : 'bad' }, errors === 0 ? 'Sans faute !' : `Trouvé avec ${errors} erreur${errors > 1 ? 's' : ''}.`),
          h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: play }, 'Réécouter'), h('button', { class: 'btn', type: 'button', onclick: next }, n >= SESSION ? 'Voir le résultat' : 'Suivant')));
      },
    });
    audio.unlock().then(play);
  }
  function finish() {
    cleanup();
    const pct = Math.round((correct / SESSION) * 100);
    store.setBest(`motifs:N${L.n}`, pct);
    const out = store.award('oreille', correct * 3 + (correct >= 7 ? 5 : 0), { activity: 'oreille', label: `Dictée de motifs · niveau ${L.n}`, score: pct, correct, total: SESSION });
    app.celebrate(out);
    stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${SESSION}`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
      h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: onBack }, 'Niveaux'), h('button', { class: 'btn', type: 'button', onclick: () => motifs(stage, app, L, onBack) }, 'Encore une série')));
  }
  next();
  return () => cleanup();
}
