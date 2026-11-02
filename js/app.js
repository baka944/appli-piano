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
import { PILIERS, conseilDuJour } from './conseils.js';

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
  const dirty = unsaved();
  return h('button', { type: 'button', class: `save-chip${dirty ? ' dirty' : ''}`, onclick: quickSave, title: dirty ? 'Des progrès ne sont pas encore sauvegardés' : 'Tout est sauvegardé', 'aria-label': 'Sauvegarder ma progression' },
    icon('save', 'ic sm'), h('span', null, dirty ? 'Sauver' : 'Sauvé'));
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
const PLANS = {
  15: [['morceau', 10], ['rythme', 5]],
  30: [['morceau', 15], ['rythme', 10], ['oreille', 5]],
  45: [['morceau', 20], ['rythme', 15], ['oreille', 10]],
  60: [['morceau', 25], ['rythme', 15], ['oreille', 10], ['harmonie', 10]],
};
function pickSong() {
  const s = store.get();
  const last = (id) => { const e = s.history.find((x) => (x.activity === 'morceau' || x.activity === 'playalong') && x.song === id); return e ? e.t : ''; };
  return s.songs.slice().sort((a, b) => (b.jam - a.jam) || last(a.id).localeCompare(last(b.id)))[0];
}
function pickPattern() {
  const s = store.get();
  const lvl = store.skillLevel('rythme').level;
  return rythme.allPatterns().filter((p) => p.level <= lvl).sort((a, b) => (s.best[`rythme:${a.id}`] ?? -1) - (s.best[`rythme:${b.id}`] ?? -1))[0];
}

