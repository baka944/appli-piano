// Fiches Culture. Chaque fait vient de la source citée sur la fiche (consultée le 31/10/2026).
// Types de source : « encyclopédie » (Britannica), « Wikipédia » (encyclopédie collaborative),
// « presse spécialisée » (magazines et sites de musique), « disquaire / salle » (pages professionnelles).

const SRC = {
  britEvans: { label: 'Britannica · Bill Evans', url: 'https://www.britannica.com/biography/Bill-Evans', type: 'encyclopédie' },
  popWaltz: { label: 'PopMatters · Waltz for Debby', url: 'https://popmatters.com/bill-evans-trio-waltz-for-debby', type: 'presse spécialisée' },
  wikiSomeday: { label: 'Wikipédia (en) · Someday My Prince Will Come', url: 'https://en.wikipedia.org/wiki/Someday_My_Prince_Will_Come', type: 'Wikipédia' },
  wikiGarland: { label: 'Wikipédia (en) · Red Garland', url: 'https://en.wikipedia.org/wiki/Red_Garland', type: 'Wikipédia' },
  wikiMiles: { label: 'Wikipédia (en) · Miles Davis', url: 'https://en.wikipedia.org/wiki/Miles_Davis', type: 'Wikipédia' },
  britMonk: { label: 'Britannica · Thelonious Monk', url: 'https://www.britannica.com/print/article/389556', type: 'encyclopédie' },
  wikiHancock: { label: 'Wikipédia (en) · Herbie Hancock', url: 'https://en.wikipedia.org/wiki/Herbie_Hancock', type: 'Wikipédia' },
  jfPetrucciani: { label: 'Jazzfuel · Michel Petrucciani', url: 'https://jazzfuel.com/michel-petrucciani-biography/', type: 'presse spécialisée' },
  wikiStolen: { label: 'Wikipédia (en) · Stolen Moments', url: 'https://en.wikipedia.org/wiki/Stolen_Moments_(Oliver_Nelson_song)', type: 'Wikipédia' },
  wikiHardGroove: { label: 'Wikipédia (en) · Hard Groove', url: 'https://en.wikipedia.org/wiki/Hard_Groove', type: 'Wikipédia' },
  wikiDistractions: { label: 'Wikipédia (en) · Distractions', url: 'https://en.wikipedia.org/wiki/Distractions_(The_RH_Factor_album)', type: 'Wikipédia' },
  faEbo: { label: 'First Avenue · Ebo Taylor', url: 'https://first-avenue.com/performer/ebo-taylor/', type: 'disquaire / salle' },
  rhEbo: { label: 'Rush Hour · Love & Death', url: 'https://www.rushhour.nl/node/106710', type: 'disquaire / salle' },
  wikiAutumn: { label: 'Wikipédia (en) · Autumn Leaves', url: 'https://en.wikipedia.org/wiki/Autumn_Leaves_(1945_song)', type: 'Wikipédia' },
  wikiAllThings: { label: 'Wikipédia (en) · All the Things You Are', url: 'https://en.wikipedia.org/wiki/All_the_Things_You_Are', type: 'Wikipédia' },
  wikiBlueBossa: { label: 'Wikipédia (en) · Blue Bossa', url: 'https://en.wikipedia.org/wiki/Blue_Bossa', type: 'Wikipédia' },
  britJazz: { label: 'Britannica · Jazz (résumé)', url: 'https://www.Britannica.com/summary/jazz', type: 'encyclopédie' },
};

