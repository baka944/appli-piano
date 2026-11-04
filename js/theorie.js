// Générateur de questions de théorie. Réponses calculées par js/music.js.
import {
  KEYS, KEY_UNLOCKS, INTERVALS, CHORDS, DIATONIC, FAMILIES, MODES, ROMAN, majorScale, nameFr, transpose, note, pc,
  chordNotes, chordSymbol, keySignature, degreeLabel, modeNotes, modeTargets,
} from './music.js';
import { pick, shuffle, weightedPick } from './ui.js';

const ORD = ['1er', '2e', '3e', '4e', '5e', '6e', '7e'];

export function unlockedKeys(level) { return KEYS.slice(0, KEY_UNLOCKS[Math.min(level, KEY_UNLOCKS.length) - 1]); }
function chordTypes(level) { return level >= 3 ? ['maj7', 'm7', 'dom7', 'm7b5'] : ['maj7', 'm7', 'dom7']; }
const keyName = (k) => nameFr(k);
const chordLabel = (root, type) => `${chordSymbol(root, type)} (sur ${nameFr(root)})`;

function options(correct, distractors) {
  const set = [correct];
  for (const d of shuffle(distractors)) { if (set.length >= 4) break; if (d && !set.includes(d)) set.push(d); }
  return shuffle(set);
}
function okAcc(n) { return Math.abs(n.a) <= 2; }

// ---------- Harmonisation de toutes les gammes ----------
// La mineure naturelle partage ses accords avec la majeure relative, décalés de deux degrés.
export const GAMMES = {
  majeure: { gamme: 'majeure', ton: 'majeur', iv: FAMILIES.majeure.iv },
  naturel: { gamme: 'mineure naturelle', ton: 'mineur naturel', iv: [0, 2, 3, 5, 7, 8, 10] },
  harmonique: { gamme: 'mineure harmonique', ton: 'mineur harmonique', iv: FAMILIES.harmonique.iv },
  melodique: { gamme: 'mineure mélodique', ton: 'mineur mélodique', iv: FAMILIES.melodique.iv },
};
const TRIADES = { '0,4,7': 'majeur', '0,3,7': 'mineur', '0,3,6': 'diminué', '0,4,8': 'augmenté' };
const TYPES_4 = ['maj7', 'm7', 'dom7', 'm7b5', 'dim7', 'mmaj7', 'maj7s5'];
const stack = (iv, d, n) => [0, 2, 4, 6].slice(0, n).map((k) => (iv[(d + k) % 7] - iv[d] + 12) % 12);
// Type de l'accord à 4 sons sur le degré d (0 = I), par empilement de tierces.
export function type4(g, d) {
  const st = stack(GAMMES[g].iv, d, 4).join();
  return TYPES_4.find((t) => CHORDS[t].iv.map(([, x]) => x).join() === st);
}
export function triade(g, d) { return TRIADES[stack(GAMMES[g].iv, d, 3).join()]; }
const typeLabel = (t) => `${CHORDS[t].sym} (${CHORDS[t].fr})`;
const rootOn = (tonic, g, d) => transpose(tonic, d, GAMMES[g].iv[d]);
export const seriesIn = (tonic, g) => GAMMES[g].iv.map((_, d) => chordSymbol(rootOn(tonic, g, d), type4(g, d)));
const seriesDo = (g) => `En do ${GAMMES[g].ton} : ${seriesIn(note(0), g).join(' – ')}.`;
const seriesTypes = (g) => GAMMES[g].iv.map((_, d) => `${ROMAN[d]} ${CHORDS[type4(g, d)].sym || '7'}`).join(' · ');
// Tonalités autorisées où la gamme s'écrit sans double altération.
function keysFor(level, iv) {
  const ks = unlockedKeys(level).filter((k) => iv.every((s, i) => Math.abs(transpose(k, i, s).a) <= 1));
  return ks.length ? ks : [note(0)];
}
const gammeKeys = Object.keys(GAMMES);
const romanList = (ds) => {
  const r = ds.map((d) => ROMAN[d]);
  return r.length > 1 ? `${r.slice(0, -1).join(', ')} et ${r[r.length - 1]}` : r[0];
};
function subsets(size, avoid) {
  const out = [];
  for (let n = 0; n < 24; n++) {
    const s = shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, size).sort((a, b) => a - b).join();
    if (s !== avoid && !out.includes(s)) out.push(s);
  }
  return out.map((s) => s.split(',').map(Number));
}

