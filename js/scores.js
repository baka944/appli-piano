// Partitions : fichiers PDF ou images gardés dans le navigateur (IndexedDB), jamais publiés sur le site.
const DB = 'appli-piano-partitions';
const STORE = 'files';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('player', 'player');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const os = t.objectStore(STORE);
    const out = fn(os);
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
    t.onerror = () => reject(t.error);
  });
}

export async function list(player) {
  const all = await tx('readonly', (os) => os.index('player').getAll(player));
  return (all || []).map(({ blob, ...meta }) => meta).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
export async function get(id) { return tx('readonly', (os) => os.get(id)); }
export async function add(player, file, songId = '') {
  const rec = {
    id: `pa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    player, name: file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim(), type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/*'),
    size: file.size, songId, added: new Date().toISOString(), blob: file,
  };
  await tx('readwrite', (os) => os.put(rec));
  return rec;
}
export async function update(id, patch) {
  const rec = await get(id);
  if (!rec) return null;
  Object.assign(rec, patch);
  await tx('readwrite', (os) => os.put(rec));
  return rec;
}
export async function remove(id) { return tx('readwrite', (os) => os.delete(id)); }

// ---------- Lecteur PDF (pdf.js chargé à la demande) ----------
let pdfjs = null;
function loadPdfJs() {
  if (pdfjs) return Promise.resolve(pdfjs);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      pdfjs = window.pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjs);
    };
    s.onerror = () => reject(new Error('Le lecteur de PDF n’a pas pu se charger (connexion internet ?).'));
    document.head.append(s);
  });
}

// Affiche une partition dans `box`. Retourne { zoom(f) }.
export async function render(box, rec, zoom = 1) {
  box.replaceChildren();
  if (!rec.type.includes('pdf')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(rec.blob);
    img.alt = rec.name;
    img.className = 'score-page';
    img.style.width = `${zoom * 100}%`;
    box.append(img);
    return;
  }
  const lib = await loadPdfJs();
  const data = await rec.blob.arrayBuffer();
  const doc = await lib.getDocument({ data }).promise;
  const width = box.clientWidth || 360;
  const dpr = window.devicePixelRatio || 1;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = (width * zoom) / base.width;
    const vp = page.getViewport({ scale: scale * dpr });
    const canvas = document.createElement('canvas');
    canvas.className = 'score-page';
    canvas.width = vp.width;
    canvas.height = vp.height;
    canvas.style.width = `${vp.width / dpr}px`;
    canvas.setAttribute('aria-label', `${rec.name}, page ${i} sur ${doc.numPages}`);
    box.append(canvas);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  }
}
