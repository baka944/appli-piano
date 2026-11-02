import { h, svg, toast, progressBar, icon } from './ui.js';
import * as store from './store.js';
import * as midi from './midi.js';
import * as rythme from './rythme.js';
import * as oreille from './oreille.js';
import * as morceaux from './morceaux.js';
import * as culture from './culture.js';
import * as travail2 from './travail2.js';
import * as partitions from './partitions.js';
import * as v3 from './v3.js';
import * as sync from './sync.js';
import { band, sprite } from './pixel.js';

const TABS = [
  { id: 'aujourdhui', label: 'Aujourd’hui', icon: 'today' },
  { id: 'morceaux', label: 'Morceaux', icon: 'songs' },
  { id: 'travail', label: 'Travail', icon: 'work' },
  { id: 'oreille', label: 'Oreille', icon: 'ear' },
  { id: 'partitions', label: 'Partitions', icon: 'score' },
  { id: 'culture', label: 'Culture', icon: 'culture' },
  { id: 'journal', label: 'Journal', icon: 'journal' },
];

const view = document.getElementById('view');
let cleanup = null;
let pending = null;

const app = {
  open(tab, params) { pending = params || null; if (location.hash === `#${tab}`) route(); else location.hash = tab; },
  celebrate(out) {
    if (out.domainUp) {
      const d = out.domainUp;
      toast(`${d.label} : niveau ${d.level} / ${store.MAX_LEVEL}${d.titleChanged ? ` · nouveau titre : ${d.title}` : ''}`, 'big');
    }
    (out.quests || []).forEach((q) => toast(`Quête réussie : ${q.text} (+${store.QUEST_REWARD} XP)`, 'big'));
    renderTop();
  },
};

function applyTheme() {
  const t = store.get().settings.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

const topEl = document.getElementById('top-status');
function renderTop() {
  const ms = midi.getStatus();
  topEl.replaceChildren(
    h('a', { class: 'lvls', href: '#journal', 'aria-label': `Niveaux de ${store.currentPlayer().name}` },
      Object.entries(store.DOMAINS).map(([k, d]) => {
        const l = store.domainLevel(k);
        return h('span', { class: 'lvl-mini', title: `${d.label} : niveau ${l.level} / ${store.MAX_LEVEL}` },
          h('span', { class: 'lvl-mini-top' }, h('span', null, d.label.slice(0, 1)), h('strong', { class: 'num' }, l.level)),
          progressBar(l.pct, d.label));
      })),
    saveButton(),
    importButton(),
    h('button', { type: 'button', class: `midi-chip st-${ms.status}`, onclick: () => midi.connect(), title: ms.inputs.join(', ') || null },
      icon('piano', 'ic sm'), h('span', null, midi.statusLabel(ms))));
}

// ---------- Sauvegarde rapide ----------
function unsaved() {
  const s = store.get();
  const last = s.settings.lastSave || '';
  return s.history.length && s.history[0].t > last;
}
function saveButton() {
  const ss = sync.getStatus();
  if (ss.status === 'ok' || ss.status === 'syncing') {
    return h('a', { href: '#journal', class: 'save-chip', title: `Synchro active (${ss.email})`, 'aria-label': 'Synchro active' }, icon('check', 'ic sm'), h('span', null, ss.status === 'syncing' ? 'Synchro…' : 'Synchro'));
  }
  if (ss.status === 'error') return h('a', { href: '#journal', class: 'save-chip dirty', title: ss.error }, icon('save', 'ic sm'), h('span', null, 'Synchro ?'));
  const dirty = unsaved();
  return h('button', { type: 'button', class: `save-chip${dirty ? ' dirty' : ''}`, onclick: quickSave, title: dirty ? 'Des progrès ne sont pas encore sauvegardés' : 'Tout est sauvegardé', 'aria-label': 'Sauvegarder ma progression' },
    icon('save', 'ic sm'), h('span', null, dirty ? 'Sauver' : 'Sauvé'));
}
function importButton() {
  const input = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { store.importJson(await f.text()); applyTheme(); toast('Sauvegarde importée.'); route(); } catch (err) { toast(err.message || 'Import impossible.', 'bad'); }
    e.target.value = '';
  } });
  return h('span', null, h('button', { type: 'button', class: 'save-chip', 'aria-label': 'Importer une sauvegarde', title: 'Importer une sauvegarde', onclick: () => input.click() }, icon('upload', 'ic sm'), h('span', null, 'Importer')), input);
}
async function quickSave() {
  const name = store.currentPlayer().name;
  const fileName = `appli-piano-${name}-${store.today()}.json`;
  const text = store.exportJson();
  const file = new File([text], fileName, { type: 'application/json' });
  const done = () => { store.setSetting('lastSave', new Date().toISOString()); toast('Progression sauvegardée.'); renderTop(); };
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sauvegarde appli piano', text: `Sauvegarde de ${name} du ${store.today()}` });
      return done();
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = h('a', { href: URL.createObjectURL(file), download: fileName });
  document.body.append(a); a.click(); a.remove();
  done();
}