// Gammes symétriques : tout accord empilé a le même type, on questionne donc directement.
const SYM = [
  { key: 'tons-3', q: 'Gamme par tons : quel accord à 3 sons sur chacun de ses degrés ?', a: 'Augmenté', wrong: ['Majeur', 'Mineur', 'Diminué'], why: 'En empilant une note sur deux : do mi sol♯, ré fa♯ si♭… Toujours deux tierces majeures.' },
  { key: 'tons-7', q: 'Sur quel accord à 4 sons utilise-t-on la gamme par tons ?', a: '7♯5', wrong: ['maj7', 'm7', '°7'], why: 'Do7♯5 (do mi sol♯ si♭) est entièrement dans la gamme par tons de do. Elle sonne aussi la ♯11 et la 9e.' },
  { key: 'tons-nb', q: 'Combien de gammes par tons différentes existe-t-il ?', a: '2', wrong: ['3', '6', '12'], why: 'Six notes à un ton d’écart : au bout de deux gammes, on retombe sur les mêmes notes.' },
  { key: 'tons-notes', q: 'Combien de notes compte une gamme par tons ?', a: '6', wrong: ['5', '7', '8'], why: 'Do ré mi fa♯ sol♯ si♭.' },
  { key: 'td-4', q: 'Gamme ton – demi-ton : quel accord à 4 sons sur chacun de ses degrés ?', a: '°7 (diminué 7)', wrong: ['m7♭5 (demi-diminué)', 'm7 (mineur 7)', '7 (septième de dominante)'], why: 'En empilant une note sur deux : do mi♭ sol♭ la, ré fa la♭ si, et ainsi de suite.' },
  { key: 'td-nb-dim', q: 'Combien d’accords °7 différents contient une gamme ton – demi-ton ?', a: '2', wrong: ['1', '3', '4'], why: 'En do : C°7 (do mi♭ sol♭ la) et D°7 (ré fa la♭ si), soit ses 8 notes.' },
  { key: 'td-nb', q: 'Combien de gammes ton – demi-ton différentes existe-t-il ?', a: '3', wrong: ['2', '4', '12'], why: 'La même gamme revient toutes les tierces mineures : do, ré♭ et ré suffisent.' },
  { key: 'td-notes', q: 'Combien de notes compte une gamme ton – demi-ton ?', a: '8', wrong: ['6', '7', '9'], why: 'Do ré mi♭ fa sol♭ la♭ la si.' },
  { key: 'td-dom', q: 'Quels accords de dominante contient la gamme ton – demi-ton de do ?', a: 'D7, F7, A♭7, B7', wrong: ['C7, E♭7, G♭7, A7', 'C7, E7, G7, B♭7', 'D7, G7, C7, F7'], why: 'Ils sont un ton au-dessus de chaque note de C°7. C’est pourquoi on dit « demi-ton – ton » en partant de la dominante.' },
  { key: 'dt-dom', q: 'Gamme demi-ton – ton de do : sur quel accord la joue-t-on ?', a: 'C7 (avec ♭9, ♯9, ♯11, 13)', wrong: ['Cmaj7', 'Cm7', 'C°7'], why: 'Do ré♭ mi♭ mi fa♯ sol la si♭ : 1, ♭9, ♯9, 3, ♯11, 5, 13, ♭7.' },
];

