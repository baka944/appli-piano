// Gammes et modes (majeur, mineur harmonique, mineur mélodique) et harmonisation des trois gammes.
import { h } from './ui.js';
import * as store from './store.js';
import * as midi from './midi.js';
import * as audio from './audio.js';
import { screenKeyboard, chordCollector, mark } from './keyboard.js';
import { KEYS, nameFr, pc, FAMILIES, MODES, modeNotes, modeIntervals, harmonize, CHORDS, degreeLabel, voice } from './music.js';

const PC = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
// Nom du degré selon sa place dans la gamme (une 2de à 3 demi-tons = ♯2, pas ♭3).
const NAT = [0, 2, 4, 5, 7, 9, 11];
const ALT = { '-2': '♭♭', '-1': '♭', 0: '', 1: '♯', 2: '♯♯' };
const degName = (k, st) => { let d = st - NAT[k]; if (d > 6) d -= 12; if (d < -6) d += 12; return `${ALT[d] ?? ''}${k + 1}`; };
// Le mode altéré se nomme d'après l'accord 7alt qu'il sert : ♭9, ♯9, 3, ♯11, ♭13, ♭7.
const ALTERE = ['1', '♭9', '♯9', '3', '♯11', '♭13', '♭7'];
const inputHint = () => h('p', { class: 'muted small' }, midi.isOn() ? 'Joue au piano, dans n’importe quelle octave.' : 'Piano non connecté : utilise le clavier à l’écran.');
const familySelect = (id, value, onchange) => h('select', { id, onchange }, Object.entries(FAMILIES).map(([k, f]) => h('option', { value: k, selected: k === value }, f.label)));
const keySelect = (id, value, onchange, label = 'majeur') => h('select', { id, onchange }, KEYS.map((k, i) => h('option', { value: i, selected: i === value }, `${nameFr(k)}${label ? ` ${label}` : ''}`)));