export const MUSICIENS = [
  {
    id: 'bill-evans', name: 'Bill Evans', role: 'Pianiste américain · 1929–1980',
    why: 'Une de tes références pour Someday My Prince Will Come.',
    facts: [
      'Né le 16 août 1929 à Plainfield (New Jersey), mort le 15 septembre 1980 à New York.',
      'Connu pour ses harmonies riches et son improvisation lyrique.',
      'Pianiste de Kind of Blue de Miles Davis (1959) ; il y a écrit « Blue in Green » sans être officiellement crédité.',
      'En juin 1961, son trio avec Scott LaFaro (contrebasse) et Paul Motian (batterie) enregistre en un jour au Village Vanguard Sunday at the Village Vanguard et Waltz for Debby. LaFaro meurt dans un accident de voiture moins de deux semaines plus tard, à 25 ans.',
    ],
    listen: [{ title: 'Portrait in Jazz', year: 1960, note: 'contient sa version de Someday My Prince Will Come' }, { title: 'Waltz for Debby', year: 1961 }, { title: 'Sunday at the Village Vanguard', year: 1961 }],
    sources: [SRC.britEvans, SRC.popWaltz, SRC.wikiSomeday],
  },
  {
    id: 'red-garland', name: 'Red Garland', role: 'Pianiste américain · 1923–1984',
    why: 'Le rythme de comping « Red Garland » de l’appli vient de son style.',
    facts: [
      'Né le 13 mai 1923 à Dallas, mort le 23 avril 1984 à Dallas.',
      'Rejoint le quintette de Miles Davis en 1955.',
      'A contribué à populariser le jeu en block chords dans le piano jazz.',
    ],
    listen: [{ title: 'A Garland of Red', year: 1957 }, { title: 'Groovy', year: 1957 }, { title: 'All Mornin’ Long', year: 1958, note: 'avec John Coltrane' }],
    sources: [SRC.wikiGarland],
  },
  {
    id: 'miles-davis', name: 'Miles Davis', role: 'Trompettiste américain · 1926–1991',
    why: 'Sa version de Someday My Prince Will Come est une de tes références.',
    facts: [
      'Né le 26 mai 1926 à Alton (Illinois), mort le 28 septembre 1991 à Santa Monica (Californie).',
      'Premier grand quintette formé en 1955 avec John Coltrane, Red Garland, Paul Chambers et Philly Joe Jones.',
      'Kind of Blue (août 1959) est l’un des albums de jazz les plus populaires de l’histoire.',
      'Second grand quintette (1963–1968) avec Herbie Hancock, Ron Carter, Tony Williams, puis Wayne Shorter.',
      'Bitches Brew (1970) a contribué à l’essor du jazz fusion.',
    ],
    listen: [{ title: 'Kind of Blue', year: 1959 }, { title: 'Someday My Prince Will Come', year: 1961 }, { title: 'Bitches Brew', year: 1970 }],
    sources: [SRC.wikiMiles],
  },
  {
    id: 'monk', name: 'Thelonious Monk', role: 'Pianiste et compositeur américain · 1917–1982',
    why: 'Un des créateurs du jazz moderne, et une autre façon de penser le piano.',
    facts: [
      'Né le 10 octobre 1917 à Rocky Mount (Caroline du Nord), mort le 17 février 1982 à Englewood (New Jersey).',
      'Pianiste de l’orchestre maison du Minton’s Playhouse à New York au début des années 1940 : une influence majeure sur les musiciens qui ont développé le bebop.',
      'Jeu percussif et dépouillé, harmonies dissonantes, intervalles et rythmes inattendus, avec beaucoup d’humour.',
      'Compositions : « ’Round Midnight », « Straight, No Chaser », « Blue Monk », « Well, You Needn’t », « Epistrophy ».',
    ],
    listen: [],
    sources: [SRC.britMonk],
  },
  {
    id: 'hancock', name: 'Herbie Hancock', role: 'Pianiste américain · né en 1940',
    why: 'Le pont direct entre jazz, funk et groove.',
    facts: [
      'Né le 12 avril 1940 à Chicago.',
      'Entre dans le second grand quintette de Miles Davis en mai 1963.',
      'Ses morceaux « Cantaloupe Island », « Watermelon Man », « Maiden Voyage » et « Chameleon » sont devenus des standards.',
      'Future Shock (1983) contient le single « Rockit ».',
    ],
    listen: [{ title: 'Takin’ Off', year: 1962, note: 'avec « Watermelon Man »' }, { title: 'Maiden Voyage', year: 1965 }, { title: 'Head Hunters', year: 1973 }],
    sources: [SRC.wikiHancock],
  },
  {
    id: 'petrucciani', name: 'Michel Petrucciani', role: 'Pianiste français · 1962–1999',
    why: 'Une de tes références pour Someday My Prince Will Come.',
    facts: [
      'Né en 1962 à Montpellier, mort en 1999, peu après ses 36 ans.',
      'Atteint d’ostéogenèse imparfaite, la maladie des os de verre.',
      'Tourne avec le saxophoniste Charles Lloyd, jusqu’au festival de Montreux en 1982.',
      'Le 22 février 1985, concert au Town Hall de New York, publié sous le titre One Night with Blue Note. Il enregistre ensuite sept albums pour Blue Note.',
    ],
    listen: [{ title: 'One Night with Blue Note', year: 1985 }, { title: 'Promenade with Duke', year: 1992, note: 'piano solo' }],
    sources: [SRC.jfPetrucciani],
  },
  {
    id: 'oliver-nelson', name: 'Oliver Nelson', role: 'Saxophoniste, compositeur et arrangeur américain',
    why: 'Compositeur de Stolen Moments, un des morceaux de ta jam.',
    facts: [
      'Stolen Moments paraît d’abord sous le titre « The Stolen Moment » sur Trane Whistle d’Eddie « Lockjaw » Davis (1960).',
      'La version qui l’a fait connaître est sur son album The Blues and the Abstract Truth (1961).',
    ],
    listen: [{ title: 'The Blues and the Abstract Truth', year: 1961 }],
    sources: [SRC.wikiStolen],
  },
  {
    id: 'rh-factor', name: 'Roy Hargrove et The RH Factor', role: 'Groupe du trompettiste Roy Hargrove',
    why: 'Crazy Race, un des morceaux de ta jam, vient de leur album Distractions.',
    facts: [
      'Hard Groove (2003, Verve) mélange jazz, funk et hip-hop, avec D’Angelo, Q-Tip, Erykah Badu et Common parmi les invités.',
      'Distractions (2006, Verve) contient « Crazy Race ».',
    ],
    listen: [{ title: 'Hard Groove', year: 2003 }, { title: 'Distractions', year: 2006, note: 'avec « Crazy Race »' }],
    sources: [SRC.wikiHardGroove, SRC.wikiDistractions],
  },
  {
    id: 'ebo-taylor', name: 'Ebo Taylor', role: 'Guitariste ghanéen · né en 1936',
    why: 'Love and Death, un des morceaux de ta jam, est de lui.',
    facts: [
      'Né en 1936 au Ghana ; guitariste, compositeur et chef d’orchestre.',
      'Figure du highlife ghanéen dans les années 1950 et 1960 (Stargazers, Broadway Dance Band).',
      'Part étudier à Londres en 1962, où il joue avec Fela Kuti.',
      'Mêle highlife, afrobeat, jazz, soul et funk.',
      'Love and Death (2010, Strut), enregistré avec l’Afrobeat Academy de Berlin, est son premier album studio distribué à l’international ; il contient une nouvelle version du morceau « Love and Death ».',
    ],
    listen: [{ title: 'Love and Death', year: 2010 }],
    sources: [SRC.faEbo, SRC.rhEbo],
  },
];