// ---------- Modes ----------
const FAMS = Object.keys(MODES);
const ALL_MODES = FAMS.flatMap((f) => MODES[f].map((m, i) => ({ f, i, name: m.name })));
// Le 1er degré des mineures porte le nom de la gamme : la question se répondrait elle-même.
const NAMED_MODES = ALL_MODES.filter((x) => x.i > 0 || x.f === 'majeure');
const modeOrigin = (x) => `${ORD[x.i]} degré de la gamme ${GAMMES[x.f].gamme}`;
const modeColor = (x) => modeTargets(note(0), x.f, x.i).colorLabels.join(', ');
const keyAt = (st) => KEYS.find((k) => pc(k) === ((st % 12) + 12) % 12);
// Tire une tonalité mère puis le mode posé sur son degré : les notes gardent l'écriture de la gamme.
function modeIn(level, x = pick(ALL_MODES)) {
  const iv = FAMILIES[x.f].iv;
  const parent = pick(keysFor(level, iv));
  const root = transpose(parent, x.i, iv[x.i]);
  return { ...x, iv, parent, root, label: `${nameFr(root)} ${x.name.toLowerCase()}` };
}
const LINK = (ns) => (ns.length > 1 ? `${ns.slice(0, -1).join(', ')} et ${ns[ns.length - 1]}` : ns[0]);

