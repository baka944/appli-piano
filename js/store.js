// Progression : XP, niveaux nommés par des tempos, historique, quêtes. Sauvegarde dans le navigateur.
const KEY = 'appli-piano-v1';
export const DAILY_CAP = 300;
export const QUEST_REWARD = 100;

export const TEMPOS = ['Largo', 'Larghetto', 'Adagio', 'Andante', 'Andantino', 'Moderato', 'Allegretto', 'Allegro', 'Vivace', 'Presto', 'Prestissimo'];
export const SKILLS = {
  rythme: 'Rythme',
  oreille: 'Oreille',
  theorie: 'Théorie',
  morceaux: 'Morceaux',
};

const DEFAULT_SONGS = [
  { id: 'love-and-death', title: 'Love and Death', artist: 'Ebo Taylor', jam: true, notes: 'Accords : fa majeur et mi mineur. Relevé du thème à l’oreille, 2e moitié à faire.' },
  { id: 'crazy-race', title: 'Crazy Race', artist: 'RH Factor', jam: true, notes: '' },
  { id: 'stolen-moments', title: 'Stolen Moments', artist: 'Oliver Nelson', jam: true, notes: '' },
  { id: 'someday', title: 'Someday My Prince Will Come', artist: 'Références : Bill Evans, Miles Davis, Michel Petrucciani', jam: false, notes: '' },
];

function fresh() {
  return {
    v: 1,
    xp: 0,
    skills: { rythme: 0, oreille: 0, theorie: 0, morceaux: 0 },
    daily: { date: '', xp: 0 },
    history: [],
    items: {},
    best: {},
    quests: {},
    songs: DEFAULT_SONGS.map((s) => ({ ...s })),
    settings: { theme: 'auto', minutes: 45, latencyMs: 0, calibrated: false, swing: true, bpm: 80, bars: 4, direction: 'asc' },
  };
}

let state = fresh();
const listeners = new Set();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = fresh();
      state = { ...base, ...parsed, skills: { ...base.skills, ...parsed.skills }, settings: { ...base.settings, ...parsed.settings } };
    }
  } catch (e) { state = fresh(); }
  return state;
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible : on continue sans */ }
  listeners.forEach((f) => f(state));
}
export function get() { return state; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setSetting(k, v) { state.settings[k] = v; save(); }

export function exportJson() { return JSON.stringify(state, null, 2); }
export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.v !== 1 || typeof parsed.xp !== 'number') throw new Error('Ce fichier ne vient pas de l’appli piano.');
  localStorage.setItem(KEY, text);
  load();
  save();
}
export function reset() { state = fresh(); save(); }

// Niveaux : 100 XP pour passer au niveau 2, puis 50 de plus à chaque niveau.
export function levelInfo(xp, scale = 1) {
  let level = 1;
  let acc = 0;
  let need = 100 * scale;
  while (xp >= acc + need) { acc += need; level++; need = (100 + 50 * (level - 1)) * scale; }
  return { level, into: xp - acc, need, pct: Math.min(100, Math.round(((xp - acc) / need) * 100)) };
}
export function tempoName(level) { return level <= TEMPOS.length ? TEMPOS[level - 1] : `Prestissimo ${level - TEMPOS.length + 1}`; }
export function globalLevel() { return levelInfo(state.xp); }
export function skillLevel(skill) { return levelInfo(state.skills[skill] || 0, 0.5); }

export function today() {
  const d = new Date();
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

export function dailyXp() {
  if (state.daily.date !== today()) return 0;
  return state.daily.xp;
}

// Ajoute de l'XP pour une activité. Retourne ce qui a été gagné et les éventuelles montées de niveau.
export function award(skill, amount, entry = {}) {
  amount = Math.max(0, Math.round(amount));
  if (state.daily.date !== today()) state.daily = { date: today(), xp: 0 };
  const room = Math.max(0, DAILY_CAP - state.daily.xp);
  const gained = Math.min(amount, room);
  const beforeG = globalLevel().level;
  const beforeS = skillLevel(skill).level;
  state.xp += gained;
  state.skills[skill] = (state.skills[skill] || 0) + gained;
  state.daily.xp += gained;
  state.history.unshift({ t: new Date().toISOString(), date: today(), skill, xp: gained, raw: amount, ...entry });
  if (state.history.length > 400) state.history.length = 400;
  const result = {
    gained,
    capped: gained < amount,
    levelUp: globalLevel().level > beforeG ? globalLevel().level : null,
    skillUp: skillLevel(skill).level > beforeS ? skillLevel(skill).level : null,
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
export function setBest(key, score) {
  if (!state.best[key] || score > state.best[key]) state.best[key] = score;
}

export function historyToday() { return state.history.filter((h) => h.date === today()); }
export function historyWeek() { const w = isoWeek().id; return state.history.filter((h) => weekOf(h.t) === w); }

// Quêtes de la semaine : 2 tirées d'une liste, suivies automatiquement.
const QUEST_POOL = [
  { id: 'rythme85', text: 'Réussir 3 exercices de rythme à 85 % ou plus', target: 3, count: (hs) => hs.filter((h) => h.activity === 'rythme' && h.score >= 85).length },
  { id: 'oreille50', text: 'Trouver 50 bonnes réponses d’oreille', target: 50, count: (hs) => hs.filter((h) => h.activity === 'oreille').reduce((s, h) => s + (h.correct || 0), 0) },
  { id: 'jam3', text: 'Travailler 3 fois un morceau de la jam', target: 3, count: (hs) => hs.filter((h) => h.activity === 'morceau' && h.jam).length },
  { id: 'theorie30', text: 'Trouver 30 bonnes réponses de théorie', target: 30, count: (hs) => hs.filter((h) => h.activity === 'theorie').reduce((s, h) => s + (h.correct || 0), 0) },
  { id: 'jours4', text: 'Pratiquer 4 jours différents', target: 4, count: (hs) => new Set(hs.filter((h) => !h.bonus).map((h) => h.date)).size },
];

export function weekQuests() {
  const { id, n } = isoWeek();
  const a = QUEST_POOL[n % QUEST_POOL.length];
  const b = QUEST_POOL[(n + 2) % QUEST_POOL.length];
  const hs = historyWeek();
  const claimed = state.quests[id] || [];
  return [a, b].map((q) => {
    const progress = Math.min(q.target, q.count(hs));
    return { id: q.id, text: q.text, target: q.target, progress, done: claimed.includes(q.id) };
  });
}

function checkQuests() {
  const { id } = isoWeek();
  const done = [];
  weekQuests().forEach((q) => {
    if (!q.done && q.progress >= q.target) {
      state.quests[id] = [...(state.quests[id] || []), q.id];
      state.xp += QUEST_REWARD;
      state.history.unshift({ t: new Date().toISOString(), date: today(), skill: 'bonus', xp: QUEST_REWARD, raw: QUEST_REWARD, activity: 'quete', label: `Quête réussie : ${q.text}`, bonus: true });
      done.push(q);
    }
  });
  return done;
}