export const STANDARDS = [
  {
    id: 'someday', name: 'Someday My Prince Will Come', role: 'Frank Churchill et Larry Morey · 1937',
    why: 'Ton morceau de travail.',
    facts: [
      'Musique de Frank Churchill, paroles de Larry Morey, pour Blanche-Neige et les sept nains de Disney (1937).',
      'Souvent jouée en si♭ majeur.',
      'Versions de référence : Dave Brubeck (Dave Digs Disney, 1957), Bill Evans (Portrait in Jazz, 1960), Miles Davis (Someday My Prince Will Come, 1961).',
    ],
    listen: [{ title: 'Portrait in Jazz (Bill Evans)', year: 1960 }, { title: 'Someday My Prince Will Come (Miles Davis)', year: 1961 }],
    sources: [SRC.wikiSomeday],
  },
  {
    id: 'autumn-leaves', name: 'Autumn Leaves (Les Feuilles mortes)', role: 'Joseph Kosma et Jacques Prévert · 1945',
    why: 'Le standard idéal pour apprendre les II-V-I.',
    facts: [
      'Musique de Joseph Kosma, paroles françaises de Jacques Prévert, écrite en 1945 ; dans le film Les Portes de la nuit de Marcel Carné (1946).',
      'Paroles anglaises de Johnny Mercer en 1950.',
      'L’une des chansons les plus enregistrées par les musiciens de jazz.',
      'Sa grille est presque entièrement faite de II-V-I et de II-V : une porte d’entrée classique dans l’harmonie jazz.',
    ],
    listen: [],
    sources: [SRC.wikiAutumn],
  },
  {
    id: 'all-the-things', name: 'All the Things You Are', role: 'Jerome Kern et Oscar Hammerstein II · 1939',
    why: 'Un des standards préférés des jazzmen, riche en modulations.',
    facts: [
      'Musique de Jerome Kern, paroles d’Oscar Hammerstein II, pour la comédie musicale Very Warm for May (1939).',
      'Forme de 36 mesures (A A2 B A3), une variante de la forme AABA de 32 mesures.',
      'Un des refrains favoris des musiciens de jazz.',
    ],
    listen: [],
    sources: [SRC.wikiAllThings],
  },
  {
    id: 'blue-bossa', name: 'Blue Bossa', role: 'Kenny Dorham · 1963',
    why: 'Un standard très joué en jam, entre bossa et jazz.',
    facts: ['Composé par le trompettiste Kenny Dorham.', 'Créé sur l’album Page One de Joe Henderson (1963).'],
    listen: [{ title: 'Page One (Joe Henderson)', year: 1963 }],
    sources: [SRC.wikiBlueBossa],
  },
  {
    id: 'stolen-moments', name: 'Stolen Moments', role: 'Oliver Nelson · 1960',
    why: 'Un des morceaux de ta jam.',
    facts: [
      'Thème de 16 mesures ; les solos se jouent sur une structure de blues mineur.',
      'Première version en 1960 sur Trane Whistle (Eddie « Lockjaw » Davis), version de référence en 1961 sur The Blues and the Abstract Truth.',
    ],
    listen: [{ title: 'The Blues and the Abstract Truth', year: 1961 }],
    sources: [SRC.wikiStolen],
  },
];

