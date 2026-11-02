// Onglet Culture : fiches sourcées, frise, quiz éclair, liste d'écoute.
import { h, shuffle, toast, weightedPick } from './ui.js';
import { parseGrid } from './music.js';
import { band } from './pixel.js';
import { REGLES } from './ecriture-data.js';
import * as store from './store.js';
import { MUSICIENS, STANDARDS, MOUVEMENTS, QUIZ, ALL_FICHES } from './culture-data.js';

const TABS = [['jour', 'Carte du jour'], ['musiciens', 'Musiciens'], ['standards', 'Standards'], ['frise', 'Frise'], ['cartes', 'Cartes'], ['quiz', 'Quiz éclair'], ['ecriture', 'Écriture classique'], ['liste', 'Ma liste']];

function dayIndex(n) { const d = new Date(); return (d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % n; }

export function render(el, app, params = {}) {
  const s = store.get();
  let tab = params.tab || 'jour';
  const root = h('div', { class: 'stack' });
  el.append(root);

  function header() {
    return h('div', { class: 'stack' },
      band(['piano', 'trompette', 'saxo', 'contrebasse', 'guitare', 'batterie'], 4),
      h('div', { class: 'page-head' }, h('h1', { class: 'display' }, 'Culture'),
        h('p', { class: 'lead' }, 'Quelques minutes pour te cultiver. Chaque fait est sourcé ; le type de source est indiqué sous la fiche.')),
      h('div', { class: 'seg scroll', role: 'tablist' }, TABS.map(([id, label]) =>
        h('button', { type: 'button', role: 'tab', 'aria-selected': tab === id ? 'true' : 'false', class: tab === id ? 'on' : '', onclick: () => { tab = id; draw(); } }, label))));
  }

  function addListen(title, by) {
    if (s.listening.some((x) => x.title === title)) { toast('Déjà dans ta liste.'); return; }
    s.listening.unshift({ id: `l-${Date.now().toString(36)}`, title, by: by || '', status: 'todo', note: '' });
    store.save();
    toast('Ajouté à ta liste d’écoute.');
  }

  function fiche(f, open = false) {
    return h('details', { class: 'card fiche', open },
      h('summary', null, h('span', { class: 'tag' }, f.cat || ''), h('strong', null, f.name), h('span', { class: 'muted small' }, f.role)),
      h('p', { class: 'why' }, f.why),
      h('ul', { class: 'facts' }, f.facts.map((x) => h('li', null, x))),
      f.listen.length ? h('div', { class: 'stack gap4' }, h('span', { class: 'small muted' }, 'À écouter'),
        f.listen.map((l) => h('div', { class: 'row' },
          h('span', null, h('em', null, l.title), ` (${l.year})`, l.note ? h('span', { class: 'muted small' }, ` · ${l.note}`) : null),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => addListen(l.title, f.name) }, '+ Ma liste')))) : null,
      h('p', { class: 'src small' }, 'Sources : ', f.sources.map((src, i) => [i ? ' · ' : '', h('a', { href: src.url, target: '_blank', rel: 'noopener' }, src.label), h('span', { class: 'muted' }, ` (${src.type})`)])));
  }

  function draw() {
    root.replaceChildren(header());
    if (tab === 'jour') {
      const f = ALL_FICHES[dayIndex(ALL_FICHES.length)];
      root.append(fiche(f, true), h('button', { class: 'btn ghost sm', type: 'button', onclick: () => {
        const out = store.award('culture', 3, { activity: 'culture', label: `Fiche : ${f.name}` });
        app.celebrate(out);
        toast(`+${out.gained} XP`);
      } }, 'J’ai lu la fiche'));
    } else if (tab === 'musiciens') root.append(...MUSICIENS.map((f) => fiche({ ...f, cat: 'Musicien' })));
    else if (tab === 'standards') root.append(...STANDARDS.map((f) => fiche({ ...f, cat: 'Standard' })));
    else if (tab === 'frise') {
      root.append(h('ol', { class: 'timeline' }, MOUVEMENTS.map((m) => h('li', null,
        h('span', { class: 'hand period' }, m.period), h('strong', null, m.name), h('p', null, m.text),
        h('a', { class: 'small', href: m.source.url, target: '_blank', rel: 'noopener' }, m.source.label)))),
      h('p', { class: 'muted small' }, 'Le hard bop et le free jazz arriveront quand j’aurai des sources fiables pour leurs dates.'));
    } else if (tab === 'cartes') cartes();
    else if (tab === 'ecriture') ecriture();
    else if (tab === 'quiz') quiz();
    else liste();
  }

  // Cartes à retourner : faits des fiches + tes propres morceaux (artistes, grilles, mesures).
  function buildCards() {
    const cards = QUIZ.map((q, i) => ({ id: `q${i}`, front: q.q, back: q.a, from: 'Fiches Culture' }));
    s.songs.forEach((song) => {
      if (song.artist && !/^Références/.test(song.artist)) cards.push({ id: `art:${song.id}`, front: `« ${song.title} » : de qui ?`, back: song.artist, from: 'Tes morceaux' });
      const { bars } = parseGrid(song.grid);
      for (let i = 0; i < bars.length; i += 4) {
        const chunk = bars.slice(i, i + 4);
        if (chunk.length < 2) break;
        cards.push({ id: `grid:${song.id}:${i}`, front: `« ${song.title} » : mesures ${i + 1} à ${i + chunk.length} ?`, back: chunk.map((b) => b.chords.map((c) => c.name).join(' ')).join(' | '), from: 'Ta grille' });
      }
      const meters = [...new Set(bars.map((b) => b.meter || song.meter))];
      if (meters.some((m) => m !== 4)) cards.push({ id: `meter:${song.id}`, front: `« ${song.title} » : dans quelle mesure se joue-t-il ?`, back: meters.map((m) => `${m}/4`).join(' puis '), from: 'Ta grille' });
    });
    return cards;
  }
  function cartes() {
    const all = buildCards();
    const deck = [];
    const pool = all.slice();
    while (deck.length < Math.min(10, all.length)) {
      const c = weightedPick(pool, (x) => store.itemWeight(`carte:${x.id}`));
      deck.push(c);
      pool.splice(pool.indexOf(c), 1);
    }
    let i = 0;
    let known = 0;
    const stage = h('section', { class: 'stack' });
    root.append(h('p', { class: 'muted small' }, `${all.length} cartes : les faits des fiches et tes morceaux (artistes, grilles, mesures). Celles que tu rates reviennent plus souvent.`), stage);
    const show = () => {
      if (i >= deck.length) {
        const out = store.award('culture', known + (known === deck.length ? 2 : 0), { activity: 'culture', label: 'Cartes', score: Math.round((known / deck.length) * 100), correct: known, total: deck.length });
        app.celebrate(out);
        stage.replaceChildren(h('section', { class: 'card stack center' }, h('div', { class: 'score' }, `${known} / ${deck.length}`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
          h('button', { class: 'btn', type: 'button', onclick: () => draw() }, 'Nouvelle série')));
        return;
      }
      const c = deck[i];
      let flipped = false;
      const answer = h('div', { class: 'row center', hidden: true },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { store.recordItem(`carte:${c.id}`, false); store.save(); i++; show(); } }, 'À revoir'),
        h('button', { class: 'btn', type: 'button', onclick: () => { known++; store.recordItem(`carte:${c.id}`, true); store.save(); i++; show(); } }, 'Je savais'));
      const card = h('button', { type: 'button', class: 'card flash', 'aria-label': 'Retourner la carte', onclick: () => {
        if (flipped) return;
        flipped = true;
        card.append(h('div', { class: 'back-face' }, c.back));
        answer.hidden = false;
      } }, h('span', { class: 'muted small' }, `${i + 1} / ${deck.length} · ${c.from}`), h('div', { class: 'face' }, c.front), h('span', { class: 'muted small' }, 'Touche pour voir la réponse'));
      stage.replaceChildren(card, answer);
    };
    show();
  }

  // Écriture classique à 4 voix : test des règles, rappel de la règle après chaque réponse
  function ecriture() {
    const deck = [];
    const pool = REGLES.map((r, i) => ({ ...r, id: `ecr:${i}` }));
    while (deck.length < 8) { const c = weightedPick(pool, (x) => store.itemWeight(x.id)); deck.push(c); pool.splice(pool.indexOf(c), 1); }
    let i = 0;
    let correct = 0;
    const stage = h('section', { class: 'card stack' });
    root.append(h('p', { class: 'muted small' }, `Les règles de l\u2019écriture à 4 voix (soprano, alto, ténor, basse) : ${REGLES.length} questions, celles que tu rates reviennent plus souvent.`), stage);
    const next = () => {
      if (i >= deck.length) {
        const out = store.award('culture', correct * 2 + (correct === deck.length ? 3 : 0), { activity: 'culture', label: 'Écriture classique', score: Math.round((correct / deck.length) * 100), correct, total: deck.length });
        app.celebrate(out);
        stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${deck.length}`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`), h('button', { class: 'btn', type: 'button', onclick: () => draw() }, 'Nouvelle série'));
        return;
      }
      const r = deck[i++];
      let done = false;
      const box = h('div', { class: 'opts col' }, shuffle([r.a, ...r.wrong]).map((o) => h('button', { class: 'opt', type: 'button', onclick: (e) => {
        if (done) return;
        done = true;
        const ok = o === r.a;
        if (ok) correct++;
        store.recordItem(r.id, ok);
        store.save();
        box.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (b.textContent === r.a) b.classList.add('right'); });
        if (!ok) e.currentTarget.classList.add('wrong');
        stage.append(h('p', { class: ok ? 'good' : 'bad' }, ok ? 'Juste !' : `Réponse : ${r.a}`),
          h('div', { class: `rule${ok ? '' : ' missed'}` }, h('strong', null, ok ? 'La règle' : 'Rappel de la règle'), h('p', null, r.regle),
            h('a', { class: 'small', href: r.src.url, target: '_blank', rel: 'noopener' }, `Source : ${r.src.label}`)),
          h('button', { class: 'btn', type: 'button', onclick: next }, i >= deck.length ? 'Voir le résultat' : 'Suivant'));
      } }, o)));
      stage.replaceChildren(h('div', { class: 'muted small' }, `Question ${i} / ${deck.length}`), h('h2', { class: 'q' }, r.q), box);
    };
    next();
  }

  function quiz() {
    const qs = shuffle(QUIZ).slice(0, 5);
    let i = 0;
    let correct = 0;
    const stage = h('section', { class: 'card stack' });
    root.append(stage);
    const next = () => {
      if (i >= qs.length) {
        const out = store.award('culture', correct * 2 + (correct === qs.length ? 3 : 0), { activity: 'culture', label: 'Quiz éclair', score: correct * 20, correct, total: qs.length });
        app.celebrate(out);
        stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${qs.length}`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
          h('button', { class: 'btn', type: 'button', onclick: () => { draw(); } }, 'Nouveau quiz'));
        return;
      }
      const q = qs[i++];
      const opts = shuffle([q.a, ...q.wrong]);
      let done = false;
      const box = h('div', { class: 'opts col' }, opts.map((o) => h('button', { class: 'opt', type: 'button', onclick: (e) => {
        if (done) return;
        done = true;
        const ok = o === q.a;
        if (ok) correct++;
        box.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (b.textContent === q.a) b.classList.add('right'); });
        if (!ok) e.currentTarget.classList.add('wrong');
        const f = ALL_FICHES.find((x) => x.id === q.ref);
        stage.append(h('p', { class: ok ? 'good' : 'bad' }, ok ? 'Juste !' : `Réponse : ${q.a}`),
          f ? h('p', { class: 'muted small' }, `Fiche : ${f.name}`) : null,
          h('button', { class: 'btn', type: 'button', onclick: next }, i >= qs.length ? 'Voir le résultat' : 'Suivant'));
      } }, o)));
      stage.replaceChildren(h('div', { class: 'muted small' }, `Question ${i} / ${qs.length}`), h('h2', { class: 'q' }, q.q), box);
    };
    next();
  }

  function liste() {
    const form = h('form', { class: 'card stack', onsubmit: (e) => {
      e.preventDefault();
      const t = form.querySelector('#li-title').value.trim();
      if (!t) return;
      addListen(t, form.querySelector('#li-by').value.trim());
      draw();
    } },
    h('label', { for: 'li-title' }, 'Album ou morceau'), h('input', { id: 'li-title', type: 'text', autocomplete: 'off' }),
    h('label', { for: 'li-by' }, 'Artiste'), h('input', { id: 'li-by', type: 'text', autocomplete: 'off' }),
    h('button', { class: 'btn ghost sm', type: 'submit' }, 'Ajouter'));
    root.append(h('p', { class: 'muted' }, 'Une écoute active : choisis un instrument (la main gauche du pianiste, la basse…) et suis-le du début à la fin. Note ce que tu as remarqué.'));
    if (!s.listening.length) root.append(h('p', { class: 'muted small' }, 'Ta liste est vide. Ajoute des albums depuis les fiches ou ci-dessous.'));
    s.listening.forEach((it) => {
      const noteId = `li-note-${it.id}`;
      root.append(h('section', { class: `card stack${it.status === 'done' ? ' done' : ''}` },
        h('div', { class: 'card-head' }, h('div', null, h('strong', null, it.title), it.by ? h('span', { class: 'muted small' }, ` · ${it.by}`) : null),
          h('span', { class: 'tag' }, it.status === 'done' ? `Écouté ${it.count || 1}×` : 'À écouter')),
        h('label', { for: noteId, class: 'small muted' }, 'Ce que j’ai remarqué'),
        h('textarea', { id: noteId, rows: 2, onchange: (e) => { it.note = e.target.value; store.save(); } }, it.note || ''),
        h('div', { class: 'row' },
          h('button', { class: 'btn sm', type: 'button', onclick: () => {
            it.status = 'done';
            it.count = (it.count || 0) + 1;
            const out = store.award('culture', 6, { activity: 'ecoute', label: `Écoute active : ${it.title}` });
            app.celebrate(out);
            toast(`+${out.gained} XP`);
            draw();
          } }, 'J’ai écouté activement'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { s.listening = s.listening.filter((x) => x.id !== it.id); store.save(); draw(); } }, 'Retirer'))));
    });
    root.append(form);
  }

  draw();
}
