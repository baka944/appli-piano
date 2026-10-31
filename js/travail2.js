// Travail au piano vérifié au MIDI : gammes, harmonisation, suites d'accords.
import { h, toast } from './ui.js';
import * as store from './store.js';
import * as midi from './midi.js';
import * as audio from './audio.js';
import { screenKeyboard, chordCollector, mark } from './keyboard.js';
import {
  KEYS, majorScale, nameFr, pc, DIATONIC, CHORDS, chordSymbol, degreeLabel, PROGRESSIONS, progById, realize, CIRCLE_FOURTHS,
  chordPcs, guideTones, voice,
} from './music.js';

const pcName = (p) => ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'][p];

function inputNote() {
  return midi.isOn()
    ? h('p', { class: 'muted small' }, 'Joue au piano. Le clavier à l’écran reste disponible.')
    : h('p', { class: 'muted small' }, 'Piano non connecté : utilise le clavier à l’écran, ou connecte le piano en haut à droite.');
}
function keySelect(id, value, onchange) {
  return h('select', { id, onchange }, KEYS.map((k, i) => h('option', { value: i, selected: i === value }, `${nameFr(k)} majeur`)));
}

// ---------- Gammes ----------
export function gammes(root, app, back) {
  const st = store.get().settings;
  let keyIdx = st.scaleKey ?? 0;
  let both = st.scaleBoth ?? true;
  let cleanup = () => {};
  function setup() {
    cleanup();
    root.replaceChildren(back(),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Gammes'),
        h('p', { class: 'lead' }, 'Joue la gamme note par note, dans n’importe quelle octave. L’appli vérifie chaque note.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'sc-key' }, 'Tonalité'), keySelect('sc-key', keyIdx, (e) => { keyIdx = +e.target.value; st.scaleKey = keyIdx; store.save(); }),
        h('label', { class: 'check' }, h('input', { id: 'sc-both', type: 'checkbox', checked: both, onchange: (e) => { both = e.target.checked; st.scaleBoth = both; store.save(); } }), 'Montante puis descendante'),
        h('button', { class: 'btn', type: 'button', onclick: run }, 'Commencer')));
  }
  function run() {
    cleanup();
    const sc = majorScale(KEYS[keyIdx]);
    const up = [...sc, sc[0]];
    const seq = both ? [...up, ...up.slice(0, -1).reverse()] : up;
    let i = 0;
    let errors = 0;
    let missOnSame = 0;
    const chips = h('div', { class: 'chips seq' }, seq.map((n, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, nameFr(n))));
    const msg = h('p', { class: 'muted', 'aria-live': 'polite' }, `Commence par ${nameFr(seq[0])}.`);
    const kb = screenKeyboard({ low: 48, octaves: 2 });
    root.replaceChildren(back(), h('div', { class: 'page-head' }, h('h1', { class: 'display' }, `Gamme de ${nameFr(KEYS[keyIdx])} majeur`)),
      h('section', { class: 'card stack' }, chips, msg, kb, inputNote()));
    const off = midi.onNote((e) => {
      if (e.note == null || i >= seq.length) return;
      if (e.note % 12 === pc(seq[i])) {
        chips.querySelector(`[data-k="${i}"]`).className = 'chip done';
        i++;
        missOnSame = 0;
        if (i >= seq.length) return finish();
        chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
        msg.textContent = 'Bien.';
      } else {
        errors++;
        missOnSame++;
        msg.textContent = missOnSame >= 2 ? `Attendu : ${nameFr(seq[i])}.` : `Pas cette note (${pcName(e.note % 12)}).`;
      }
    });
    cleanup = () => { off(); kb.destroy && kb.destroy(); };
    function finish() {
      cleanup();
      const score = Math.round((seq.length / (seq.length + errors)) * 100);
      store.setBest(`gamme:${keyIdx}`, score);
      const out = store.award('harmonie', 8 + (score >= 90 ? 4 : 0), { activity: 'gammes', label: `Gamme de ${nameFr(KEYS[keyIdx])} majeur`, score });
      app.celebrate(out);
      root.replaceChildren(back(), h('section', { class: 'card stack center' },
        h('div', { class: 'score' }, `${score} %`), h('p', null, errors ? `${errors} fausse${errors > 1 ? 's' : ''} note${errors > 1 ? 's' : ''}.` : 'Sans faute.'),
        h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
        h('div', { class: 'row center' },
          h('button', { class: 'btn ghost', type: 'button', onclick: setup }, 'Autre tonalité'),
          h('button', { class: 'btn', type: 'button', onclick: run }, 'Rejouer'))));
    }
  }
  setup();
  return () => cleanup();
}

