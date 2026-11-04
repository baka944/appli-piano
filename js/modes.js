// Gammes (majeure, mineures, par tons, ton – demi-ton) et harmonisation des trois gammes avec leurs modes.
import { h } from './ui.js';
import * as store from './store.js';
import * as midi from './midi.js';
import * as audio from './audio.js';
import { screenKeyboard, chordCollector, mark } from './keyboard.js';
import { KEYS, nameFr, pc, FAMILIES, MODES, modeNotes, modeIntervals, harmonize, CHORDS, degreeLabel, voice, transpose, note, degName, ALTERE } from './music.js';

const PC = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const inputHint = () => h('p', { class: 'muted small' }, midi.isOn() ? 'Joue au piano, dans n’importe quelle octave.' : 'Piano non connecté : utilise le clavier à l’écran.');
const familySelect = (id, value, onchange) => h('select', { id, onchange }, Object.entries(FAMILIES).map(([k, f]) => h('option', { value: k, selected: k === value }, f.label)));
const keySelect = (id, value, onchange, label = 'majeur') => h('select', { id, onchange }, KEYS.map((k, i) => h('option', { value: i, selected: i === value }, `${nameFr(k)}${label ? ` ${label}` : ''}`)));

// ---------- Gammes ----------
// steps = lettre de chaque note (0 = fondamentale), pour bien écrire les altérations.
const SCALES = {
  majeure: { label: 'Gamme majeure', iv: [0, 2, 4, 5, 7, 9, 11], steps: [0, 1, 2, 3, 4, 5, 6], use: 'Les accords maj7, et la base de tous les modes.' },
  melodique: { label: 'Mineur mélodique', iv: [0, 2, 3, 5, 7, 9, 11], steps: [0, 1, 2, 3, 4, 5, 6], use: 'En jazz, la même à la montée et à la descente. Sur m(maj7) et m6.' },
  harmonique: { label: 'Mineur harmonique', iv: [0, 2, 3, 5, 7, 8, 11], steps: [0, 1, 2, 3, 4, 5, 6], use: 'La sensible en mineur : la seconde augmentée entre la ♭6 et la 7.' },
  tons: { label: 'Par tons', iv: [0, 2, 4, 6, 8, 10], steps: [0, 1, 2, 3, 4, 5], use: 'Six notes à un ton d’écart. Sur les accords 7♯5 (7 avec ♯11 et ♭13). Il n’en existe que 2 différentes.' },
  tondemi: { label: 'Ton – demi-ton', iv: [0, 2, 3, 5, 6, 8, 9, 11], steps: [0, 1, 2, 3, 4, 5, 5, 6], use: 'Huit notes, ton puis demi-ton. Sur les accords diminués (°7). Il n’en existe que 3 différentes.' },
};
const STEP_NAMES = (iv) => iv.slice(1).concat(12).map((x, i) => (x - iv[i] === 1 ? '½' : x - iv[i] === 2 ? 'T' : '1½'));
const ODD = (n) => Math.abs(n.a) > 1 || (n.a === 1 && (n.l === 2 || n.l === 6)) || (n.a === -1 && (n.l === 0 || n.l === 3)); // double altération, mi♯, si♯, do♭, fa♭
const plain = (n) => KEYS.find((k) => pc(k) === pc(n) && k.a === 0) || KEYS.find((k) => pc(k) === pc(n));
const spell = (tonic, sc) => sc.iv.map((x, k) => transpose(tonic, sc.steps[k], x));
function scaleNotes(tonic, sc) {
  if (sc.iv.length === 7) {
    // Gamme à 7 sons : on garde une lettre par note ; si l'écriture donne des doubles altérations
    // (sol♭ mineur), on prend la tonique enharmonique (fa♯ mineur).
    const cands = [0, 1, 2, 3, 4, 5, 6].map((l) => note(l, ((((pc(tonic) - [0, 2, 4, 5, 7, 9, 11][l]) % 12) + 18) % 12) - 6)).filter((n) => Math.abs(n.a) <= 1);
    const cost = (ns) => ns.reduce((a, n) => a + (Math.abs(n.a) > 1 ? 10 : Math.abs(n.a)), 0);
    const own = spell(tonic, sc);
    if (!own.some((n) => Math.abs(n.a) > 1)) return own;
    return cands.map((t) => spell(t, sc)).sort((a, b) => cost(a) - cost(b))[0];
  }
  // Gammes symétriques : une lettre peut revenir, on évite les doubles altérations et mi♯, si♯, do♭, fa♭.
  return spell(tonic, sc).map((n) => (ODD(n) ? plain(n) : n));
}
export function gammes(root, app) {
  const st = store.get().settings;
  let sk = SCALES[st.scaleKind] ? st.scaleKind : 'majeure';
  let keyIdx = st.modeKey ?? 0;
  let both = st.scaleBoth ?? true;
  let cleanup = () => {};
  const persist = () => { Object.assign(st, { scaleKind: sk, modeKey: keyIdx, scaleBoth: both }); store.save(); };

  function setup() {
    cleanup();
    const sc = SCALES[sk];
    const notes = scaleNotes(KEYS[keyIdx], sc);
    const tonic = notes[0];
    const seven = sc.iv.length === 7;
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Gammes'),
        h('p', { class: 'lead' }, 'Majeure, les deux mineures, et les deux gammes symétriques. Les modes et leurs notes cibles sont dans Harmonisation.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'sc-kind' }, 'Gamme'),
        h('select', { id: 'sc-kind', onchange: (e) => { sk = e.target.value; persist(); setup(); } }, Object.entries(SCALES).map(([k, x]) => h('option', { value: k, selected: k === sk }, x.label))),
        h('label', { for: 'sc-key' }, 'Tonalité'), keySelect('sc-key', keyIdx, (e) => { keyIdx = +e.target.value; persist(); setup(); }, ''),
        h('label', { class: 'check' }, h('input', { id: 'sc-both', type: 'checkbox', checked: both, onchange: (e) => { both = e.target.checked; persist(); } }), 'Montante puis descendante')),
      h('section', { class: 'card stack mode-card' },
        h('h2', { class: 'hand-title' }, `${nameFr(tonic)} · ${sc.label.toLowerCase()}`),
        h('div', { class: 'chips' }, notes.map((n, k) => h('span', { class: 'chip' }, nameFr(n), seven ? h('small', null, ` ${degName(k, sc.iv[k])}`) : null))),
        h('p', { class: 'muted small' }, `Écarts : ${STEP_NAMES(sc.iv).join(' – ')} (T = ton, ½ = demi-ton).`),
        h('p', { class: 'muted' }, sc.use),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; const base = 60 + pc(tonic) - (pc(tonic) > 6 ? 12 : 0); sc.iv.concat(12).forEach((x, i) => audio.tone(base + x, t + i * 0.3, 0.5, 0.8)); } }, 'Écouter'),
          h('button', { class: 'btn', type: 'button', onclick: run }, 'Jouer la gamme'))));
  }
  function run() {
    cleanup();
    const sc = SCALES[sk];
    const notes = scaleNotes(KEYS[keyIdx], sc);
    const tonic = notes[0];
    const up = [...notes, notes[0]];
    const seq = both ? [...up, ...up.slice(0, -1).reverse()] : up;
    let i = 0;
    let errors = 0;
    let miss = 0;
    const chips = h('div', { class: 'chips seq' }, seq.map((n, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, nameFr(n))));
    const msg = h('p', { 'aria-live': 'polite' }, `Commence par ${nameFr(seq[0])}.`);
    const kb = screenKeyboard({ low: 48, octaves: 2 });
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: setup }, '← Retour'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, `${nameFr(tonic)} · ${sc.label.toLowerCase()}`)),
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
      store.setBest(`gamme:${sk}:${keyIdx}`, score);
      const out = store.award('harmonie', 8 + (score >= 90 ? 4 : 0), { activity: 'gammes', label: `${nameFr(tonic)} · ${sc.label.toLowerCase()}`, score });
      app.celebrate(out);
      root.replaceChildren(h('section', { class: 'card stack center' }, h('div', { class: 'score' }, `${score} %`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
        h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: setup }, 'Autre gamme'), h('button', { class: 'btn', type: 'button', onclick: run }, 'Rejouer'))));
    }
  }
  setup();
  return () => cleanup();
}

