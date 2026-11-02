// Bibliothèque de licks. Tous sont écrits pour l'appli : aucune phrase n'est recopiée d'un enregistrement.
// Les notes sont en demi-tons au-dessus de la tonique (do = 0) ; d = durée en croches ; oct = jouer en octaves.
// `harmo` (facultatif) : l'accord qui sonne sous chaque note, [croche de départ, fondamentale depuis la tonique, type].
// `inspi` dit d'où vient l'idée de style, avec sa source quand c'est un fait sur un musicien.

export const LICKS = [
  {
    id: 'bebop-enclosure', harmo: [[0, 2, 'm7'], [4, 7, 'dom7'], [8, 0, 'maj7']],  name: 'Arpège et encadrement', style: 'Bebop', over: 'ii-v-i',
    inspi: 'Vocabulaire bebop : arpège de l’accord, puis on « encadre » la tierce de l’accord d’arrivée par la note du dessus et celle du dessous.',
    notes: [[2, 1], [5, 1], [9, 1], [12, 1], [11, 1], [7, 1], [5, 1], [3, 1], [4, 4]],
  },
  {
    id: 'bebop-chroma', harmo: [[0, 2, 'm7'], [4, 7, 'dom7'], [8, 0, 'maj7']],  name: 'Approche chromatique', style: 'Bebop', over: 'ii-v-i',
    inspi: 'Descente dans l’accord du II, puis note de passage chromatique pour retomber pile sur un temps fort.',
    notes: [[9, 1], [7, 1], [5, 1], [4, 1], [2, 1], [1, 1], [2, 1], [5, 1], [4, 4]],
  },
  {
    id: 'blues-crush', name: 'Blues : tierce écrasée', style: 'Blues / hard bop', over: 'dom7',
    inspi: 'La tierce mineure glissée vers la tierce majeure, puis la quinte diminuée en note de passage : le son du blues. Horace Silver privilégiait des mélodies directes plutôt que l’harmonie complexe (Wikipédia).',
    notes: [[3, 0.5], [4, 1.5], [7, 1], [10, 1], [7, 1], [6, 1], [5, 1], [3, 1], [0, 4]],
  },
  {
    id: 'lyrique-neuf', name: 'Ligne lyrique sur la neuvième', style: 'Lyrique (Bill Evans)', over: 'maj7',
    inspi: 'Bill Evans est connu pour son improvisation lyrique et ses harmonies riches (Britannica). Ici : une ligne chantante qui met en valeur la 9e et la 7e majeure.',
    notes: [[7, 1], [9, 1], [11, 1], [14, 3], [12, 1], [11, 1], [9, 4]],
  },
  {
    id: 'octaves-wes', name: 'Phrase en octaves', style: 'Wes Montgomery', over: 'm7', oct: true,
    inspi: 'Wes Montgomery jouait beaucoup en octaves et construisait ses solos en trois étapes : notes seules, octaves, puis accords (Wikipédia). À jouer aux deux mains ou en octave à la main droite, comme sur Four On Six.',
    notes: [[0, 1], [3, 1], [5, 1], [7, 1], [10, 2], [7, 1], [5, 1], [3, 4]],
  },
  {
    id: 'funk-penta', name: 'Pentatonique syncopée', style: 'Funk / neo soul', over: 'm7',
    inspi: 'La gamme pentatonique mineure jouée en décalé : un vocabulaire courant en funk et en jazz-funk (repère pédagogique, non sourcé).',
    notes: [[0, 1], [3, 0.5], [5, 1.5], [7, 1], [10, 1], [12, 1], [10, 1], [7, 2]],
  },
  {
    id: 'quartes', name: 'Montée en quartes', style: 'Modal (Herbie Hancock)', over: 'm7',
    inspi: 'Des quartes empilées donnent une couleur ouverte, modale. Koji Kondo cite Herbie Hancock et Chick Corea parmi ses influences (Wikipédia).',
    notes: [[0, 1], [5, 1], [10, 1], [15, 1], [14, 1], [10, 1], [7, 2], [3, 4]],
  },
  {
    id: 'montuno', name: 'Petit montuno latin', style: 'Latin (Koji Kondo)', over: 'dom7',
    inspi: 'La musique de Super Mario Bros. repose surtout sur des genres dansants comme la musique latine, avec des boucles courtes (Wikipédia). Ici, un motif syncopé à boucler.',
    notes: [[4, 1], [7, 1], [10, 1.5], [7, 0.5], [12, 1], [10, 1], [7, 1], [4, 1]],
  },
  {
    id: 'ballade-pop', harmo: [[0, 0, 'maj'], [4, 7, 'maj'], [8, 9, 'min'], [12, 5, 'maj']],  name: 'Arpèges de ballade', style: 'Ballade piano (Nobuo Uematsu)', over: 'pop',
    inspi: 'Nobuo Uematsu cite Elton John comme sa plus grande influence (Wikipédia). Ici, des arpèges larges de ballade au piano sur I – V – VI – IV.',
    notes: [[0, 1], [7, 1], [12, 1], [16, 1], [7, 1], [14, 1], [19, 1], [23, 1], [9, 1], [16, 1], [21, 1], [24, 1], [5, 1], [12, 1], [17, 1], [21, 1]],
  },
  {
    id: 'gruppetto', name: 'Gruppetto classique', style: 'Classique (Yoko Shimomura)', over: 'maj7',
    inspi: 'Yoko Shimomura cite Beethoven, Chopin et Ravel parmi ses influences (Wikipédia). Le gruppetto tourne autour d’une note : au-dessus, la note, en dessous, la note.',
    notes: [[7, 0.5], [9, 0.5], [7, 0.5], [6, 0.5], [7, 2], [11, 1], [14, 1], [12, 2]],
  },
];

