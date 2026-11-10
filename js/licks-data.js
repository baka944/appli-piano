// Bibliothèque de licks : le vocabulaire le plus enseigné dans chaque style, écrit sous une forme courte et transposable.
// Les notes sont en demi-tons au-dessus de la tonique (do = 0) ; d = durée en croches ; oct = jouer en octaves.
// `harmo` (facultatif) : l'accord qui sonne sous chaque note, [croche de départ, fondamentale depuis la tonique, type].
// `inspi` dit d'où vient l'idée de style, avec sa source quand c'est un fait sur un musicien.

// Sources pédagogiques : elles décrivent le type de phrase (vocabulaire courant), pas une phrase recopiée d'un enregistrement.
const S = {
  'donaldson': { label: 'NEA · Lou Donaldson on « Blues Walk » (« un croisement entre le blues et le bebop »)', url: 'https://www.arts.gov/stories/other/lou-donaldson-blues-walk' },
  'lick': { label: 'jazz-guitar-licks.com, « What is The Lick »', url: 'https://www.jazz-guitar-licks.com/blog/lessons/what-is-the-lick.html' },
  '251': { label: 'The Jazz Piano Site, ii-V7-I licks', url: 'https://thejazzpianosite.com/?p=2767' },
  'four': { label: 'Wikipédia, Four note group', url: 'https://en.wikipedia.org/wiki/Four_note_group' },
  'bebopsc': { label: 'No Treble, Introduction to Bebop Scale Forms', url: 'https://www.notreble.com/?p=7570' },
  'encl': { label: 'jazz-guitar-licks.com, Target tones and enclosures', url: 'https://www.jazz-guitar-licks.com/blog/lessons/target-notes-enclosures-jazz-guitar-lesson.html' },
  'blue3': { label: 'MusicGurus, The blue third', url: 'https://www.musicgurus.com/courses/beginning-jazz-piano-part-1/lessons/the-blue-third-beginner-jazz-piano/' },
  'bluesj': { label: 'Piano With Jonny, 10 funky blues riffs & licks', url: 'https://pianowithjonny.com/piano-lessons/10-essential-funky-blues-riffs-and-licks-piano/' },
  'funk': { label: 'Piano With Jonny, The top 10 piano funk licks', url: 'https://pianowithjonny.com/piano-lessons/the-top-10-piano-funk-licks/' },
  'neo': { label: 'Piano With Jonny, Neo soul improv with the pentatonic scale', url: 'https://pianowithjonny.com/piano-lessons/neo-soul-piano-improv-with-the-pentatonic-scale/' },
  'glasper': { label: 'Free Jazz Lessons, 5 Robert Glasper licks', url: 'https://www.freejazzlessons.com/?p=20084' },
  'mccoy': { label: 'Jazzadvice, McCoy Tyner and the pentatonic scale', url: 'https://www.jazzadvice.com/lessons/mccoy-tyner-and-the-pentatonic-scale/' },
};
export const LICKS = [
  // ---------- Bebop ----------
  { id: 'the-lick', name: '« The Lick »', style: 'Bebop', level: 1, over: 'm7', src: S.lick,
    inspi: 'La phrase la plus célèbre du jazz, devenue un cliché à force d’être jouée : 1-2-♭3-4, puis 2 et la tonique encadrée par la ♭7 et la 2.',
    notes: [[0, 1], [2, 1], [3, 1], [5, 1], [2, 2], [-2, 1], [0, 1]] },
  { id: 'arpege-guide', name: 'Arpèges et notes guides', style: 'Bebop', level: 1, over: 'ii-v-i', src: S['251'],
    harmo: [[0, 2, 'm7'], [4, 7, 'dom7'], [8, 0, 'maj7']],
    inspi: 'Arpège de Dm7, descente dans G7, et la 7e de G7 (fa) qui descend sur la tierce de Cmaj7 (mi) : la résolution de base du II-V-I.',
    notes: [[2, 1], [5, 1], [9, 1], [12, 1], [11, 1], [9, 1], [7, 1], [5, 1], [4, 4]] },
  { id: 'coltrane-1235', name: '1-2-3-5 sur chaque accord', style: 'Bebop', level: 2, over: 'ii-v-i', src: S.four,
    harmo: [[0, 2, 'm7'], [4, 7, 'dom7'], [8, 0, 'maj7']],
    inspi: 'Le groupe de 4 notes 1-2-3-5, transposé sur chaque accord. Coltrane en a bâti une grande partie de son solo sur Giant Steps.',
    notes: [[2, 1], [4, 1], [5, 1], [9, 1], [7, 1], [9, 1], [11, 1], [14, 1], [16, 4]] },
  { id: 'bebop-scale', name: 'Gamme bebop descendante', style: 'Bebop', level: 2, over: 'v-i', src: S.bebopsc,
    inspi: 'La gamme bebop de dominante : un demi-ton de passage entre la fondamentale et la ♭7 pour que les notes de l’accord tombent sur les temps (1, ♭7, 5, 3).',
    notes: [[19, 1], [18, 1], [17, 1], [16, 1], [14, 1], [12, 1], [11, 1], [9, 1], [7, 4]] },
  { id: 'encadrement', name: 'Encadrement de la tierce', style: 'Bebop', level: 2, over: 'v-i', src: S.encl,
    inspi: 'Arpège de G7 avec la ♭9, puis on encadre la tierce de Cmaj7 : la note du dessus (fa) et celle du dessous (ré♯) avant d’y arriver.',
    notes: [[7, 1], [11, 1], [14, 1], [17, 1], [20, 1], [19, 1], [17, 1], [15, 1], [16, 4]] },
  { id: 'ii-v-i-mineur', name: 'II-V-I mineur', style: 'Bebop', level: 2, over: 'ii-v-i-min', src: S['251'],
    harmo: [[0, 2, 'm7b5'], [4, 7, 'dom7'], [8, 0, 'min']],
    inspi: 'Arpège du demi-diminué, puis sur G7 la tierce et la ♭9 (la♭), qui descendent vers la tierce mineure de do mineur.',
    notes: [[2, 1], [5, 1], [8, 1], [12, 1], [11, 1], [8, 1], [7, 1], [5, 1], [3, 4]] },
  { id: 'bebop-2-mesures', name: 'Ligne bebop sur 2 mesures', style: 'Bebop', level: 3, over: 'ii-v-i', src: S.encl,
    harmo: [[0, 2, 'm7'], [8, 7, 'dom7'], [16, 0, 'maj7']],
    inspi: 'Une mesure par accord. Arpège de Dm9, encadrement de si, arpège de G7♭9, note de passage bebop (fa♯) et encadrement de la tierce de Cmaj7.',
    notes: [[2, 1], [5, 1], [9, 1], [12, 1], [16, 1], [14, 1], [12, 1], [10, 1], [11, 1], [14, 1], [17, 1], [20, 1], [19, 1], [18, 1], [17, 1], [15, 1], [16, 4]] },

  // ---------- Blues ----------
  { id: 'blue-third', name: 'La tierce bleue', style: 'Blues', level: 1, over: 'dom7', src: S.blue3,
    inspi: 'On écrase la tierce mineure sur la tierce majeure, presque en même temps : le son de base du blues au piano.',
    notes: [[3, 0.5], [4, 1.5], [7, 1], [4, 1], [0, 4]] },
  { id: 'penta-descente', name: 'Descente pentatonique', style: 'Blues', level: 1, over: 'dom7', src: S.bluesj,
    inspi: 'La pentatonique mineure qui descend de la tonique à la tonique. Sur un accord 7, la ♭3 sonne « bleue ».',
    notes: [[12, 1], [10, 1], [7, 1], [5, 1], [3, 1], [0, 3]] },
  { id: 'quinte-bleue', name: 'La quinte bleue', style: 'Blues', level: 2, over: 'dom7', src: S.bluesj,
    inspi: 'La gamme blues : la ♭5 (sol♭) glisse entre la quinte et la quarte. On termine sous la tonique et on y revient.',
    notes: [[10, 1], [7, 1], [6, 1], [5, 1], [3, 1], [0, 1], [-2, 1], [0, 1]] },
  { id: 'riff-repete', name: 'Riff répété', style: 'Blues', level: 2, over: 'dom7', src: S.bluesj,
    inspi: 'Un petit riff qu’on répète tel quel (ostinato) : tierce bleue, quinte, tonique en haut. À rejouer plusieurs fois de suite.',
    notes: [[3, 0.5], [4, 0.5], [7, 1], [12, 1], [7, 1], [3, 0.5], [4, 0.5], [7, 1], [12, 1], [7, 1]] },
  { id: 'majeur-mineur', name: 'Majeur et mineur mélangés', style: 'Blues', level: 2, over: 'dom7', src: S.blue3,
    inspi: 'On passe par la ♭3 et la 3 dans la même phrase, puis la 6te et la ♭7 : le mélange majeur / mineur typique du jazz blues.',
    notes: [[0, 1], [2, 1], [3, 1], [4, 1], [7, 1], [9, 1], [10, 1], [9, 1], [7, 4]] },
  { id: 'descente-doubles', name: 'Descente rapide de la gamme blues', style: 'Blues', level: 3, over: 'dom7', src: S.bluesj,
    inspi: 'La gamme blues en doubles croches de la tonique jusqu’en bas, puis la tierce bleue et retour à la tonique.',
    notes: [[12, 0.5], [10, 0.5], [7, 0.5], [6, 0.5], [5, 0.5], [3, 0.5], [0, 0.5], [-2, 0.5], [3, 0.5], [4, 1.5], [0, 2]] },

  { id: 'donaldson-riff', name: 'Riff soul jazz (esprit Lou Donaldson)', style: 'Blues', level: 1, over: 'dom7', src: S.donaldson,
    inspi: 'Un riff court et chantant, autour de la ♭7 et de la tierce bleue, comme les phrases soul jazz de Lou Donaldson. Écrit pour l’appli, pas recopié de Blues Walk.',
    notes: [[7, 1], [10, 1], [12, 1], [10, 0.5], [7, 1.5], [5, 1], [3, 0.5], [4, 1.5]] },
  { id: 'donaldson-bebop-blues', name: 'Bebop sur le blues (esprit Lou Donaldson)', style: 'Blues', level: 2, over: 'dom7', src: S.donaldson,
    inspi: 'Ce que Lou Donaldson appelait « blues et bebop » : un arpège de l’accord 7 qui redescend en chromatique, puis la tierce bleue et la tonique. Écrit pour l’appli.',
    notes: [[0, 1], [4, 1], [7, 1], [10, 1], [9, 1], [8, 1], [7, 1], [6, 1], [5, 1], [3, 0.5], [4, 1.5], [-2, 1], [0, 4]] },
  { id: 'donaldson-question', name: 'Question-réponse (esprit Lou Donaldson)', style: 'Blues', level: 2, over: 'dom7', src: S.donaldson,
    inspi: 'Une petite question (tierce bleue puis quinte tenue), et la réponse qui redescend vers la tonique : la façon de « faire parler » le blues des souffleurs soul jazz. Écrit pour l’appli.',
    notes: [[3, 0.5], [4, 1.5], [7, 2], [10, 1], [7, 1], [3, 0.5], [4, 1.5], [0, 4]] },

  // ---------- Funk ----------
  { id: 'funk-penta', name: 'Pentatonique syncopée', style: 'Funk', level: 1, over: 'm7', src: S.funk,
    inspi: 'La pentatonique mineure sur un vamp mineur, avec une note décalée en double croche pour le groove.',
    notes: [[0, 1], [3, 1], [5, 0.5], [7, 1.5], [10, 1], [7, 1], [5, 1], [3, 1]] },
  { id: 'funk-septieme', name: 'Riff ♭7 – tonique', style: 'Funk', level: 1, over: 'dom7', src: S.funk,
    inspi: 'Un riff court autour de la ♭7 et de la tonique, avec la ♭5 en passage : du vocabulaire de vamp funk sur un accord 7.',
    notes: [[10, 0.5], [12, 1], [10, 0.5], [7, 1], [6, 0.5], [7, 1.5], [10, 1], [12, 2]] },
  { id: 'funk-glisse', name: 'Glissés ♯4 – 5', style: 'Funk', level: 2, over: 'm7', src: S.funk,
    inspi: 'Le glissé d’un demi-ton fa♯ → sol, qui donne le côté « crunchy » au funk, puis descente vers la tonique.',
    notes: [[6, 0.5], [7, 0.5], [10, 1], [6, 0.5], [7, 0.5], [3, 1], [5, 0.5], [3, 0.5], [0, 3]] },
  { id: 'funk-dorien', name: 'La sixte du dorien', style: 'Funk', level: 2, over: 'm7', src: S.funk,
    inspi: 'Le funk mineur emprunte souvent au dorien : la 6te majeure (la sur do mineur) éclaire la ligne.',
    notes: [[9, 0.5], [10, 0.5], [12, 1], [10, 0.5], [9, 0.5], [7, 1], [5, 0.5], [3, 0.5], [2, 1], [0, 2]] },
  { id: 'funk-quartes', name: 'Quartes qui dégringolent', style: 'Funk', level: 3, over: 'm7', src: S.funk,
    inspi: 'Une descente bâtie en quartes (fa-do-sol-ré, puis mi♭-si♭-fa-do), en doubles croches, comme les runs de quartes du funk.',
    notes: [[17, 0.5], [12, 0.5], [7, 0.5], [2, 0.5], [15, 0.5], [10, 0.5], [5, 0.5], [0, 0.5], [3, 1], [5, 1], [7, 2]] },
  { id: 'funk-chroma', name: 'Chromatisme en doubles croches', style: 'Funk', level: 3, over: 'dom7', src: S.funk,
    inspi: 'Descente chromatique de la ♭7 à la quinte, tierce bleue, puis remontée de l’arpège en croches droites.',
    notes: [[10, 0.5], [9, 0.5], [8, 0.5], [7, 0.5], [4, 0.5], [3, 0.5], [0, 0.5], [3, 0.5], [4, 1], [7, 1], [10, 1], [12, 1]] },

  // ---------- Neo soul ----------
  { id: 'neo-penta9', name: 'Pentatonique et neuvième', style: 'Neo soul', level: 1, over: 'm7', src: S.neo,
    inspi: 'Les notes de la pentatonique mineure, et on finit sur la 9e puis la tonique : la couleur douce du neo soul.',
    notes: [[3, 1], [5, 1], [7, 1], [10, 1], [14, 2], [12, 2]] },
  { id: 'neo-maj9', name: 'Cascade maj9', style: 'Neo soul', level: 1, over: 'maj7', src: S.neo,
    inspi: 'L’accord maj9 égrené de haut en bas : 9, 7, 5, 3, puis 9 et tonique.',
    notes: [[14, 1], [11, 1], [7, 1], [4, 1], [2, 2], [0, 2]] },
  { id: 'neo-pedale', name: 'Descente avec pédale de quinte', style: 'Neo soul', level: 2, over: 'm7', src: S.glasper,
    inspi: 'Une descente chromatique vers la tonique, avec la quinte rejouée entre chaque note, dans l’esprit des lignes de Robert Glasper.',
    notes: [[3, 0.5], [7, 0.5], [2, 0.5], [7, 0.5], [1, 0.5], [7, 0.5], [0, 1], [10, 1], [7, 1], [12, 2]] },
  { id: 'neo-appog', name: 'Appoggiature sur la 9e', style: 'Neo soul', level: 2, over: 'm7', src: S.glasper,
    inspi: 'Une petite note chromatique juste sous la 9e (ré♭ → ré), puis une ligne posée, en retard sur le temps.',
    notes: [[13, 0.5], [14, 1.5], [12, 1], [10, 1], [7, 0.5], [10, 0.5], [12, 1], [14, 2]] },
  { id: 'neo-penta-maj', name: 'Pentatonique majeure 6/9', style: 'Neo soul', level: 2, over: 'maj7', src: S.neo,
    inspi: 'La pentatonique majeure sur un accord maj7 : 13, 5, 3, 9 et tonique, la couleur 6/9.',
    notes: [[9, 0.5], [7, 0.5], [4, 1], [2, 1], [0, 1], [2, 0.5], [4, 0.5], [7, 1], [9, 2]] },
  { id: 'neo-sequence', name: 'Séquence pentatonique', style: 'Neo soul', level: 3, over: 'm7', src: S.neo,
    inspi: 'La pentatonique de si♭ majeur sur do mineur 7 (11, 9, 1, ♭7, 5) en groupes de 4 doubles croches qui redescendent d’un cran à chaque fois.',
    notes: [[17, 0.5], [14, 0.5], [12, 0.5], [10, 0.5], [14, 0.5], [12, 0.5], [10, 0.5], [7, 0.5], [12, 0.5], [10, 0.5], [7, 0.5], [5, 0.5], [3, 2]] },

  // ---------- Modal ----------
  { id: 'modal-quartes', name: 'Quartes empilées', style: 'Modal', level: 1, over: 'm7', src: S.mccoy,
    inspi: 'Trois quartes justes qui montent depuis la tonique, puis on redescend : le son ouvert du jazz modal.',
    notes: [[0, 1], [5, 1], [10, 1], [15, 1], [14, 1], [10, 1], [7, 2]] },
  { id: 'modal-une-sur-deux', name: 'Pentatonique une note sur deux', style: 'Modal', level: 1, over: 'm7', src: S.mccoy,
    inspi: 'La pentatonique mineure en sautant une note à chaque fois : des quartes et des tierces, un exercice conseillé pour sonner comme McCoy Tyner.',
    notes: [[0, 1], [5, 1], [3, 1], [7, 1], [5, 1], [10, 1], [7, 1], [12, 1]] },
  { id: 'modal-penta5', name: 'Pentatonique de la quinte', style: 'Modal', level: 2, over: 'm7', src: S.mccoy,
    inspi: 'La pentatonique mineure bâtie sur la quinte (sol mineur sur do mineur 7) : elle donne la 9e et la 11e.',
    notes: [[17, 1], [14, 1], [12, 1], [10, 1], [14, 1], [12, 1], [10, 1], [7, 1]] },
  { id: 'modal-quartes-desc', name: 'Quartes en séquence', style: 'Modal', level: 2, over: 'm7', src: S.mccoy,
    inspi: 'Deux groupes de quartes qui descendent : fa-do-sol-ré puis mi♭-si♭-fa-do.',
    notes: [[17, 1], [12, 1], [7, 1], [2, 1], [15, 1], [10, 1], [5, 1], [0, 1]] },
  { id: 'modal-dehors', name: 'Sortir d’un demi-ton et revenir', style: 'Modal', level: 3, over: 'm7', src: S.mccoy,
    inspi: 'Une mesure de pentatonique de do mineur, une mesure un demi-ton au-dessus (do♯ mineur : ça sonne « dehors »), et retour : tension puis détente.',
    notes: [[0, 1], [3, 1], [5, 1], [7, 1], [10, 1], [7, 1], [5, 1], [3, 1], [1, 1], [4, 1], [6, 1], [8, 1], [11, 1], [8, 1], [6, 1], [4, 1], [3, 1], [0, 3]] },
  { id: 'modal-quartes-rapides', name: 'Quartes en doubles croches', style: 'Modal', level: 3, over: 'm7', src: S.mccoy,
    inspi: 'Trois groupes de quartes qui montent en doubles croches (do-fa-si♭-mi♭, ré-sol-do-fa, sol-do-fa-si♭), puis on se pose sur la quinte.',
    notes: [[0, 0.5], [5, 0.5], [10, 0.5], [15, 0.5], [2, 0.5], [7, 0.5], [12, 0.5], [17, 0.5], [7, 0.5], [12, 0.5], [17, 0.5], [22, 0.5], [19, 2]] },
];
export const LEVELS = { 1: 'Facile', 2: 'Moyen', 3: 'Avancé' };

