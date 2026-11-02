// V3 : licks et relevés, voicings et fioritures, impro guidée, dictée de motifs.
import { h, toast, pick, weightedPick, shuffle } from './ui.js';
import * as store from './store.js';
import * as audio from './audio.js';
import * as midi from './midi.js';
import { screenKeyboard, chordCollector, mark } from './keyboard.js';
import { KEYS, CIRCLE_FOURTHS, nameFr, pc, majorScale, parseGrid, PROGRESSIONS, realize } from './music.js';
import { LICKS, CONTEXTS, FIORITURES, VOICINGS, QUAL, CONSIGNES } from './licks-data.js';
import * as playalong from './playalong.js';
import { allPatterns } from './rythme.js';

const PC = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const keyLabel = (k) => nameFr(k);
function inputHint() {
  return h('p', { class: 'muted small' }, midi.isOn() ? 'Joue au piano (n’importe quelle octave). Le clavier à l’écran reste disponible.' : 'Piano non connecté : utilise le clavier à l’écran.');
}
function keySelect(id, value, onchange, keys = KEYS) {
  return h('select', { id, onchange }, keys.map((k, i) => h('option', { value: i, selected: i === value }, keyLabel(k))));
}

// Joue un contexte harmonique + une ligne mélodique
function playLine(notes, ctxKey, tonicPc, { bpm = 120, swing = true, oct = false, withBacking = true } = {}) {
  const c = audio.getCtx();
  const beat = 60 / bpm;
  const t0 = c.currentTime + 0.1;
  const base = 60 + tonicPc;
  if (withBacking && CONTEXTS[ctxKey]) {
    let t = t0;
    CONTEXTS[ctxKey].chords.forEach(([r, semis, , bars]) => {
      const root = 48 + ((tonicPc + r) % 12);
      audio.tone(root - 12, t, bars * 4 * beat * 0.95, 0.7);
      audio.chord(semis.slice(1).map((s) => root + s), t, bars * 4 * beat * 0.9, 0.35);
      t += bars * 4 * beat;
    });
  }
  let t = t0;
  let eighth = 0;
  notes.forEach(([s, d]) => {
    const swingOff = swing && eighth % 1 === 0 && Math.floor(eighth) % 2 === 1 ? beat * 0.16 : 0;
    const when = t + swingOff;
    audio.tone(base + s, when, Math.max(0.15, d * beat * 0.5 * 0.95), 0.85);
    if (oct) audio.tone(base + s - 12, when, Math.max(0.15, d * beat * 0.5 * 0.95), 0.6);
    t += d * beat * 0.5;
    eighth += d;
  });
}

// Vérifie une suite de classes de hauteur jouée note à note
function sequenceDrill(container, expectedPcs, { onDone, labelOf = (p) => PC[p], showNames = true } = {}) {
  let i = 0;
  let errors = 0;
  const chips = h('div', { class: 'chips seq' }, expectedPcs.map((p, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, showNames ? labelOf(p) : '?')));
  const msg = h('p', { 'aria-live': 'polite' }, showNames ? `Commence par ${labelOf(expectedPcs[0])}.` : 'À toi de jouer.');
  const kb = screenKeyboard({ low: 48, octaves: 2 });
  container.append(chips, msg, kb, inputHint());
  const off = midi.onNote((e) => {
    if (e.note == null || i >= expectedPcs.length) return;
    if (e.note % 12 === expectedPcs[i]) {
      const chip = chips.querySelector(`[data-k="${i}"]`);
      chip.className = 'chip done';
      chip.textContent = labelOf(expectedPcs[i]);
      i++;
      if (i >= expectedPcs.length) { cleanup(); onDone(errors); return; }
      chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
      msg.textContent = 'Bien.';
    } else {
      errors++;
      msg.textContent = `Pas cette note (${PC[e.note % 12]}).`;
    }
  });
  const cleanup = () => { off(); kb.destroy && kb.destroy(); };
  return cleanup;
}