const MAKERS = {
  degre(level) {
    const k = pick(unlockedKeys(level));
    const sc = majorScale(k);
    const d = 1 + Math.floor(Math.random() * 6);
    const n = sc[d];
    const distract = [note(n.l, n.a + 1), note(n.l, n.a - 1), sc[(d + 1) % 7], sc[d - 1]].filter(okAcc).map(nameFr);
    return {
      key: `degre:${keyName(k)}:${d}`,
      q: `Quel est le ${ORD[d]} degré de la gamme de ${keyName(k)} majeur ?`,
      a: nameFr(n), opts: options(nameFr(n), distract),
      why: `Gamme de ${keyName(k)} majeur : ${sc.map(nameFr).join(' – ')}.`,
    };
  },
  accord(level) {
    const root = pick(unlockedKeys(level));
    const type = pick(chordTypes(level));
    const ns = chordNotes(root, type);
    const show = (arr) => arr.map(nameFr).join(' – ');
    const variants = [];
    [1, 2, 3].forEach((i) => {
      if (!ns[i]) return;
      [1, -1].forEach((dir) => {
        const v = ns.slice();
        v[i] = note(ns[i].l, ns[i].a + dir);
        if (Math.abs(v[i].a) <= 1) variants.push(show(v));
      });
    });
    return {
      key: `accord:${type}`,
      q: `Quelles notes forment l’accord ${chordLabel(root, type)} ?`,
      a: show(ns), opts: options(show(ns), variants),
      why: `${chordSymbol(root, type)} est un accord ${CHORDS[type].fr} : ${CHORDS[type].formula}.`,
    };
  },
  diatonique(level) {
    const k = pick(unlockedKeys(level));
    const sc = majorScale(k);
    const d = pick([1, 4, 0, 5, 3, 1, 4, 6, 2]);
    const correct = chordSymbol(sc[d], DIATONIC[d]);
    const distract = ['maj7', 'm7', 'dom7', 'm7b5'].filter((t) => t !== DIATONIC[d]).map((t) => chordSymbol(sc[d], t));
    return {
      key: `diatonique:${d}`,
      q: `En harmonisant la gamme de ${keyName(k)} majeur à 4 sons, quel accord trouve-t-on sur le ${degreeLabel(d)} degré ?`,
      a: correct, opts: options(correct, distract),
      why: `En ${keyName(k)} majeur : ${sc.map((n, i) => chordSymbol(n, DIATONIC[i])).join(' – ')}.`,
    };
  },
  iivi(level) {
    const k = pick(unlockedKeys(level));
    const sc = majorScale(k);
    const which = pick([1, 4]);
    const correct = chordSymbol(sc[which], DIATONIC[which]);
    const distract = [0, 1, 3, 4, 5].filter((i) => i !== which).map((i) => chordSymbol(sc[i], DIATONIC[i]));
    distract.push(chordSymbol(sc[which], which === 1 ? 'dom7' : 'maj7'));
    return {
      key: `iivi:${which}`,
      q: `Dans un II-V-I en ${keyName(k)} majeur, quel est l’accord du ${degreeLabel(which)} degré ?`,
      a: correct, opts: options(correct, distract),
      why: `II-V-I en ${keyName(k)} majeur : ${chordSymbol(sc[1], 'm7')} – ${chordSymbol(sc[4], 'dom7')} – ${chordSymbol(sc[0], 'maj7')}.`,
    };
  },
  armure(level) {
    const k = pick(unlockedKeys(level));
    const sig = keySignature(k);
    const txt = (n, sharp) => (n === 0 ? 'Aucune altération' : `${n} ${sharp ? 'dièse' : 'bémol'}${n > 1 ? 's' : ''}`);
    const correct = txt(sig.count, sig.sharp);
    const distract = [txt(sig.count + 1, sig.sharp), sig.count > 1 ? txt(sig.count - 1, sig.sharp) : null, sig.count ? txt(sig.count, !sig.sharp) : txt(1, true), sig.count ? 'Aucune altération' : txt(1, false)];
    return {
      key: `armure:${keyName(k)}`,
      q: `Combien d’altérations à la clé en ${keyName(k)} majeur ?`,
      a: correct, opts: options(correct, distract),
      why: sig.count ? `${correct} : ${sig.list.map(nameFr).join(', ')}.` : 'Do majeur n’a aucune altération.',
    };
  },
  intervalle(level) {
    const pool = INTERVALS.filter((i) => i.id !== '8J' && (level >= 3 || !['2m', '4+', '7M'].includes(i.id)));
    let root;
    let iv;
    let top;
    let guard = 0;
    do {
      root = pick(unlockedKeys(level));
      iv = pick(pool);
      top = transpose(root, iv.steps, iv.st);
      guard++;
    } while (Math.abs(top.a) > 1 && guard < 20);
    const same = INTERVALS.filter((i) => i.steps === iv.steps && i.id !== iv.id).map((i) => i.fr);
    const near = INTERVALS.filter((i) => Math.abs(i.st - iv.st) <= 2 && i.id !== iv.id).map((i) => i.fr);
    return {
      key: `intervalle:${iv.id}`,
      q: `Quel intervalle entre ${nameFr(root)} et ${nameFr(top)}, en montant ?`,
      a: iv.fr, opts: options(iv.fr, [...same, ...near]),
      why: `De ${nameFr(root)} à ${nameFr(top)} : ${iv.st} demi-ton${iv.st > 1 ? 's' : ''}, ${iv.steps + 1} noms de notes → ${iv.fr}.`,
    };
  },
  // Harmonisation : « quel type d'accord sur le degré III ? »
  harmo_type() {
    const g = pick(gammeKeys);
    const d = Math.floor(Math.random() * 7);
    const t = type4(g, d);
    return {
      key: `harmo:${g}:${d}:4`,
      q: `Gamme ${GAMMES[g].gamme} harmonisée à 4 sons : quel type d’accord sur le degré ${ROMAN[d]} ?`,
      a: typeLabel(t), opts: options(typeLabel(t), TYPES_4.map(typeLabel)),
      why: seriesDo(g),
    };
  },
  harmo_triade() {
    const g = pick(gammeKeys);
    const d = Math.floor(Math.random() * 7);
    const t = triade(g, d);
    return {
      key: `harmo:${g}:${d}:3`,
      q: `Gamme ${GAMMES[g].gamme} harmonisée à 3 sons : quel type d’accord sur le degré ${ROMAN[d]} ?`,
      a: t, opts: options(t, Object.values(TRIADES)),
      why: `Degrés I à VII : ${GAMMES[g].iv.map((_, i) => triade(g, i)).join(', ')}.`,
    };
  },
  harmo_accord(level) {
    const g = pick(gammeKeys);
    const d = Math.floor(Math.random() * 7);
    const k = pick(keysFor(level, GAMMES[g].iv));
    const root = rootOn(k, g, d);
    const t = type4(g, d);
    const correct = chordSymbol(root, t);
    return {
      key: `harmo:${g}:${d}:4`,
      q: `En ${nameFr(k)} ${GAMMES[g].ton}, quel accord à 4 sons sur le degré ${ROMAN[d]} ?`,
      a: correct, opts: options(correct, TYPES_4.map((x) => chordSymbol(root, x))),
      why: `En ${nameFr(k)} ${GAMMES[g].ton} : ${seriesIn(k, g).join(' – ')}.`,
    };
  },
  harmo_degres() {
    const g = pick(gammeKeys);
    const degs = (t) => GAMMES[g].iv.map((_, d) => d).filter((d) => type4(g, d) === t);
    const present = TYPES_4.filter((t) => degs(t).length);
    const t = pick(present);
    const ds = degs(t);
    const correct = romanList(ds);
    return {
      key: `harmo-deg:${g}:${t}`,
      q: `Gamme ${GAMMES[g].gamme} harmonisée à 4 sons : sur quel(s) degré(s) trouve-t-on ${typeLabel(t)} ?`,
      a: correct, opts: options(correct, subsets(ds.length, ds.join()).map(romanList)),
      why: `${seriesTypes(g)}.`,
    };
  },
  harmo_sym() {
    const s = pick(SYM);
    return { key: `harmo-sym:${s.key}`, q: s.q, a: s.a, opts: options(s.a, s.wrong), why: s.why };
  },
  // Modes : « tel mode, tel degré de telle gamme »
  mode_origine() {
    const x = pick(NAMED_MODES);
    const correct = modeOrigin(x);
    const others = [...MODES[x.f].map((_, i) => ({ f: x.f, i })), ...FAMS.map((f) => ({ f, i: x.i }))];
    return {
      key: `mode-origine:${x.f}:${x.i}`,
      q: `Le mode ${x.name} : quel degré de quelle gamme ?`,
      a: correct, opts: options(correct, others.map(modeOrigin)),
      why: `${x.name} : ${MODES[x.f][x.i].txt}`,
    };
  },
  mode_nom() {
    const x = pick(NAMED_MODES);
    return {
      key: `mode-origine:${x.f}:${x.i}`,
      q: `Quel mode trouve-t-on sur le ${ORD[x.i]} degré de la gamme ${GAMMES[x.f].gamme} ?`,
      a: x.name, opts: options(x.name, [...MODES[x.f].map((m) => m.name), ...FAMS.map((f) => MODES[f][x.i].name)]),
      why: `Degrés I à VII : ${MODES[x.f].map((m) => m.name).join(', ')}.`,
    };
  },
  mode_parent(level) {
    const y = modeIn(level, pick(NAMED_MODES));
    const lab = (k) => `${nameFr(k)} ${GAMMES[y.f].ton}`;
    const correct = lab(y.parent);
    const others = y.iv.map((st) => keyAt(pc(y.root) - st)).filter(Boolean).map(lab);
    return {
      key: `mode-origine:${y.f}:${y.i}`,
      q: `${y.label[0].toUpperCase()}${y.label.slice(1)} : de quelle gamme vient-il ?`,
      a: correct, opts: options(correct, others),
      why: `${y.name} = ${ORD[y.i]} degré de la gamme ${GAMMES[y.f].gamme}. Notes : ${modeNotes(y.root, y.f, y.i).map(nameFr).join(' ')}.`,
    };
  },
  // Modes : les notes à faire sonner
  mode_couleur() {
    const x = pick(ALL_MODES);
    const correct = modeColor(x);
    return {
      key: `mode-couleur:${x.f}:${x.i}`,
      q: `Mode ${x.name} : quelle note fait entendre sa couleur ?`,
      a: correct, opts: options(correct, ALL_MODES.map(modeColor)),
      why: MODES[x.f][x.i].txt,
    };
  },
  mode_couleur_note(level) {
    const y = modeIn(level);
    const t = modeTargets(y.root, y.f, y.i);
    const correct = LINK(t.colorNotes.map(nameFr));
    const rest = t.notes.filter((n) => !t.colorNotes.includes(n)).map(nameFr);
    const distract = t.colorNotes.length === 1 ? rest : Array.from({ length: 12 }, () => LINK(shuffle(t.notes.map(nameFr)).slice(0, t.colorNotes.length)));
    return {
      key: `mode-couleur:${y.f}:${y.i}`,
      q: `En ${y.label}, quelle note fait entendre la couleur du mode ?`,
      a: correct, opts: options(correct, distract),
      why: `${correct} (${t.colorLabels.join(', ')}). ${t.m.txt}`,
    };
  },
  mode_cibles(level) {
    const y = modeIn(level);
    const t = modeTargets(y.root, y.f, y.i);
    const fr = t.notes.map(nameFr);
    const correct = `${nameFr(t.third)} et ${nameFr(t.seventh)}`;
    const pair = (a, b) => `${fr[a]} et ${fr[b]}`;
    return {
      key: `mode-cibles:${y.f}:${y.i}`,
      q: `En ${y.label}, sur ${t.chord} : quelles notes viser sur les temps forts ?`,
      a: correct, opts: options(correct, [pair(0, 4), pair(2, 4), pair(1, 5), pair(3, 6), pair(0, 6), pair(2, 5)]),
      why: `Tierce : ${nameFr(t.third)}${t.alt ? ' (à entendre comme une tierce majeure)' : ''}. Septième : ${nameFr(t.seventh)}.`,
    };
  },
};