// Fiche d'un mode : notes, notes cibles, note caractéristique, sensation.
function modeCard(tonic, fam, mi, chordType = null) {
  const m = MODES[fam][mi];
  const notes = modeNotes(tonic, fam, mi);
  const ivs = modeIntervals(fam, mi);
  const alt = m.name === 'Altéré';
  const lab = (k) => (alt ? ALTERE[k] : degName(k, ivs[k]));
  const ti = alt ? 3 : 2; // pour l'altéré, la tierce majeure est le 4e son (fa♭ = mi en do)
  const si = 6;
  return h('div', { class: 'stack mode-detail' },
    h('div', { class: 'row wrap' }, h('h3', { class: 'hand-title sm' }, `${nameFr(tonic)} ${m.name.toLowerCase()}`), h('span', { class: 'feel' }, m.feel)),
    h('div', { class: 'chips' }, notes.map((n, k) => h('span', { class: `chip${m.car.includes(ivs[k]) ? ' car' : ''}${k === ti || k === si ? ' guide' : ''}` }, nameFr(n), h('small', null, ` ${lab(k)}`)))),
    chordType && chordType !== m.chord ? h('p', { class: 'muted' }, `L’accord de la gamme est ${nameFr(tonic)} ${CHORDS[chordType].sym}, mais en jazz ce mode sert surtout sur ${nameFr(tonic)} ${m.name === 'Altéré' ? '7alt' : CHORDS[m.chord].sym} : c’est pour cet accord que sont données les notes cibles.`) : null,
    h('p', null, h('strong', null, 'Notes cibles : '), `la tierce (${nameFr(notes[ti])}${alt ? ', à entendre comme une tierce majeure' : ''}) et la septième (${nameFr(notes[si])}). Vise-les sur les temps forts.`),
    h('p', null, h('strong', null, 'Couleur : '), `${m.car.map((c) => nameFr(notes[ivs.indexOf(c)])).join(', ')} (${m.car.map((c) => lab(ivs.indexOf(c))).join(', ')}). ${m.txt}`),
    h('p', { class: 'muted small' }, 'Surlignée : la note caractéristique. Encadrées : tierce et septième.'),
    h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; const base = 60 + pc(tonic) - (pc(tonic) > 6 ? 12 : 0); audio.chord(CHORDS[m.chord].iv.map(([, x]) => base - 12 + x), t, 3.2, 0.4); ivs.concat(12).forEach((x, i) => audio.tone(base + x, t + 0.4 + i * 0.3, 0.5, 0.8)); } }, 'Écouter l’accord et le mode'));
}

