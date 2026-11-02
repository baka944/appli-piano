// Onglet Partitions : bibliothèque de tes partitions, reliées à tes morceaux.
import { h, toast, icon } from './ui.js';
import * as store from './store.js';
import * as scores from './scores.js';

export function scoreViewer(rec, onBack) {
  let zoom = 1;
  const pages = h('div', { class: 'score-pages', 'aria-live': 'polite' }, h('p', { class: 'muted' }, 'Chargement de la partition…'));
  const wrap = h('div', { class: 'stack score-viewer' },
    h('div', { class: 'row wrap' },
      h('button', { class: 'back', type: 'button', onclick: onBack }, '← Retour'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': 'Dézoomer', onclick: () => { zoom = Math.max(0.6, zoom - 0.2); draw(); } }, '−'),
      h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': 'Zoomer', onclick: () => { zoom = Math.min(2.4, zoom + 0.2); draw(); } }, '+'),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { (wrap.requestFullscreen ? wrap.requestFullscreen() : Promise.reject()).catch(() => toast('Plein écran indisponible ici.')); } }, 'Plein écran')),
    h('h1', { class: 'display' }, rec.name),
    pages);
  const draw = () => scores.render(pages, rec, zoom).catch((e) => { pages.replaceChildren(h('p', { class: 'bad' }, e.message || 'Impossible d’afficher ce fichier.')); });
  setTimeout(draw, 0);
  return wrap;
}

export function uploadButton(label, onFile) {
  const input = h('input', { type: 'file', accept: 'application/pdf,.pdf,image/*', hidden: true, onchange: (e) => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = ''; } });
  return h('span', null, h('button', { class: 'btn sm', type: 'button', onclick: () => input.click() }, label), input);
}

export function render(el, app, params = {}) {
  const s = store.get();
  const player = store.currentPlayer().id;
  const root = h('div', { class: 'stack' });
  el.append(root);
  const songName = (id) => s.songs.find((x) => x.id === id)?.title;

  async function list() {
    const items = await scores.list(player);
    const add = uploadButton('Ajouter une partition', async (f) => {
      const rec = await scores.add(player, f, guessSong(f.name));
      toast(rec.songId ? `Ajoutée et reliée à ${songName(rec.songId)}.` : 'Partition ajoutée.');
      list();
    });
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Partitions'),
        h('p', { class: 'lead' }, 'Tes partitions en PDF ou en image, reliées à tes morceaux. Elles restent dans ce navigateur : rien n’est publié sur le site.')),
      h('div', { class: 'row' }, add),
      items.length ? null : h('p', { class: 'muted' }, 'Aucune partition pour l’instant. Ajoute un PDF : s’il porte le nom d’un de tes morceaux, il y sera relié automatiquement.'),
      ...items.map((it) => h('section', { class: 'card stack' },
        h('div', { class: 'card-head' },
          h('button', { class: 'linkish', type: 'button', onclick: () => open(it.id) }, h('strong', null, it.name)),
          h('span', { class: 'muted small' }, it.type.includes('pdf') ? 'PDF' : 'Image')),
        h('div', { class: 'row wrap' },
          h('label', { for: `link-${it.id}`, class: 'small muted' }, 'Morceau'),
          h('select', { id: `link-${it.id}`, style: { width: 'auto', maxWidth: '100%' }, onchange: async (e) => { await scores.update(it.id, { songId: e.target.value }); toast('Lien enregistré.'); } },
            h('option', { value: '' }, 'Aucun'), s.songs.map((song) => h('option', { value: song.id, selected: it.songId === song.id }, song.title))),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn sm', type: 'button', onclick: () => open(it.id) }, 'Ouvrir'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await scores.remove(it.id); toast('Partition retirée.'); list(); } }, 'Retirer')))));
  }
  function guessSong(fileName) {
    const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    const f = norm(fileName);
    return (s.songs.find((song) => f.includes(norm(song.title))) || {}).id || '';
  }
  async function open(id) {
    const rec = await scores.get(id);
    if (!rec) return list();
    window.scrollTo(0, 0);
    root.replaceChildren(scoreViewer(rec, list));
  }
  if (params.open) open(params.open); else list();
}