export const MOUVEMENTS = [
  { period: 'Fin XIXe – début XXe', name: 'Les origines à La Nouvelle-Orléans', text: 'Le jazz naît d’un mélange des cultures musicales de La Nouvelle-Orléans.', source: SRC.britJazz },
  { period: 'Vers 1930 – 1945', name: 'L’ère du swing', text: 'Les grands orchestres et la danse.', source: SRC.britJazz },
  { period: 'Début des années 1940', name: 'Le Minton’s Playhouse', text: 'Monk y tient le piano de l’orchestre maison et influence les créateurs du bebop.', source: SRC.britMonk },
  { period: 'Milieu des années 1940', name: 'Le bebop', text: 'Charlie Parker et la complexité technique du bebop.', source: SRC.britJazz },
  { period: 'Années 1950', name: 'Le cool jazz', text: 'Un style plus détendu, qui prend le nom de cool jazz.', source: SRC.britJazz },
  { period: 'Années 1950 – 1960', name: 'Le highlife ghanéen', text: 'Ebo Taylor y devient une figure majeure avec les grands orchestres de danse.', source: SRC.rhEbo },
  { period: '1959', name: 'Le jazz modal', text: 'Kind of Blue de Miles Davis, avec Bill Evans au piano, en devient le chef-d’œuvre.', source: SRC.popWaltz },
  { period: 'Années 1970', name: 'Afrobeat', text: 'Lancé par Fela Kuti ; Ebo Taylor le mêle au highlife, au jazz et au funk à partir du milieu des années 1970.', source: SRC.rhEbo },
  { period: '1970', name: 'Le jazz fusion', text: 'Bitches Brew de Miles Davis contribue à l’essor du jazz fusion.', source: SRC.wikiMiles },
  { period: '2003', name: 'Jazz, funk et hip-hop', text: 'Hard Groove de The RH Factor réunit jazzmen et artistes neo soul et hip-hop.', source: SRC.wikiHardGroove },
];

