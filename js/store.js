// Progression : joueurs, XP, niveaux nommés par des tempos, historique, quêtes.
// Tout est enregistré dans le navigateur de l'appareil : chaque appareil et chaque joueur a sa propre partie.
const PLAYERS_KEY = 'appli-piano-joueurs';
const OLD_KEY = 'appli-piano-v1';
const dataKey = (id) => `appli-piano-v1:${id}`;
export const DAILY_CAP = 300;
export const QUEST_REWARD = 100;

export const TEMPOS = ['Largo', 'Larghetto', 'Adagio', 'Andante', 'Andantino', 'Moderato', 'Allegretto', 'Allegro', 'Vivace', 'Presto', 'Prestissimo'];
export const SKILLS = { rythme: 'Rythme', oreille: 'Oreille', theorie: 'Théorie', harmonie: 'Harmonie', morceaux: 'Morceaux', culture: 'Culture' };

// Un niveau par onglet, de 1 à 100. 100 = niveau d'un professionnel : la courbe est volontairement lente.
export const MAX_LEVEL = 100;
export const DOMAINS = {
  morceaux: { label: 'Morceaux', skills: ['morceaux'], tab: 'morceaux' },
  travail: { label: 'Travail', skills: ['rythme', 'harmonie'], tab: 'travail' },
  oreille: { label: 'Oreille', skills: ['oreille', 'theorie'], tab: 'oreille' },
  culture: { label: 'Culture', skills: ['culture'], tab: 'culture' },
};
export const SKILL_DOMAIN = { morceaux: 'morceaux', rythme: 'travail', harmonie: 'travail', oreille: 'oreille', theorie: 'oreille', culture: 'culture' };
// XP cumulée pour atteindre le niveau L : 30·(L−1)² + 70·(L−1)
// niv. 2 = 100 XP · niv. 10 ≈ 3 100 · niv. 30 ≈ 27 300 · niv. 50 ≈ 75 500 · niv. 100 ≈ 301 000
export function xpForLevel(L) { return 30 * (L - 1) ** 2 + 70 * (L - 1); }
export function domainXp(d) { return DOMAINS[d].skills.reduce((t, k) => t + (state.skills[k] || 0), 0); }
export function domainLevel(d) {
  const xp = domainXp(d);
  let L = 1;
  while (L < MAX_LEVEL && xp >= xpForLevel(L + 1)) L++;
  const from = xpForLevel(L);
  const to = L < MAX_LEVEL ? xpForLevel(L + 1) : from;
  return { level: L, xp, into: xp - from, need: to - from, pct: L >= MAX_LEVEL ? 100 : Math.round(((xp - from) / (to - from)) * 100), title: titleFor(L) };
}
// Titre selon la dizaine : Largo (1–9), Larghetto (10–19)… Presto (90–99), Prestissimo (100)
export function titleFor(L) { return TEMPOS[Math.min(TEMPOS.length - 1, Math.floor(L / 10))]; }

const MODULES = [
  { kind: 'theme', name: 'Thème' },
  { kind: 'comping', name: 'Accompagnement' },
  { kind: 'impro', name: 'Impro sur la grille' },
];
export function defaultModules(extra = []) {
  return [...MODULES, ...extra].map((m, i) => ({ id: `mod-${i}-${Math.random().toString(36).slice(2, 7)}`, status: 'todo', notes: '', minutes: 0, ...m }));
}

function defaultSongs(withPersonal) {
  if (!withPersonal) return [];
  return [
    { id: 'love-and-death', title: 'Love and Death', artist: 'Ebo Taylor', jam: true, notes: 'Relevé du thème à l’oreille : 2e moitié à faire.', grid: '| F | Em |', meter: 4, tempo: 100, link: '', modules: defaultModules([{ kind: 'releve', name: 'Relevé du thème à l’oreille' }]) },
    { id: 'crazy-race', title: 'Crazy Race', artist: 'The RH Factor', jam: true, notes: '', grid: '', meter: 4, tempo: 120, link: '', modules: defaultModules() },
    { id: 'stolen-moments', title: 'Stolen Moments', artist: 'Oliver Nelson', jam: true, notes: '', grid: '', meter: 4, tempo: 90, link: '', modules: defaultModules() },
    { id: 'someday', title: 'Someday My Prince Will Come', artist: 'Références : Bill Evans, Miles Davis, Michel Petrucciani', jam: false, notes: '', grid: '', meter: 3, tempo: 140, link: '', modules: defaultModules() },
  ];
}

function fresh(withPersonal = false) {
  return {
    v: 1,
    xp: 0,
    skills: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 0])),
    daily: { date: '', xp: 0 },
    history: [],
    items: {},
    best: {},
    quests: {},
    songs: defaultSongs(withPersonal),
    customPatterns: [],
    listening: [],
    settings: { theme: 'auto', minutes: 45, latencyMs: 0, calibrated: false, swing: true, bpm: 80, bars: 4, direction: 'asc' },
  };
}

