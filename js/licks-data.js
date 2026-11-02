// Bibliothèque de licks. Tous sont écrits pour l'appli : aucune phrase n'est recopiée d'un enregistrement.
// Les notes sont en demi-tons au-dessus de la tonique (do = 0) ; d = durée en croches ; oct = jouer en octaves.
// `inspi` dit d'où vient l'idée de style, avec sa source quand c'est un fait sur un musicien.

export const LICKS = [
  {
    id: 'bebop-enclosure', name: 'Arpège et encadrement', style: 'Bebop', over: 'ii-v-i',
    inspi: 'Vocabulaire bebop : arpège de l’accord, puis on « encadre » la tierce de l’accord d’arrivée par la note du dessus et celle du dessous.',
    notes: [[2, 1], [5, 1], [9, 1], [12, 1], [11, 1], [7, 1], [5, 1], [3, 1], [4, 4]],
  },
  {
    id: 'bebop-chroma', name: 'Approche chromatique', style: 'Bebop', over: 'ii-v-i',
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
    id: 'ballade-pop', name: 'Arpèges de ballade', style: 'Ballade piano (Nobuo Uematsu)', over: 'pop',
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

export const VOICINGS = [
  { id: 'shell', name: 'Shell 1-3-7', desc: 'Fondamentale, tierce, septième : l’essentiel de l’accord en trois notes.', build: (q) => [0, q.third, q.seventh] },
  { id: 'shell2', name: 'Shell 1-7-3', desc: 'Fondamentale, septième, puis tierce au-dessus : plus ouvert.', build: (q) => [0, q.seventh, q.third + 12] },
  { id: 'rootlessA', name: 'Sans fondamentale (3-5-7-9)', desc: 'La basse joue la fondamentale ; toi tu joues tierce, quinte, septième, neuvième.', build: (q) => [q.third, q.fifth, q.seventh, 14] },
  { id: 'rootlessB', name: 'Sans fondamentale (7-9-3-5)', desc: 'Même couleur, renversée : septième et neuvième en bas.', build: (q) => [q.seventh - 12, 2, q.third, q.fifth] },
  { id: 'drop2', name: 'Drop 2', desc: 'On prend un accord serré et on descend d’une octave la 2e note en partant du haut (La F.M. Jazz 2e année, p. 15).', build: (q) => [q.fifth - 12, 0, q.third, q.seventh] },
];

export const QUAL = {
  maj7: { third: 4, fifth: 7, seventh: 11, sym: 'maj7' },
  m7: { third: 3, fifth: 7, seventh: 10, sym: 'm7' },
  dom7: { third: 4, fifth: 7, seventh: 10, sym: '7' },
};

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