// ---------- Exercice d'accords commun (harmonisation et suites) ----------
function chordDrill(root, app, back, { title, chords, label, strictAll, onDone }) {
  let i = 0;
  let firstTry = 0;
  let triedThis = false;
  const chips = h('div', { class: 'chips seq hand big' }, chords.map((c, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, c.symbol)));
  const msg = h('p', { 'aria-live': 'polite' }, `Joue ${chords[0].symbol}.`);
  const kb = screenKeyboard({ low: 48, octaves: 2 });
  const validateBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => col.validate() }, 'Valider l’accord');
  const hintBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => {
    const c = chords[i];
    const v = voice(c.rootPc, c.semis, 52);
    mark(kb, v.notes, 'hint');
    audio.unlock().then(() => audio.chord(v.notes, null, 1.4));
    triedThis = true;
  } }, 'Montrer et écouter');
  root.replaceChildren(back(), h('div', { class: 'page-head' }, h('h1', { class: 'display' }, title), h('p', { class: 'lead' }, label)),
    h('section', { class: 'card stack' }, chips, msg, kb, h('div', { class: 'row' }, validateBtn, hintBtn), inputNote(),
      h('p', { class: 'muted small' }, strictAll ? 'Toutes les notes de l’accord doivent y être, dans l’ordre et l’octave que tu veux.' : 'La tierce et la septième suffisent (voicing « shell ») ; la fondamentale et la quinte sont facultatives.')));
  const col = chordCollector((notes) => {
    const c = chords[i];
    const pcs = new Set(notes.map((m) => m % 12));
    const need = strictAll ? chordPcs(c.rootPc, c.semis) : (c.semis.length >= 4 ? guideTones(c.rootPc, c.semis) : chordPcs(c.rootPc, c.semis));
    const missing = need.filter((p) => !pcs.has(p));
    if (!missing.length) {
      if (!triedThis) firstTry++;
      chips.querySelector(`[data-k="${i}"]`).className = 'chip done';
      mark(kb, [], 'hint');
      i++;
      triedThis = false;
      if (i >= chords.length) return finish();
      chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
      msg.textContent = `Bien. Maintenant ${chords[i].symbol}.`;
    } else {
      triedThis = true;
      msg.textContent = `Il manque : ${missing.map(pcName).join(', ')}.`;
    }
  });
  function finish() {
    col.destroy();
    kb.destroy && kb.destroy();
    const score = Math.round((firstTry / chords.length) * 100);
    onDone(score);
  }
  return () => { col.destroy(); kb.destroy && kb.destroy(); };
}

// ---------- Harmonisation ----------
export function harmonisation(root, app, back) {
  const st = store.get().settings;
  let keyIdx = st.harmKey ?? 0;
  let cleanup = () => {};
  function setup() {
    cleanup();
    const sc = majorScale(KEYS[keyIdx]);
    root.replaceChildren(back(),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Harmonisation'),
        h('p', { class: 'lead' }, 'Joue les 7 accords à 4 sons de la gamme, du Ier au VIIe degré.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'hm-key' }, 'Tonalité'), keySelect('hm-key', keyIdx, (e) => { keyIdx = +e.target.value; st.harmKey = keyIdx; store.save(); setup(); }),
        h('p', { class: 'hand' }, sc.map((n, d) => `${degreeLabel(d)} ${chordSymbol(n, DIATONIC[d])}`).join(' · ')),
        h('button', { class: 'btn', type: 'button', onclick: run }, 'Commencer')));
  }
  function run() {
    cleanup();
    const sc = majorScale(KEYS[keyIdx]);
    const chords = sc.map((n, d) => ({ symbol: chordSymbol(n, DIATONIC[d]), rootPc: pc(n), semis: CHORDS[DIATONIC[d]].iv.map(([, s]) => s) }));
    cleanup = chordDrill(root, app, back, {
      title: `${nameFr(KEYS[keyIdx])} majeur harmonisé`, label: 'Accords à 4 sons, du Ier au VIIe degré.', chords, strictAll: true,
      onDone: (score) => {
        store.setBest(`harmo:${keyIdx}`, score);
        const out = store.award('harmonie', 10 + (score >= 85 ? 5 : 0), { activity: 'harmonisation', label: `Harmonisation de ${nameFr(KEYS[keyIdx])} majeur`, score });
        app.celebrate(out);
        done(score, out);
      },
    });
  }
  function done(score, out) {
    root.replaceChildren(back(), h('section', { class: 'card stack center' },
      h('div', { class: 'score' }, `${score} %`), h('p', { class: 'muted' }, 'Part des accords trouvés du premier coup.'),
      h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
      h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: setup }, 'Autre tonalité'), h('button', { class: 'btn', type: 'button', onclick: run }, 'Rejouer'))));
  }
  setup();
  return () => cleanup();
}

