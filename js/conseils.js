// L'essentiel du jour : ce qui compte, avec sa source et son niveau de preuve.
export const PILIERS = [
  { id: 'morceau', title: 'Un morceau', text: 'Avancer un morceau de ton répertoire, en priorité ceux de la jam.' },
  { id: 'temps', title: 'Le temps', text: 'Jouer avec une pulsation : métronome ou accompagnement.' },
  { id: 'oreille', title: 'L’oreille', text: 'Écouter activement ou reconnaître à l’oreille, même 10 minutes.' },
];

export const CONSEILS = [
  {
    title: 'Ralentis et corrige l’erreur tout de suite',
    text: 'Quand une erreur arrive, ralentis juste avant le passage et rejoue-le juste avant de repartir. Répéter une erreur, c’est l’apprendre.',
    preuve: 'Limitée',
    detail: 'Une étude sur 17 étudiants pianistes : ceux qui ont le mieux retenu le passage le lendemain corrigeaient leurs erreurs dès qu’elles apparaissaient, en ralentissant ou en s’arrêtant juste avant.',
    source: { label: 'Duke, Simmons et Cash, Journal of Research in Music Education, 2009', url: 'https://cml.music.utexas.edu/online-resources/intelligent-music-practice' },
  },
  {
    title: 'Un objectif précis par séance',
    text: 'Pas « travailler Someday », mais « placer la main gauche sur le « et » du 1 sur les 8 premières mesures à 90 BPM ».',
    preuve: 'Modérée',
    detail: 'La pratique délibérée (concentrée, avec un objectif et un retour) est liée au niveau atteint. Mais une méta-analyse de 88 études estime qu’elle n’explique qu’environ 21 % des différences de niveau en musique : elle compte, sans tout expliquer.',
    source: { label: 'Macnamara, Hambrick et Oswald, Psychological Science, 2014', url: 'https://www.princeton.edu/news/2014/07/03/becoming-expert-takes-more-practice' },
  },
  {
    title: 'Alterne plutôt que de répéter un seul bloc',
    text: 'Passe d’un exercice à l’autre toutes les quelques minutes. Sur le moment, ça semble moins efficace ; le lendemain, tu retiens mieux.',
    preuve: 'Limitée en musique, solide en apprentissage moteur',
    detail: 'Dix clarinettistes avancés ont mieux réussi les passages travaillés en alternance qu’en bloc. L’effet est bien établi dans le sport, beaucoup moins étudié en musique.',
    source: { label: 'Carter et Grahn, Frontiers in Psychology, 2016', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4989027' },
  },
  {
    title: 'Un peu chaque jour plutôt que beaucoup une fois',
    text: 'Trois séances de 30 minutes réparties dans la semaine valent mieux qu’une séance de 1 h 30 d’un coup.',
    preuve: 'Solide pour la mémoire, extrapolée aux gestes',
    detail: 'Une méta-analyse de 317 expériences montre que l’espacement des révisions améliore la mémorisation. Les études portent sur la mémoire verbale ; l’appliquer au piano est une extrapolation raisonnable.',
    source: { label: 'Cepeda et al., Psychological Bulletin, 2006', url: 'https://pubmed.ncbi.nlm.nih.gov/16719566/' },
  },
  {
    title: 'Écoute activement chaque jour',
    text: 'Choisis un morceau et suis un seul instrument du début à la fin : la main gauche du pianiste, la basse, le placement de la batterie.',
    preuve: 'Avis d’experts',
    detail: 'C’est un conseil constant dans la pédagogie du jazz, mais je n’ai pas trouvé d’étude qui mesure son effet.',
    source: null,
  },
  {
    title: 'Joue toujours avec une pulsation',
    text: 'Métronome sur 2 et 4, ou accompagnement de l’appli : ton temps devient fiable quand il est mis à l’épreuve.',
    preuve: 'Avis d’experts',
    detail: 'Conseil répandu chez les enseignants de jazz ; pas d’étude trouvée qui compare directement.',
    source: null,
  },
];

export function conseilDuJour(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d - start) / 86400000);
  return CONSEILS[day % CONSEILS.length];
}
