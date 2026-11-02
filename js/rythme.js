// Module Rythme : placements de main gauche joués au piano (ou tapés), mesurés à la milliseconde.
import { h, svg, toast, sleep, icon } from './ui.js';
import * as audio from './audio.js';
import * as midi from './midi.js';
import * as store from './store.js';

// Positions en croches dans une mesure à 4 temps : 0 = 1, 1 = « et » du 1, 2 = 2, … 7 = « et » du 4.
export const PATTERNS = [
  { id: 'noires', name: 'Noires sur le temps', desc: 'Une note sur chaque temps. La base pour caler ton placement.', bars: [[0, 2, 4, 6]], level: 1 },
  { id: 'et1', name: '« Et » du 1', desc: 'Ton rythme 1 sur Someday : l’accord anticipé sur le « et » du 1.', bars: [[1]], level: 1 },
  { id: 'et1et2', name: '« Et » du 1 + « et » du 2', desc: 'Ton rythme 3, le swing à la Bill Evans.', bars: [[1, 3]], level: 1 },
  { id: 'deux-mesures', name: 'Rythme sur 2 mesures', desc: 'Ton rythme 2 : le 1 et le « et » du 2, puis le « et » du 1.', bars: [[0, 3], [1]], level: 1 },
  { id: 'charleston', name: 'Charleston', desc: 'Le 1 et le « et » du 2, répété à chaque mesure : un placement de comping très courant.', bars: [[0, 3]], level: 2 },
  { id: 'contretemps', name: 'Contretemps', desc: 'Uniquement sur les « et ». Indispensable en swing comme en funk.', bars: [[1, 3, 5, 7]], level: 2 },
  { id: 'garland', name: 'Red Garland', desc: '« Et » du 2 et « et » du 4, l’accord suivant anticipé.', bars: [[3, 7]], level: 4 },
];
export const patternById = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
export function allPatterns() {
  return [...PATTERNS, ...store.get().customPatterns.map((c) => ({ ...c, level: 1, custom: true, desc: 'Ton rythme personnalisé.' }))];
}
export function findPattern(id) { return allPatterns().find((p) => p.id === id); }

const GRADES = {
  parfait: { label: 'Parfait', pts: 100, max: 25 },
  bien: { label: 'Bien', pts: 80, max: 50 },
  juste: { label: 'Juste', pts: 50, max: 90 },
  loin: { label: 'Loin', pts: 20, max: Infinity },
  manque: { label: 'Manqué', pts: 0 },
};
function grade(dev) {
  const a = Math.abs(dev);
  if (a <= GRADES.parfait.max) return 'parfait';
  if (a <= GRADES.bien.max) return 'bien';
  if (a <= GRADES.juste.max) return 'juste';
  return 'loin';
}

export function posBeats(p, swing) {
  return Math.floor(p / 2) + (p % 2 ? (swing ? 2 / 3 : 0.5) : 0);
}

// Associe chaque attaque attendue à la frappe la plus proche. Les notes d'un même accord comptent pour une frappe.
export function evaluate(expected, rawHits, beatMs, t0, t1) {
  const hs = rawHits.filter((t) => t > t0 - beatMs * 0.6 && t < t1 + beatMs * 0.3).sort((a, b) => a - b);
  const hits = [];
  for (const t of hs) if (!hits.length || t - hits[hits.length - 1] > 45) hits.push(t);
  const used = new Array(hits.length).fill(false);
  const res = expected.map((e, i) => {
    const prev = i > 0 ? e.t - expected[i - 1].t : Infinity;
    const next = i < expected.length - 1 ? expected[i + 1].t - e.t : Infinity;
    const win = Math.max(60, Math.min(0.45 * prev, 0.45 * next, 0.4 * beatMs, 250));
    let best = -1;
    let bd = Infinity;
    hits.forEach((ht, j) => {
      if (used[j]) return;
      const d = ht - e.t;
      if (Math.abs(d) <= win && Math.abs(d) < Math.abs(bd)) { best = j; bd = d; }
    });
    if (best >= 0) { used[best] = true; return { ...e, dev: bd, hit: hits[best], grade: grade(bd) }; }
    return { ...e, dev: null, hit: null, grade: 'manque' };
  });
  const extras = hits.filter((_, j) => !used[j]);
  const pts = res.reduce((s, r) => s + GRADES[r.grade].pts, 0);
  const score = expected.length ? Math.round(pts / (expected.length + extras.length * 0.5)) : 0;
  const devs = res.filter((r) => r.dev != null).map((r) => r.dev);
  const meanDev = devs.length ? devs.reduce((s, d) => s + d, 0) / devs.length : null;
  const counts = {};
  Object.keys(GRADES).forEach((k) => { counts[k] = res.filter((r) => r.grade === k).length; });
  return { res, extras, score, meanDev, counts };
}

