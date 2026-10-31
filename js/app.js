import { h, svg, toast, progressBar, icon } from './ui.js';
import * as store from './store.js';
import * as midi from './midi.js';
import * as rythme from './rythme.js';
import * as oreille from './oreille.js';

const TABS = [
  { id: 'aujourdhui', label: 'Aujourd’hui', icon: 'today' },
  { id: 'morceaux', label: 'Morceaux', icon: 'songs' },
  { id: 'travail', label: 'Travail', icon: 'work' },
  { id: 'oreille', label: 'Oreille', icon: 'ear' },
  { id: 'culture', label: 'Culture', icon: 'culture' },
  { id: 'journal', label: 'Journal', icon: 'journal' },
];

const view = document.getElementById('view');
let cleanup = null;
let pending = null;

const app = {
  open(tab, params) { pending = params || null; if (location.hash === `#${tab}`) route(); else location.hash = tab; },
  celebrate(out) {
    if (out.levelUp) toast(`Niveau ${out.levelUp} : ${store.tempoName(out.levelUp)} !`, 'big');
    if (out.skillUp) toast(`Nouveau niveau de compétence : ${out.skillUp}. De nouveaux exercices sont débloqués.`);
    (out.quests || []).forEach((q) => toast(`Quête réussie : ${q.text} (+${store.QUEST_REWARD} XP)`, 'big'));
    renderTop();
  },
};

// ---------- Thème ----------
function applyTheme() {
  const t = store.get().settings.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

// ---------- Barre du haut ----------
const topEl = document.getElementById('top-status');
function renderTop() {
  const g = store.globalLevel();
  const ms = midi.getStatus();
  topEl.replaceChildren(
    h('div', { class: 'lvl' },
      h('span', { class: 'lvl-name' }, `Niv. ${g.level} · ${store.tempoName(g.level)}`),
      progressBar(g.pct, 'Progression vers le niveau suivant')),
    h('button', { type: 'button', class: `midi-chip st-${ms.status}`, onclick: () => midi.connect(), title: ms.inputs.join(', ') || null },
      icon('piano', 'ic sm'), h('span', null, midi.statusLabel(ms))));
}

// ---------- Navigation ----------
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
  const params = pending;
  pending = null;
  renderNav();
  view.replaceChildren();
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  const pages = { aujourdhui: today, morceaux: songs, travail: work, oreille: (el, p) => oreille.render(el, app, p), culture, journal };
  cleanup = pages[tab](view, params || {}) || null;
}

// ---------- Aujourd'hui ----------
const PLANS = {
  15: [['morceau', 10], ['rythme', 5]],
  30: [['morceau', 15], ['rythme', 10], ['oreille', 5]],
  45: [['morceau', 20], ['rythme', 15], ['oreille', 10]],
  60: [['morceau', 25], ['rythme', 15], ['oreille', 10], ['theorie', 10]],
};

function pickSong() {
  const s = store.get();
  const last = (id) => { const e = s.history.find((x) => x.activity === 'morceau' && x.song === id); return e ? e.t : ''; };
  const list = s.songs.slice().sort((a, b) => (b.jam - a.jam) || last(a.id).localeCompare(last(b.id)));
  return list[0];
}
function pickPattern() {
  const s = store.get();
  const lvl = store.skillLevel('rythme').level;
  const open = rythme.PATTERNS.filter((p) => p.level <= lvl);
  return open.slice().sort((a, b) => (s.best[`rythme:${a.id}`] ?? -1) - (s.best[`rythme:${b.id}`] ?? -1))[0];
}