export const TYPES = Object.keys(MAKERS);
export function makeQuestion(level, type) {
  return MAKERS[type || pick(TYPES)](level);
}

export const THEMES = {
  tout: { label: 'Tout mélangé', types: TYPES },
  gammes: { label: 'Gammes et armures', types: ['degre', 'armure'] },
  accords: { label: 'Accords et II-V-I', types: ['accord', 'diatonique', 'iivi'] },
  harmonisation: { label: 'Harmonisation de toutes les gammes', types: ['harmo_type', 'harmo_type', 'harmo_triade', 'harmo_accord', 'harmo_degres', 'harmo_sym'] },
  modes: { label: 'Modes', types: ['mode_origine', 'mode_nom', 'mode_parent', 'mode_couleur', 'mode_couleur_note', 'mode_cibles'] },
  intervalles: { label: 'Intervalles', types: ['intervalle'] },
};

// Évite les questions déjà posées dans la série et ramène plus souvent celles qui ont été ratées.
export function nextQuestion(level, types, seen, weightOf) {
  const cands = [];
  for (let n = 0; n < 12 && cands.length < 4; n++) {
    const q = makeQuestion(level, pick(types));
    if (!seen.has(q.q) && !cands.some((c) => c.q === q.q)) cands.push(q);
  }
  const q = cands.length ? weightedPick(cands, (c) => weightOf(c.key)) : makeQuestion(level, pick(types));
  seen.add(q.q);
  return q;
}