// Contextes harmoniques pour l'accompagnement (degrés relatifs à la tonique)
// type : clé de CHORDS (music.js), pour nommer les degrés de la mélodie par rapport à l'accord.
export const CONTEXT_TYPE = { 'ii-v-i': ['m7', 'dom7', 'maj7'], dom7: ['dom7'], maj7: ['maj7'], m7: ['m7'], pop: ['maj', 'maj', 'min', 'maj'] };
export const CONTEXTS = {
  'ii-v-i': { label: 'II – V – I', chords: [[2, [0, 3, 7, 10], 'm7', 1], [7, [0, 4, 7, 10], '7', 1], [0, [0, 4, 7, 11], 'maj7', 2]] },
  dom7: { label: 'Accord de septième (blues)', chords: [[0, [0, 4, 7, 10], '7', 2]] },
  maj7: { label: 'Accord majeur 7', chords: [[0, [0, 4, 7, 11], 'maj7', 2]] },
  m7: { label: 'Accord mineur 7', chords: [[0, [0, 3, 7, 10], 'm7', 2]] },
  pop: { label: 'I – V – VI – IV', chords: [[0, [0, 4, 7], '', 1], [7, [0, 4, 7], '', 1], [9, [0, 3, 7], 'm', 1], [5, [0, 4, 7], '', 1]] },
};

export const FIORITURES = [
  { id: 'tierce', name: 'Tierce mineure écrasée vers la majeure', how: 'Frappe la tierce mineure et glisse tout de suite le doigt sur la tierce majeure, presque en même temps.', demo: [[3, 0.15], [4, 1.2]], chord: [0, [0, 4, 7, 10]] },
  { id: 'triton', name: 'Quarte augmentée vers la quinte', how: 'Même geste un cran plus haut : la quinte diminuée glisse sur la quinte.', demo: [[6, 0.15], [7, 1.2]], chord: [0, [0, 4, 7, 10]] },
  { id: 'gruppetto', name: 'Gruppetto', how: 'Note du dessus, note principale, note du dessous, note principale : un tour rapide autour de la note.', demo: [[9, 0.12], [7, 0.12], [6, 0.12], [7, 1]], chord: [0, [0, 4, 7, 11]] },
  { id: 'mordant', name: 'Mordant', how: 'Note principale, note voisine, note principale, très vite : un petit battement.', demo: [[7, 0.1], [9, 0.1], [7, 1]], chord: [0, [0, 4, 7, 11]] },
  { id: 'tremolo', name: 'Trémolo d’octave', how: 'Alterne très vite l’octave à la main droite pour faire durer et enfler une note.', demo: [[12, 0.09], [24, 0.09], [12, 0.09], [24, 0.09], [12, 0.09], [24, 0.09], [12, 0.09], [24, 0.6]], chord: [0, [0, 4, 7]] },
  { id: 'glissando', name: 'Glissando sur les touches blanches', how: 'Le dos des doigts (ou l’ongle du pouce) glisse sur les touches blanches jusqu’à la note visée.', demo: [[0, 0.04], [2, 0.04], [4, 0.04], [5, 0.04], [7, 0.04], [9, 0.04], [11, 0.04], [12, 1]], chord: [0, [0, 4, 7]] },
];