// ---------- Licks et relevés ----------
export function licks(root, app) {
  const s = store.get();
  let cleanup = () => {};
  let view = 'biblio';
  function header() {
    return h('div', { class: 'stack' },
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Licks'),
        h('p', { class: 'lead' }, 'Du vocabulaire à écouter, jouer au piano et transposer dans les 12 tonalités. Les licks sont écrits pour l’appli, dans le style des musiciens que tu aimes.')),
      h('div', { class: 'seg', role: 'tablist' }, [['biblio', 'Bibliothèque'], ['releves', 'Mes relevés']].map(([id, l]) =>
        h('button', { type: 'button', role: 'tab', 'aria-selected': view === id ? 'true' : 'false', class: view === id ? 'on' : '', onclick: () => { view = id; home(); } }, l))));
  }
  function home() {
    cleanup();
    root.replaceChildren(header());
    if (view === 'releves') return releves();
    const styles = [...new Set(LICKS.map((l) => l.style))];
    styles.forEach((st) => {
      root.append(h('h2', { class: 'hand-title' }, st));
      LICKS.filter((l) => l.style === st).forEach((l) => {
        const best = store.getBest(`lick:${l.id}`);
        root.append(h('button', { type: 'button', class: 'card pick', onclick: () => detail(l) },
          h('span', { class: 'pick-title' }, l.name),
          h('span', { class: 'muted small' }, `Sur ${CONTEXTS[l.over].label} · ${l.notes.length} notes${best != null ? ` · meilleur : ${best} %` : ''}`)));
      });
    });
  }
  function detail(l, keyIdx = 0) {
    cleanup();
    const k = KEYS[keyIdx];
    const tpc = pc(k);
    root.replaceChildren(
      h('button', { class: 'back', type: 'button', onclick: home }, '← Tous les licks'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, l.name), h('p', { class: 'lead' }, `${l.style} · sur ${CONTEXTS[l.over].label}`)),
      h('section', { class: 'card stack' },
        h('p', null, l.inspi),
        h('div', { class: 'row wrap' }, h('label', { for: 'lk-key' }, 'Tonalité'), keySelect('lk-key', keyIdx, (e) => detail(l, +e.target.value))),
        h('p', { class: 'hand big-notes' }, l.notes.map(([s]) => PC[(tpc + s) % 12]).join('  ')),
        h('div', { class: 'row wrap' },
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await audio.unlock(); playLine(l.notes, l.over, tpc, { oct: l.oct }); } }, 'Écouter avec l’accompagnement'),
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await audio.unlock(); playLine(l.notes, l.over, tpc, { oct: l.oct, withBacking: false, bpm: 80 }); } }, 'Écouter lentement'),
          h('button', { class: 'btn', type: 'button', onclick: () => practice(l, [k]) }, 'Jouer'),
          h('button', { class: 'btn', type: 'button', onclick: () => practice(l, CIRCLE_FOURTHS) }, 'Dans les 12 tonalités'))));
  }
  function practice(l, keys) {
    cleanup();
    let ki = 0;
    let totalErr = 0;
    const box = h('section', { class: 'card stack' });
    const run = () => {
      box.replaceChildren(h('p', { class: 'hand-title sm' }, `${l.name} · en ${keyLabel(keys[ki])} (${ki + 1}/${keys.length})`),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); playLine(l.notes, l.over, pc(keys[ki]), { oct: l.oct, withBacking: false, bpm: 90 }); } }, 'Écouter'));
      cleanup = sequenceDrill(box, l.notes.map(([s]) => (pc(keys[ki]) + s) % 12), {
        onDone: (err) => {
          totalErr += err;
          ki++;
          if (ki < keys.length) { toast(`Bien ! Maintenant en ${keyLabel(keys[ki])}.`); run(); return; }
          const n = l.notes.length * keys.length;
          const score = Math.round((n / (n + totalErr)) * 100);
          store.setBest(`lick:${l.id}`, score);
          const out = store.award('licks', Math.min(40, 6 + keys.length * 3) + (score >= 90 ? 4 : 0), { activity: 'licks', label: `Lick ${l.name}${keys.length > 1 ? ' · 12 tonalités' : ''}`, score });
          app.celebrate(out);
          box.replaceChildren(h('div', { class: 'score' }, `${score} %`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
            h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => detail(l) }, 'Retour'), h('button', { class: 'btn', type: 'button', onclick: () => practice(l, keys) }, 'Rejouer')));
        },
      });
    };
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: () => detail(l) }, '← Retour'), box);
    run();
  }

  // ---------- Mes relevés ----------
  function releves() {
    const list = s.releves || (s.releves = []);
    root.append(h('section', { class: 'card stack' },
      h('h2', null, 'Enregistrer une phrase relevée'),
      h('p', { class: 'muted' }, 'Relève une phrase à l’oreille, puis joue-la ici : l’appli la garde, te la fait rejouer et transposer dans les 12 tonalités.'),
      h('button', { class: 'btn', type: 'button', onclick: record }, 'Enregistrer une phrase')));
    if (!list.length) root.append(h('p', { class: 'muted small' }, 'Aucun relevé pour l’instant.'));
    list.forEach((r) => root.append(h('section', { class: 'card stack' },
      h('div', { class: 'card-head' }, h('strong', null, r.name), h('span', { class: 'muted small' }, r.song ? s.songs.find((x) => x.id === r.song)?.title || '' : '')),
      h('p', { class: 'hand' }, r.notes.map((n) => PC[n.m % 12]).join('  ')),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; r.notes.forEach((n) => audio.tone(n.m, t + n.t, Math.max(0.15, n.d), 0.8)); } }, 'Écouter'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => practiceReleve(r, [0]) }, 'Rejouer'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => practiceReleve(r, CIRCLE_FOURTHS.map((k) => (pc(k) - (r.notes[0].m % 12) + 12) % 12)) }, '12 tonalités'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { s.releves = list.filter((x) => x.id !== r.id); store.save(); home(); } }, 'Supprimer')))));
  }
  function record() {
    cleanup();
    const notes = [];
    let t0 = null;
    const open = new Map();
    const status = h('p', { class: 'hand big-notes', 'aria-live': 'polite' }, '…');
    const kb = screenKeyboard({ low: 48, octaves: 2 });
    const offOn = midi.onNote((e) => {
      if (e.note == null) return;
      if (t0 == null) t0 = e.t;
      const n = { m: e.note, t: (e.t - t0) / 1000, d: 0.3 };
      notes.push(n);
      open.set(e.note, n);
      status.textContent = notes.map((x) => PC[x.m % 12]).join('  ');
    });
    const offOff = midi.onNoteOff((e) => { const n = open.get(e.note); if (n && t0 != null) { n.d = Math.max(0.08, (e.t - t0) / 1000 - n.t); open.delete(e.note); } });
    cleanup = () => { offOn(); offOff(); kb.destroy && kb.destroy(); };
    const nameIn = h('input', { id: 'rel-name', type: 'text', placeholder: 'Ex. : phrase de Wes, mesure 5', autocomplete: 'off' });
    const songSel = h('select', { id: 'rel-song' }, h('option', { value: '' }, 'Aucun'), s.songs.map((x) => h('option', { value: x.id }, x.title)));
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: home }, '← Retour'),
      h('section', { class: 'card stack' }, h('h2', null, 'Joue ta phrase'), status, kb, inputHint(),
        h('label', { for: 'rel-name' }, 'Nom'), nameIn, h('label', { for: 'rel-song' }, 'Morceau'), songSel,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => record() }, 'Recommencer'),
          h('button', { class: 'btn', type: 'button', onclick: () => {
            if (notes.length < 2) { toast('Joue au moins deux notes.', 'bad'); return; }
            (s.releves = s.releves || []).unshift({ id: `rel-${Date.now().toString(36)}`, name: nameIn.value.trim() || 'Ma phrase', song: songSel.value, notes: notes.map((n) => ({ ...n })) });
            store.save();
            const out = store.award('licks', 8, { activity: 'licks', label: `Relevé : ${nameIn.value.trim() || 'Ma phrase'}` });
            app.celebrate(out);
            toast('Relevé enregistré.');
            home();
          } }, 'Enregistrer'))));
  }
  function practiceReleve(r, shifts) {
    cleanup();
    let i = 0;
    let errs = 0;
    const box = h('section', { class: 'card stack' });
    const run = () => {
      const sh = shifts[i];
      const label = shifts.length > 1 ? `En partant de ${PC[(r.notes[0].m + sh) % 12]} (${i + 1}/${shifts.length})` : r.name;
      box.replaceChildren(h('p', { class: 'hand-title sm' }, label),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; r.notes.forEach((n) => audio.tone(n.m + sh, t + n.t, Math.max(0.15, n.d), 0.8)); } }, 'Écouter'));
      cleanup = sequenceDrill(box, r.notes.map((n) => (n.m + sh) % 12), {
        onDone: (e) => {
          errs += e;
          i++;
          if (i < shifts.length) { run(); return; }
          const n = r.notes.length * shifts.length;
          const score = Math.round((n / (n + errs)) * 100);
          const out = store.award('licks', Math.min(40, 5 + shifts.length * 3), { activity: 'licks', label: `Relevé ${r.name}${shifts.length > 1 ? ' · 12 tonalités' : ''}`, score });
          app.celebrate(out);
          box.replaceChildren(h('div', { class: 'score' }, `${score} %`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`), h('button', { class: 'btn', type: 'button', onclick: home }, 'Retour'));
        },
      });
    };
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: home }, '← Retour'), box);
    run();
  }

  home();
  return () => cleanup();
}

// ---------- Voicings et fioritures ----------
export function voicings(root, app) {
  const st = store.get().settings;
  let cleanup = () => {};
  let vId = st.voicing || 'shell';
  let keyIdx = st.voicingKey ?? 0;
  let progId = st.voicingProg || 'ii-v-i';
  function home() {
    cleanup();
    const v = VOICINGS.find((x) => x.id === vId);
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Voicings et fioritures'),
        h('p', { class: 'lead' }, 'Des façons de disposer les accords, à jouer sur les grandes progressions, et les ornements qui donnent la couleur d’un style.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'vc-type' }, 'Type de voicing'),
        h('select', { id: 'vc-type', onchange: (e) => { vId = e.target.value; st.voicing = vId; store.save(); home(); } }, VOICINGS.map((x) => h('option', { value: x.id, selected: x.id === vId }, x.name))),
        h('p', { class: 'muted' }, v.desc),
        h('label', { for: 'vc-prog' }, 'Progression'),
        h('select', { id: 'vc-prog', onchange: (e) => { progId = e.target.value; st.voicingProg = progId; store.save(); } },
          PROGRESSIONS.filter((p) => p.chords.every((c) => QUAL[c.q])).map((p) => h('option', { value: p.id, selected: p.id === progId }, p.name))),
        h('label', { for: 'vc-key' }, 'Tonalité'), keySelect('vc-key', keyIdx, (e) => { keyIdx = +e.target.value; st.voicingKey = keyIdx; store.save(); }),
        h('button', { class: 'btn', type: 'button', onclick: drill }, 'Commencer')),
      h('h2', { class: 'hand-title' }, 'Fioritures'),
      h('p', { class: 'muted small' }, 'Associer un ornement à un style relève de la pratique des musiciens et des enseignants ; je n’ai pas de source écrite pour chacun. Niveau de preuve : avis d’experts.'),
      h('div', { class: 'grid2' }, FIORITURES.map((f) => h('section', { class: 'card stack' },
        h('strong', null, f.name), h('span', { class: 'muted small' }, f.how),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => {
          await audio.unlock();
          const c = audio.getCtx();
          const t = c.currentTime + 0.1;
          audio.chord(f.chord[1].map((x) => 48 + x), t, 2.2, 0.4);
          let tt = t;
          f.demo.forEach(([s, d]) => { audio.tone(72 + s - 12, tt, Math.max(0.1, d + 0.1), 0.8); tt += d; });
        } }, 'Écouter')))));
  }
  function drill() {
    cleanup();
    const v = VOICINGS.find((x) => x.id === vId);
    const p = PROGRESSIONS.find((x) => x.id === progId);
    const chords = realize(p, KEYS[keyIdx]).map((c) => {
      const q = QUAL[c.q];
      const rel = v.build(q);
      return { symbol: c.symbol, pcs: [...new Set(rel.map((x) => (((c.rootPc + x) % 12) + 12) % 12))], bass: (((c.rootPc + rel[0]) % 12) + 12) % 12, notes: rel.map((x) => 52 + ((c.rootPc + 12 - 52 % 12) % 12) + x) };
    });
    let i = 0;
    let first = 0;
    let tried = false;
    const chips = h('div', { class: 'chips seq hand big' }, chords.map((c, k) => h('span', { class: `chip${k === 0 ? ' now' : ''}`, 'data-k': k }, c.symbol)));
    const msg = h('p', { 'aria-live': 'polite' }, `Joue ${chords[0].symbol} en ${v.name}, la note du bas : ${PC[chords[0].bass]}.`);
    const kb = screenKeyboard({ low: 48, octaves: 2 });
    const col = chordCollector((notes) => {
      const c = chords[i];
      const set = new Set(notes.map((m) => m % 12));
      const low = Math.min(...notes) % 12;
      const missing = c.pcs.filter((x) => !set.has(x));
      if (!missing.length && low === c.bass) {
        if (!tried) first++;
        chips.querySelector(`[data-k="${i}"]`).className = 'chip done';
        mark(kb, [], 'hint');
        i++;
        tried = false;
        if (i >= chords.length) return done();
        chips.querySelector(`[data-k="${i}"]`).className = 'chip now';
        msg.textContent = `Bien. ${chords[i].symbol}, note du bas : ${PC[chords[i].bass]}.`;
      } else {
        tried = true;
        msg.textContent = missing.length ? `Il manque : ${missing.map((x) => PC[x]).join(', ')}.` : `Les notes y sont, mais la note du bas doit être ${PC[c.bass]}.`;
      }
    });
    cleanup = () => { col.destroy(); kb.destroy && kb.destroy(); };
    function done() {
      cleanup();
      const score = Math.round((first / chords.length) * 100);
      store.setBest(`voicing:${vId}:${progId}`, score);
      const out = store.award('harmonie', 10 + (score >= 85 ? 5 : 0), { activity: 'voicings', label: `${v.name} · ${p.name} en ${keyLabel(KEYS[keyIdx])}`, score });
      app.celebrate(out);
      root.replaceChildren(h('section', { class: 'card stack center' }, h('div', { class: 'score' }, `${score} %`), h('p', { class: 'muted' }, 'Accords trouvés du premier coup.'), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
        h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: home }, 'Retour'), h('button', { class: 'btn', type: 'button', onclick: drill }, 'Rejouer'))));
    }
    root.replaceChildren(h('button', { class: 'back', type: 'button', onclick: home }, '← Retour'),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, v.name), h('p', { class: 'lead' }, `${p.name} en ${keyLabel(KEYS[keyIdx])}`)),
      h('section', { class: 'card stack' }, chips, msg, kb,
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => col.validate() }, 'Valider l’accord'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { tried = true; mark(kb, chords[i].notes, 'hint'); audio.unlock().then(() => audio.chord(chords[i].notes, null, 1.4)); } }, 'Montrer et écouter')),
        inputHint()));
  }
  home();
  return () => cleanup();
}

// ---------- Impro guidée ----------
export function impro(root, app) {
  const s = store.get();
  let session = null;
  const withGrid = s.songs.filter((x) => parseGrid(x.grid).bars.length);
  function stop() { if (session) { session.stop(); session = null; } }
  function home() {
    stop();
    const st = s.settings;
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Impro guidée'),
        h('p', { class: 'lead' }, 'L’appli joue la grille et te donne une consigne différente à chaque tour. Une contrainte à la fois, pour construire ton vocabulaire.')),
      h('section', { class: 'card stack' },
        h('label', { for: 'im-src' }, 'Sur quoi improviser'),
        h('select', { id: 'im-src' },
          withGrid.map((x) => h('option', { value: `song:${x.id}`, selected: st.improSrc === `song:${x.id}` }, x.title)),
          PROGRESSIONS.map((p) => h('option', { value: `prog:${p.id}`, selected: st.improSrc === `prog:${p.id}` }, `${p.name} (en do)`))),
        h('label', { for: 'im-tempo' }, 'Tempo'),
        h('select', { id: 'im-tempo' }, [80, 100, 120, 140, 160, 200].map((b) => h('option', { value: b, selected: (st.improTempo || 100) === b }, `${b} BPM`))),
        h('label', { for: 'im-tours' }, 'Nombre de tours'),
        h('select', { id: 'im-tours' }, [2, 4, 6, 8].map((n) => h('option', { value: n, selected: (st.improTours || 4) === n }, `${n} tours`))),
        h('button', { class: 'btn', type: 'button', onclick: go }, 'Lancer')));
  }
  async function go() {
    await audio.unlock();
    const st = s.settings;
    st.improSrc = document.getElementById('im-src').value;
    st.improTempo = +document.getElementById('im-tempo').value;
    st.improTours = +document.getElementById('im-tours').value;
    store.save();
    let bars;
    let meter = 4;
    let title;
    const [kind, id] = st.improSrc.split(':');
    if (kind === 'song') {
      const song = s.songs.find((x) => x.id === id);
      bars = parseGrid(song.grid).bars;
      meter = song.meter;
      title = song.title;
    } else {
      const p = PROGRESSIONS.find((x) => x.id === id);
      bars = realize(p, KEYS[0]).map((c) => ({ chords: [{ name: c.symbol, root: c.rootPc, semis: c.semis, bass: c.rootPc }] }));
      title = p.name;
    }
    const consignes = shuffle(CONSIGNES);
    const big = h('p', { class: 'consigne' }, consignes[0]);
    const info = h('p', { class: 'muted small' }, 'Décompte…');
    const chordNow = h('p', { class: 'hand big-notes' }, '');
    const started = performance.now();
    root.replaceChildren(h('section', { class: 'card stack center' }, h('span', { class: 'muted small' }, title), big, chordNow, info,
      h('button', { class: 'btn ghost', type: 'button', onclick: () => stop() }, 'Arrêter')));
    const pat = allPatterns().find((x) => x.id === (st.paPattern || 'charleston')) || allPatterns()[0];
    session = playalong.start({
      bars, meter, bpm: st.improTempo, swing: true, compPattern: pat.bars[0], opts: { bass: true, comp: true, click: '2-4' }, loops: st.improTours,
      onBar: (b, k, count) => {
        if (b < 0) { info.textContent = `Décompte : ${count}`; return; }
        const tour = Math.floor(k / bars.length);
        big.textContent = consignes[tour % consignes.length];
        chordNow.textContent = bars[b].chords.map((c) => c.name).join('  ');
        info.textContent = `Tour ${tour + 1} / ${st.improTours} · mesure ${b + 1}`;
      },
      onEnd: () => {
        session = null;
        const mins = Math.max(1, Math.round((performance.now() - started) / 60000));
        const out = store.award('impro', Math.min(40, mins * 3), { activity: 'impro', label: `Impro guidée · ${title}`, minutes: mins, song: kind === 'song' ? id : null });
        app.celebrate(out);
        toast(`+${out.gained} XP`);
        home();
      },
    });
  }
  home();
  return stop;
}

// ---------- Dictée de motifs (Oreille) ----------
export const MOTIF_LEVELS = [
  { n: 1, name: '3 notes conjointes', desc: 'Gamme majeure, notes voisines', len: 3, pool: 'major', steps: [1, 2] },
  { n: 2, name: '4 notes, petits sauts', desc: 'Gamme majeure, sauts jusqu’à la quinte', len: 4, pool: 'major', steps: [1, 2, 3, 4] },
  { n: 3, name: 'Arpèges', desc: 'Notes de maj7, m7 ou 7', len: 4, pool: 'arp' },
  { n: 4, name: 'Gamme blues', desc: '5 notes dans la gamme blues', len: 5, pool: 'blues', steps: [1, 2, 3] },
  { n: 5, name: 'Chromatisme bebop', desc: '6 notes avec notes de passage', len: 6, pool: 'chroma', steps: [1, 2, 3] },
];

function makeMotif(L) {
  const tonic = 60 + Math.floor(Math.random() * 7) - 3;
  if (L.pool === 'arp') {
    const q = pick([[0, 4, 7, 11], [0, 3, 7, 10], [0, 4, 7, 10]]);
    const order = pick([[0, 1, 2, 3], [3, 2, 1, 0], [0, 2, 1, 3], [1, 2, 3, 0]]);
    return order.map((i) => tonic + q[i] - (order[0] === 3 && i === 0 ? 0 : 0));
  }
  const scale = L.pool === 'blues' ? [0, 3, 5, 6, 7, 10, 12, 15] : L.pool === 'chroma' ? [...Array(13).keys()] : [0, 2, 4, 5, 7, 9, 11, 12, 14];
  let idx = Math.floor(Math.random() * Math.max(1, scale.length - 4));
  const out = [tonic + scale[idx]];
  while (out.length < L.len) {
    const step = pick(L.steps) * (Math.random() < 0.5 ? -1 : 1);
    idx = Math.max(0, Math.min(scale.length - 1, idx + step));
    const m = tonic + scale[idx];
    if (m !== out[out.length - 1]) out.push(m);
  }
  return out;
}

export function motifs(stage, app, L, onBack) {
  let n = 0;
  let correct = 0;
  let cleanup = () => {};
  const SESSION = 8;
  function next() {
    cleanup();
    if (n >= SESSION) return finish();
    n++;
    const m = makeMotif(L);
    const play = () => { const t = audio.getCtx().currentTime + 0.1; m.forEach((x, i) => audio.tone(x, t + i * 0.45, 0.6, 0.8)); };
    stage.replaceChildren(
      h('div', { class: 'muted small' }, `Niveau ${L.n} · motif ${n} / ${SESSION} · ${correct} réussi${correct > 1 ? 's' : ''}`),
      h('p', null, `Écoute le motif, puis rejoue-le. La première note est ${PC[m[0] % 12]}.`),
      h('div', { class: 'row center' }, h('button', { class: 'btn big', type: 'button', onclick: play }, 'Écouter')));
    let errors = 0;
    cleanup = sequenceDrill(stage, m.map((x) => x % 12), {
      showNames: false,
      onDone: (err) => {
        errors = err;
        if (errors === 0) correct++;
        stage.append(h('p', { class: errors === 0 ? 'good' : 'bad' }, errors === 0 ? 'Sans faute !' : `Trouvé avec ${errors} erreur${errors > 1 ? 's' : ''}.`),
          h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: play }, 'Réécouter'), h('button', { class: 'btn', type: 'button', onclick: next }, n >= SESSION ? 'Voir le résultat' : 'Suivant')));
      },
    });
    audio.unlock().then(play);
  }
  function finish() {
    cleanup();
    const pct = Math.round((correct / SESSION) * 100);
    store.setBest(`motifs:N${L.n}`, pct);
    const out = store.award('oreille', correct * 3 + (correct >= 7 ? 5 : 0), { activity: 'oreille', label: `Dictée de motifs · niveau ${L.n}`, score: pct, correct, total: SESSION });
    app.celebrate(out);
    stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${SESSION}`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
      h('div', { class: 'row center' }, h('button', { class: 'btn ghost', type: 'button', onclick: onBack }, 'Niveaux'), h('button', { class: 'btn', type: 'button', onclick: () => motifs(stage, app, L, onBack) }, 'Encore une série')));
  }
  next();
  return () => cleanup();
}
