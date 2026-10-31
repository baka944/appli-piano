// Onglet Morceaux : liste, puis une page par morceau (grille, accompagnement, modules de travail).
import { h, toast, icon, progressBar } from './ui.js';
import * as store from './store.js';
import * as audio from './audio.js';
import * as midi from './midi.js';
import { parseGrid } from './music.js';
import { allPatterns } from './rythme.js';
import * as playalong from './playalong.js';

const MODULE_TEMPLATES = [
  { kind: 'theme', name: 'Thème', hint: 'Jouer la mélodie, puis la chanter.' },
  { kind: 'comping', name: 'Accompagnement', hint: 'Main gauche sur la grille avec un rythme de comping.' },
  { kind: 'impro', name: 'Impro sur la grille', hint: 'Improviser sur l’accompagnement de l’appli.' },
  { kind: 'releve', name: 'Relevé à l’oreille', hint: 'Relever le thème ou une phrase sur l’enregistrement.' },
  { kind: 'voicings', name: 'Voicings de la grille', hint: 'Trouver et enchaîner des voicings pour chaque accord.' },
  { kind: 'tempo', name: 'Tempo cible', hint: 'Monter progressivement vers le tempo du morceau.' },
  { kind: 'libre', name: 'Autre sujet', hint: '' },
];
const STATUS = { todo: 'À faire', doing: 'En cours', done: 'Maîtrisé' };

