// Onglet Oreille et théorie : niveaux au choix pour intervalles, accords, progressions et théorie.
import { h, pick, weightedPick } from './ui.js';
import * as audio from './audio.js';
import * as midi from './midi.js';
import * as store from './store.js';
import {
  INTERVALS, intervalById, CHORDS, chordSemis, PROGRESSIONS, PROG_LEVELS, progById, realize, KEYS, nameFr, voice,
} from './music.js';
import { makeQuestion, THEMES } from './theorie.js';
import { MOTIF_LEVELS, motifs } from './v3.js';

const SESSION = 10;
const DIRS = { asc: 'Montants', desc: 'Descendants', harm: 'Harmoniques (ensemble)' };

export const INTERVAL_LEVELS = [
  { n: 1, name: 'Les repères', ids: ['3M', '4J', '5J', '8J'] },
  { n: 2, name: 'Majeur ou mineur', ids: ['3m', '3M', '6m', '6M'] },
  { n: 3, name: 'Secondes et septièmes', ids: ['2m', '2M', '7m', '7M'] },
  { n: 4, name: 'Quartes, quintes et triton', ids: ['4J', '4+', '5J', '8J'] },
  { n: 5, name: 'Tous les intervalles', ids: INTERVALS.map((i) => i.id) },
];
export const CHORD_LEVELS = [
  { n: 1, name: 'Majeur ou mineur', ids: ['maj', 'min'] },
  { n: 2, name: 'Les trois accords du jazz', ids: ['maj7', 'm7', 'dom7'] },
  { n: 3, name: 'Demi-diminué et diminué', ids: ['m7', 'dom7', 'm7b5', 'dim7'] },
  { n: 4, name: 'Couleurs : augmenté, sus4', ids: ['maj', 'min', 'aug', 'sus4'] },
  { n: 5, name: 'Tous les accords', ids: Object.keys(CHORDS) },
];
export const THEORY_LEVELS = [
  { n: 1, name: 'Do, fa, sol' },
  { n: 2, name: '+ si♭ et ré' },
  { n: 3, name: '+ mi♭ et la' },
  { n: 4, name: '+ la♭ et mi' },
  { n: 5, name: 'Toutes les tonalités' },
];

const MODES = [['intervalles', 'Intervalles'], ['accords', 'Accords'], ['progressions', 'Progressions'], ['motifs', 'Motifs'], ['theorie', 'Théorie']];