function normalize(parsed) {
  const base = fresh(false);
  const s = { ...base, ...parsed, skills: { ...base.skills, ...(parsed.skills || {}) }, settings: { ...base.settings, ...(parsed.settings || {}) } };
  s.songs = (s.songs || []).map((song) => ({ grid: '', meter: 4, tempo: 100, link: '', modules: defaultModules(), ...song }));
  s.customPatterns = s.customPatterns || [];
  s.listening = s.listening || [];
  return s;
}

let players = { current: null, list: [] };
let state = fresh();
const listeners = new Set();

function readJson(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function writeJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }

export function load() {
  players = readJson(PLAYERS_KEY) || { current: null, list: [] };
  if (!players.list.length) {
    const old = readJson(OLD_KEY);
    const id = 'p1';
    players = { current: id, list: [{ id, name: 'Christopher' }] };
    writeJson(PLAYERS_KEY, players);
    writeJson(dataKey(id), old ? normalize(old) : fresh(true));
  }
  if (!players.list.some((p) => p.id === players.current)) players.current = players.list[0].id;
  const data = readJson(dataKey(players.current));
  state = data ? normalize(data) : fresh(false);
  return state;
}
export function save() {
  writeJson(dataKey(players.current), state);
  listeners.forEach((f) => f(state));
}
export function get() { return state; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setSetting(k, v) { state.settings[k] = v; save(); }

// ---------- Joueurs ----------
export function playerList() { return players.list.slice(); }
export function currentPlayer() { return players.list.find((p) => p.id === players.current) || players.list[0]; }
export function switchPlayer(id) { players.current = id; writeJson(PLAYERS_KEY, players); load(); save(); }
export function addPlayer(name) {
  const id = `p${Date.now().toString(36)}`;
  players.list.push({ id, name: name.trim().slice(0, 30) || 'Joueur' });
  writeJson(dataKey(id), fresh(false));
  switchPlayer(id);
}
export function renamePlayer(name) {
  const p = currentPlayer();
  p.name = name.trim().slice(0, 30) || p.name;
  writeJson(PLAYERS_KEY, players);
  save();
}
export function removeCurrentPlayer() {
  if (players.list.length < 2) return false;
  const id = players.current;
  try { localStorage.removeItem(dataKey(id)); } catch (e) { /* rien */ }
  players.list = players.list.filter((p) => p.id !== id);
  switchPlayer(players.list[0].id);
  return true;
}

export function exportJson() { return JSON.stringify({ ...state, player: currentPlayer().name }, null, 2); }
export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.v !== 1 || typeof parsed.xp !== 'number') throw new Error('Ce fichier ne vient pas de l’appli piano.');
  delete parsed.player;
  state = normalize(parsed);
  save();
}
export function reset() { state = fresh(false); save(); }

// ---------- Niveaux ----------
export function levelInfo(xp, scale = 1) {
  let level = 1;
  let acc = 0;
  let need = 100 * scale;
  while (xp >= acc + need) { acc += need; level++; need = (100 + 50 * (level - 1)) * scale; }
  return { level, into: xp - acc, need, pct: Math.min(100, Math.round(((xp - acc) / need) * 100)) };
}
export function skillLevel(skill) { return domainLevel(SKILL_DOMAIN[skill] || 'travail'); }

// ---------- Dates ----------
export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((d - y0) / 86400000 + 1) / 7);
  return { id: `${d.getUTCFullYear()}-S${String(w).padStart(2, '0')}`, n: w };
}
function weekOf(iso) { return isoWeek(new Date(iso)).id; }
export function dailyXp() { return state.daily.date === today() ? state.daily.xp : 0; }

// ---------- XP ----------
export function award(skill, amount, entry = {}) {
  amount = Math.max(0, Math.round(amount));
  if (state.daily.date !== today()) state.daily = { date: today(), xp: 0 };
  const room = Math.max(0, DAILY_CAP - state.daily.xp);
  const gained = Math.min(amount, room);
  const dom = SKILL_DOMAIN[skill];
  const before = dom ? domainLevel(dom).level : null;
  state.xp += gained;
  state.skills[skill] = (state.skills[skill] || 0) + gained;
  state.daily.xp += gained;
  state.history.unshift({ t: new Date().toISOString(), date: today(), skill, xp: gained, raw: amount, ...entry });
  if (state.history.length > 500) state.history.length = 500;
  const result = {
    gained,
    capped: gained < amount,
    domainUp: dom && domainLevel(dom).level > before ? { domain: dom, label: DOMAINS[dom].label, ...domainLevel(dom), titleChanged: titleFor(domainLevel(dom).level) !== titleFor(before) } : null,
    quests: [],
  };
  result.quests = checkQuests();
  save();
  return result;
}

export function recordItem(key, ok) {
  const it = state.items[key] || { ok: 0, ko: 0 };
  if (ok) it.ok++; else it.ko++;
  state.items[key] = it;
}
export function itemWeight(key) {
  const it = state.items[key];
  if (!it) return 2;
  return Math.max(0.4, Math.min(6, 1 + it.ko * 1.5 - it.ok * 0.3));
}
export function setBest(key, score) { if (state.best[key] == null || score > state.best[key]) state.best[key] = score; }
export function getBest(key) { return state.best[key]; }