// Voicings : `on` = sur quoi on les travaille ('prog' = progressions II-V-I, sinon un type d'accord dans les 12 tonalités).
// `build(q)` = demi-tons depuis la fondamentale, de la note la plus grave à la plus aiguë. `two` = à deux mains.
export const VOICINGS = [
  { id: 'shell', group: 'Bases', name: 'Shell 1-3-7', on: 'prog', desc: 'Fondamentale, tierce, septième : l\u2019essentiel de l\u2019accord en trois notes.', build: (q) => [0, q.third, q.seventh] },
  { id: 'shell2', group: 'Bases', name: 'Shell 1-7-3', on: 'prog', desc: 'Fondamentale, septième, puis tierce au-dessus : plus ouvert.', build: (q) => [0, q.seventh, q.third + 12] },
  { id: 'rootlessA', group: 'Bases', name: 'Sans fondamentale (3-5-7-9)', on: 'prog', desc: 'La basse joue la fondamentale ; toi tu joues tierce, quinte, septième, neuvième.', build: (q) => [q.third, q.fifth, q.seventh, 14] },
  { id: 'rootlessB', group: 'Bases', name: 'Sans fondamentale (7-9-3-5)', on: 'prog', desc: 'Même couleur, renversée : septième et neuvième en bas.', build: (q) => [q.seventh - 12, 2, q.third, q.fifth] },
  { id: 'drop2', group: 'Bases', name: 'Drop 2', on: 'prog', desc: 'Un accord serré dont on descend d\u2019une octave la 2e note en partant du haut (La F.M. Jazz 2e année, p. 15).', build: (q) => [q.fifth - 12, 0, q.third, q.seventh] },
  { id: 'open', group: 'À deux mains', name: 'Ouvert 1-7 | 3-5-9', on: 'prog', two: true, desc: 'Main gauche : fondamentale et septième. Main droite : tierce, quinte, neuvième. Le voicing ouvert de base à deux mains.', build: (q) => [0, q.seventh, q.third + 12, q.fifth + 12, 26] },
  { id: 'barron', group: 'À deux mains', name: 'Kenny Barron (m11)', on: 'm7', sym: 'm11', two: true, desc: 'Main gauche 1-5-9, main droite ♭3-♭7-11 : deux quintes dans chaque main, une seconde mineure entre les deux.', build: () => [0, 7, 14, 15, 22, 29], source: { label: 'Pianogroove · Kenny Barron voicing', url: 'https://www.pianogroove.com/?p=114' } },
  { id: 'sowhat', group: 'Quartes et 11e', name: 'So What', on: 'm7', sym: 'm11', two: true, desc: 'Trois quartes justes puis une tierce majeure : 1-4-♭7-♭3-5. Un accord mineur 11 empilé en quartes ; Bill Evans l\u2019utilise dans la réponse au thème de « So What ».', build: () => [0, 5, 10, 15, 19], source: { label: 'Wikipédia (en) · So What chord', url: 'https://en.wikipedia.org/wiki/So_What_chord' } },
  { id: 'quartes', group: 'Quartes et 11e', name: 'Accord de quartes (11-♭7-♭3)', on: 'm7', sym: 'm11', desc: 'Trois notes à une quarte d\u2019écart, posées sur la 11e : un son ouvert et modal, à une main.', build: () => [5, 10, 15] },
  { id: 'quartes4', group: 'Quartes et 11e', name: 'Quartes à 4 sons (1-11-♭7-♭3)', on: 'm7', sym: 'm11', desc: 'Quatre notes à une quarte juste d\u2019écart en partant de la fondamentale. Essaie ensuite de le faire monter note à note dans le mode dorien.', build: () => [0, 5, 10, 15] },
  { id: 'lydien', group: 'Quartes et 11e', name: 'Majeur ♯11 (3-5-7-♯11)', on: 'maj7', sym: 'maj7♯11', desc: 'La couleur lydienne : tierce, quinte, septième majeure et quarte augmentée au-dessus.', build: () => [4, 7, 11, 18] },
  { id: 'alt', group: 'Accords altérés', name: 'Altéré 3-♭7-♯9-♭13', on: 'dom7', sym: '7alt', desc: 'Sans fondamentale : la tierce et la septième, puis la ♯9 et la ♭13. Le son du 7alt en une main.', build: () => [4, 10, 15, 20] },
  { id: 'alt2', group: 'Accords altérés', name: 'Altéré ♭7-3-♭13-♭9', on: 'dom7', sym: '7(♭9 ♭13)', desc: 'Septième et tierce en bas, ♭13 et ♭9 au-dessus : plus sombre.', build: () => [10, 16, 20, 25] },
  { id: 'us2', group: 'Upper structures (deux mains)', name: 'US II : 13♯11', on: 'dom7', sym: '13♯11', two: true, desc: 'Main gauche : 3 et ♭7 (le triton). Main droite : l\u2019accord parfait majeur bâti sur la 9e (9, ♯11, 13).', build: () => [4, 10, 14, 18, 21], source: { label: 'Pianogroove · Upper structure triads', url: 'https://pianogroove.com/jazz-piano-lessons/what-are-upper-structure-triads/' } },
  { id: 'us4', group: 'Upper structures (deux mains)', name: 'US ♯IV : 7♭9♯11', on: 'dom7', sym: '7♭9♯11', two: true, desc: 'Main gauche : 3 et ♭7. Main droite : accord parfait majeur sur la ♯11 (♯11, ♭7, ♭9).', build: () => [4, 10, 18, 22, 25], source: { label: 'Pianogroove · Upper structure triads', url: 'https://pianogroove.com/jazz-piano-lessons/what-are-upper-structure-triads/' } },
  { id: 'us5', group: 'Upper structures (deux mains)', name: 'US ♯V : 7♯5♯9 (alt)', on: 'dom7', sym: '7♯5♯9', two: true, desc: 'Main gauche : 3 et ♭7. Main droite : accord parfait majeur sur la ♯5 (♯5, fondamentale, ♯9).', build: () => [4, 10, 20, 24, 27], source: { label: 'Pianogroove · Upper structure triads', url: 'https://pianogroove.com/jazz-piano-lessons/what-are-upper-structure-triads/' } },
  { id: 'us6', group: 'Upper structures (deux mains)', name: 'US VI : 13♭9', on: 'dom7', sym: '13♭9', two: true, desc: 'Main gauche : 3 et ♭7. Main droite : accord parfait majeur sur la 13e (13, ♭9, 3).', build: () => [4, 10, 21, 25, 28], source: { label: 'Pianogroove · Upper structure triads', url: 'https://pianogroove.com/jazz-piano-lessons/what-are-upper-structure-triads/' } },
];