export function render(el, app, params = {}) {
  const s = store.get();
  let mode = params.mode || 'intervalles';
  let cleanupMidi = null;
  const root = h('div', { class: 'stack' });
  el.append(root);

  function header() {
    return h('div', { class: 'stack' },
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Oreille et théorie')),
      h('div', { class: 'seg scroll', role: 'tablist' }, MODES.map(([id, label]) =>
        h('button', { type: 'button', role: 'tab', 'aria-selected': mode === id ? 'true' : 'false', class: mode === id ? 'on' : '', onclick: () => { mode = id; home(); } }, label))));
  }
  function stopMidi() { if (cleanupMidi) cleanupMidi(); cleanupMidi = null; }
  const bestKey = (lvl, extra = '') => `${mode}:N${lvl}${extra}`;

  function levelCards(levels, describe, onPick, extra = '') {
    return h('div', { class: 'levels' }, levels.map((L) => {
      const best = store.getBest(bestKey(L.n, extra));
      const stars = best == null ? 0 : best >= 90 ? 3 : best >= 70 ? 2 : best >= 50 ? 1 : 0;
      return h('button', { type: 'button', class: 'card level', onclick: () => onPick(L) },
        h('span', { class: 'level-n hand' }, `Niveau ${L.n}`),
        h('strong', null, L.name),
        h('span', { class: 'muted small' }, describe(L)),
        h('span', { class: 'stars', 'aria-label': `${stars} étoile${stars > 1 ? 's' : ''} sur 3` }, '★'.repeat(stars) + '☆'.repeat(3 - stars), best != null ? h('span', { class: 'muted small' }, ` meilleur : ${best} %`) : null));
    }));
  }

  function home() {
    stopMidi();
    root.replaceChildren(header());
    if (mode === 'intervalles') {
      root.append(h('section', { class: 'card stack' },
        h('p', null, 'Tu entends deux notes : nomme l’écart entre elles. Choisis ton niveau, tous sont ouverts.'),
        h('div', { class: 'controls' }, h('label', { for: 'dir' }, 'Sens'),
          h('select', { id: 'dir', onchange: (e) => { store.setSetting('direction', e.target.value); home(); } },
            Object.entries(DIRS).map(([k, v]) => h('option', { value: k, selected: s.settings.direction === k }, v))))),
      levelCards(INTERVAL_LEVELS, (L) => L.ids.map((id) => intervalById[id].fr).join(', '), (L) => earQuiz(L), `:${s.settings.direction}`));
    } else if (mode === 'accords') {
      root.append(h('p', { class: 'muted' }, 'Tu entends un accord : trouve sa couleur.'),
        levelCards(CHORD_LEVELS, (L) => L.ids.map((id) => CHORDS[id].fr).join(', '), (L) => earQuiz(L)));
    } else if (mode === 'motifs') {
      root.append(h('p', { class: 'muted' }, 'Dictée de motifs inconnus : l\u2019appli joue une courte phrase, tu la rejoues au piano ou sur le clavier à l\u2019écran.'),
        levelCards(MOTIF_LEVELS, (L) => L.desc, (L) => {
          stopMidi();
          const stage = h('section', { class: 'card stack' });
          root.replaceChildren(header(), h('button', { class: 'back', type: 'button', onclick: home }, '← Niveaux'), stage);
          cleanupMidi = motifs(stage, app, L, home);
        }));
    } else if (mode === 'progressions') {
      root.append(h('p', { class: 'muted' }, 'Tu entends une suite d’accords dans une tonalité au hasard : reconnais la progression.'),
        levelCards(PROG_LEVELS, (L) => L.ids.map((id) => progById[id].name).join(' · '), (L) => progQuiz(L)),
        h('h2', { class: 'hand-title' }, 'Les progressions à connaître'),
        h('div', { class: 'stack' }, PROGRESSIONS.map((p) => h('details', { class: 'card' },
          h('summary', null, h('strong', null, p.name), h('span', { class: 'muted small' }, ` · en do : ${realize(p, KEYS[0]).map((c) => c.symbol).join(' – ')}`)),
          h('p', null, p.info),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => playProg(p, KEYS[0]) }, 'Écouter en do')))));
    } else {
      root.append(h('section', { class: 'card stack' },
        h('p', null, 'Degrés des gammes, notes des accords, harmonisation, II-V-I, armures et intervalles.'),
        h('div', { class: 'controls' }, h('label', { for: 'theme' }, 'Thème'),
          h('select', { id: 'theme', onchange: (e) => store.setSetting('theoryTheme', e.target.value) },
            Object.entries(THEMES).map(([k, v]) => h('option', { value: k, selected: (s.settings.theoryTheme || 'tout') === k }, v.label))))),
      levelCards(THEORY_LEVELS, () => 'Tonalités travaillées', (L) => theoryQuiz(L)));
    }
  }

  // ---------- Intervalles et accords ----------
  async function earQuiz(L) {
    await audio.unlock();
    const isInt = mode === 'intervalles';
    const dir = s.settings.direction;
    const ids = L.ids;
    let n = 0;
    let correct = 0;
    let answered = false;
    let q = null;
    const stage = h('section', { class: 'card stack center' });
    root.replaceChildren(header(), h('button', { class: 'back', type: 'button', onclick: home }, '← Niveaux'), stage);
    const itemKey = (id) => `${mode}:${id}${isInt ? `:${dir}` : ''}`;

    function makeQ() {
      const id = weightedPick(ids, (x) => store.itemWeight(itemKey(x)));
      if (isInt) {
        const iv = intervalById[id];
        const low = 52 + Math.floor(Math.random() * 14);
        return { id, a: dir === 'desc' ? low + iv.st : low, b: dir === 'desc' ? low : low + iv.st, label: iv.fr };
      }
      const r = 48 + Math.floor(Math.random() * 12);
      return { id, notes: chordSemis(id).map((x) => r + x), label: CHORDS[id].fr };
    }
    function play(arp = false) {
      const t = audio.getCtx().currentTime + 0.05;
      if (isInt) {
        if (dir === 'harm') audio.chord([q.a, q.b], t, 1.8);
        else { audio.tone(q.a, t, 1.1); audio.tone(q.b, t + 0.75, 1.4); }
      } else if (arp) q.notes.forEach((m, i) => audio.tone(m, t + i * 0.35, 1.6, 0.6));
      else audio.chord(q.notes, t, 2);
    }
    function answer(id, viaPiano) {
      if (answered) return;
      answered = true;
      const ok = id === q.id;
      if (ok) correct++;
      store.recordItem(itemKey(q.id), ok);
      stage.querySelectorAll('.opt').forEach((b) => {
        b.disabled = true;
        if (b.dataset.id === q.id) b.classList.add('right');
        else if (b.dataset.id === id) b.classList.add('wrong');
      });
      stage.append(h('p', { class: ok ? 'good' : 'bad' }, ok ? (viaPiano ? 'Bonne note !' : 'Juste !') : `C’était : ${q.label}.`),
        h('div', { class: 'row center' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => play() }, 'Réécouter'),
          h('button', { class: 'btn', type: 'button', onclick: next }, n >= SESSION ? 'Voir le résultat' : 'Suivant')));
    }
    function next() {
      if (n >= SESSION) return finish();
      n++;
      answered = false;
      q = makeQ();
      const names = ids.map((id) => [id, isInt ? intervalById[id].fr : CHORDS[id].fr]);
      stage.replaceChildren(
        h('div', { class: 'muted small' }, `Niveau ${L.n} · question ${n} / ${SESSION} · ${correct} juste${correct > 1 ? 's' : ''}`),
        h('div', { class: 'row center' },
          h('button', { class: 'btn big', type: 'button', onclick: () => play() }, 'Écouter'),
          isInt ? null : h('button', { class: 'btn ghost', type: 'button', onclick: () => play(true) }, 'Arpégé')),
        h('div', { class: 'opts' }, names.map(([id, label]) => h('button', { class: 'opt', type: 'button', 'data-id': id, onclick: () => answer(id, false) }, label))),
        isInt && dir !== 'harm' && midi.isOn() ? h('p', { class: 'muted small' }, 'Tu peux aussi répondre au piano : joue la 2e note.') : null);
      play();
    }
    stopMidi();
    if (isInt && dir !== 'harm') {
      cleanupMidi = midi.onNote((e) => {
        if (answered || e.note == null || !q || e.source !== 'midi') return;
        if (e.note % 12 === q.b % 12) answer(q.id, true);
        else if (e.note % 12 !== q.a % 12) {
          const st = ((((dir === 'desc' ? q.a - e.note : e.note - q.a) % 12) + 12) % 12) || 12;
          const iv = INTERVALS.find((i) => i.st === st);
          answer(iv ? iv.id : '__autre', true);
        }
      });
    }
    function finish() {
      stopMidi();
      const pct = correct * 10;
      store.setBest(bestKey(L.n, isInt ? `:${dir}` : ''), pct);
      const out = store.award('oreille', correct * 2 + (correct >= 8 ? 5 : 0), { activity: 'oreille', label: isInt ? `Intervalles ${DIRS[dir].toLowerCase()} · niveau ${L.n}` : `Accords · niveau ${L.n}`, score: pct, correct, total: SESSION });
      app.celebrate(out);
      results(stage, correct, out, () => earQuiz(L));
    }
    next();
  }

  // ---------- Progressions ----------
  function playProg(p, tonic, t0) {
    const t = t0 ?? audio.getCtx().currentTime + 0.05;
    const dur = 1.25;
    realize(p, tonic).forEach((c, i) => {
      const v = voice(c.rootPc, c.semis, 55);
      audio.tone(v.bass - 12 >= 33 ? v.bass - 12 : v.bass, t + i * dur, dur, 0.8);
      audio.chord(v.notes, t + i * dur, dur * 0.95, 0.6);
    });
  }
  async function progQuiz(L) {
    await audio.unlock();
    const ids = L.ids;
    let n = 0;
    let correct = 0;
    let q = null;
    let answered = false;
    const stage = h('section', { class: 'card stack center' });
    root.replaceChildren(header(), h('button', { class: 'back', type: 'button', onclick: home }, '← Niveaux'), stage);
    const play = () => playProg(progById[q.id], q.key);
    function next() {
      if (n >= SESSION) return finish();
      n++;
      answered = false;
      q = { id: weightedPick(ids, (x) => store.itemWeight(`prog:${x}`)), key: pick(KEYS) };
      stage.replaceChildren(
        h('div', { class: 'muted small' }, `Niveau ${L.n} · question ${n} / ${SESSION} · ${correct} juste${correct > 1 ? 's' : ''}`),
        h('button', { class: 'btn big', type: 'button', onclick: play }, 'Écouter'),
        h('div', { class: 'opts' }, ids.map((id) => h('button', { class: 'opt', type: 'button', 'data-id': id, onclick: () => answer(id) }, progById[id].name))));
      play();
    }
    function answer(id) {
      if (answered) return;
      answered = true;
      const p = progById[q.id];
      const ok = id === q.id;
      if (ok) correct++;
      store.recordItem(`prog:${q.id}`, ok);
      stage.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (b.dataset.id === q.id) b.classList.add('right'); else if (b.dataset.id === id) b.classList.add('wrong'); });
      stage.append(h('p', { class: ok ? 'good' : 'bad' }, ok ? 'Juste !' : `C’était : ${p.name}.`),
        h('p', null, `En ${nameFr(q.key)}${p.minor ? ' mineur' : ''} : `, h('strong', { class: 'hand' }, realize(p, q.key).map((c) => c.symbol).join(' – '))),
        h('p', { class: 'muted small' }, p.info),
        h('div', { class: 'row center' },
          h('button', { class: 'btn ghost', type: 'button', onclick: play }, 'Réécouter'),
          h('button', { class: 'btn', type: 'button', onclick: next }, n >= SESSION ? 'Voir le résultat' : 'Suivant')));
    }
    function finish() {
      const pct = correct * 10;
      store.setBest(bestKey(L.n), pct);
      const out = store.award('oreille', correct * 2 + (correct >= 8 ? 5 : 0), { activity: 'oreille', label: `Progressions · niveau ${L.n}`, score: pct, correct, total: SESSION });
      app.celebrate(out);
      results(stage, correct, out, () => progQuiz(L));
    }
    next();
  }

  // ---------- Théorie ----------
  function theoryQuiz(L) {
    const theme = s.settings.theoryTheme || 'tout';
    let n = 0;
    let correct = 0;
    const stage = h('section', { class: 'card stack' });
    root.replaceChildren(header(), h('button', { class: 'back', type: 'button', onclick: home }, '← Niveaux'), stage);
    function next() {
      if (n >= SESSION) return finish();
      n++;
      const q = makeQuestion(L.n, pick(THEMES[theme].types));
      let done = false;
      const opts = h('div', { class: 'opts col' });
      q.opts.forEach((o) => opts.append(h('button', {
        class: 'opt', type: 'button',
        onclick: (e) => {
          if (done) return;
          done = true;
          const ok = o === q.a;
          if (ok) correct++;
          store.recordItem(`theorie:${q.key}`, ok);
          opts.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (b.textContent === q.a) b.classList.add('right'); });
          if (!ok) e.currentTarget.classList.add('wrong');
          stage.append(h('p', { class: ok ? 'good' : 'bad' }, ok ? 'Juste !' : `Réponse : ${q.a}`),
            h('p', { class: 'muted' }, q.why),
            h('button', { class: 'btn', type: 'button', onclick: next }, n >= SESSION ? 'Voir le résultat' : 'Suivant'));
        },
      }, o)));
      stage.replaceChildren(h('div', { class: 'muted small' }, `Niveau ${L.n} · ${THEMES[theme].label} · question ${n} / ${SESSION}`), h('h2', { class: 'q' }, q.q), opts);
    }
    function finish() {
      const pct = correct * 10;
      store.setBest(bestKey(L.n), pct);
      const out = store.award('theorie', correct * 3 + (correct >= 8 ? 5 : 0), { activity: 'theorie', label: `Théorie · ${THEMES[theme].label} · niveau ${L.n}`, score: pct, correct, total: SESSION });
      app.celebrate(out);
      results(stage, correct, out, () => theoryQuiz(L));
    }
    next();
  }

  function results(stage, correct, out, again) {
    stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${SESSION}`),
      h('div', { class: 'xp-gain' }, `+${out.gained} XP`, out.capped ? h('span', { class: 'muted small' }, ' (plafond du jour)') : null),
      h('p', { class: 'muted' }, 'Les questions ratées reviendront plus souvent.'),
      h('div', { class: 'row center' },
        h('button', { class: 'btn ghost', type: 'button', onclick: home }, 'Niveaux'),
        h('button', { class: 'btn', type: 'button', onclick: again }, 'Encore une série')));
  }

  if (params.start) {
    if (mode === 'theorie') theoryQuiz(THEORY_LEVELS[0]);
    else if (mode === 'progressions') progQuiz(PROG_LEVELS[0]);
    else earQuiz((mode === 'accords' ? CHORD_LEVELS : INTERVAL_LEVELS)[0]);
  } else home();
  return stopMidi;
}