export function historyToday() { return state.history.filter((h) => h.date === today()); }
export function historyWeek() { const w = isoWeek().id; return state.history.filter((h) => weekOf(h.t) === w); }

// ---------- Quêtes : chacune applique un principe de pratique, pas un compteur pour le plaisir ----------
const jamSongs = () => state.songs.filter((s) => s.jam);
const QUEST_POOL = [
  {
    id: 'repertoire', domain: 'morceaux', always: true,
    text: () => 'Travailler chaque morceau de la jam au moins une fois',
    why: 'Ta priorité du moment, c’est la jam : chaque morceau doit avancer chaque semaine.',
    target: () => Math.max(1, jamSongs().length),
    count: (hs) => new Set(hs.filter((h) => (h.activity === 'morceau' || h.activity === 'playalong') && jamSongs().some((s) => s.id === h.song)).map((h) => h.song)).size,
  },
  {
    id: 'regularite', domain: 'equilibre', text: () => 'Pratiquer 5 jours différents', target: () => 5,
    why: 'Répartir le travail sur plusieurs jours aide à retenir (effet d’espacement).',
    count: (hs) => new Set(hs.filter((h) => !h.bonus).map((h) => h.date)).size,
  },
  {
    id: 'melange', domain: 'equilibre', text: () => 'Mélanger au moins 3 types d’exercices dans une même journée, 3 jours', target: () => 3,
    why: 'Alterner les exercices plutôt que répéter un seul bloc favorise la rétention.',
    count: (hs) => {
      const byDay = {};
      hs.filter((h) => !h.bonus).forEach((h) => { (byDay[h.date] = byDay[h.date] || new Set()).add(h.activity); });
      return Object.values(byDay).filter((s) => s.size >= 3).length;
    },
  },
  {
    id: 'lent-vite', domain: 'travail', text: () => 'Réussir un rythme à 90 % à 70 BPM ou moins, puis le même 20 BPM plus vite à 80 %', target: () => 1,
    why: 'Ralentir jusqu’à jouer juste, puis accélérer : c’est ce que font les pianistes qui progressent le mieux.',
    count: (hs) => {
      const r = hs.filter((h) => h.activity === 'rythme' && h.bpm).slice().reverse();
      for (let i = 0; i < r.length; i++) {
        if (r[i].score >= 90 && r[i].bpm <= 70) {
          if (r.slice(i + 1).some((x) => x.pattern === r[i].pattern && x.score >= 80 && x.bpm >= r[i].bpm + 20)) return 1;
        }
      }
      return 0;
    },
  },
  {
    id: 'contexte', domain: 'morceaux', text: () => 'Jouer 3 fois sur la grille d’un morceau avec l’accompagnement', target: () => 3,
    why: 'La technique sert les morceaux : la jouer en situation, sur une grille, la rend utilisable.',
    count: (hs) => hs.filter((h) => h.activity === 'playalong').length,
  },
  {
    id: 'ecoute', domain: 'culture', text: () => 'Noter 3 écoutes actives dans ta liste d’écoute', target: () => 3,
    why: 'Écouter les maîtres de près nourrit le son, le phrasé et le vocabulaire.',
    count: (hs) => hs.filter((h) => h.activity === 'ecoute').length,
  },
];

export function weekQuests() {
  const { id, n } = isoWeek();
  const hs = historyWeek();
  const claimed = state.quests[id] || [];
  const rotating = QUEST_POOL.filter((q) => !q.always);
  const picks = [];
  if (jamSongs().length) picks.push(QUEST_POOL.find((q) => q.always));
  picks.push(rotating[n % rotating.length], rotating[(n + 2) % rotating.length]);
  return picks.map((q) => {
    const target = q.target();
    return { id: q.id, domain: q.domain, text: q.text(), why: q.why, target, progress: Math.min(target, q.count(hs)), done: claimed.includes(q.id) };
  });
}

function checkQuests() {
  const { id } = isoWeek();
  const done = [];
  weekQuests().forEach((q) => {
    if (!q.done && q.progress >= q.target) {
      state.quests[id] = [...(state.quests[id] || []), q.id];
      state.xp += QUEST_REWARD;
      // la récompense va dans l'onglet concerné ; les quêtes d'équilibre la répartissent entre les quatre
      const split = q.domain === 'equilibre' ? ['morceaux', 'rythme', 'oreille', 'culture'] : [DOMAINS[q.domain].skills[0]];
      split.forEach((k) => { state.skills[k] = (state.skills[k] || 0) + QUEST_REWARD / split.length; });
      state.history.unshift({ t: new Date().toISOString(), date: today(), skill: 'bonus', xp: QUEST_REWARD, raw: QUEST_REWARD, activity: 'quete', label: `Quête réussie : ${q.text}`, bonus: true });
      done.push(q);
    }
  });
  return done;
}

// Pour les modules qui enregistrent sans XP (liste d'écoute, etc.)
export function log(entry) {
  state.history.unshift({ t: new Date().toISOString(), date: today(), skill: entry.skill || 'bonus', xp: 0, raw: 0, ...entry });
  const q = checkQuests();
  save();
  return q;
}