function today(el) {
  const s = store.get();
  const minutes = s.settings.minutes;
  const done = store.historyToday();
  const d = new Date();
  const doneSong = done.find((x) => x.activity === 'morceau' || x.activity === 'playalong');
  const song = (doneSong && s.songs.find((x) => x.id === doneSong.song)) || pickSong();
  const donePat = done.find((x) => x.activity === 'rythme');
  const pat = (donePat && rythme.findPattern(donePat.pattern)) || pickPattern();
  const earMode = ['intervalles', 'accords', 'progressions'][d.getDate() % 3];
  const has = (...acts) => done.some((x) => acts.includes(x.activity));

  const items = PLANS[minutes].map(([kind, mins]) => {
    if (kind === 'morceau') {
      if (!song) return { tag: 'Morceau', title: 'Ajoute un morceau', sub: 'Onglet Morceaux', mins, done: false, go: () => app.open('morceaux') };
      return { tag: 'Morceau', title: song.title, sub: song.grid ? 'Ouvrir la grille et jouer dessus' : 'Saisir la grille', mins, done: done.some((x) => (x.activity === 'morceau' || x.activity === 'playalong') && x.song === song.id), go: () => app.open('morceaux', { song: song.id }) };
    }
    if (kind === 'rythme') return { tag: 'Rythme', title: pat.name, sub: 'Au métronome, mesuré au MIDI', mins, done: has('rythme'), go: () => app.open('travail', { sub: 'rythme', pattern: pat.id }) };
    if (kind === 'oreille') return { tag: 'Oreille', title: { intervalles: 'Intervalles', accords: 'Accords', progressions: 'Progressions' }[earMode], sub: '10 questions', mins, done: has('oreille'), go: () => app.open('oreille', { mode: earMode }) };
    return { tag: 'Harmonie', title: 'Suites d’accords', sub: 'Au piano, dans plusieurs tonalités', mins, done: has('suites', 'harmonisation', 'gammes'), go: () => app.open('travail', { sub: 'suites' }) };
  });

  const tip = conseilDuJour(d);
  const pillarDone = { morceau: has('morceau', 'playalong'), temps: has('rythme', 'playalong'), oreille: has('oreille', 'ecoute') };
  const quests = store.weekQuests();
  const dx = store.dailyXp();
  el.append(
    h('div', { class: 'hero' },
      svg(`<svg class="staff" viewBox="0 0 350 70" aria-hidden="true">
        <g class="staff-lines"><line x1="0" y1="20" x2="350" y2="20"/><line x1="0" y1="30" x2="350" y2="30"/><line x1="0" y1="40" x2="350" y2="40"/><line x1="0" y1="50" x2="350" y2="50"/><line x1="0" y1="60" x2="350" y2="60"/></g>
        <g class="staff-bars"><line x1="1" y1="20" x2="1" y2="60"/><line x1="175" y1="20" x2="175" y2="60"/><line x1="349" y1="20" x2="349" y2="60"/></g>
        <g class="staff-notes"><ellipse cx="40" cy="45" rx="5.5" ry="4" transform="rotate(-20 40 45)"/><line x1="45.3" y1="44" x2="45.3" y2="18"/>
        <ellipse cx="70" cy="40" rx="5.5" ry="4" transform="rotate(-20 70 40)"/><line x1="75.3" y1="39" x2="75.3" y2="13"/><line x1="45.3" y1="18" x2="75.3" y2="13" stroke-width="3.5"/>
        <ellipse cx="125" cy="35" rx="5.5" ry="4" transform="rotate(-20 125 35)" class="open"/><line x1="130.3" y1="34" x2="130.3" y2="8"/>
        <ellipse cx="215" cy="50" rx="5.5" ry="4" transform="rotate(-20 215 50)"/><line x1="220.3" y1="49" x2="220.3" y2="23"/>
        <ellipse cx="250" cy="55" rx="5.5" ry="4" transform="rotate(-20 250 55)"/><line x1="255.3" y1="54" x2="255.3" y2="28"/><line x1="220.3" y1="23" x2="255.3" y2="28" stroke-width="3.5"/>
        <ellipse cx="305" cy="45" rx="5.5" ry="4" transform="rotate(-20 305 45)" class="open"/><line x1="310.3" y1="44" x2="310.3" y2="18"/></g>
        <text x="8" y="12" class="chord">F</text><text x="182" y="12" class="chord">Em</text></svg>`),
      h('p', { class: 'muted hand' }, d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })),
      h('h1', { class: 'display' }, `Salut ${store.currentPlayer().name}`)),
    h('section', { class: 'card stack essentiel' },
      h('h2', { class: 'hand-title' }, 'L’essentiel du jour'),
      h('div', { class: 'piliers' }, PILIERS.map((p) => h('div', { class: `pilier${pillarDone[p.id] ? ' done' : ''}` },
        h('span', { class: 'tick' }, pillarDone[p.id] ? icon('check', 'ic sm') : null),
        h('span', null, h('strong', null, p.title), h('span', { class: 'muted small' }, p.text))))),
      h('details', { class: 'tip' },
        h('summary', null, h('strong', null, `Conseil : ${tip.title}`)),
        h('p', null, tip.text),
        h('p', { class: 'small' }, h('span', { class: 'proof' }, `Niveau de preuve : ${tip.preuve}`), ' ', tip.detail),
        tip.source ? h('a', { class: 'small', href: tip.source.url, target: '_blank', rel: 'noopener' }, tip.source.label) : null)),
    h('section', { class: 'card stack' },
      h('div', { class: 'card-head' },
        h('h2', { class: 'hand-title' }, 'Au programme'),
        h('div', { class: 'seg small', role: 'group', 'aria-label': 'Temps disponible' },
          Object.keys(PLANS).map((m) => h('button', { type: 'button', class: +m === minutes ? 'on' : '', 'aria-pressed': +m === minutes ? 'true' : 'false', onclick: () => { store.setSetting('minutes', +m); route(); } }, `${m}′`)))),
      h('div', { class: 'plan' }, items.map((it) => h('button', { type: 'button', class: `plan-item${it.done ? ' done' : ''}`, onclick: it.go },
        h('span', { class: 'tick' }, it.done ? icon('check', 'ic sm') : null),
        h('span', { class: 'plan-main' }, h('span', { class: 'tag' }, it.tag), h('strong', null, it.title), h('span', { class: 'muted small' }, it.sub)),
        h('span', { class: 'hand mins' }, `${it.mins}′`)))),
      h('p', { class: 'muted small' }, `XP du jour : ${dx} / ${store.DAILY_CAP}. Au-delà, l’XP ne compte plus jusqu’à demain.`)),
    h('h2', { class: 'hand-title' }, 'Quêtes de la semaine'),
    h('div', { class: 'grid2' }, quests.map((q) => h('section', { class: `card stack quest${q.done ? ' done' : ''}` },
      h('strong', null, q.text),
      h('span', { class: 'muted small' }, q.why),
      progressBar(Math.round((q.progress / q.target) * 100), q.text),
      h('span', { class: 'muted small num' }, q.done ? `Réussie · +${store.QUEST_REWARD} XP` : `${q.progress} / ${q.target} · +${store.QUEST_REWARD} XP`)))),
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

// ---------- Démarrage ----------
store.load();
applyTheme();
midi.onStatus(renderTop);
store.subscribe(renderTop);
window.addEventListener('hashchange', route);
route();
if (navigator.permissions && midi.supported) {
  navigator.permissions.query({ name: 'midi' }).then((p) => { if (p.state === 'granted') midi.connect(); }).catch(() => {});
}