// ---------- Gammes et modes ----------
export function gammes(root, app) {
  const st = store.get().settings;
  let fam = st.modeFam || 'majeure';
  let mi = st.modeIdx ?? 1;
  let keyIdx = st.modeKey ?? 0;
  let both = st.scaleBoth ?? true;
  let cleanup = () => {};
  const persist = () => { Object.assign(st, { modeFam: fam, modeIdx: mi, modeKey: keyIdx, scaleBoth: both }); store.save(); };

  function setup() {
    cleanup();
    const m = MODES[fam][mi];
    const tonic = KEYS[keyIdx];
    const notes = modeNotes(tonic, fam, mi);
    const ivs = modeIntervals(fam, mi);
    const alt = m.name === 'Altéré';
    const lab = (k) => (alt ? ALTERE[k] : degName(k, ivs[k]));
    // Tierce et septième de l'accord : pour l'altéré, la tierce majeure est le 4e son (fa♭ = mi en do).
    const ti = alt ? 3 : 2;
    const si = 6;
    const chordSym = nameFr(tonic) + ' ' + CHORDS[m.chord].sym;
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Gammes et modes'),
        h('p', { class: 'lead' }, 'Les modes de la gamme majeure et des deux gammes mineures, avec les notes à viser.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'md-fam' }, 'Famille'), familySelect('md-fam', fam, (e) => { fam = e.target.value; mi = 0; persist(); setup(); }),
        h('label', { for: 'md-mode' }, 'Mode'),
        h('select', { id: 'md-mode', onchange: (e) => { mi = +e.target.value; persist(); setup(); } }, MODES[fam].map((x, i) => h('option', { value: i, selected: i === mi }, `${degreeLabel(i)} degré · ${x.name}`))),
        h('label', { for: 'md-key' }, 'Fondamentale du mode'), keySelect('md-key', keyIdx, (e) => { keyIdx = +e.target.value; persist(); setup(); }, ''),
        h('label', { class: 'check' }, h('input', { id: 'md-both', type: 'checkbox', checked: both, onchange: (e) => { both = e.target.checked; persist(); } }), 'Montante puis descendante')),
      h('section', { class: 'card stack mode-card' },
        h('h2', { class: 'hand-title' }, `${nameFr(tonic)} ${m.name.toLowerCase()}`),
        h('div', { class: 'chips' }, notes.map((n, k) => h('span', { class: `chip${m.car.includes(ivs[k]) ? ' car' : ''}${k === ti || k === si ? ' guide' : ''}` }, nameFr(n), h('small', null, ` ${lab(k)}`)))),
        h('p', null, h('strong', null, 'Accord : '), `${chordSym} (${CHORDS[m.chord].fr}).`),
        h('p', null, h('strong', null, 'Notes cibles : '), `la tierce (${nameFr(notes[ti])}${alt ? ', à entendre comme une tierce majeure' : ''}) et la septième (${nameFr(notes[si])}) donnent l’accord ; vise-les sur les temps forts. `,
          `La note caractéristique, ${m.car.map((c) => nameFr(notes[ivs.indexOf(c)])).join(' et ')} (${m.car.map((c) => lab(ivs.indexOf(c))).join(', ')}), donne la couleur du mode.`),
        h('p', { class: 'muted' }, m.txt),
        h('p', { class: 'muted small' }, `En surligné : la note caractéristique ; encadrées : tierce et septième. Référence : ${FAMILIES[fam].ref}.`),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; const base = 60 + pc(tonic) - (pc(tonic) > 6 ? 12 : 0); ivs.concat(12).forEach((x, i) => audio.tone(base + x, t + i * 0.3, 0.5, 0.8)); } }, 'Écouter'),
          h('button', { class: 'btn', type: 'button', onclick: run }, 'Jouer le mode'))));
  }
  function run() {
    cleanup();
    const tonic = KEYS[keyIdx];
    const notes = modeNotes(tonic, fam, mi);
    const up = [...notes, notes[0]];
    const seq = both ? [...up, ...up.slice(0, -1).reverse()] : up;
    let i = 0;
    let errors = 0;
    let miss = 0;
    const chips = h('div', { class: 'chips seq' }, seq.map((n, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, nameFr(n))));
    const msg = h('p', { 'aria-live': 'polite' }, `Commence par ${nameFr(seq[0])}.`);
    const kb = screenKeyboard({ low: 48, octaves: 2 });
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: setup }, '← Retour'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, `${nameFr(tonic)} ${MODES[fam][mi].name.toLowerCase()}`)),
      h('section', { class: 'card stack' }, chips, msg, kb, inputHint()));
    const off = midi.onNote((e) => {
      if (e.note == null || i >= seq.length) return;
      if (e.note % 12 === pc(seq[i])) {
        chips.querySelector(`[data-k="${i}"]`).className = 'chip done';
        i++; miss = 0;
        if (i >= seq.length) return finish();
        chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
        msg.textContent = 'Bien.';
      } else { errors++; miss++; msg.textContent = miss >= 2 ? `Attendu : ${nameFr(seq[i])}.` : `Pas cette note (${PC[e.note % 12]}).`; }
    });
    cleanup = () => { off(); kb.destroy && kb.destroy(); };
    function finish() {
      cleanup();
      const score = Math.round((seq.length / (seq.length + errors)) * 100);
      store.setBest(`mode:${fam}:${mi}:${keyIdx}`, score);
      const out = store.award('harmonie', 8 + (score >= 90 ? 4 : 0), { activity: 'gammes', label: `${nameFr(tonic)} ${MODES[fam][mi].name.toLowerCase()}`, score });
      app.celebrate(out);
      root.replaceChildren(h('section', { class: 'card stack center' }, h('div', { class: 'score' }, `${score} %`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
        h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: setup }, 'Autre mode'), h('button', { class: 'btn', type: 'button', onclick: run }, 'Rejouer'))));
    }
  }
  setup();
  return () => cleanup();
}