// Contextes harmoniques pour l'accompagnement (degrés relatifs à la tonique)
// type : clé de CHORDS (music.js), pour nommer les degrés de la mélodie par rapport à l'accord.
export const CONTEXT_TYPE = { 'ii-v-i': ['m7', 'dom7', 'maj7'], dom7: ['dom7'], maj7: ['maj7'], m7: ['m7'], pop: ['maj', 'maj', 'min', 'maj'], 'v-i': ['dom7', 'maj7'], 'ii-v-i-min': ['m7b5', 'dom7', 'min'] };
export const CONTEXTS = {
  'ii-v-i': { label: 'II – V – I', chords: [[2, [0, 3, 7, 10], 'm7', 1], [7, [0, 4, 7, 10], '7', 1], [0, [0, 4, 7, 11], 'maj7', 2]] },
  dom7: { label: 'Accord de septième (blues)', chords: [[0, [0, 4, 7, 10], '7', 2]] },
  maj7: { label: 'Accord majeur 7', chords: [[0, [0, 4, 7, 11], 'maj7', 2]] },
  m7: { label: 'Accord mineur 7', chords: [[0, [0, 3, 7, 10], 'm7', 2]] },
  'v-i': { label: 'V – I', chords: [[7, [0, 4, 7, 10], '7', 1], [0, [0, 4, 7, 11], 'maj7', 1]] },
  'ii-v-i-min': { label: 'II – V – I mineur', chords: [[2, [0, 3, 6, 10], 'm7♭5', 1], [7, [0, 4, 7, 10], '7', 1], [0, [0, 3, 7], 'm', 2]] },
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
