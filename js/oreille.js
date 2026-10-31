// Onglet Oreille et théorie : intervalles et accords à l'oreille, quiz de théorie.
import { h, toast, pick, weightedPick, shuffle } from './ui.js';
import * as audio from './audio.js';
import * as midi from './midi.js';
import * as store from './store.js';
import {
  INTERVALS, intervalById, INTERVAL_UNLOCKS, CHORDS, CHORD_UNLOCKS, chordSemis, unlockedFrom, nextUnlock,
} from './music.js';
import { makeQuestion } from './theorie.js';

const SESSION = 10;
const DIRS = { asc: 'Montants', desc: 'Descendants', harm: 'Harmoniques (ensemble)' };

export function render(el, app, params = {}) {
  const s = store.get();
  let mode = params.mode || 'intervalles';
  let cleanupMidi = null;
  const root = h('div', { class: 'stack' });
  el.append(root);

  function header() {
    const tabs = [['intervalles', 'Intervalles'], ['accords', 'Accords'], ['theorie', 'Théorie']];
    return h('div', { class: 'stack' },
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Oreille et théorie')),
      h('div', { class: 'seg', role: 'tablist' }, tabs.map(([id, label]) =>
        h('button', { type: 'button', role: 'tab', 'aria-selected': mode === id ? 'true' : 'false', class: mode === id ? 'on' : '', onclick: () => { mode = id; home(); } }, label))));
  }

  function home() {
    stopMidi();
    root.replaceChildren(header());
    if (mode === 'theorie') return theoryHome();
    const skill = store.skillLevel('oreille').level;
    const isInt = mode === 'intervalles';
    const table = isInt ? INTERVAL_UNLOCKS : CHORD_UNLOCKS;
    const ids = unlockedFrom(table, skill);
    const nxt = nextUnlock(table, skill);
    const name = (id) => (isInt ? intervalById[id].fr : CHORDS[id].fr);
    const box = h('section', { class: 'card stack' },
      h('h2', null, isInt ? 'Reconnaître les intervalles' : 'Reconnaître les accords'),
      h('p', null, isInt ? 'Tu entends deux notes : nomme l’écart entre elles.' : 'Tu entends un accord : trouve sa couleur.'),
      h('div', { class: 'chips' }, ids.map((id) => h('span', { class: 'chip' }, name(id)))),
      nxt ? h('p', { class: 'muted small' }, `Niveau ${nxt.level} d’oreille : ${nxt.items.map(name).join(', ')}`) : null);
    if (isInt) {
      box.append(h('div', { class: 'controls' },
        h('label', { for: 'dir' }, 'Sens'),
        h('select', { id: 'dir', onchange: (e) => store.setSetting('direction', e.target.value) },
          Object.entries(DIRS).map(([k, v]) => h('option', { value: k, selected: s.settings.direction === k }, v)))));
    }
    box.append(h('button', { class: 'btn', type: 'button', onclick: () => quiz(ids) }, `Commencer (${SESSION} questions)`));
    root.append(box);
  }

  function theoryHome() {
    const lvl = store.skillLevel('theorie').level;
    root.append(h('section', { class: 'card stack' },
      h('h2', null, 'Quiz de théorie'),
      h('p', null, 'Degrés des gammes, notes des accords, harmonisation, II-V-I, armures et intervalles. Les tonalités s’ajoutent avec ton niveau de théorie.'),
      h('p', { class: 'muted small' }, `Niveau ${lvl} de théorie.`),
      h('button', { class: 'btn', type: 'button', onclick: () => theoryQuiz() }, `Commencer (${SESSION} questions)`)));
  }

  function stopMidi() { if (cleanupMidi) cleanupMidi(); cleanupMidi = null; }

  // ---------- Oreille ----------
  async function quiz(ids) {
    await audio.unlock();
    const isInt = mode === 'intervalles';
    const dir = s.settings.direction;
    let n = 0;
    let correct = 0;
    let answered = false;
    let q = null;
    const stage = h('section', { class: 'card stack center' });
    root.replaceChildren(header(), stage);

    function makeQ() {
      const id = weightedPick(ids, (x) => store.itemWeight(`${mode}:${x}${isInt ? `:${dir}` : ''}`));
      if (isInt) {
        const iv = intervalById[id];
        const low = 52 + Math.floor(Math.random() * 14);
        const a = dir === 'desc' ? low + iv.st : low;
        const b = dir === 'desc' ? low : low + iv.st;
        return { id, a, b, label: iv.fr };
      }
      const rootNote = 48 + Math.floor(Math.random() * 12);
      return { id, notes: chordSemis(id).map((x) => rootNote + x), label: CHORDS[id].fr };
    }
    function play(arp = false) {
      const c = audio.getCtx();
      const t = c.currentTime + 0.05;
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
      store.recordItem(`${mode}:${q.id}${isInt ? `:${dir}` : ''}`, ok);
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
      const names = isInt ? ids.map((id) => [id, intervalById[id].fr]) : ids.map((id) => [id, CHORDS[id].fr]);
      stage.replaceChildren(
        h('div', { class: 'muted small' }, `Question ${n} / ${SESSION} · ${correct} juste${correct > 1 ? 's' : ''}`),
        h('div', { class: 'row center' },
          h('button', { class: 'btn big', type: 'button', onclick: () => play() }, 'Écouter'),
          isInt ? null : h('button', { class: 'btn ghost', type: 'button', onclick: () => play(true) }, 'Arpégé')),
        h('div', { class: 'opts' }, names.map(([id, label]) => h('button', { class: 'opt', type: 'button', 'data-id': id, onclick: () => answer(id, false) }, label))),
        isInt && dir !== 'harm' && midi.getStatus().status === 'on'
          ? h('p', { class: 'muted small' }, 'Tu peux aussi répondre au piano : joue la 2e note.') : null);
      play();
    }
    stopMidi();
    if (isInt && dir !== 'harm') {
      cleanupMidi = midi.onNote((e) => {
        if (answered || e.note == null || !q) return;
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
      const raw = correct * 2 + (correct >= 8 ? 5 : 0);
      const out = store.award('oreille', raw, { activity: 'oreille', label: isInt ? `Intervalles ${DIRS[dir].toLowerCase()}` : 'Accords', score: correct * 10, correct, total: SESSION });
      app.celebrate(out);
      stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${SESSION}`),
        h('div', { class: 'xp-gain' }, `+${out.gained} XP`, out.capped ? h('span', { class: 'muted small' }, ' (plafond du jour)') : null),
        h('p', { class: 'muted' }, 'Les questions ratées reviendront plus souvent.'),
        h('div', { class: 'row center' },
          h('button', { class: 'btn ghost', type: 'button', onclick: home }, 'Retour'),
          h('button', { class: 'btn', type: 'button', onclick: () => quiz(ids) }, 'Encore une série')));
    }
    next();
  }

  // ---------- Théorie ----------
  function theoryQuiz() {
    const lvl = store.skillLevel('theorie').level;
    let n = 0;
    let correct = 0;
    const stage = h('section', { class: 'card stack' });
    root.replaceChildren(header(), stage);
    function next() {
      if (n >= SESSION) return finish();
      n++;
      const q = makeQuestion(lvl);
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
      stage.replaceChildren(h('div', { class: 'muted small' }, `Question ${n} / ${SESSION}`), h('h2', { class: 'q' }, q.q), opts);
    }
    function finish() {
      const raw = correct * 3 + (correct >= 8 ? 5 : 0);
      const out = store.award('theorie', raw, { activity: 'theorie', label: 'Quiz de théorie', score: correct * 10, correct, total: SESSION });
      app.celebrate(out);
      stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${SESSION}`),
        h('div', { class: 'xp-gain' }, `+${out.gained} XP`, out.capped ? h('span', { class: 'muted small' }, ' (plafond du jour)') : null),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: home }, 'Retour'),
          h('button', { class: 'btn', type: 'button', onclick: theoryQuiz }, 'Encore une série')));
    }
    next();
  }

  if (params.start && mode !== 'theorie') {
    const skill = store.skillLevel('oreille').level;
    quiz(unlockedFrom(mode === 'intervalles' ? INTERVAL_UNLOCKS : CHORD_UNLOCKS, skill));
  } else if (params.start) theoryQuiz();
  else home();
  return stopMidi;
}
