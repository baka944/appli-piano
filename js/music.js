// Théorie musicale : notes orthographiées (lettre + altération), gammes, intervalles, accords.
// Tout est calculé, rien n'est saisi à la main : les réponses des quiz sont justes par construction.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const FR = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'];
const NAT = [0, 2, 4, 5, 7, 9, 11];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const ACC = { '-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪' };

export function note(l, a = 0) { return { l: ((l % 7) + 7) % 7, a }; }
export function pc(n) { return (((NAT[n.l] + n.a) % 12) + 12) % 12; }
export function nameFr(n) { return FR[n.l] + ACC[n.a]; }
export function nameEn(n) { return LETTERS[n.l] + ACC[n.a]; }
export function sameNote(a, b) { return a.l === b.l && a.a === b.a; }

function accFor(l, targetPc) {
  let d = (((targetPc - NAT[l]) % 12) + 12) % 12;
  if (d > 6) d -= 12;
  return d;
}

// Monte de `steps` lettres et de `semis` demi-tons.
export function transpose(n, steps, semis) {
  const l = (n.l + steps) % 7;
  return note(l, accFor(l, pc(n) + semis));
}

export function majorScale(tonic) {
  return MAJOR.map((s, i) => transpose(tonic, i, s));
}

// Tonalités majeures, de la plus simple à la plus chargée en altérations (ordre de déblocage).
export const KEYS = [
  note(0), note(3), note(4),          // do, fa, sol
  note(6, -1), note(1),               // si♭, ré
  note(2, -1), note(5),               // mi♭, la
  note(5, -1), note(2),               // la♭, mi
  note(1, -1), note(6), note(4, -1),  // ré♭, si, sol♭
];
export const KEY_UNLOCKS = [3, 5, 7, 9, 12]; // nombre de tonalités disponibles aux niveaux 1 à 5+

export const INTERVALS = [
  { id: '2m', fr: 'seconde mineure', st: 1, steps: 1 },
  { id: '2M', fr: 'seconde majeure', st: 2, steps: 1 },
  { id: '3m', fr: 'tierce mineure', st: 3, steps: 2 },
  { id: '3M', fr: 'tierce majeure', st: 4, steps: 2 },
  { id: '4J', fr: 'quarte juste', st: 5, steps: 3 },
  { id: '4+', fr: 'triton', st: 6, steps: 3 },
  { id: '5J', fr: 'quinte juste', st: 7, steps: 4 },
  { id: '6m', fr: 'sixte mineure', st: 8, steps: 5 },
  { id: '6M', fr: 'sixte majeure', st: 9, steps: 5 },
  { id: '7m', fr: 'septième mineure', st: 10, steps: 6 },
  { id: '7M', fr: 'septième majeure', st: 11, steps: 6 },
  { id: '8J', fr: 'octave', st: 12, steps: 7 },
];
export const intervalById = Object.fromEntries(INTERVALS.map((i) => [i.id, i]));
// Déblocage à l'oreille, des intervalles les plus repérables aux plus fins.
export const INTERVAL_UNLOCKS = [['3M', '4J', '5J', '8J'], ['3m', '6M'], ['2M', '2m'], ['7m', '6m'], ['7M', '4+']];

export const CHORDS = {
  maj: { sym: '', fr: 'majeur', iv: [[0, 0], [2, 4], [4, 7]], formula: 'fondamentale, tierce majeure, quinte juste' },
  min: { sym: 'm', fr: 'mineur', iv: [[0, 0], [2, 3], [4, 7]], formula: 'fondamentale, tierce mineure, quinte juste' },
  dom7: { sym: '7', fr: 'septième de dominante', iv: [[0, 0], [2, 4], [4, 7], [6, 10]], formula: 'tierce majeure, quinte juste, septième mineure' },
  maj7: { sym: 'maj7', fr: 'majeur 7', iv: [[0, 0], [2, 4], [4, 7], [6, 11]], formula: 'tierce majeure, quinte juste, septième majeure' },
  m7: { sym: 'm7', fr: 'mineur 7', iv: [[0, 0], [2, 3], [4, 7], [6, 10]], formula: 'tierce mineure, quinte juste, septième mineure' },
  m7b5: { sym: 'm7♭5', fr: 'demi-diminué', iv: [[0, 0], [2, 3], [4, 6], [6, 10]], formula: 'tierce mineure, quinte diminuée, septième mineure' },
  dim7: { sym: '°7', fr: 'diminué 7', iv: [[0, 0], [2, 3], [4, 6], [6, 9]], formula: 'tierce mineure, quinte diminuée, septième diminuée' },
  aug: { sym: '+', fr: 'augmenté', iv: [[0, 0], [2, 4], [4, 8]], formula: 'tierce majeure, quinte augmentée' },
  sus4: { sym: 'sus4', fr: 'sus4', iv: [[0, 0], [3, 5], [4, 7]], formula: 'quarte juste à la place de la tierce, quinte juste' },
};
export const CHORD_UNLOCKS = [['maj', 'min'], ['dom7', 'maj7'], ['m7'], ['m7b5', 'dim7'], ['aug', 'sus4']];

export function chordNotes(root, type) {
  return CHORDS[type].iv.map(([s, st]) => transpose(root, s, st));
}
export function chordSymbol(root, type) { return nameEn(root) + CHORDS[type].sym; }
export function chordSemis(type) { return CHORDS[type].iv.map(([, st]) => st); }

// Harmonisation de la gamme majeure à 4 sons.
export const DIATONIC = ['maj7', 'm7', 'm7', 'maj7', 'dom7', 'm7', 'm7b5'];
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export function degreeLabel(i) { return ROMAN[i] + (i === 0 ? 'er' : 'e'); }

export const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // fa do sol ré la mi si
export const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];  // si mi la ré sol do fa
export function keySignature(tonic) {
  const sc = majorScale(tonic);
  const altered = sc.filter((n) => n.a !== 0);
  const sharp = altered.some((n) => n.a > 0);
  const order = sharp ? SHARP_ORDER : FLAT_ORDER;
  const list = order.filter((l) => altered.some((n) => n.l === l)).map((l) => altered.find((n) => n.l === l));
  return { count: altered.length, sharp, list };
}

export function unlockedFrom(table, level) {
  const out = [];
  table.slice(0, Math.max(1, level)).forEach((g) => out.push(...g));
  return out;
}
export function nextUnlock(table, level) {
  return level < table.length ? { level: level + 1, items: table[level] } : null;
}

export function midiToFr(m) {
  const names = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
  return names[m % 12] + (Math.floor(m / 12) - 2); // convention française : do central = do3
}