export function render(el, app, params = {}) {
  const s = store.get();
  let session = null;
  const root = h('div', { class: 'stack' });
  el.append(root);

  const minutesOf = (song, mod) => s.history.filter((x) => (x.activity === 'morceau' || x.activity === 'playalong') && x.song === song.id && (!mod || x.module === mod)).reduce((t, x) => t + (x.minutes || 0), 0);

  // ---------- Liste ----------
  function list() {
    stopSession();
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Morceaux'),
        h('p', { class: 'lead' }, 'Ouvre un morceau pour voir sa grille, jouer dessus avec l’accompagnement et suivre tes sujets de travail.')),
      ...s.songs.map((song) => {
        const { bars } = parseGrid(song.grid);
        const mods = song.modules || [];
        const done = mods.filter((m) => m.status === 'done').length;
        return h('button', { type: 'button', class: 'card song-card', onclick: () => detail(song.id) },
          h('div', { class: 'card-head' },
            h('div', null, h('h2', null, song.title), h('span', { class: 'muted small' }, song.artist)),
            song.jam ? h('span', { class: 'tag' }, 'Jam') : null),
          bars.length ? h('div', { class: 'grid-mini hand' }, bars.slice(0, 4).map((b) => h('span', null, b.chords.map((c) => c.name).join(' ')))) : h('span', { class: 'muted small' }, 'Grille à saisir'),
          h('div', { class: 'row wrap' },
            h('span', { class: 'muted small' }, `${minutesOf(song)} min travaillées`),
            h('span', { class: 'spacer' }),
            mods.length ? h('span', { class: 'muted small' }, `${done} / ${mods.length} sujets maîtrisés`) : null));
      }),
      addForm());
  }

  function addForm() {
    const f = h('form', { class: 'card stack', onsubmit: (e) => {
      e.preventDefault();
      const title = f.querySelector('#new-title').value.trim();
      if (!title) return;
      const song = { id: `m-${Date.now().toString(36)}`, title, artist: f.querySelector('#new-artist').value.trim(), jam: f.querySelector('#new-jam').checked, notes: '', grid: '', meter: 4, tempo: 100, link: '', modules: store.defaultModules() };
      s.songs.push(song);
      store.save();
      detail(song.id);
    } },
    h('h2', null, 'Ajouter un morceau'),
    h('label', { for: 'new-title' }, 'Titre'), h('input', { id: 'new-title', type: 'text', required: true, autocomplete: 'off' }),
    h('label', { for: 'new-artist' }, 'Artiste ou version de référence'), h('input', { id: 'new-artist', type: 'text', autocomplete: 'off' }),
    h('label', { class: 'check' }, h('input', { id: 'new-jam', type: 'checkbox' }), 'Morceau de la jam'),
    h('button', { class: 'btn', type: 'submit' }, 'Ajouter'));
    return f;
  }

  // ---------- Page d'un morceau ----------
  function detail(id) {
    stopSession();
    const song = s.songs.find((x) => x.id === id);
    if (!song) return list();
    window.scrollTo(0, 0);
    const gridBox = h('div');
    const playBox = h('section', { class: 'card stack' });
    const modBox = h('section', { class: 'stack' });
    let editing = !song.grid;
    let lastTake = null;

    function drawGrid(active = -1) {
      const { bars, unknown } = parseGrid(song.grid);
      gridBox.replaceChildren(h('section', { class: 'card stack' },
        h('div', { class: 'card-head' }, h('h2', { class: 'hand-title' }, 'Grille'),
          h('div', { class: 'row' },
            h('span', { class: 'muted small' }, `${song.meter}/4`),
            h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { editing = !editing; drawGrid(); } }, editing ? 'Fermer' : 'Modifier'))),
        bars.length ? h('div', { class: `grid-view meter-${song.meter}` }, bars.map((b, i) => h('div', { class: `bar-cell${i === active ? ' now' : ''}`, 'data-bar': i },
          h('span', { class: 'bar-num' }, i + 1), h('span', { class: 'hand chords' }, b.repeat ? '%' : b.chords.map((c) => c.name).join('  ')))))
          : h('p', { class: 'muted' }, 'Pas encore de grille. Recopie-la depuis ta partition ou ton Real Book.'),
        unknown.length ? h('p', { class: 'bad small' }, `Accords non reconnus (joués comme des accords simples) : ${unknown.join(', ')}`) : null,
        editing ? gridEditor() : null));
    }
    function gridEditor() {
      return h('div', { class: 'stack' },
        h('label', { for: 'grid-text' }, 'Grille (une barre | entre chaque mesure, un espace entre deux accords d’une même mesure)'),
        h('textarea', { id: 'grid-text', rows: 5, class: 'mono', placeholder: '| Dm7 | G7 | Cmaj7 | % |\n| Fm7 Bb7 | Ebmaj7 | Am7b5 D7 | Gm7 |' }, song.grid),
        h('div', { class: 'row wrap' },
          h('label', { for: 'meter' }, 'Mesure'),
          h('select', { id: 'meter', style: { width: 'auto' } }, [4, 3].map((m) => h('option', { value: m, selected: song.meter === m }, `${m}/4`))),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn sm', type: 'button', onclick: () => {
            song.grid = document.getElementById('grid-text').value.trim();
            song.meter = +document.getElementById('meter').value;
            store.save();
            editing = false;
            drawGrid();
            drawPlay();
          } }, 'Enregistrer la grille')),
        h('p', { class: 'muted small' }, 'Exemples d’accords reconnus : C, Cm, C7, Cmaj7, Cm7, Cm7b5, C°7, C6, C9, C7b9, Csus4, C/E, Bb, F#.'));
    }

    function drawPlay() {
      const { bars } = parseGrid(song.grid);
      const pats = allPatterns();
      const st = s.settings;
      const ms = midi.getStatus();
      if (!bars.length) { playBox.replaceChildren(h('h2', { class: 'hand-title' }, 'Jouer sur la grille'), h('p', { class: 'muted' }, 'Saisis la grille pour lancer l’accompagnement.')); return; }
      const tempoOut = h('output', { class: 'num' }, song.tempo);
      playBox.replaceChildren(
        h('h2', { class: 'hand-title' }, 'Jouer sur la grille'),
        h('p', { class: 'muted small' }, 'L’appli joue la basse et les accords pendant que tu joues le thème, improvises ou fais ta main gauche.'),
        h('div', { class: 'controls' },
          h('label', { for: 'pa-tempo' }, 'Tempo ', tempoOut, ' BPM'),
          h('input', { id: 'pa-tempo', type: 'range', min: 40, max: 240, step: 2, value: song.tempo, oninput: (e) => { song.tempo = +e.target.value; tempoOut.textContent = song.tempo; }, onchange: () => store.save() }),
          h('div', { class: 'grid2 tight' },
            h('div', { class: 'stack gap4' }, h('label', { for: 'pa-what' }, 'L’appli joue'),
              h('select', { id: 'pa-what' }, [['all', 'Basse + accords'], ['bass', 'Basse seule'], ['comp', 'Accords seuls'], ['click', 'Métronome seul']].map(([v, l]) => h('option', { value: v, selected: (st.paWhat || 'all') === v }, l)))),
            h('div', { class: 'stack gap4' }, h('label', { for: 'pa-pattern' }, 'Rythme des accords'),
              h('select', { id: 'pa-pattern' }, pats.map((p) => h('option', { value: p.id, selected: (st.paPattern || 'charleston') === p.id }, p.name)))),
            h('div', { class: 'stack gap4' }, h('label', { for: 'pa-click' }, 'Métronome'),
              h('select', { id: 'pa-click' }, [['2-4', 'Sur 2 et 4'], ['tous', 'Tous les temps'], ['aucun', 'Aucun']].map(([v, l]) => h('option', { value: v, selected: (st.paClick || '2-4') === v }, l)))),
            h('div', { class: 'stack gap4' }, h('label', { for: 'pa-loops' }, 'Nombre de tours'),
              h('select', { id: 'pa-loops' }, [1, 2, 3, 4, 8].map((n) => h('option', { value: n, selected: (st.paLoops || 2) === n }, `${n} tour${n > 1 ? 's' : ''}`))))),
          h('label', { class: 'check' }, h('input', { id: 'pa-swing', type: 'checkbox', checked: st.swing }), 'Croches swing'),
          h('label', { class: 'check' }, h('input', { id: 'pa-rec', type: 'checkbox', disabled: ms.status !== 'on' }), ms.status === 'on' ? 'Enregistrer ce que je joue' : 'Enregistrer ce que je joue (piano à connecter)')),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', id: 'pa-go', onclick: () => go() }, icon('play', 'ic sm'), 'Lancer'),
          h('button', { class: 'btn ghost', type: 'button', id: 'pa-stop', hidden: true, onclick: () => session && session.stop() }, 'Arrêter'),
          lastTake && lastTake.notes.length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => go(lastTake) }, 'Réécouter ma prise') : null),
        h('p', { class: 'muted small', id: 'pa-status' }, ''),
        song.link ? h('a', { class: 'small', href: song.link, target: '_blank', rel: 'noopener' }, 'Écouter l’enregistrement original ↗') : null);
    }

    async function go(replay = null) {
      await audio.unlock();
      stopSession();
      const { bars } = parseGrid(song.grid);
      const st = s.settings;
      st.paWhat = document.getElementById('pa-what').value;
      st.paPattern = document.getElementById('pa-pattern').value;
      st.paClick = document.getElementById('pa-click').value;
      st.paLoops = +document.getElementById('pa-loops').value;
      st.swing = document.getElementById('pa-swing').checked;
      const record = !replay && document.getElementById('pa-rec').checked;
      store.save();
      const pat = allPatterns().find((p) => p.id === st.paPattern) || allPatterns()[0];
      const opts = { bass: st.paWhat === 'all' || st.paWhat === 'bass', comp: st.paWhat === 'all' || st.paWhat === 'comp', click: st.paClick };
      if (st.paWhat === 'click' && opts.click === 'aucun') opts.click = 'tous';
      const statusEl = document.getElementById('pa-status');
      document.getElementById('pa-go').hidden = true;
      document.getElementById('pa-stop').hidden = false;
      const started = performance.now();
      session = playalong.start({
        bars, meter: song.meter, bpm: song.tempo, swing: st.swing, compPattern: pat.bars[0], opts, loops: replay ? replay.loops : st.paLoops, record,
        takeToReplay: replay,
        onBar: (b, k, count) => {
          drawGrid(b);
          statusEl.textContent = b < 0 ? `Décompte : ${count}` : `Tour ${Math.floor(k / bars.length) + 1} · mesure ${b + 1}`;
          if (b >= 0) document.querySelector(`.bar-cell[data-bar="${b}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
        onEnd: (take) => {
          session = null;
          drawGrid();
          const mins = Math.round((performance.now() - started) / 60000);
          if (!replay) {
            take.loops = st.paLoops;
            if (take.notes.length) lastTake = take;
            const out = store.award('morceaux', Math.max(2, mins * 2), { activity: 'playalong', song: song.id, jam: song.jam, minutes: Math.max(1, mins), label: `${song.title} · sur la grille à ${song.tempo} BPM` });
            app.celebrate(out);
            toast(`+${out.gained} XP · ${Math.max(1, mins)} min sur ${song.title}`);
          }
          drawPlay();
        },
      });
    }

    function drawModules() {
      const mods = song.modules || (song.modules = []);
      modBox.replaceChildren(
        h('div', { class: 'card-head' }, h('h2', { class: 'hand-title' }, 'Sujets de travail'),
          h('span', { class: 'muted small' }, `${minutesOf(song)} min au total`)),
        ...mods.map((m) => {
          const notesId = `mod-notes-${m.id}`;
          return h('section', { class: `card stack mod st-${m.status}` },
            h('div', { class: 'card-head' },
              h('strong', null, m.name),
              h('select', { 'aria-label': `État de ${m.name}`, style: { width: 'auto' }, onchange: (e) => { m.status = e.target.value; store.save(); drawModules(); } },
                Object.entries(STATUS).map(([k, v]) => h('option', { value: k, selected: m.status === k }, v)))),
            MODULE_TEMPLATES.find((t) => t.kind === m.kind)?.hint ? h('span', { class: 'muted small' }, MODULE_TEMPLATES.find((t) => t.kind === m.kind).hint) : null,
            h('label', { for: notesId, class: 'small muted' }, 'Notes'),
            h('textarea', { id: notesId, rows: 2, onchange: (e) => { m.notes = e.target.value; store.save(); } }, m.notes || ''),
            h('div', { class: 'row wrap' },
              h('span', { class: 'muted small' }, `${minutesOf(song, m.id)} min`),
              h('span', { class: 'spacer' }),
              [10, 20, 30].map((n) => h('button', { type: 'button', class: 'btn ghost sm', onclick: () => {
                const out = store.award('morceaux', n, { activity: 'morceau', song: song.id, module: m.id, jam: song.jam, minutes: n, label: `${song.title} · ${m.name} · ${n} min` });
                if (m.status === 'todo') m.status = 'doing';
                store.save();
                toast(`+${out.gained} XP${out.capped ? ' (plafond du jour)' : ''}`);
                app.celebrate(out);
                drawModules();
              } }, `+${n} min`)),
              h('button', { type: 'button', class: 'btn ghost sm', 'aria-label': `Retirer ${m.name}`, onclick: () => { song.modules = mods.filter((x) => x.id !== m.id); store.save(); drawModules(); } }, 'Retirer')));
        }),
        addModule());
    }
    function addModule() {
      const sel = h('select', { id: 'mod-kind' }, MODULE_TEMPLATES.map((t) => h('option', { value: t.kind }, t.name)));
      const name = h('input', { id: 'mod-name', type: 'text', placeholder: 'Nom (pour « Autre sujet »)', autocomplete: 'off' });
      return h('div', { class: 'card stack' },
        h('label', { for: 'mod-kind' }, 'Ajouter un sujet de travail'), sel, name,
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => {
          const t = MODULE_TEMPLATES.find((x) => x.kind === sel.value);
          const label = (t.kind === 'libre' ? name.value.trim() : '') || (t.kind === 'libre' ? 'Autre sujet' : t.name);
          song.modules.push({ id: `mod-${Date.now().toString(36)}`, kind: t.kind, name: label, status: 'todo', notes: '' });
          store.save();
          drawModules();
        } }, 'Ajouter'));
    }

    const confirmDel = h('div', { class: 'row', hidden: true },
      h('span', null, 'Supprimer ce morceau et ses notes ?'),
      h('button', { class: 'btn danger sm', type: 'button', onclick: () => { s.songs = s.songs.filter((x) => x.id !== song.id); store.save(); list(); } }, 'Supprimer'),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { confirmDel.hidden = true; } }, 'Annuler'));

    root.replaceChildren(
      h('button', { class: 'back', type: 'button', onclick: list }, '← Tous les morceaux'),
      h('div', { class: 'page-head' },
        h('h1', { class: 'display' }, song.title),
        h('p', { class: 'lead' }, song.artist, song.jam ? ' · morceau de la jam' : '')),
      gridBox, playBox, modBox,
      h('section', { class: 'card stack' },
        h('h2', null, 'Infos du morceau'),
        h('label', { for: 'song-notes', class: 'small muted' }, 'Où j’en suis'),
        h('textarea', { id: 'song-notes', rows: 2, onchange: (e) => { song.notes = e.target.value; store.save(); } }, song.notes || ''),
        h('label', { for: 'song-link', class: 'small muted' }, 'Lien vers l’enregistrement (Spotify, Deezer, YouTube…)'),
        h('input', { id: 'song-link', type: 'url', value: song.link || '', placeholder: 'https://', onchange: (e) => { song.link = e.target.value.trim(); store.save(); drawPlay(); } }),
        h('label', { for: 'song-artist', class: 'small muted' }, 'Artiste ou version de référence'),
        h('input', { id: 'song-artist', type: 'text', value: song.artist || '', onchange: (e) => { song.artist = e.target.value; store.save(); } }),
        h('label', { class: 'check' }, h('input', { id: 'song-jam', type: 'checkbox', checked: song.jam, onchange: (e) => { song.jam = e.target.checked; store.save(); } }), 'Morceau de la jam'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { confirmDel.hidden = false; } }, 'Supprimer le morceau'),
        confirmDel));
    drawGrid();
    drawPlay();
    drawModules();
  }

  function stopSession() { if (session) { session.stop(); session = null; } }

  if (params.song) detail(params.song); else list();
  return stopSession;
}