// ---------- Harmonisation des trois gammes ----------
export function harmonisation(root, app) {
  const st = store.get().settings;
  let fam = st.harmFam || 'majeure';
  let keyIdx = st.harmKey ?? 0;
  let cleanup = () => {};
  const persist = () => { Object.assign(st, { harmFam: fam, harmKey: keyIdx }); store.save(); };
  const label = () => `${nameFr(KEYS[keyIdx])} ${fam === 'majeure' ? 'majeur' : fam === 'harmonique' ? 'mineur harmonique' : 'mineur mélodique'}`;
  function setup() {
    cleanup();
    const ch = harmonize(KEYS[keyIdx], fam);
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Harmonisation'), h('p', { class: 'lead' }, 'Les 7 accords à 4 sons de la gamme, du Ier au VIIe degré, joués au piano.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'hm-fam' }, 'Gamme'), familySelect('hm-fam', fam, (e) => { fam = e.target.value; persist(); setup(); }),
        h('label', { for: 'hm-key' }, 'Tonalité'), keySelect('hm-key', keyIdx, (e) => { keyIdx = +e.target.value; persist(); setup(); }, ''),
        h('div', { class: 'harmo-list' }, ch.map((c, d) => h('div', null, h('span', { class: 'muted small' }, degreeLabel(d)), h('strong', { class: 'hand' }, c.symbol), h('span', { class: 'muted small' }, MODES[fam][d].name)))),
        h('p', { class: 'muted small' }, `Sous chaque accord : le mode correspondant. Référence : ${FAMILIES[fam].ref}.`),
        h('button', { class: 'btn', type: 'button', onclick: run }, 'Commencer')));
  }
  function run() {
    cleanup();
    const chords = harmonize(KEYS[keyIdx], fam);
    let i = 0;
    let first = 0;
    let tried = false;
    const chips = h('div', { class: 'chips seq hand big' }, chords.map((c, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, c.symbol)));
    const msg = h('p', { 'aria-live': 'polite' }, `Joue ${chords[0].symbol}.`);
    const kb = screenKeyboard({ low: 48, octaves: 2 });
    const col = chordCollector((notes) => {
      const c = chords[i];
      const set = new Set(notes.map((m) => m % 12));
      const need = [...new Set(c.semis.map((x) => (c.rootPc + x) % 12))];
      const missing = need.filter((x) => !set.has(x));
      if (!missing.length) {
        if (!tried) first++;
        chips.querySelector(`[data-k="${i}"]`).className = 'chip done';
        mark(kb, [], 'hint');
        i++; tried = false;
        if (i >= chords.length) return finish();
        chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
        msg.textContent = `Bien. Maintenant ${chords[i].symbol}.`;
      } else { tried = true; msg.textContent = `Il manque : ${missing.map((x) => PC[x]).join(', ')}.`; }
    });
    cleanup = () => { col.destroy(); kb.destroy && kb.destroy(); };
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: setup }, '← Retour'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, label())),
      h('section', { class: 'card stack' }, chips, msg, kb,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => col.validate() }, 'Valider l’accord'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { tried = true; const v = voice(chords[i].rootPc, chords[i].semis, 52); mark(kb, v.notes, 'hint'); audio.unlock().then(() => audio.chord(v.notes, null, 1.4)); } }, 'Montrer et écouter')),
        inputHint()));
    function finish() {
      cleanup();
      const score = Math.round((first / chords.length) * 100);
      store.setBest(`harmo:${fam}:${keyIdx}`, score);
      const out = store.award('harmonie', 10 + (score >= 85 ? 5 : 0), { activity: 'harmonisation', label: `Harmonisation · ${label()}`, score });
      app.celebrate(out);
      root.replaceChildren(h('section', { class: 'card stack center' }, h('div', { class: 'score' }, `${score} %`), h('p', { class: 'muted' }, 'Accords trouvés du premier coup.'), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
        h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: setup }, 'Autre gamme'), h('button', { class: 'btn', type: 'button', onclick: run }, 'Rejouer'))));
    }
  }
  setup();
  return () => cleanup();
}