function renderNav() {
  const nav = document.getElementById('tabbar');
  const cur = currentTab();
  nav.replaceChildren(...TABS.map((t) => h('a', { href: `#${t.id}`, class: t.id === cur ? 'on' : '', 'aria-current': t.id === cur ? 'page' : null }, icon(t.icon), h('span', null, t.label))));
}
function currentTab() {
  const id = location.hash.replace('#', '');
  return TABS.some((t) => t.id === id) ? id : 'aujourdhui';
}
function route() {
  if (cleanup) { try { cleanup(); } catch (e) { /* rien */ } }
  cleanup = null;
  const tab = currentTab();
  const params = pending || {};
  pending = null;
  renderNav();
  renderTop();
  view.replaceChildren();
  window.scrollTo(0, 0);
  const pages = {
    aujourdhui: today,
    morceaux: (el, p) => morceaux.render(el, app, p),
    travail: work,
    oreille: (el, p) => oreille.render(el, app, p),
    culture: (el, p) => culture.render(el, app, p),
    partitions: (el, p) => partitions.render(el, app, p),
    journal,
  };
  const dom = Object.entries(store.DOMAINS).find(([, d]) => d.tab === tab);
  if (dom) view.append(domainStrip(dom[0]));
  cleanup = pages[tab](view, params) || null;
}

function domainStrip(key) {
  const d = store.DOMAINS[key];
  const l = store.domainLevel(key);
  return h('div', { class: 'dom-strip' },
    h('span', { class: 'hand' }, `${d.label} · niveau ${l.level}`, h('span', { class: 'muted' }, ` / ${store.MAX_LEVEL}`)),
    h('span', { class: 'muted small' }, l.title),
    progressBar(l.pct, `Progression ${d.label}`),
    h('span', { class: 'muted small num' }, l.level >= store.MAX_LEVEL ? 'Niveau maximum' : `${Math.round(l.into)} / ${Math.round(l.need)} XP vers le niveau ${l.level + 1}`));
}

// ---------- Aujourd'hui ----------
function pickSong() {
  const s = store.get();
  const last = (id) => { const e = s.history.find((x) => (x.activity === 'morceau' || x.activity === 'playalong' || x.activity === 'impro') && x.song === id); return e ? e.t : ''; };
  return s.songs.slice().sort((a, b) => (b.jam - a.jam) || last(a.id).localeCompare(last(b.id)))[0];
}
function pickPattern() {
  const s = store.get();
  const lvl = store.skillLevel('rythme').level;
  return rythme.allPatterns().filter((p) => p.level <= lvl).sort((a, b) => (s.best[`rythme:${a.id}`] ?? -1) - (s.best[`rythme:${b.id}`] ?? -1))[0];
}

