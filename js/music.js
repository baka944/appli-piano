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

// ---------- Grilles d'accords saisies à la main ----------
const QUALITY = [
  [/^(maj7|ma7|M7|Δ7?|maj)$/, [0, 4, 7, 11], 'maj7'],
  [/^(maj9|M9|Δ9)$/, [0, 4, 7, 11, 14], 'maj7'],
  [/^(6|M6|add6)$/, [0, 4, 7, 9], 'maj'],
  [/^(69|6\/9)$/, [0, 4, 7, 9, 14], 'maj'],
  [/^(m|-|min)$/, [0, 3, 7], 'min'],
  [/^(m6|-6|min6)$/, [0, 3, 7, 9], 'min'],
  [/^(m7|-7|min7|mi7)$/, [0, 3, 7, 10], 'm7'],
  [/^(m9|-9|min9)$/, [0, 3, 7, 10, 14], 'm7'],
  [/^(m11|-11)$/, [0, 3, 7, 10, 14, 17], 'm7'],
  [/^(mMaj7|mM7|m\(maj7\)|-Δ7?|mΔ7?)$/, [0, 3, 7, 11], 'min'],
  [/^(m7b5|m7♭5|-7b5|-7♭5|ø7?)$/, [0, 3, 6, 10], 'm7b5'],
  [/^(dim7|°7|o7)$/, [0, 3, 6, 9], 'dim7'],
  [/^(dim|°|o)$/, [0, 3, 6], 'dim7'],
  [/^(7)$/, [0, 4, 7, 10], 'dom7'],
  [/^(9)$/, [0, 4, 7, 10, 14], 'dom7'],
  [/^(13)$/, [0, 4, 10, 14, 21], 'dom7'],
  [/^(7b9|7♭9)$/, [0, 4, 7, 10, 13], 'dom7'],
  [/^(7#9|7♯9)$/, [0, 4, 7, 10, 15], 'dom7'],
  [/^(7#11|7♯11)$/, [0, 4, 7, 10, 18], 'dom7'],
  [/^(7#5|7♯5|7\+5|\+7|7aug|aug7)$/, [0, 4, 8, 10], 'dom7'],
  [/^(7b5|7♭5)$/, [0, 4, 6, 10], 'dom7'],
  [/^(7alt|alt)$/, [0, 4, 10, 13, 15], 'dom7'],
  [/^(\+|aug)$/, [0, 4, 8], 'aug'],
  [/^(sus4?|sus2)$/, [0, 5, 7], 'sus4'],
  [/^(7sus4?|9sus4?|sus7)$/, [0, 5, 7, 10], 'sus4'],
  [/^(m\d+)$/, [0, 3, 7, 10], 'm7'],
  [/^(7|9|11|13).+$/, [0, 4, 7, 10], 'dom7'],
  [/^(maj\d+.*)$/, [0, 4, 7, 11], 'maj7'],
  [/^$/, [0, 4, 7], 'maj'],
];
const ACC_IN = { '#': 1, '♯': 1, b: -1, '♭': -1 };

// "Fmaj7", "Bb7", "Em7b5", "C7/E" → { name, root (classe 0–11), semis, bass, ok }
export function parseChord(raw) {
  const s = String(raw).trim();
  const m = s.match(/^([A-G])([#♯b♭]?)([^/]*)(?:\/([A-G])([#♯b♭]?))?$/);
  if (!m) return null;
  const root = (NAT[LETTERS.indexOf(m[1])] + (ACC_IN[m[2]] || 0) + 12) % 12;
  // notations Real Book : « mi7 », « MA7 », extensions entre parenthèses « 7(#11b9) »
  const suf = m[3].replace(/[()]/g, '').replace(/^mi(?!n)/, 'm').replace(/^(MA|Ma|ma)(?=\d|$)/, 'maj');
  let semis = null;
  let family = 'maj';
  for (const [re, iv, fam] of QUALITY) if (re.test(suf)) { semis = iv; family = fam; break; }
  let ok = true;
  if (!semis) {
    ok = false;
    const minor = /^(m|-)/.test(suf) && !/^maj/.test(suf);
    semis = minor ? [0, 3, 7] : [0, 4, 7];
    if (/7/.test(suf)) semis = semis.concat(/maj|M|Δ/.test(suf) ? 11 : 10);
    family = minor ? 'm7' : 'dom7';
  }
  const bass = m[4] ? (NAT[LETTERS.indexOf(m[4])] + (ACC_IN[m[5]] || 0) + 12) % 12 : root;
  return { name: s, root, semis, bass, family, ok };
}

// Texte de grille → mesures. "|" sépare les mesures, l'espace les accords, "%" répète la mesure précédente.
export function parseGrid(text) {
  const lines = String(text || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const bars = [];
  const unknown = new Set();
  let meter = null;
  lines.forEach((line, li) => {
    // « [5/4] » en début de ligne change la mesure pour la suite de la grille
    const mm = line.match(/^\[(\d+)\/4\]\s*/);
    if (mm) { meter = +mm[1]; line = line.slice(mm[0].length); }
    line.split('|').map((b) => b.trim()).filter((b) => b.length).forEach((b) => {
      if (b === '%' && bars.length) { bars.push({ chords: bars[bars.length - 1].chords, line: li, repeat: true, meter }); return; }
      const chords = b.split(/\s+/).map((t) => {
        const c = parseChord(t);
        if (!c || !c.ok) unknown.add(t);
        return c;
      }).filter(Boolean);
      if (chords.length) bars.push({ chords, line: li, meter });
    });
  });
  return { bars, unknown: [...unknown] };
}

// ---------- Progressions courantes (degrés relatifs à la tonique) ----------
// d = degré (0 = I), alt = altération en demi-tons, q = qualité (clé de CHORDS)
export const PROGRESSIONS = [
  { id: 'ii-v-i', name: 'II – V – I', chords: [{ d: 1, q: 'm7' }, { d: 4, q: 'dom7' }, { d: 0, q: 'maj7' }], level: 1,
    info: 'La cadence centrale du jazz : le II prépare le V, qui se résout sur le I. Une grande partie des standards s’enchaîne en II-V.', },
  { id: 'i-iv-v-i', name: 'I – IV – V – I', chords: [{ d: 0, q: 'maj' }, { d: 3, q: 'maj' }, { d: 4, q: 'maj' }, { d: 0, q: 'maj' }], level: 1,
    info: 'Les trois accords principaux de la tonalité. On les retrouve au cœur du blues, du rock et de la chanson.' },
  { id: 'i-v-vi-iv', name: 'I – V – VI – IV', chords: [{ d: 0, q: 'maj' }, { d: 4, q: 'maj' }, { d: 5, q: 'min' }, { d: 3, q: 'maj' }], level: 1,
    info: 'Une boucle de quatre accords très présente en pop. Le VI mineur apporte la touche mélancolique.' },
  { id: 'i-vi-ii-v', name: 'I – VI – II – V', chords: [{ d: 0, q: 'maj7' }, { d: 5, q: 'm7' }, { d: 1, q: 'm7' }, { d: 4, q: 'dom7' }], level: 2,
    info: 'Le turnaround : il fait tourner la grille et ramène au début du morceau. Souvent joué en fin de grille ou dans les A d’un AABA.' },
  { id: 'vi-iv-i-v', name: 'VI – IV – I – V', chords: [{ d: 5, q: 'min' }, { d: 3, q: 'maj' }, { d: 0, q: 'maj' }, { d: 4, q: 'maj' }], level: 2,
    info: 'Les mêmes accords que I-V-VI-IV, mais en partant du VI : la boucle sonne plus sombre.' },
  { id: 'ii-v-i-min', name: 'II – V – I mineur', minor: true, chords: [{ d: 1, q: 'm7b5' }, { d: 4, q: 'dom7' }, { d: 0, q: 'm7', alt: 0, minorI: true }], level: 2,
    info: 'La version mineure de la cadence : un II demi-diminué, un V7 et un I mineur.' },
  { id: 'iv-ivm-i', name: 'IV – IVm – I', chords: [{ d: 3, q: 'maj7' }, { d: 3, q: 'm7' }, { d: 0, q: 'maj7' }], level: 3,
    info: 'Le IV devient mineur avant de revenir au I : un accord emprunté au mode mineur qui donne une couleur douce-amère.' },
  { id: 'iii-vi-ii-v', name: 'III – VI – II – V', chords: [{ d: 2, q: 'm7' }, { d: 5, q: 'm7' }, { d: 1, q: 'm7' }, { d: 4, q: 'dom7' }], level: 3,
    info: 'Une chaîne d’accords qui descendent par quintes jusqu’au V. Variante plus longue du turnaround.' },
  { id: 'andalouse', name: 'Cadence andalouse', minor: true, chords: [{ d: 0, q: 'min', minorI: true }, { d: 6, alt: -1, q: 'maj' }, { d: 5, alt: -1, q: 'maj' }, { d: 4, q: 'maj' }], level: 3,
    info: 'Une basse qui descend : I mineur, ♭VII, ♭VI, V. Couleur hispanique, associée au flamenco.' },
  { id: 'i-bvii-iv-i', name: 'I – ♭VII – IV – I', chords: [{ d: 0, q: 'maj' }, { d: 6, alt: -1, q: 'maj' }, { d: 3, q: 'maj' }, { d: 0, q: 'maj' }], level: 3,
    info: 'Le ♭VII emprunté donne une couleur mixolydienne, typique du rock et du funk.' },
];
export const PROG_LEVELS = [
  { n: 1, name: 'Les incontournables', ids: ['ii-v-i', 'i-iv-v-i', 'i-v-vi-iv'] },
  { n: 2, name: 'Turnarounds et mineur', ids: ['i-vi-ii-v', 'vi-iv-i-v', 'ii-v-i-min', 'ii-v-i'] },
  { n: 3, name: 'Couleurs et emprunts', ids: ['iv-ivm-i', 'iii-vi-ii-v', 'andalouse', 'i-bvii-iv-i'] },
  { n: 4, name: 'Toutes les progressions', ids: PROGRESSIONS.map((p) => p.id) },
];
export const progById = Object.fromEntries(PROGRESSIONS.map((p) => [p.id, p]));

// Accords d'une progression dans une tonalité (tonique orthographiée).
export function realize(prog, tonic) {
  return prog.chords.map((c) => {
    const semis = (c.minorI ? 0 : MAJOR[c.d]) + (c.alt || 0);
    // en mineur : ♭VI et ♭VII sont relatifs à la gamme majeure de même tonique
    const root = transpose(tonic, c.d, semis);
    return { root, q: c.q, symbol: chordSymbol(root, c.q), rootPc: pc(root), semis: chordSemis(c.q) };
  });
}
export function romanOf(prog) { return prog.name; }

// Classes de hauteur d'un accord (pour vérifier ce qui est joué).
export function chordPcs(rootPc, semis) { return [...new Set(semis.map((s) => (rootPc + s) % 12))]; }
export function guideTones(rootPc, semis) {
  // tierce et septième si présentes : suffisent pour reconnaître un accord de jazz joué en « shell »
  const third = semis.find((s) => s === 3 || s === 4 || s === 5);
  const seventh = semis.find((s) => s === 9 || s === 10 || s === 11);
  return [third, seventh].filter((x) => x != null).map((s) => (rootPc + s) % 12);
}

// Voicing simple autour du médium : fondamentale à la basse, accord au-dessus.
export function voice(rootPc, semis, low = 48) {
  let r = low + ((rootPc - low % 12 + 12) % 12);
  if (r > low + 7) r -= 12;
  const bass = r - 12 >= 36 ? r - 12 : r;
  const upper = semis.slice(1).map((s) => r + s).map((m) => (m < 52 ? m + 12 : m));
  return { bass, notes: [r, ...upper] };
}

export const CIRCLE_FOURTHS = [0, 1, 3, 5, 7, 9, 11, 10, 8, 6, 4, 2].map((i) => KEYS[i]); // do fa si♭ mi♭ la♭ ré♭ sol♭ si mi la ré sol