function slotsView(pattern, barIndex = 0, active = null) {
  const bar = pattern.bars[barIndex % pattern.bars.length];
  const labels = ['1', 'et', '2', 'et', '3', 'et', '4', 'et'];
  return h('div', { class: 'slots', 'aria-label': 'Placement dans la mesure' },
    labels.map((l, i) => h('span', { class: `slot${bar.includes(i) ? ' on' : ''}${i % 2 ? ' off' : ''}${active === i ? ' now' : ''}` }, l)));
}

function patternNotation(pattern) {
  return h('div', { class: 'notation' }, pattern.bars.map((_, b) => slotsView(pattern, b)));
}

export function render(el, app, params = {}) {
  const s = store.get();
  const lvl = store.skillLevel('rythme').level;
  let current = findPattern(params.pattern) || PATTERNS.find((p) => p.level <= lvl && !s.best[`rythme:${p.id}`]) || PATTERNS[0];
  if (current.level > lvl) current = PATTERNS[0];
  let running = null;
  let stopTap = null;

  const root = h('div', { class: 'stack' });
  el.append(root);

  function list() {
    root.replaceChildren();
    root.append(
      h('div', { class: 'page-head' },
        h('h1', { class: 'display' }, 'Rythme'),
        h('p', { class: 'lead' }, 'Joue le placement demandé au piano, sur le métronome. L’appli mesure ton écart à chaque attaque.')),
    );
    if (!s.settings.calibrated) {
      root.append(h('section', { class: 'card note-card' },
        h('h2', null, 'À faire une fois : calibrer'),
        h('p', null, 'Le son, le câble et le piano ajoutent un petit délai. Joue 8 noires bien en place pour que l’appli le compense.'),
        h('button', { class: 'btn', type: 'button', onclick: () => setup(PATTERNS[0], true) }, 'Calibrer (30 s)')));
    }
    const grid = h('div', { class: 'grid2' });
    PATTERNS.forEach((p) => {
      const locked = p.level > lvl;
      const best = s.best[`rythme:${p.id}`];
      grid.append(h('button', {
        type: 'button', class: `card pick${locked ? ' locked' : ''}`, disabled: locked,
        onclick: () => setup(p, false),
      },
      h('span', { class: 'pick-title' }, locked ? icon('lock', 'ic sm') : null, p.name),
      patternNotation(p),
      h('span', { class: 'muted small' }, locked ? `Débloqué au niveau ${p.level} de Travail` : best != null ? `Meilleur score : ${best} %` : 'Pas encore joué')));
    });
    root.append(grid);
    root.append(h('div', { class: 'card-head' }, h('h2', { class: 'hand-title' }, 'Mes rythmes'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => builder() }, 'Créer un rythme')));
    const mine = allPatterns().filter((p) => p.custom);
    if (!mine.length) root.append(h('p', { class: 'muted small' }, 'Coche les croches que tu veux jouer sur une ou deux mesures, et l\u2019appli te fait travailler ce placement comme les autres.'));
    else {
      const g2 = h('div', { class: 'grid2' });
      mine.forEach((p) => {
        const best = s.best[`rythme:${p.id}`];
        g2.append(h('div', { class: 'card pick' },
          h('button', { type: 'button', class: 'pick-btn', onclick: () => setup(p, false) },
            h('span', { class: 'pick-title' }, p.name), patternNotation(p),
            h('span', { class: 'muted small' }, best != null ? `Meilleur score : ${best} %` : 'Pas encore joué')),
          h('div', { class: 'row' },
            h('button', { class: 'btn ghost sm', type: 'button', onclick: () => builder(p) }, 'Modifier'),
            h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { s.customPatterns = s.customPatterns.filter((c) => c.id !== p.id); store.save(); list(); } }, 'Supprimer'))));
      });
      root.append(g2);
    }
  }

  function builder(edit) {
    cleanup();
    const bars = edit ? edit.bars.map((b) => b.slice()) : [[0, 3]];
    let name = edit ? edit.name : '';
    const box = h('div', { class: 'stack' });
    const labels = ['1', 'et', '2', 'et', '3', 'et', '4', 'et'];
    function draw() {
      box.replaceChildren(
        h('label', { for: 'pat-name' }, 'Nom du rythme'),
        h('input', { id: 'pat-name', type: 'text', value: name, placeholder: 'Ex. : comping Crazy Race', autocomplete: 'off', oninput: (e) => { name = e.target.value; } }),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Nombre de mesures' },
          [1, 2].map((n) => h('button', { type: 'button', class: bars.length === n ? 'on' : '', onclick: () => { if (n === 2 && bars.length === 1) bars.push(bars[0].slice()); if (n === 1) bars.length = 1; draw(); } }, `${n} mesure${n > 1 ? 's' : ''}`))),
        ...bars.map((bar, bi) => h('div', { class: 'stack' },
          bars.length > 1 ? h('span', { class: 'muted small' }, `Mesure ${bi + 1}`) : null,
          h('div', { class: 'slots edit' }, labels.map((l, i) => h('button', {
            type: 'button', class: `slot${bar.includes(i) ? ' on' : ''}${i % 2 ? ' off' : ''}`, 'aria-pressed': bar.includes(i) ? 'true' : 'false',
            onclick: () => { const k = bar.indexOf(i); if (k >= 0) bar.splice(k, 1); else { bar.push(i); bar.sort((a, b) => a - b); } draw(); },
          }, l))))),
        h('p', { class: 'muted small' }, 'Touche une case pour ajouter ou retirer une attaque. « et » = la croche entre deux temps.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => demo({ pattern: { bars }, bpm: s.settings.bpm, swing: s.settings.swing }) }, 'Écouter'),
          h('button', { class: 'btn', type: 'button', onclick: () => {
            if (!bars.some((b) => b.length)) { toast('Coche au moins une case.', 'bad'); return; }
            const pat = { id: edit ? edit.id : `perso-${Date.now().toString(36)}`, name: name.trim() || 'Mon rythme', bars: bars.map((b) => b.slice()) };
            s.customPatterns = [...s.customPatterns.filter((c) => c.id !== pat.id), pat];
            store.save();
            toast('Rythme enregistré.');
            list();
          } }, 'Enregistrer')));
    }
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: list }, '← Tous les rythmes'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, edit ? 'Modifier le rythme' : 'Créer un rythme')),
      h('section', { class: 'card' }, box));
    draw();
  }

  function setup(p, calibration) {
    current = p;
    cleanup();
    root.replaceChildren();
    const cfg = { pattern: p, bpm: calibration ? 80 : s.settings.bpm, swing: calibration ? false : s.settings.swing, bars: calibration ? 2 : s.settings.bars, calibration };
    const bpmOut = h('output', { id: 'bpm-out', class: 'num' }, cfg.bpm);
    const ms = midi.getStatus();
    root.append(
      h('button', { class: 'back', type: 'button', onclick: list }, '← Tous les rythmes'),
      h('div', { class: 'page-head' },
        h('h1', { class: 'display' }, calibration ? 'Calibrage' : p.name),
        h('p', { class: 'lead' }, calibration ? 'Joue une note sur chaque temps, le plus en place possible, pendant 2 mesures.' : p.desc)),
      h('section', { class: 'card stack' },
        patternNotation(p),
        calibration ? null : h('div', { class: 'controls' },
          h('label', { for: 'bpm' }, 'Tempo ', bpmOut, ' BPM'),
          h('input', { id: 'bpm', type: 'range', min: 40, max: 180, step: 2, value: cfg.bpm, oninput: (e) => { cfg.bpm = +e.target.value; bpmOut.textContent = cfg.bpm; store.setSetting('bpm', cfg.bpm); } }),
          h('label', { class: 'check' }, h('input', { id: 'swing', type: 'checkbox', checked: cfg.swing, onchange: (e) => { cfg.swing = e.target.checked; store.setSetting('swing', cfg.swing); } }), 'Croches swing (ternaires)'),
          h('label', { for: 'bars' }, 'Durée'),
          h('select', { id: 'bars', onchange: (e) => { cfg.bars = +e.target.value; store.setSetting('bars', cfg.bars); } },
            [4, 8].map((n) => h('option', { value: n, selected: n === cfg.bars }, `${n} mesures`)))),
        h('p', { class: 'muted small' }, ms.status === 'on'
          ? `Entrée : ${ms.inputs.join(', ')}. Les notes d’un accord comptent pour une seule attaque.`
          : 'Piano non connecté : tu peux taper sur le grand bouton ou la barre d’espace (moins précis qu’au piano).'),
        h('div', { class: 'row' },
          calibration ? null : h('button', { class: 'btn ghost', type: 'button', onclick: () => demo(cfg) }, 'Écouter le modèle'),
          h('button', { class: 'btn', type: 'button', onclick: () => go(cfg) }, calibration ? 'Commencer le calibrage' : ms.status === 'on' ? 'Commencer (mesuré au piano)' : 'Commencer (mesuré au tapotement)')),
        calibration ? null : h('div', { class: 'metro-box' },
          h('strong', null, 'Sans piano : métronome seul'),
          h('p', { class: 'muted small' }, 'Le métronome bat les temps et un bip aigu tombe sur chaque attaque du rythme. Tu joues avec, sans rien brancher et sans être noté.'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => metro(cfg) }, 'Lancer le métronome'))),
    );
  }

  // Métronome seul : boucle sans fin, temps + bip sur les attaques du rythme, pas de mesure.
  async function metro(cfg) {
    const c = await audio.unlock();
    cleanup();
    const beat = 60 / cfg.bpm;
    let withHits = true;
    const start = c.currentTime + 0.3;
    let nextBar = 0;
    const started = performance.now();
    const beatEl = h('div', { class: 'beat-big' }, '1');
    const slotsBox = h('div', null, slotsView(cfg.pattern, 0));
    const tempoOut = h('output', { class: 'num' }, cfg.bpm);
    let bpm = cfg.bpm;
    let nextT = start;
    const barLog = [];
    const timer = setInterval(() => {
      while (nextT < c.currentTime + 0.5) {
        const b0 = nextT;
        const bt = 60 / bpm;
        barLog.push({ t: b0, bt, n: nextBar });
        nextT += 4 * bt;
        for (let i = 0; i < 4; i++) audio.click(b0 + i * bt, i === 0 ? 'accent' : 'soft');
        if (withHits) cfg.pattern.bars[nextBar % cfg.pattern.bars.length].forEach((p) => audio.click(b0 + posBeats(p, cfg.swing) * bt, 'hit'));
        nextBar++;
      }
    }, 50);
    let raf = 0;
    const tick = () => {
      const now = c.currentTime;
      const cur = barLog.filter((b) => b.t <= now).pop();
      if (cur) {
        const inBar = Math.min(3.99, (now - cur.t) / cur.bt);
        beatEl.textContent = String(Math.floor(inBar) + 1);
        slotsBox.replaceChildren(slotsView(cfg.pattern, cur.n, Math.floor(inBar * 2)));
      }
      if (barLog.length > 8) barLog.splice(0, barLog.length - 8);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = () => {
      clearInterval(timer); cancelAnimationFrame(raf);
      const mins = Math.round((performance.now() - started) / 60000);
      if (mins >= 1) { const out = store.award('rythme', Math.min(30, mins * 2), { activity: 'rythme', label: `${cfg.pattern.name} au métronome · ${mins} min`, minutes: mins, pattern: cfg.pattern.id, bpm }); app.celebrate(out); toast(`+${out.gained} XP`); }
    };
    stopTap = stop;
    root.replaceChildren(h('section', { class: 'card stack center run' },
      h('span', { class: 'muted small' }, `${cfg.pattern.name} · métronome seul`), beatEl, slotsBox,
      h('label', { for: 'metro-bpm' }, 'Tempo ', tempoOut, ' BPM'),
      h('input', { id: 'metro-bpm', type: 'range', min: 40, max: 220, step: 2, value: bpm, oninput: (e) => { bpm = +e.target.value; tempoOut.textContent = bpm; } }),
      h('label', { class: 'check' }, h('input', { id: 'metro-hits', type: 'checkbox', checked: true, onchange: (e) => { withHits = e.target.checked; } }), 'Bip sur les attaques du rythme'),
      h('button', { class: 'btn', type: 'button', onclick: () => { stop(); stopTap = null; setup(cfg.pattern, false); } }, 'Arrêter')));
  }

  async function demo(cfg) {
    cfg = { ...cfg, pattern: cfg.pattern };
    const c = await audio.unlock();
    const beat = 60 / cfg.bpm;
    const start = c.currentTime + 0.2;
    const voicing = [53, 57, 60, 64]; // fa – la – do – mi (Fmaj7)
    for (let b = 0; b < 2; b++) {
      for (let i = 0; i < 4; i++) audio.click(start + (b * 4 + i) * beat, i === 0 ? 'accent' : 'beat');
      cfg.pattern.bars[b % cfg.pattern.bars.length].forEach((p) => audio.chord(voicing, start + (b * 4 + posBeats(p, cfg.swing)) * beat, beat * 0.9, 0.8));
    }
  }

  async function go(cfg) {
    const c = await audio.unlock();
    root.replaceChildren();
    const beatEl = h('div', { class: 'beat-big', 'aria-live': 'off' }, 'Prêt');
    const barEl = h('div', { class: 'muted' }, '');
    const slotsBox = h('div', null, slotsView(cfg.pattern, 0));
    const tapBtn = h('button', { class: 'tap', type: 'button' }, 'Tape ici');
    root.append(h('section', { class: 'card stack center run' }, beatEl, barEl, slotsBox, tapBtn,
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { running && (running.stopped = true); setup(cfg.pattern, cfg.calibration); } }, 'Arrêter')));

    const hits = [];
    const offNote = midi.onNote((e) => { hits.push(e.t); tapBtn.classList.remove('flash'); void tapBtn.offsetWidth; tapBtn.classList.add('flash'); });
    tapBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); midi.emitTap(e.timeStamp || performance.now()); });
    const onKey = (e) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); midi.emitTap(e.timeStamp || performance.now()); } };
    window.addEventListener('keydown', onKey);
    stopTap = () => { offNote(); window.removeEventListener('keydown', onKey); };

    const beat = 60 / cfg.bpm;
    const countIn = 4;
    const total = countIn + cfg.bars * 4;
    const start = c.currentTime + 0.4;
    for (let i = 0; i < total; i++) audio.click(start + i * beat, i < countIn ? 'count' : i % 4 === 0 ? 'accent' : 'beat');
    const recStart = start + countIn * beat;
    const exp = [];
    for (let b = 0; b < cfg.bars; b++) {
      cfg.pattern.bars[b % cfg.pattern.bars.length].forEach((p) => exp.push({ ctx: recStart + (b * 4 + posBeats(p, cfg.swing)) * beat, bar: b, pos: p }));
    }
    const end = start + total * beat;
    running = { stopped: false };
    const run = running;
    await sleep(150);
    const map = audio.clockMap();

    const tick = () => {
      if (run.stopped || !root.isConnected) return;
      const now = c.currentTime;
      const i = Math.floor((now - start) / beat);
      if (now < start) { beatEl.textContent = 'Prêt'; }
      else if (i < countIn) { beatEl.textContent = String(i + 1); barEl.textContent = 'Décompte'; }
      else if (now < end) {
        const k = i - countIn;
        const bar = Math.floor(k / 4);
        beatEl.textContent = String((k % 4) + 1);
        barEl.textContent = `Mesure ${bar + 1} / ${cfg.bars}`;
        const eighth = Math.floor(((now - recStart) / beat - bar * 4) * 2);
        slotsBox.replaceChildren(slotsView(cfg.pattern, bar, eighth));
      }
      if (now < end + 0.1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await sleep((end - c.currentTime) * 1000 + 450);
    if (run.stopped) return;
    stopTap && stopTap();
    stopTap = null;
    running = null;

    const lat = cfg.calibration ? 0 : (s.settings.latencyMs || 0);
    const expected = exp.map((e) => ({ ...e, t: map(e.ctx) + lat }));
    const t0 = map(recStart) + lat;
    const t1 = map(end) + lat;
    const r = evaluate(expected, hits, beat * 1000, t0, t1);
    if (cfg.calibration) return finishCalibration(r, cfg);
    showResult(r, cfg, t0, beat * 1000);
  }

  function finishCalibration(r, cfg) {
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: list }, '← Tous les rythmes'));
    const found = r.res.filter((x) => x.dev != null);
    if (found.length < 5 || r.meanDev == null) {
      root.append(h('section', { class: 'card stack' }, h('h2', null, 'Calibrage incomplet'),
        h('p', null, `Seulement ${found.length} notes sur 8 ont été reconnues. Vérifie que le piano est connecté, puis recommence.`),
        h('button', { class: 'btn', type: 'button', onclick: () => setup(cfg.pattern, true) }, 'Recommencer')));
      return;
    }
    const lat = Math.round(Math.max(-150, Math.min(250, r.meanDev)));
    store.setSetting('latencyMs', lat);
    store.setSetting('calibrated', true);
    root.append(h('section', { class: 'card stack' }, h('h2', null, 'Calibrage enregistré'),
      h('p', null, `Décalage mesuré : ${lat} ms. Il sera retiré de tous tes prochains exercices. Tu peux recalibrer depuis le Journal si tu changes d’appareil ou de câble.`),
      h('button', { class: 'btn', type: 'button', onclick: list }, 'Choisir un rythme')));
  }

  function showResult(r, cfg, t0, beatMs) {
    const xpRaw = Math.round(20 * r.score / 100) + (r.score >= 85 ? 10 : 0);
    const prevBest = s.best[`rythme:${cfg.pattern.id}`];
    store.setBest(`rythme:${cfg.pattern.id}`, r.score);
    const out = store.award('rythme', xpRaw, { activity: 'rythme', label: `${cfg.pattern.name} · ${cfg.bpm} BPM`, score: r.score, pattern: cfg.pattern.id, bpm: cfg.bpm });
    app.celebrate(out);

    let tendency = 'Pas assez d’attaques pour mesurer une tendance.';
    if (r.meanDev != null) {
      const m = Math.round(r.meanDev);
      tendency = Math.abs(m) <= 10 ? `Tu es bien centré sur le temps (écart moyen ${m} ms).`
        : m < 0 ? `Tu as tendance à jouer en avance : ${-m} ms en moyenne.` : `Tu as tendance à jouer en retard : ${m} ms en moyenne.`;
    }
    root.replaceChildren(
      h('button', { class: 'back', type: 'button', onclick: list }, '← Tous les rythmes'),
      h('section', { class: 'card stack' },
        h('div', { class: 'result-head' },
          h('div', null, h('div', { class: 'score' }, `${r.score} %`), h('div', { class: 'muted small' }, `${cfg.pattern.name} · ${cfg.bpm} BPM${cfg.swing ? ' · swing' : ''}`)),
          h('div', { class: 'xp-gain' }, `+${out.gained} XP`, out.capped ? h('span', { class: 'muted small' }, ' (plafond du jour)') : null)),
        prevBest != null && r.score > prevBest ? h('p', { class: 'good' }, `Nouveau record (avant : ${prevBest} %)`) : null,
        h('p', null, tendency),
        h('div', { class: 'chips' },
          ['parfait', 'bien', 'juste', 'loin', 'manque'].map((k) => h('span', { class: `chip g-${k}` }, `${GRADES[k].label} ${r.counts[k]}`)),
          r.extras.length ? h('span', { class: 'chip' }, `En trop ${r.extras.length}`) : null),
        timeline(r, cfg, t0, beatMs),
        h('p', { class: 'muted small' }, 'Repères : parfait ≤ 25 ms, bien ≤ 50 ms, juste ≤ 90 ms. Seuils provisoires, à ajuster ensemble.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => setup(cfg.pattern, false) }, 'Réglages'),
          h('button', { class: 'btn', type: 'button', onclick: () => go(cfg) }, 'Rejouer'))));
  }

  function timeline(r, cfg, t0, beatMs) {
    const W = 320;
    const rowH = 34;
    const barMs = beatMs * 4;
    const rows = [];
    for (let b = 0; b < cfg.bars; b++) {
      const y = b * rowH + 6;
      let g = `<line x1="0" y1="${y + 12}" x2="${W}" y2="${y + 12}" class="tl-axis"/>`;
      for (let i = 0; i <= 4; i++) g += `<line x1="${(i / 4) * W}" y1="${y}" x2="${(i / 4) * W}" y2="${y + 24}" class="tl-beat"/>`;
      r.res.filter((x) => x.bar === b).forEach((x) => {
        const ex = ((x.t - t0 - b * barMs) / barMs) * W;
        g += `<circle cx="${ex.toFixed(1)}" cy="${y + 12}" r="7" class="tl-exp"/>`;
        if (x.hit != null) {
          const hx = ((x.hit - t0 - b * barMs) / barMs) * W;
          g += `<circle cx="${hx.toFixed(1)}" cy="${y + 12}" r="4.5" class="tl-hit g-${x.grade}"/>`;
        }
      });
      r.extras.forEach((t) => {
        const hx = ((t - t0 - b * barMs) / barMs) * W;
        if (hx >= -10 && hx <= W + 10) g += `<circle cx="${hx.toFixed(1)}" cy="${y + 12}" r="3.5" class="tl-extra"/>`;
      });
      rows.push(g);
    }
    const H = cfg.bars * rowH + 8;
    return h('div', { class: 'tl-wrap' },
      svg(`<svg class="tl" viewBox="-12 0 ${W + 24} ${H}" role="img" aria-label="Tes attaques par rapport aux temps attendus">${rows.join('')}</svg>`),
      h('p', { class: 'muted small' }, 'Cercle vide : moment attendu. Point plein : ta note. Traits verticaux : les temps.'));
  }

  function cleanup() {
    if (running) running.stopped = true;
    running = null;
    if (stopTap) stopTap();
    stopTap = null;
  }

  if (params.pattern) setup(current, false); else list();
  return cleanup;
}