// Ce qui compte comme « fait » pour chaque case du programme
const moduleKind = (s, h) => { const song = s.songs.find((x) => x.id === h.song); return song?.modules?.find((m) => m.id === h.module)?.kind; };
const CHECKS = {
  accomp: (h, s) => h.activity === 'playalong' || (h.activity === 'morceau' && moduleKind(s, h) === 'comping') || h.activity === 'voicings',
  impro: (h, s) => h.activity === 'impro' || (h.activity === 'morceau' && moduleKind(s, h) === 'impro'),
  licks: (h) => h.activity === 'licks',
  rythme: (h) => h.activity === 'rythme',
  oreille: (h) => h.activity === 'oreille' || h.activity === 'theorie',
  culture: (h) => h.activity === 'culture' || h.activity === 'ecoute',
  dechiffrage: (h) => h.activity === 'dechiffrage',
};
const LABELS = { accomp: 'Accompagnement', impro: 'Improvisation', licks: 'Licks', rythme: 'Rythmique', oreille: 'Oreille', culture: 'Culture', dechiffrage: 'Déchiffrage' };

function today(el) {
  const s = store.get();
  const d = new Date();
  const day = store.today();
  s.dayPlan = s.dayPlan || {};
  const plan = s.dayPlan[day] || (s.dayPlan[day] = { manual: {} });
  if (!plan.song || !s.songs.some((x) => x.id === plan.song)) plan.song = pickSong()?.id || '';
  const song = s.songs.find((x) => x.id === plan.song);
  const done = store.historyToday();
  const isDone = (k) => !!plan.manual[k] || done.some((h) => CHECKS[k](h, s) && (k === 'accomp' || k === 'impro' ? !h.song || h.song === plan.song : true));
  const pat = pickPattern();

  const toggle = (k) => {
    plan.manual[k] = !plan.manual[k];
    if (plan.manual[k] && k === 'dechiffrage') store.award('morceaux', 10, { activity: 'dechiffrage', label: 'Déchiffrage', minutes: 10 });
    else store.save();
    route();
  };
  const row = (k, sub, go, nested = false) => h('div', { class: `todo${isDone(k) ? ' done' : ''}${nested ? ' nested' : ''}` },
    h('button', { type: 'button', class: 'todo-check', 'aria-pressed': isDone(k) ? 'true' : 'false', 'aria-label': `${LABELS[k]} : ${isDone(k) ? 'fait' : 'à faire'}`, onclick: () => toggle(k) }, isDone(k) ? icon('check', 'ic sm') : null),
    h('button', { type: 'button', class: 'todo-main', onclick: go }, h('strong', null, LABELS[k]), h('span', { class: 'muted small' }, sub)),
    h('span', { class: 'todo-go', 'aria-hidden': 'true' }, '›'));

  const keys = ['accomp', 'impro', 'licks', 'rythme', 'oreille', 'culture', 'dechiffrage'];
  const nDone = keys.filter(isDone).length;

  // Rappels : ce qui n'a pas été travaillé depuis un moment
  const lastOf = (k) => {
    const hit = s.history.find((h) => CHECKS[k](h, s));
    const manualDays = Object.entries(s.dayPlan).filter(([, p]) => p.manual && p.manual[k]).map(([dd]) => dd).sort().pop();
    const dates = [hit ? hit.date : null, manualDays].filter(Boolean).sort();
    return dates.pop() || null;
  };
  const daysSince = (iso) => (iso ? Math.round((new Date(day) - new Date(iso)) / 86400000) : null);
  const reminders = [];
  keys.forEach((k) => { const n = daysSince(lastOf(k)); if (n == null || n >= 3) reminders.push({ label: LABELS[k], n }); });
  s.songs.forEach((sg) => {
    const hit = s.history.find((h) => h.song === sg.id);
    const n = daysSince(hit ? hit.date : null);
    if (n == null || n >= 5) reminders.push({ label: sg.title, n, song: true });
  });
  reminders.sort((a, b) => (b.n ?? 999) - (a.n ?? 999));

  el.append(
    h('div', { class: 'hero' },
      band(['coeur', 'coeur', 'coeur', 'piece', 'epee', 'potion', 'coffre', 'cristal', 'etoile', 'note'], 3.5),
      h('p', { class: 'muted hand' }, d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })),
      h('h1', { class: 'display' }, `Salut ${store.currentPlayer().name}`)),
    h('section', { class: 'card stack plan-card' },
      h('div', { class: 'card-head' }, h('h2', { class: 'hand-title' }, 'Programme du jour'), h('span', { class: 'num day-count' }, `${nDone} / ${keys.length}`)),
      progressBar(Math.round((nDone / keys.length) * 100), 'Programme du jour'),
      h('div', { class: 'block' },
        h('div', { class: 'block-head' }, h('span', { class: 'block-n' }, '1'), h('strong', null, 'Morceau'),
          h('select', { 'aria-label': 'Morceau du jour', class: 'song-pick', onchange: (e) => { plan.song = e.target.value; store.save(); route(); } },
            s.songs.map((x) => h('option', { value: x.id, selected: x.id === plan.song }, x.title)))),
        song ? [
          row('accomp', 'Main gauche ou accords sur la grille', () => app.open('morceaux', { song: song.id }), true),
          row('impro', 'Impro guidée sur la grille', () => { s.settings.improSrc = `song:${song.id}`; store.save(false); app.open('travail', { sub: 'impro' }); }, true),
          row('licks', 'Un lick à placer dans le morceau', () => app.open('travail', { sub: 'licks' }), true),
        ] : h('p', { class: 'muted small' }, 'Ajoute un morceau dans l’onglet Morceaux.')),
      h('div', { class: 'block single' }, h('span', { class: 'block-n' }, '2'), row('rythme', pat ? `${pat.name}, au métronome` : 'Au métronome', () => app.open('travail', { sub: 'rythme', pattern: pat?.id }))),
      h('div', { class: 'block single' }, h('span', { class: 'block-n' }, '3'), row('oreille', 'Intervalles, accords, progressions ou motifs', () => app.open('oreille', {}))),
      h('div', { class: 'block single' }, h('span', { class: 'block-n' }, '4'), row('culture', 'Une fiche, des cartes ou une écoute', () => app.open('culture', { tab: 'cartes' }))),
      h('div', { class: 'block single' }, h('span', { class: 'block-n' }, '5'), row('dechiffrage', 'Lire une partition nouvelle, sans s’arrêter', () => app.open('partitions', {}))),
      h('p', { class: 'muted small' }, 'Les cases se cochent toutes seules quand tu fais l’exercice dans l’appli. Touche une case pour la cocher à la main.')),
    h('section', { class: 'card stack' },
      h('h2', { class: 'hand-title' }, 'À reprendre'),
      reminders.length ? h('ul', { class: 'reminders' }, reminders.slice(0, 8).map((r) => h('li', null,
        h('span', null, r.label, r.song ? h('span', { class: 'muted small' }, ' · morceau') : null),
        h('span', { class: `rem-days${r.n == null || r.n >= 7 ? ' old' : ''}` }, r.n == null ? 'jamais travaillé' : `il y a ${r.n} jours`))))
        : h('p', { class: 'muted' }, 'Tout a été travaillé ces derniers jours.')),
    h('p', { class: 'muted small' }, `XP du jour : ${store.dailyXp()} / ${store.DAILY_CAP}`),
  );
}