// ---------- Cartes à retourner ----------
export function theoryCards(theme) {
  const cards = [];
  const add = (id, front, back, from) => cards.push({ id, front, back, from });
  if (theme === 'harmonisation') {
    gammeKeys.forEach((g) => {
      const G = GAMMES[g];
      const from = 'Harmonisation';
      add(`h:${g}:serie`, `Harmonise la gamme ${G.gamme} à 4 sons`, seriesTypes(g), from);
      G.iv.forEach((_, d) => {
        const t = type4(g, d);
        add(`h:${g}:${d}:4`, `Gamme ${G.gamme}, degré ${ROMAN[d]} : quel accord à 4 sons ?`, `${typeLabel(t)} · en do : ${chordSymbol(rootOn(note(0), g, d), t)}`, from);
        add(`h:${g}:${d}:3`, `Gamme ${G.gamme}, degré ${ROMAN[d]} : quel accord à 3 sons ?`, triade(g, d), from);
      });
    });
    SYM.forEach((s) => add(`h:sym:${s.key}`, s.q, `${s.a}. ${s.why}`, 'Gammes symétriques'));
  } else if (theme === 'modes') {
    ALL_MODES.forEach((x) => {
      const y = modeIn(3, x);
      const t = modeTargets(y.root, y.f, y.i);
      if (x.i > 0 || x.f === 'majeure') {
        add(`m:${x.f}:${x.i}:origine`, `Le mode ${x.name} : quel degré de quelle gamme ?`, modeOrigin(x), 'Modes');
        add(`m:${x.f}:${x.i}:nom`, `Quel mode sur le ${ORD[x.i]} degré de la gamme ${GAMMES[x.f].gamme} ?`, x.name, 'Modes');
      }
      add(`m:${x.f}:${x.i}:couleur`, `Mode ${x.name} : quelle note fait entendre sa couleur ?`, `${modeColor(x)}. ${t.m.txt}`, 'Modes');
      add(`m:${x.f}:${x.i}:cibles`, `En ${y.label}, sur ${t.chord} : notes à viser ?`, `${nameFr(t.third)}${t.alt ? ' (tierce majeure)' : ''} et ${nameFr(t.seventh)}`, 'Modes');
    });
  }
  return cards;
}