function today(el) {
  const s = store.get();
  const minutes = s.settings.minutes;
  const done = store.historyToday();
  const d = new Date();
  const dateTxt = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const doneSong = done.find((x) => x.activity === 'morceau');
  const song = (doneSong && s.songs.find((x) => x.id === doneSong.song)) || pickSong();
  const donePat = done.find((x) => x.activity === 'rythme');
  const pat = (donePat && rythme.patternById[donePat.pattern]) || pickPattern();
  const earMode = d.getDate() % 2 ? 'intervalles' : 'accords';

  const items = PLANS[minutes].map(([kind, mins]) => {
    if (kind === 'morceau' && song) {
      return { tag: 'Morceau', title: song.title, sub: song.notes ? song.notes.split('.')[0] : song.artist, mins, done: done.some((x) => x.activity === 'morceau' && x.song === song.id), go: () => app.open('morceaux', { song: song.id, mins }) };
    }
    if (kind === 'rythme') return { tag: 'Rythme', title: pat.name, sub: 'Au métronome, mesuré au MIDI', mins, done: done.some((x) => x.activity === 'rythme'), go: () => app.open('travail', { pattern: pat.id }) };
    if (kind === 'oreille') return { tag: 'Oreille', title: earMode === 'intervalles' ? 'Intervalles' : 'Accords', sub: '10 questions', mins, done: done.some((x) => x.activity === 'oreille'), go: () => app.open('oreille', { mode: earMode, start: true }) };
    return { tag: 'Théorie', title: 'Quiz de théorie', sub: '10 questions', mins, done: done.some((x) => x.activity === 'theorie'), go: () => app.open('oreille', { mode: 'theorie', start: true }) };
  });

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
      h('p', { class: 'muted hand' }, dateTxt),
      h('h1', { class: 'display' }, 'Salut Christopher')),
    h('section', { class: 'card stack' },
      h('div', { class: 'card-head' },
        h('h2', { class: 'hand-title' }, 'Au programme'),
        h('div', { class: 'seg small', role: 'group', 'aria-label': 'Temps disponible' },
          Object.keys(PLANS).map((m) => h('button', { type: 'button', class: +m === minutes ? 'on' : '', 'aria-pressed': +m === minutes ? 'true' : 'false', onclick: () => { store.setSetting('minutes', +m); route(); } }, `${m}′`)))),
      h('div', { class: 'plan' }, items.map((it) => h('button', { type: 'button', class: `plan-item${it.done ? ' done' : ''}`, onclick: it.go },
        h('span', { class: 'tick' }, it.done ? icon('check', 'ic sm') : null),
        h('span', { class: 'plan-main' }, h('span', { class: 'tag' }, it.tag), h('strong', null, it.title), h('span', { class: 'muted small' }, it.sub)),
        h('span', { class: 'hand mins' }, `${it.mins}′`)))),
      h('p', { class: 'muted small' }, `XP du jour : ${dx} / ${store.DAILY_CAP}. Au-delà, l’XP ne compte plus jusqu’à demain : pas besoin d’en faire trop.`)),
    h('div', { class: 'grid2' },
      quests.map((q) => h('section', { class: `card stack quest${q.done ? ' done' : ''}` },
        h('span', { class: 'hand-title sm' }, q.done ? 'Quête réussie' : 'Quête de la semaine'),
        h('strong', null, q.text),
        progressBar(Math.round((q.progress / q.target) * 100), q.text),
        h('span', { class: 'muted small num' }, `${q.progress} / ${q.target} · +${store.QUEST_REWARD} XP`)))),
  );
}

