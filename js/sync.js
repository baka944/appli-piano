// Synchro automatique de la progression entre appareils, via Supabase (compte e-mail + mot de passe).
// Chaque joueur connecté ne peut lire et écrire que ses propres lignes (sécurité par lignes, RLS).
import * as store from './store.js';

// Renseignés une fois le projet Supabase créé (l'URL et la clé « anon » sont faites pour être publiques).
const DEFAULT_URL = '';
const DEFAULT_KEY = '';
const CFG_KEY = 'appli-piano-synchro';

let client = null;
let user = null;
let status = 'off'; // off | noconfig | signedout | syncing | ok | error
let lastError = '';
let pushTimer = null;
let applyingRemote = false;
const listeners = new Set();

function cfg() {
  let c = {};
  try { c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) { c = {}; }
  return { url: c.url || DEFAULT_URL, key: c.key || DEFAULT_KEY };
}
export function setConfig(url, key) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify({ url: url.trim(), key: key.trim() })); } catch (e) { /* rien */ }
  client = null;
  return init();
}
export function getStatus() { return { status, email: user?.email || '', error: lastError, configured: !!(cfg().url && cfg().key) }; }
export function onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function setStatus(s, err = '') { status = s; lastError = err; listeners.forEach((f) => f(getStatus())); }

function loadLib() {
  if (window.supabase) return Promise.resolve(window.supabase);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
    s.onload = () => resolve(window.supabase);
    s.onerror = () => reject(new Error('Le service de synchro ne répond pas (connexion internet ?).'));
    document.head.append(s);
  });
}

export async function init() {
  const { url, key } = cfg();
  if (!url || !key) { setStatus('noconfig'); return; }
  try {
    const lib = await loadLib();
    client = lib.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await client.auth.getSession();
    user = data.session?.user || null;
    client.auth.onAuthStateChange((_e, session) => { user = session?.user || null; if (!user) setStatus('signedout'); });
    if (!user) { setStatus('signedout'); return; }
    await pull();
  } catch (e) { setStatus('error', e.message || String(e)); }
}

export async function signUp(email, password) {
  if (!client) await init();
  const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) throw new Error(translate(error.message));
  if (data.session) { user = data.session.user; await pull(); return 'ok'; }
  return 'confirm';
}
export async function signIn(email, password) {
  if (!client) await init();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translate(error.message));
  user = data.user;
  await pull();
}
export async function signOut() { if (client) await client.auth.signOut(); user = null; setStatus('signedout'); }

function translate(msg) {
  if (/Invalid login/i.test(msg)) return 'E-mail ou mot de passe incorrect.';
  if (/Email not confirmed/i.test(msg)) return 'Confirme d’abord ton e-mail avec le lien reçu.';
  if (/already registered/i.test(msg)) return 'Ce compte existe déjà : connecte-toi.';
  if (/Password should be/i.test(msg)) return 'Mot de passe trop court (6 caractères minimum).';
  return msg;
}

const playerName = () => store.currentPlayer().name;

// Récupère la sauvegarde en ligne ; la plus récente des deux gagne.
export async function pull() {
  if (!client || !user) return;
  setStatus('syncing');
  const { data, error } = await client.from('saves').select('data, updated_at').eq('user_id', user.id).eq('player', playerName()).maybeSingle();
  if (error) { setStatus('error', error.message); return; }
  const local = store.get();
  const localAt = local.updatedAt || '';
  if (data && data.data && (data.updated_at || '') > localAt && JSON.stringify(data.data) !== JSON.stringify(local)) {
    applyingRemote = true;
    store.replace(data.data);
    applyingRemote = false;
    setStatus('ok');
    listeners.forEach((f) => f({ ...getStatus(), pulled: true }));
    return;
  }
  await push();
}

export async function push() {
  if (!client || !user) return;
  clearTimeout(pushTimer);
  setStatus('syncing');
  const s = store.get();
  const updatedAt = s.updatedAt || new Date().toISOString();
  const { error } = await client.from('saves').upsert({ user_id: user.id, player: playerName(), data: s, updated_at: updatedAt }, { onConflict: 'user_id,player' });
  if (error) setStatus('error', error.message); else setStatus('ok');
}

// Envoi automatique quelques secondes après chaque changement, et quand on quitte l'appli.
store.subscribe(() => {
  if (applyingRemote || !client || !user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 3000);
});
document.addEventListener('visibilitychange', () => {
  if (!client || !user) return;
  if (document.visibilityState === 'hidden') push();
  else pull();
});

export const SETUP_SQL = `create table public.saves (
  user_id uuid not null references auth.users on delete cascade,
  player text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, player)
);
alter table public.saves enable row level security;
create policy "lire ses sauvegardes" on public.saves for select using (auth.uid() = user_id);
create policy "créer ses sauvegardes" on public.saves for insert with check (auth.uid() = user_id);
create policy "modifier ses sauvegardes" on public.saves for update using (auth.uid() = user_id);`;
