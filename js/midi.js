// Connexion au piano en MIDI (Web MIDI, Chrome sur Mac et Android) + saisie au doigt en secours.
const noteListeners = new Set();
const statusListeners = new Set();
let access = null;
let status = 'off'; // off | pending | on | nodevice | blocked | unsupported

export const supported = typeof navigator.requestMIDIAccess === 'function';

export function getStatus() {
  const inputs = access ? [...access.inputs.values()].filter((i) => i.state === 'connected').map((i) => i.name || 'Clavier MIDI') : [];
  return { status, inputs };
}
function emitStatus() { const s = getStatus(); statusListeners.forEach((f) => f(s)); }

export function onStatus(fn) { statusListeners.add(fn); fn(getStatus()); return () => statusListeners.delete(fn); }
export function onNote(fn) { noteListeners.add(fn); return () => noteListeners.delete(fn); }

function handle(e) {
  const d = e.data;
  if (!d || d.length < 3) return;
  const st = d[0] & 0xf0;
  if (st === 0x90 && d[2] > 0) {
    const t = e.timeStamp > 0 ? e.timeStamp : performance.now();
    noteListeners.forEach((f) => f({ note: d[1], vel: d[2], t, source: 'midi' }));
  }
}

function bind() {
  let n = 0;
  access.inputs.forEach((i) => { i.onmidimessage = handle; if (i.state === 'connected') n++; });
  status = n ? 'on' : 'nodevice';
  emitStatus();
}

export async function connect() {
  if (!supported) { status = 'unsupported'; emitStatus(); return false; }
  status = 'pending';
  emitStatus();
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
    access.onstatechange = bind;
    bind();
    return true;
  } catch (err) {
    status = 'blocked';
    emitStatus();
    return false;
  }
}

// Frappe au doigt (écran ou clavier d'ordinateur) : même circuit que les notes MIDI, sans hauteur.
export function emitTap(t) {
  noteListeners.forEach((f) => f({ note: null, vel: 100, t: t || performance.now(), source: 'tap' }));
}

export function statusLabel(s) {
  switch (s.status) {
    case 'on': return 'Piano connecté';
    case 'pending': return 'Connexion…';
    case 'nodevice': return 'Aucun piano détecté';
    case 'blocked': return 'MIDI refusé';
    case 'unsupported': return 'MIDI indisponible ici';
    default: return 'Connecter le piano';
  }
}
