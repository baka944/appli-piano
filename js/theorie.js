// Générateur de questions de théorie. Réponses calculées par js/music.js.
import {
  KEYS, KEY_UNLOCKS, INTERVALS, CHORDS, DIATONIC, majorScale, nameFr, transpose, note,
  chordNotes, chordSymbol, keySignature, degreeLabel,
} from './music.js';
import { pick, shuffle } from './ui.js';

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
};

export const TYPES = Object.keys(MAKERS);
export function makeQuestion(level, type) {
  return MAKERS[type || pick(TYPES)](level);
}