// Quiz éclair : chaque question reprend un fait d'une fiche ci-dessus.
export const QUIZ = [
  { q: 'Qui joue du piano sur Kind of Blue de Miles Davis (1959) ?', a: 'Bill Evans', wrong: ['Red Garland', 'Herbie Hancock', 'Thelonious Monk'], ref: 'bill-evans' },
  { q: 'En quelle année le trio de Bill Evans enregistre-t-il Waltz for Debby au Village Vanguard ?', a: '1961', wrong: ['1956', '1959', '1965'], ref: 'bill-evans' },
  { q: 'Quel contrebassiste jouait dans le trio de Bill Evans en 1961 ?', a: 'Scott LaFaro', wrong: ['Paul Chambers', 'Ron Carter', 'Paul Motian'], ref: 'bill-evans' },
  { q: 'Quel pianiste a contribué à populariser les block chords et jouait dans le premier quintette de Miles Davis ?', a: 'Red Garland', wrong: ['Bill Evans', 'Herbie Hancock', 'Michel Petrucciani'], ref: 'red-garland' },
  { q: 'Quel album de Miles Davis a contribué à l’essor du jazz fusion ?', a: 'Bitches Brew', wrong: ['Kind of Blue', 'Birth of the Cool', 'Someday My Prince Will Come'], ref: 'miles-davis' },
  { q: 'En quelle année Miles Davis forme-t-il son premier grand quintette ?', a: '1955', wrong: ['1949', '1959', '1963'], ref: 'miles-davis' },
  { q: 'Quel pianiste rejoint le second grand quintette de Miles Davis en 1963 ?', a: 'Herbie Hancock', wrong: ['Bill Evans', 'Red Garland', 'Thelonious Monk'], ref: 'hancock' },
  { q: 'Qui a composé « ’Round Midnight » et « Blue Monk » ?', a: 'Thelonious Monk', wrong: ['Bill Evans', 'Herbie Hancock', 'Oliver Nelson'], ref: 'monk' },
  { q: 'Dans quel club new-yorkais Monk tenait-il le piano au début des années 1940 ?', a: 'Minton’s Playhouse', wrong: ['Village Vanguard', 'Town Hall', 'Birdland'], ref: 'monk' },
  { q: 'Quel morceau de Herbie Hancock figure sur Takin’ Off (1962) ?', a: 'Watermelon Man', wrong: ['Chameleon', 'Rockit', 'Maiden Voyage'], ref: 'hancock' },
  { q: 'Dans quelle ville est né Michel Petrucciani ?', a: 'Montpellier', wrong: ['Paris', 'Marseille', 'Lyon'], ref: 'petrucciani' },
  { q: 'Avec quel saxophoniste Michel Petrucciani tourne-t-il jusqu’à Montreux en 1982 ?', a: 'Charles Lloyd', wrong: ['Wayne Shorter', 'John Coltrane', 'Lee Konitz'], ref: 'petrucciani' },
  { q: 'Sur quel album Stolen Moments est-il devenu célèbre ?', a: 'The Blues and the Abstract Truth', wrong: ['Kind of Blue', 'Page One', 'Hard Groove'], ref: 'stolen-moments' },
  { q: 'Sur quelle structure se jouent les solos de Stolen Moments ?', a: 'Un blues mineur', wrong: ['Un AABA de 32 mesures', 'Un blues majeur', 'Une forme de 36 mesures'], ref: 'stolen-moments' },
  { q: 'Sur quel album de The RH Factor trouve-t-on « Crazy Race » ?', a: 'Distractions', wrong: ['Hard Groove', 'Head Hunters', 'Love and Death'], ref: 'rh-factor' },
  { q: 'Avec quel musicien Ebo Taylor a-t-il joué à Londres dans les années 1960 ?', a: 'Fela Kuti', wrong: ['Miles Davis', 'Herbie Hancock', 'Roy Hargrove'], ref: 'ebo-taylor' },
  { q: 'Quel style ghanéen Ebo Taylor a-t-il marqué dans les années 1950 et 1960 ?', a: 'Le highlife', wrong: ['Le bebop', 'La bossa nova', 'Le cool jazz'], ref: 'ebo-taylor' },
  { q: 'Pour quel film Disney « Someday My Prince Will Come » a-t-il été écrit ?', a: 'Blanche-Neige et les sept nains', wrong: ['Cendrillon', 'Pinocchio', 'La Belle au bois dormant'], ref: 'someday' },
  { q: 'Qui a écrit les paroles françaises des « Feuilles mortes » ?', a: 'Jacques Prévert', wrong: ['Boris Vian', 'Jacques Brel', 'Serge Gainsbourg'], ref: 'autumn-leaves' },
  { q: 'Quelle forme a All the Things You Are ?', a: '36 mesures (A A2 B A3)', wrong: ['32 mesures AABA', 'Blues de 12 mesures', '16 mesures'], ref: 'all-the-things' },
  { q: 'Qui a composé Blue Bossa ?', a: 'Kenny Dorham', wrong: ['Joe Henderson', 'Oliver Nelson', 'Miles Davis'], ref: 'blue-bossa' },
  { q: 'Pourquoi Autumn Leaves est-il souvent conseillé pour débuter en jazz ?', a: 'Sa grille est presque entièrement en II-V-I', wrong: ['Il n’a que deux accords', 'Il est en 3/4', 'Il n’a pas de pont'], ref: 'autumn-leaves' },
];

export const ALL_FICHES = [...MUSICIENS.map((f) => ({ ...f, cat: 'Musicien' })), ...STANDARDS.map((f) => ({ ...f, cat: 'Standard' }))];