export const QUAL = {
  maj7: { third: 4, fifth: 7, seventh: 11, sym: 'maj7' },
  m7: { third: 3, fifth: 7, seventh: 10, sym: 'm7' },
  dom7: { third: 4, fifth: 7, seventh: 10, sym: '7' },
  m7b5: { third: 3, fifth: 6, seventh: 10, sym: 'm7♭5', fr: 'demi-diminué' },
  dim7: { third: 3, fifth: 6, seventh: 9, sym: '°7', fr: 'diminué 7' },
  mmaj7: { third: 3, fifth: 7, seventh: 11, sym: 'm(maj7)', fr: 'mineur majeur 7' },
  maj6: { third: 4, fifth: 7, seventh: 9, sym: '6', fr: 'majeur 6' },
  m6: { third: 3, fifth: 7, seventh: 9, sym: 'm6', fr: 'mineur 6' },
  sus: { third: 5, fifth: 7, seventh: 10, sym: '7sus4', fr: '7sus4 (la quarte remplace la tierce)' },
};
QUAL.maj7.fr = 'majeur 7'; QUAL.m7.fr = 'mineur 7'; QUAL.dom7.fr = 'septième de dominante';
// Enchaînements des fondamentales : intervalle (demi-tons) entre deux accords successifs.
export const CHAINS = [
  ['one', 'Une seule tonalité', 0],
  ['quartes', 'Par quartes (do, fa, si♭…)', 5],
  ['tm', 'Par tierces mineures (do, mi♭, sol♭, la)', 3],
  ['tM', 'Par tierces majeures (do, mi, la♭)', 4],
  ['ton', 'Ton par ton (do, ré, mi, sol♭…)', 2],
  ['demi', 'Demi-ton par demi-ton', 1],
];

export const CONSIGNES = [
  'Arpèges seulement : joue uniquement les notes de l’accord.',
  'Notes guides : vise la tierce ou la septième sur le 1 de chaque mesure.',
  'Un seul motif de 3 notes, que tu transposes sur chaque accord.',
  'Économie : 2 notes au maximum par mesure.',
  'Commence chaque phrase sur le « et » du 1.',
  'Question-réponse : 2 mesures de jeu, 2 mesures de silence.',
  'Place un lick de ta bibliothèque, puis développe-le.',
  'Rythme d’abord : une seule note, mais des rythmes variés.',
];