// ---------- Suites d'accords ----------
export function suites(root, app, back) {
  const st = store.get().settings;
  let progId = st.suiteProg || 'ii-v-i';
  let keyMode = st.suiteKeys || 'one';
  let keyIdx = st.suiteKey ?? 0;
  let cleanup = () => {};
  function setup() {
    cleanup();
    const p = progById[progId];
    root.replaceChildren(back(),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Suites d’accords'),
        h('p', { class: 'lead' }, 'Joue les grandes progressions au piano, dans une tonalité ou dans les 12.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'su-prog' }, 'Progression'),
        h('select', { id: 'su-prog', onchange: (e) => { progId = e.target.value; st.suiteProg = progId; store.save(); setup(); } }, PROGRESSIONS.map((x) => h('option', { value: x.id, selected: x.id === progId }, x.name))),
        h('p', { class: 'muted small' }, p.info),
        h('label', { for: 'su-keys' }, 'Tonalités'),
        h('select', { id: 'su-keys', onchange: (e) => { keyMode = e.target.value; st.suiteKeys = keyMode; store.save(); setup(); } },
          [['one', 'Une tonalité'], ['cycle', 'Les 12, par quartes (do, fa, si♭…)']].map(([v, l]) => h('option', { value: v, selected: keyMode === v }, l))),
        keyMode === 'one' ? keySelect('su-key', keyIdx, (e) => { keyIdx = +e.target.value; st.suiteKey = keyIdx; store.save(); setup(); }) : null,
        h('p', { class: 'hand' }, `En ${nameFr(keyMode === 'one' ? KEYS[keyIdx] : KEYS[0])}${p.minor ? ' mineur' : ''} : ${realize(p, keyMode === 'one' ? KEYS[keyIdx] : KEYS[0]).map((c) => c.symbol).join(' – ')}`),
        h('button', { class: 'btn', type: 'button', onclick: run }, 'Commencer')));
  }
  function run() {
    cleanup();
    const p = progById[progId];
    const keys = keyMode === 'one' ? [KEYS[keyIdx]] : CIRCLE_FOURTHS;
    const chords = keys.flatMap((k) => realize(p, k));
    cleanup = chordDrill(root, app, back, {
      title: p.name, label: keyMode === 'one' ? `En ${nameFr(keys[0])}${p.minor ? ' mineur' : ''}` : 'Dans les 12 tonalités, par quartes', chords, strictAll: false,
      onDone: (score) => {
        store.setBest(`suite:${progId}:${keyMode}`, score);
        const out = store.award('harmonie', Math.min(40, 6 + Math.round(chords.length * 0.8)) + (score >= 85 ? 5 : 0), { activity: 'suites', label: `${p.name} · ${keyMode === 'one' ? nameFr(keys[0]) : '12 tonalités'}`, score });
        app.celebrate(out);
        root.replaceChildren(back(), h('section', { class: 'card stack center' },
          h('div', { class: 'score' }, `${score} %`), h('p', { class: 'muted' }, 'Part des accords trouvés du premier coup.'),
          h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
          h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: setup }, 'Réglages'), h('button', { class: 'btn', type: 'button', onclick: run }, 'Rejouer'))));
      },
    });
  }
  setup();
  return () => cleanup();
}