// ---------- Morceaux ----------
function songs(el, params) {
  const s = store.get();
  const wrap = h('div', { class: 'stack' });
  el.append(wrap);
  function draw() {
    wrap.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Morceaux'),
        h('p', { class: 'lead' }, 'Le cœur de ta pratique. Note où tu en es et enregistre ton temps de travail.')),
      ...s.songs.map((song) => {
        const worked = s.history.filter((x) => x.activity === 'morceau' && x.song === song.id);
        const mins = worked.reduce((t, x) => t + (x.minutes || 0), 0);
        const notesId = `notes-${song.id}`;
        return h('section', { class: `card stack${params.song === song.id ? ' focus' : ''}`, id: `song-${song.id}` },
          h('div', { class: 'card-head' },
            h('div', null, h('h2', null, song.title), h('span', { class: 'muted small' }, song.artist)),
            song.jam ? h('span', { class: 'tag' }, 'Jam') : null),
          h('label', { for: notesId, class: 'small muted' }, 'Où j’en suis'),
          h('textarea', { id: notesId, rows: 2, onchange: (e) => { song.notes = e.target.value; store.save(); } }, song.notes || ''),
          h('div', { class: 'row wrap' },
            h('span', { class: 'muted small' }, mins ? `${mins} min travaillées au total` : 'Pas encore de séance enregistrée'),
            h('span', { class: 'spacer' }),
            [10, 20, 30].map((m) => h('button', {
              type: 'button', class: `btn ${params.mins === m && params.song === song.id ? '' : 'ghost'} sm`,
              onclick: () => {
                const out = store.award('morceaux', m, { activity: 'morceau', song: song.id, jam: song.jam, minutes: m, label: `${song.title} · ${m} min` });
                toast(`+${out.gained} XP sur ${song.title}${out.capped ? ' (plafond du jour)' : ''}`);
                app.celebrate(out);
                draw();
              },
            }, `+${m} min`))));
      }),
      addForm());
    if (params.song) setTimeout(() => document.getElementById(`song-${params.song}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  }
  function addForm() {
    const f = h('form', { class: 'card stack', onsubmit: (e) => {
      e.preventDefault();
      const title = f.querySelector('#new-title').value.trim();
      if (!title) return;
      s.songs.push({ id: `m-${Date.now()}`, title, artist: f.querySelector('#new-artist').value.trim(), jam: f.querySelector('#new-jam').checked, notes: '' });
      store.save();
      draw();
    } },
    h('h2', null, 'Ajouter un morceau'),
    h('label', { for: 'new-title' }, 'Titre'), h('input', { id: 'new-title', type: 'text', required: true, autocomplete: 'off' }),
    h('label', { for: 'new-artist' }, 'Artiste ou version de référence'), h('input', { id: 'new-artist', type: 'text', autocomplete: 'off' }),
    h('label', { class: 'check' }, h('input', { id: 'new-jam', type: 'checkbox' }), 'Morceau de la jam'),
    h('button', { class: 'btn', type: 'submit' }, 'Ajouter'));
    return f;
  }
  draw();
}

// ---------- Travail ----------
function work(el, params) {
  const box = h('div', { class: 'stack' });
  el.append(box);
  const stop = rythme.render(box, app, params);
  el.append(h('section', { class: 'stack soon' },
    h('h2', { class: 'hand-title' }, 'Bientôt dans Travail'),
    h('div', { class: 'grid2' },
      [['Gammes et harmonisation', 'V2'], ['Suites d’accords', 'V2'], ['Voicings et fioritures', 'V3'], ['Licks et relevés', 'V3'], ['Impro', 'V3'], ['Dictée mélodique', 'V3']]
        .map(([t, v]) => h('div', { class: 'card locked' }, icon('lock', 'ic sm'), h('strong', null, t), h('span', { class: 'muted small' }, v))))));
  return stop;
}

// ---------- Culture ----------
function culture(el) {
  el.append(h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Culture'),
    h('p', { class: 'lead' }, 'Arrive en V2. Chaque fiche sera vérifiée et sourcée avant d’entrer dans l’appli.')),
  h('div', { class: 'grid2' },
    ['Carte du jour', 'Grands compositeurs', 'Grands interprètes', 'Histoire des mouvements', 'Albums et morceaux incontournables', 'Citations vérifiées', 'Familles d’instruments', 'Ponts entre genres', 'Quiz éclair', 'Ma liste d’écoute']
      .map((t) => h('div', { class: 'card locked' }, icon('lock', 'ic sm'), h('strong', null, t)))));
}

// ---------- Journal ----------
function journal(el) {
  const s = store.get();
  const g = store.globalLevel();
  const ms = midi.getStatus();
  const confirmBox = h('div', { class: 'row', hidden: true },
    h('span', null, 'Effacer toute ta progression ?'),
    h('button', { class: 'btn danger sm', type: 'button', onclick: () => { store.reset(); applyTheme(); toast('Progression effacée.'); route(); } }, 'Oui, tout effacer'),
    h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { confirmBox.hidden = true; } }, 'Annuler'));
  const fileIn = h('input', { id: 'import-file', type: 'file', accept: 'application/json,.json', hidden: true, onchange: async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { store.importJson(await f.text()); applyTheme(); toast('Progression importée.'); route(); } catch (err) { toast(err.message || 'Import impossible.', 'bad'); }
  } });

  el.append(
    h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Journal')),
    h('section', { class: 'card stack' },
      h('div', { class: 'card-head' }, h('h2', null, `Niveau ${g.level} · ${store.tempoName(g.level)}`), h('span', { class: 'muted small num' }, `${s.xp} XP`)),
      progressBar(g.pct), h('span', { class: 'muted small num' }, `${g.into} / ${g.need} XP avant ${store.tempoName(g.level + 1)}`),
      h('div', { class: 'skills' }, Object.entries(store.SKILLS).map(([k, label]) => {
        const l = store.skillLevel(k);
        return h('div', { class: 'skill' }, h('span', null, label), h('span', { class: 'num muted small' }, `niv. ${l.level}`), progressBar(l.pct, label));
      }))),
    h('section', { class: 'card stack' }, h('h2', null, 'Dernières séances'),
      s.history.length ? h('ul', { class: 'hist' }, s.history.slice(0, 30).map((x) => h('li', null,
        h('span', { class: 'muted small num' }, new Date(x.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })),
        h('span', null, x.label || x.activity, x.score != null && x.activity !== 'morceau' ? h('span', { class: 'muted' }, ` · ${x.score} %`) : null),
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
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { store.setSetting('calibrated', false); app.open('travail'); } }, 'Recalibrer'))),
    h('section', { class: 'card stack' }, h('h2', null, 'Sauvegarde'),
      h('p', { class: 'muted small' }, 'Ta progression est enregistrée dans ce navigateur, sur cet appareil. Pour la passer sur un autre appareil : exporte-la ici, puis importe le fichier là-bas.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => {
          const blob = new Blob([store.exportJson()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `appli-piano-${store.today()}.json` });
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
