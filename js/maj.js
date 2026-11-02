// Mises à jour de l'appli : version toujours à jour à l'ouverture, et bandeau si une version sort pendant que l'appli reste ouverte.
import { h } from './ui.js';

let loaded = null;
const fetchVersion = () => fetch('version.json', { cache: 'no-store' }).then((r) => r.json()).then((j) => j.version);

export const version = () => fetchVersion().then((v) => { loaded = loaded || v; return loaded; }).catch(() => loaded);

function showBar() {
  if (document.getElementById('update-bar')) return;
  document.body.append(h('div', { id: 'update-bar', class: 'update-bar', role: 'status' },
    h('span', null, 'Nouvelle version de l’appli disponible.'),
    h('button', { class: 'btn sm', type: 'button', onclick: () => location.reload() }, 'Mettre à jour')));
}
async function check() {
  try {
    const v = await fetchVersion();
    if (!loaded) loaded = v;
    else if (v !== loaded) showBar();
  } catch (e) { /* pas de connexion : on réessaiera */ }
}

export function start() {
  if ('serviceWorker' in navigator) {
    const first = !navigator.serviceWorker.controller;
    // Première installation : on recharge une seule fois pour quitter les fichiers gardés en cache par le navigateur.
    if (first) navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  }
  check();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(check, 5 * 60 * 1000);
}