// ---------- Harmonisation des trois gammes ----------
export function harmonisation(root, app) {
  const st = store.get().settings;
  let fam = st.harmFam || 'majeure';
  let keyIdx = st.harmKey ?? 0;
  let sel = 0;
  let cleanup = () => {};
  const persist = () => { Object.assign(st, { harmFam: fam, harmKey: keyIdx }); store.save(); };
  const tonicOf = () => scaleNotes(KEYS[keyIdx], SCALES[fam])[0];
  const label = () => `${nameFr(tonicOf())} ${fam === 'majeure' ? 'majeur' : fam === 'harmonique' ? 'mineur harmonique' : 'mineur mélodique'}`;
  function setup() {
    cleanup();
    const ch = harmonize(tonicOf(), fam);
    const detail = h('div', { 'aria-live': 'polite' });
    const show = (d) => {
      sel = d;
      list.querySelectorAll('button').forEach((b, k) => { b.classList.toggle('on', k === d); b.setAttribute('aria-pressed', k === d ? 'true' : 'false'); });
      detail.replaceChildren(modeCard(ch[d].root, fam, d, ch[d].type));
    };
    const list = h('div', { class: 'harmo-list' }, ch.map((c, d) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => show(d) },
      h('span', { class: 'muted small' }, degreeLabel(d)), h('strong', { class: 'hand' }, c.symbol), h('span', { class: 'muted small' }, MODES[fam][d].name), h('span', { class: 'feel sm' }, MODES[fam][d].feel))));
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Harmonisation'), h('p', { class: 'lead' }, 'Les 7 accords à 4 sons de la gamme, du Ier au VIIe degré, joués au piano.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'hm-fam' }, 'Gamme'), familySelect('hm-fam', fam, (e) => { fam = e.target.value; persist(); setup(); }),
        h('label', { for: 'hm-key' }, 'Tonalité'), keySelect('hm-key', keyIdx, (e) => { keyIdx = +e.target.value; persist(); setup(); }, ''),
        list,
        h('p', { class: 'muted small' }, `Touche un accord pour voir son mode, les notes cibles et la couleur. Référence : ${FAMILIES[fam].ref}. La sensation en un mot est un repère d’écoute courant, pas une règle : elle reste subjective.`),
        detail,
        h('button', { class: 'btn', type: 'button', onclick: run }, 'Jouer les 7 accords')));
    show(Math.min(sel, 6));
  }
  function run() {
    cleanup();
    const chords = harmonize(tonicOf(), fam);
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