// ---------- Travail ----------
const WORK_TABS = [['rythme', 'Rythme'], ['licks', 'Licks'], ['impro', 'Impro'], ['voicings', 'Voicings'], ['gammes', 'Gammes'], ['harmonisation', 'Harmonisation'], ['suites', 'Suites d’accords']];
function work(el, params) {
  let sub = params.sub || 'rythme';
  let stop = null;
  const box = h('div', { class: 'stack' });
  const seg = h('div', { class: 'seg scroll', role: 'tablist' });
  el.append(seg, box);
  function show(p = {}) {
    if (stop) { try { stop(); } catch (e) { /* rien */ } }
    seg.replaceChildren(...WORK_TABS.map(([id, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': sub === id ? 'true' : 'false', class: sub === id ? 'on' : '', onclick: () => { sub = id; show(); } }, label)));
    box.replaceChildren();
    const back = () => h('button', { class: 'back', type: 'button', onclick: () => show() }, '← Retour');
    if (sub === 'rythme') stop = rythme.render(box, app, p);
    else if (sub === 'licks') stop = v3.licks(box, app);
    else if (sub === 'impro') stop = v3.impro(box, app);
    else if (sub === 'voicings') stop = v3.voicings(box, app);
    else if (sub === 'gammes') stop = travail2.gammes(box, app, back);
    else if (sub === 'harmonisation') stop = travail2.harmonisation(box, app, back);
    else stop = travail2.suites(box, app, back);
  }
  show(params);
  return () => { if (stop) stop(); };
}

// ---------- Journal ----------
function journal(el) {
  const s = store.get();
  const ms = midi.getStatus();
  const confirmBox = h('div', { class: 'row', hidden: true },
    h('span', null, 'Effacer toute la progression de ce joueur ?'),
    h('button', { class: 'btn danger sm', type: 'button', onclick: () => { store.reset(); applyTheme(); toast('Progression effacée.'); route(); } }, 'Oui, tout effacer'),
    h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { confirmBox.hidden = true; } }, 'Annuler'));
  const fileIn = h('input', { id: 'import-file', type: 'file', accept: 'application/json,.json', hidden: true, onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { store.importJson(await f.text()); applyTheme(); toast('Progression importée.'); route(); } catch (err) { toast(err.message || 'Import impossible.', 'bad'); }
  } });
  const players = store.playerList();
  const cur = store.currentPlayer();
  const newName = h('input', { id: 'new-player', type: 'text', placeholder: 'Prénom', autocomplete: 'off' });
  const delBox = h('div', { class: 'row', hidden: true },
    h('span', null, `Supprimer ${cur.name} et toute sa progression ?`),
    h('button', { class: 'btn danger sm', type: 'button', onclick: () => { store.removeCurrentPlayer(); applyTheme(); route(); } }, 'Supprimer'),
    h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { delBox.hidden = true; } }, 'Annuler'));

  // temps par onglet, pour voir l'équilibre du travail
  const groups = { Morceaux: ['morceau', 'playalong'], Travail: ['rythme', 'gammes', 'harmonisation', 'suites', 'licks', 'voicings', 'impro'], Oreille: ['oreille', 'theorie'], Culture: ['culture', 'ecoute'] };
  const week = store.historyWeek();
  const xpBy = Object.fromEntries(Object.entries(groups).map(([k, acts]) => [k, week.filter((x) => acts.includes(x.activity)).reduce((t, x) => t + x.xp, 0)]));
  const maxXp = Math.max(1, ...Object.values(xpBy));

  el.append(
    h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Journal')),
    h('section', { class: 'card stack' },
      h('h2', null, 'Joueur'),
      h('div', { class: 'row wrap' },
        h('label', { for: 'player' }, 'Joueur actuel'),
        h('select', { id: 'player', style: { width: 'auto' }, onchange: (e) => { store.switchPlayer(e.target.value); applyTheme(); route(); } },
          players.map((p) => h('option', { value: p.id, selected: p.id === cur.id }, p.name)))),
      h('div', { class: 'row wrap' }, newName,
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { if (!newName.value.trim()) return; store.addPlayer(newName.value); applyTheme(); toast(`Nouveau joueur : ${newName.value.trim()}`); route(); } }, 'Ajouter un joueur')),
      players.length > 1 ? h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { delBox.hidden = false; } }, `Supprimer ${cur.name}`) : null,
      delBox,
      h('p', { class: 'muted small' }, 'Chaque joueur a sa propre partie sur cet appareil. Quelqu’un qui ouvre l’appli sur son appareil part de zéro et ne voit jamais la tienne.')),
    h('section', { class: 'card stack' },
      h('h2', null, 'Mes niveaux'),
      h('p', { class: 'muted small' }, `Un niveau par onglet, de 1 à ${store.MAX_LEVEL}. Le niveau ${store.MAX_LEVEL} correspond à un professionnel : la montée est volontairement lente. Il mesure la quantité de pratique réussie, pas un examen de ton niveau réel.`),
      h('div', { class: 'skills' }, Object.entries(store.DOMAINS).map(([k, d]) => {
        const l = store.domainLevel(k);
        const detail = d.skills.length > 1 ? d.skills.map((sk) => `${store.SKILLS[sk]} ${Math.round(s.skills[sk] || 0)} XP`).join(' · ') : `${Math.round(l.xp)} XP`;
        return h('div', { class: 'skill' },
          h('span', null, h('strong', null, d.label), h('span', { class: 'muted small' }, ` · ${l.title}`)),
          h('span', { class: 'num' }, `${l.level} / ${store.MAX_LEVEL}`),
          progressBar(l.pct, d.label),
          h('span', { class: 'muted small skill-detail' }, detail));
      })),
      h('details', { class: 'small' }, h('summary', null, 'Comment montent les niveaux ?'),
        h('p', { class: 'muted' }, 'Niveau 2 : 100 XP · niveau 10 : environ 3 100 XP · niveau 30 : environ 27 300 XP · niveau 50 : environ 75 500 XP · niveau 100 : environ 301 000 XP. Avec 40 XP par jour dans un onglet, il faut environ 2 mois et demi pour le niveau 10 et près de 2 ans pour le niveau 30. Titres : Largo (1–9), Larghetto (10–19)… Presto (90–99), Prestissimo (100). Ces paliers sont un choix de conception, pas une mesure scientifique.'))),
    h('section', { class: 'card stack' },
      h('h2', null, 'Équilibre de la semaine'),
      h('p', { class: 'muted small' }, 'XP gagnée par onglet depuis lundi.'),
      h('div', { class: 'skills' }, Object.entries(xpBy).map(([k, v]) => h('div', { class: 'skill' }, h('span', null, k), h('span', { class: 'num muted small' }, `${v} XP`), progressBar(Math.round((v / maxXp) * 100), k))))),
    h('section', { class: 'card stack' }, h('h2', null, 'Dernières séances'),
      s.history.length ? h('ul', { class: 'hist' }, s.history.slice(0, 30).map((x) => h('li', null,
        h('span', { class: 'muted small num' }, new Date(x.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })),
        h('span', null, x.label || x.activity, x.score != null ? h('span', { class: 'muted' }, ` · ${x.score} %`) : null),
        h('span', { class: 'num xp' }, `+${x.xp}`)))) : h('p', { class: 'muted' }, 'Rien encore. Ta première séance apparaîtra ici.')),
    h('section', { class: 'card stack' }, h('h2', null, 'Réglages'),
      h('label', { for: 'theme' }, 'Apparence'),
      h('select', { id: 'theme', onchange: (e) => { store.setSetting('theme', e.target.value); applyTheme(); } },
        [['auto', 'Comme l’appareil'], ['light', 'Clair (cahier)'], ['dark', 'Sombre (club)']].map(([v, l]) => h('option', { value: v, selected: s.settings.theme === v }, l))),
      h('div', { class: 'row wrap' },
        h('span', null, `Piano : ${ms.status === 'off' ? 'non connecté' : midi.statusLabel(ms)}${ms.inputs.length ? ` (${ms.inputs.join(', ')})` : ''}`),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await midi.connect(); route(); } }, 'Connecter')),
      h('div', { class: 'row wrap' },
        h('span', null, s.settings.calibrated ? `Décalage compensé : ${s.settings.latencyMs} ms` : 'Pas encore calibré'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { store.setSetting('calibrated', false); app.open('travail', { sub: 'rythme' }); } }, 'Recalibrer'))),
    syncSection(),
    h('section', { class: 'card stack' }, h('h2', null, 'Sauvegarde'),
      h('p', { class: 'muted small' }, 'La progression est enregistrée dans ce navigateur. En attendant la synchro automatique : exporte ici, puis importe le fichier sur l’autre appareil.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => {
          const blob = new Blob([store.exportJson()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `appli-piano-${cur.name}-${store.today()}.json` });
          document.body.append(a); a.click(); a.remove();
        } }, 'Exporter'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => fileIn.click() }, 'Importer'), fileIn,
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { confirmBox.hidden = false; } }, 'Tout effacer')),
      confirmBox),
  );
}

