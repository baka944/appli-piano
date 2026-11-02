// Sprites en pixel art, dessinés pour l'appli (originaux, esprit RPG rétro).
const P = {
  k: '#1B1D22', r: '#D63C3C', R: '#8E1F28', w: '#FFFFFF', y: '#F2C230', Y: '#B8860B', o: '#E07A2E',
  g: '#3FA34D', G: '#23672E', b: '#3B7DD8', B: '#21508F', c: '#7FE0E8', C: '#2E9AA6', s: '#C8CDD6', S: '#8A909C', n: '#8B5A2B', N: '#5C3A1A', p: '#B25FD3', P: '#6E2F8C',
};

export const SPRITES = {
  coeur: [
    '.kk.kk.',
    'krrkrRk',
    'krwrrRk',
    'krrrrRk',
    '.krrRk.',
    '..kRk..',
    '...k...',
  ],
  piece: [
    '..kkkk..',
    '.kyyyyk.',
    'kyywyYYk',
    'kyywyYYk',
    'kyywyYYk',
    'kyyyyYYk',
    '.kYYYYk.',
    '..kkkk..',
  ],
  epee: [
    '......kk',
    '.....ksk',
    '....kswk',
    '...kswk.',
    'k.kswk..',
    '.kSwk...',
    '.nkk....',
    'nk.k....',
  ],
  potion: [
    '..kkk..',
    '..knk..',
    '.k...k.',
    'kpppppk',
    'kpwpppk',
    'kppppPk',
    'kpPPPPk',
    '.kkkkk.',
  ],
  coffre: [
    '.kkkkkkk.',
    'knnnnnnnk',
    'kNNNyNNNk',
    'kkkkykkkk',
    'knnnynnnk',
    'knnnnnnnk',
    'kNNNNNNNk',
    '.kkkkkkk.',
  ],
  cristal: [
    '...k...',
    '..kck..',
    '.kcwCk.',
    'kcwcCCk',
    '.kcCCk.',
    '..kCk..',
    '...k...',
  ],
  etoile: [
    '....k....',
    '...kyk...',
    'kkkkyykkk',
    'kyywyyyYk',
    '.kyyyyYk.',
    '..kyyYk..',
    '.kyYkYYk.',
    'kYk...kYk',
  ],
  note: [
    '...kk..',
    '...kbk.',
    '...k.bk',
    '...k..k',
    '...k...',
    '.kkk...',
    'kbbk...',
    '.kk....',
  ],
  // instruments pour la page Culture
  piano: [
    'kkkkkkkkkk',
    'kwkwkkwkwk',
    'kwkwkkwkwk',
    'kwwwwwwwwk',
    'kwwwwwwwwk',
    'kkkkkkkkkk',
  ],
  trompette: [
    '........kk',
    'k.k.k..kyk',
    'kkkkkkkyyk',
    'kyyyyyyyyk',
    'kkkkkkkyyk',
    '...k...kyk',
    '........kk',
  ],
  saxo: [
    '..kk....',
    '.kyk....',
    '.kyk....',
    '..kyk...',
    '..kyk...',
    '..kyyk..',
    '.kyyyyk.',
    '.kyykyk.',
    '..kk.kk.',
  ],
  contrebasse: [
    '...kk...',
    '...kk...',
    '...nn...',
    '..knnk..',
    '.knNnNk.',
    '.knnnnk.',
    'knnkknnk',
    'knnnnnnk',
    '.kNNNNk.',
    '..k..k..',
  ],
  guitare: [
    '.......kk',
    '......kk.',
    '.....kN..',
    '....kN...',
    '.kkkN....',
    'knnkkk...',
    'knkknk...',
    'knnnnk...',
    '.kkkk....',
  ],
  batterie: [
    '.kkkkkk.',
    'ksssssSk',
    'krrrrrRk',
    'krwwrrRk',
    'krrrrrRk',
    'kRRRRRRk',
    '.kkkkkk.',
  ],
};

export function sprite(name, size = 4, label = '') {
  const rows = SPRITES[name];
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  let rects = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.' && P[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${P[ch]}"/>`;
  }));
  const t = document.createElement('template');
  t.innerHTML = `<svg class="sprite" viewBox="0 0 ${w} ${h}" width="${w * size}" height="${h * size}" shape-rendering="crispEdges" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${rects}</svg>`;
  return t.content.firstElementChild;
}

export function band(names, size = 4) {
  const d = document.createElement('div');
  d.className = 'sprite-band';
  d.setAttribute('aria-hidden', 'true');
  names.forEach((n) => d.append(sprite(n, size)));
  return d;
}