// ---------- Synchro ----------
function syncSection() {
  const ss = sync.getStatus();
  const box = h('section', { class: 'card stack', id: 'synchro' }, h('h2', null, 'Synchro entre appareils'));
  const msg = h('p', { class: 'small', 'aria-live': 'polite' });
  if (ss.status === 'noconfig') {
    const url = h('input', { id: 'sb-url', type: 'url', placeholder: 'https://xxxx.supabase.co', autocomplete: 'off' });
    const key = h('input', { id: 'sb-key', type: 'text', placeholder: 'Clé « anon public »', autocomplete: 'off' });
    box.append(h('p', { class: 'muted small' }, 'Pas encore configurée. Une fois ton projet Supabase créé, colle ici son adresse et sa clé publique « anon » (Project Settings › API).'),
      h('label', { for: 'sb-url' }, 'Adresse du projet'), url, h('label', { for: 'sb-key' }, 'Clé anon'), key,
      h('button', { class: 'btn sm', type: 'button', onclick: async () => { await sync.setConfig(url.value, key.value); route(); } }, 'Enregistrer'),
      h('details', { class: 'small' }, h('summary', null, 'Script à lancer une fois dans Supabase (SQL Editor)'), h('pre', { class: 'mono sql' }, sync.SETUP_SQL)));
    return box;
  }
  if (ss.status === 'signedout' || (ss.status === 'error' && !ss.email)) {
    const email = h('input', { id: 'sb-email', type: 'email', autocomplete: 'email', placeholder: 'ton@email.fr' });
    const pass = h('input', { id: 'sb-pass', type: 'password', autocomplete: 'current-password', placeholder: '6 caractères minimum' });
    const run = (fn) => async () => { msg.textContent = '…'; try { const r = await fn(email.value.trim(), pass.value); msg.textContent = r === 'confirm' ? 'Compte créé : clique sur le lien reçu par e-mail, puis connecte-toi ici.' : 'Connecté. Ta progression se synchronise.'; renderTop(); setTimeout(route, 800); } catch (e) { msg.textContent = e.message; } };
    box.append(h('p', { class: 'muted small' }, 'Connecte-toi avec le même compte sur chaque appareil : ta partie suit toute seule.'),
      h('label', { for: 'sb-email' }, 'E-mail'), email, h('label', { for: 'sb-pass' }, 'Mot de passe'), pass,
      h('div', { class: 'row wrap' }, h('button', { class: 'btn sm', type: 'button', onclick: run(sync.signIn) }, 'Se connecter'), h('button', { class: 'btn ghost sm', type: 'button', onclick: run(sync.signUp) }, 'Créer mon compte')),
      ss.error ? h('p', { class: 'bad small' }, ss.error) : null, msg);
    return box;
  }
  box.append(h('p', null, ss.status === 'error' ? `Problème de synchro : ${ss.error}` : `Synchro active pour ${ss.email}. Ta partie (${store.currentPlayer().name}) est envoyée automatiquement après chaque exercice et récupérée à l\u2019ouverture.`),
    h('p', { class: 'muted small' }, 'Les partitions restent sur chaque appareil pour l\u2019instant.'),
    h('div', { class: 'row wrap' },
      h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await sync.pull(); toast('Synchronisé.'); route(); } }, 'Synchroniser maintenant'),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await sync.signOut(); route(); } }, 'Se déconnecter')));
  return box;
}

// ---------- Démarrage ----------
store.load();
applyTheme();
midi.onStatus(renderTop);
store.subscribe(renderTop);
window.addEventListener('hashchange', route);
route();
sync.onStatus((st) => { renderTop(); if (st.pulled) { applyTheme(); route(); toast('Progression récupérée depuis ton autre appareil.'); } });
sync.init();
if (navigator.permissions && midi.supported) {
  navigator.permissions.query({ name: 'midi' }).then((p) => { if (p.state === 'granted') midi.connect(); }).catch(() => {});
}
