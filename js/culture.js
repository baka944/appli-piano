// Onglet Culture : fiches sourcées, frise, quiz éclair, liste d'écoute.
import { h, svg, shuffle, toast, weightedPick } from './ui.js';
import * as audio from './audio.js';
import { parseGrid } from './music.js';
import { band } from './pixel.js';
import { REGLES, PARTITIONS } from './ecriture-data.js';
import * as store from './store.js';
import { MUSICIENS, STANDARDS, MOUVEMENTS, QUIZ, ALL_FICHES, COURANTS } from './culture-data.js';
import { nextQuestion, THEMES, theoryCards } from './theorie.js';

// Thèmes des cartes et du quiz éclair. Harmonisation et modes rapportent de l'XP en Théorie.
const SUJETS = [['tout', 'Tout'], ['culture', 'Culture'], ['harmonisation', 'Harmonisation'], ['modes', 'Modes']];
const TABS = [['jour', 'Carte du jour'], ['musiciens', 'Musiciens'], ['standards', 'Standards'], ['courants', 'Courants du jazz'], ['frise', 'Frise'], ['cartes', 'Cartes'], ['quiz', 'Quiz éclair'], ['ecriture', 'Écriture classique'], ['liste', 'Ma liste']];

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
      f.who ? h('p', null, h('strong', null, 'Grands représentants : '), f.who.join(', '), '.') : null,
      f.listen.length ? h('div', { class: 'stack gap4' }, h('span', { class: 'small muted' }, 'À écouter'),
        f.listen.map((l) => h('div', { class: 'row' },
          h('span', null, h('em', null, l.title), l.year ? ` (${l.year})` : '', l.note ? h('span', { class: 'muted small' }, ` · ${l.note}`) : null),
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
    else if (tab === 'courants') {
      root.append(h('p', { class: 'muted small' }, 'Du plus ancien au plus récent. Un style ne naît pas un jour précis : ces dates sont des repères, et les sources ne les placent pas toujours au même endroit. Touche un courant pour l’ouvrir.'),
        ...COURANTS.map((f) => fiche({ ...f, cat: 'Courant' })));
    } else if (tab === 'frise') {
      root.append(h('ol', { class: 'timeline' }, MOUVEMENTS.map((m) => h('li', null,
        h('span', { class: 'hand period' }, m.period), h('strong', null, m.name), h('p', null, m.text),
        h('a', { class: 'small', href: m.source.url, target: '_blank', rel: 'noopener' }, m.source.label)))),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { tab = 'courants'; draw(); } }, 'Voir tous les courants du jazz'));
    } else if (tab === 'cartes') cartes();
    else if (tab === 'ecriture') ecriture();
    else if (tab === 'quiz') quiz();
    else liste();
    // Garde l'onglet choisi visible dans la barre qui défile.
    root.querySelectorAll('.seg.scroll').forEach((seg) => {
      const on = seg.querySelector('.on');
      if (on) seg.scrollLeft += on.getBoundingClientRect().left - seg.getBoundingClientRect().left - (seg.clientWidth - on.offsetWidth) / 2;
    });
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
  // Sélecteur de thème commun aux cartes et au quiz éclair.
  function sujets(setting, value, list = SUJETS) {
    return h('div', { class: 'seg small scroll', role: 'tablist', 'aria-label': 'Thème' }, list.map(([id, label]) =>
      h('button', { type: 'button', role: 'tab', 'aria-selected': value === id ? 'true' : 'false', class: value === id ? 'on' : '', onclick: () => { store.setSetting(setting, id); draw(); } }, label)));
  }
  function drawFrom(cards, n) {
    const out = [];
    const pool = cards.slice();
    while (out.length < n && pool.length) {
      const c = weightedPick(pool, (x) => store.itemWeight(`carte:${x.id}`));
      out.push(c);
      pool.splice(pool.indexOf(c), 1);
    }
    return out;
  }
  function cartes() {
    const sujet = s.settings.cardsTheme || 'tout';
    const culture = buildCards();
    const harmo = theoryCards('harmonisation');
    const modes = theoryCards('modes');
    const all = { culture, harmonisation: harmo, modes, tout: [...culture, ...harmo, ...modes] }[sujet] || culture;
    // « Tout » garde un équilibre, sinon les cartes de théorie, plus nombreuses, prendraient toute la place.
    const deck = sujet === 'tout' ? shuffle([...drawFrom(culture, 4), ...drawFrom(harmo, 3), ...drawFrom(modes, 3)]) : drawFrom(all, 10);
    let i = 0;
    let known = 0;
    const knownSet = [];
    const stage = h('section', { class: 'stack' });
    root.append(sujets('cardsTheme', sujet), h('p', { class: 'muted small' }, `${all.length} cartes${sujet === 'culture' || sujet === 'tout' ? ', dont tes morceaux (artistes, grilles, mesures)' : ''}. Celles que tu rates reviennent plus souvent.`), stage);
    const show = () => {
      if (i >= deck.length) {
        const bonus = known === deck.length ? 2 : 0;
        const isTheory = (c) => harmo.includes(c) || modes.includes(c);
        const entry = { label: 'Cartes', score: Math.round((known / deck.length) * 100), correct: known, total: deck.length };
        let gained = 0;
        // Chaque carte réussie va dans son domaine : Culture ou Théorie.
        [['culture', 'culture', knownSet.filter((c) => !isTheory(c)).length, !deck.some(isTheory)], ['theorie', 'theorie', knownSet.filter(isTheory).length, deck.some(isTheory)]].forEach(([skill, activity, n, always]) => {
          if (!n && !always) return;
          const out = store.award(skill, n + (bonus && (always || n) ? bonus : 0), { activity, ...entry });
          app.celebrate(out);
          gained += out.gained;
        });
        stage.replaceChildren(h('section', { class: 'card stack center' }, h('div', { class: 'score' }, `${known} / ${deck.length}`), h('div', { class: 'xp-gain' }, `+${gained} XP`),
          h('button', { class: 'btn', type: 'button', onclick: () => draw() }, 'Nouvelle série')));
        return;
      }
      const c = deck[i];
      let flipped = false;
      const answer = h('div', { class: 'row center', hidden: true },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { store.recordItem(`carte:${c.id}`, false); store.save(); i++; show(); } }, 'À revoir'),
        h('button', { class: 'btn', type: 'button', onclick: () => { known++; knownSet.push(c); store.recordItem(`carte:${c.id}`, true); store.save(); i++; show(); } }, 'Je savais'));
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
  // Petite partition : grand-portée, rondes, soprano et ténor hampe en haut, alto et basse hampe en bas.
  function scoreSvg(chords) {
    const L = 'CDEFGAB';
    const parse = (n) => { const m = /^([A-G])([#b]?)(\d)$/.exec(n); return { d: +m[3] * 7 + L.indexOf(m[1]), acc: m[2], midi: 12 * (+m[3] + 1) + [0, 2, 4, 5, 7, 9, 11][L.indexOf(m[1])] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) }; };
    const H = 5; // demi-interligne
    const top1 = 20; // ligne du haut de la clé de sol (fa5, d = 38)
    const top2 = top1 + 10 * H + 34; // ligne du haut de la clé de fa (la3, d = 26)
    const yT = (d) => top1 + (38 - d) * H;
    const yB = (d) => top2 + (26 - d) * H;
    const W = 70 + chords.length * 70;
    let m = `<svg class="score-svg" viewBox="0 0 ${W} ${top2 + 8 * H + 30}" width="${W}" role="img" aria-label="Partition à quatre voix">`;
    [top1, top2].forEach((t) => { for (let i = 0; i < 5; i++) m += `<line x1="6" x2="${W - 6}" y1="${t + i * 2 * H}" y2="${t + i * 2 * H}" class="st"/>`; });
    m += `<line x1="6" x2="6" y1="${top1}" y2="${top2 + 8 * H}" class="st"/><line x1="${W - 6}" x2="${W - 6}" y1="${top1}" y2="${top2 + 8 * H}" class="st bar"/>`;
    m += `<text x="12" y="${top1 + 7 * H}" class="clef">𝄞</text><text x="12" y="${top2 + 5 * H}" class="clef fa">𝄢</text>`;
    chords.forEach((ch, k) => {
      const x = 70 + k * 70;
      if (k) m += `<line x1="${x - 35}" x2="${x - 35}" y1="${top1}" y2="${top2 + 8 * H}" class="st"/>`;
      ch.forEach((n, v) => {
        const p = parse(n);
        const treble = v < 2;
        const y = treble ? yT(p.d) : yB(p.d);
        const first = treble ? 30 : 18; // d de la ligne du bas
        const last = treble ? 38 : 26;
        for (let d = first - 2; d >= p.d; d -= 2) if (d % 2 === first % 2) m += `<line x1="${x - 9}" x2="${x + 9}" y1="${treble ? yT(d) : yB(d)}" y2="${treble ? yT(d) : yB(d)}" class="st"/>`;
        for (let d = last + 2; d <= p.d; d += 2) m += `<line x1="${x - 9}" x2="${x + 9}" y1="${treble ? yT(d) : yB(d)}" y2="${treble ? yT(d) : yB(d)}" class="st"/>`;
        // deux voix à une seconde sur la même portée : on décale la note du bas
        const other = ch[v % 2 === 0 ? v + 1 : v - 1];
        const shift = other && Math.abs(parse(other).d - p.d) === 1 && p.d < parse(other).d ? 13 : 0;
        if (other && parse(other).d === p.d && v % 2 === 1) { m += `<ellipse cx="${x + 13}" cy="${y}" rx="6.5" ry="4.6" class="nh v${v}"/>`; }
        else m += `<ellipse cx="${x + shift}" cy="${y}" rx="6.5" ry="4.6" class="nh v${v}"/><ellipse cx="${x + shift}" cy="${y}" rx="3" ry="2.6" transform="rotate(-30 ${x + shift} ${y})" class="hole"/>`;
        if (p.acc) m += `<text x="${x - 20}" y="${y + 4}" class="acc">${p.acc === '#' ? '♯' : '♭'}</text>`;
      });
    });
    m += '</svg>';
    const el = svg(m);
    const midis = chords.map((ch) => ch.map((n) => parse(n).midi));
    return { el, midis };
  }

  function ecriture() {
    const deck = [];
    const pool = REGLES.map((r, i) => ({ ...r, id: `ecr:${i}` }));
    const scores = PARTITIONS.map((r, i) => ({ ...r, id: `ecrp:${i}` }));
    while (deck.length < 3) { const c = weightedPick(scores, (x) => store.itemWeight(x.id)); deck.push(c); scores.splice(scores.indexOf(c), 1); }
    while (deck.length < 8) { const c = weightedPick(pool, (x) => store.itemWeight(x.id)); deck.push(c); pool.splice(pool.indexOf(c), 1); }
    shuffle(deck).forEach((x, k) => { deck[k] = x; });
    let i = 0;
    let correct = 0;
    const stage = h('section', { class: 'card stack' });
    root.append(h('p', { class: 'muted small' }, `Les règles de l’écriture à 4 voix (soprano, alto, ténor, basse) : ${REGLES.length} questions, dont celles de ton cours, et ${PARTITIONS.length} exercices sur partition. Celles que tu rates reviennent plus souvent.`), stage);
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
            r.src.url ? h('a', { class: 'small', href: r.src.url, target: '_blank', rel: 'noopener' }, `Source : ${r.src.label}`) : h('span', { class: 'small muted' }, `Source : ${r.src.label}`)),
          h('button', { class: 'btn', type: 'button', onclick: next }, i >= deck.length ? 'Voir le résultat' : 'Suivant'));
      } }, o)));
      let sc = null;
      if (r.chords) {
        const pic = scoreSvg(r.chords);
        sc = h('div', { class: 'score-box' }, pic.el,
          h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await audio.unlock(); const t = audio.getCtx().currentTime + 0.1; pic.midis.forEach((ch, k) => audio.chord(ch, t + k * 1.3, 1.2, 0.6)); } }, 'Écouter'),
          h('p', { class: 'muted small' }, 'En haut (clé de sol) : soprano et alto. En bas (clé de fa) : ténor et basse.'));
      }
      stage.replaceChildren(h('div', { class: 'muted small' }, `Question ${i} / ${deck.length}${r.chords ? ' · sur partition' : ''}`), h('h2', { class: 'q' }, r.q), sc, box);
    };
    next();
  }

  function quiz() {
    const sujet = s.settings.quizTheme || 'culture';
    const theory = sujet === 'harmonisation' || sujet === 'modes';
    const SIZE = 5;
    let qs;
    if (theory) {
      const seen = new Set();
      qs = Array.from({ length: SIZE }, () => nextQuestion(3, THEMES[sujet].types, seen, (k) => store.itemWeight(`theorie:${k}`)))
        .map((q) => ({ q: q.q, a: q.a, opts: q.opts, why: q.why, id: `theorie:${q.key}` }));
    } else {
      // Questions pas encore vues ou ratées d'abord : c'est ce qui évite de tourner en rond.
      const pool = QUIZ.map((q, i) => ({ ...q, id: `quiz:${i}` }));
      qs = [];
      while (qs.length < SIZE) {
        const c = weightedPick(pool, (x) => store.itemWeight(x.id));
        qs.push({ ...c, opts: shuffle([c.a, ...c.wrong]) });
        pool.splice(pool.indexOf(c), 1);
      }
    }
    let i = 0;
    let correct = 0;
    const stage = h('section', { class: 'card stack' });
    root.append(sujets('quizTheme', sujet, SUJETS.filter(([id]) => id !== 'tout')),
    theory ? null : h('p', { class: 'muted small' }, `${QUIZ.length} questions. Celles que tu n’as pas vues ou que tu as ratées passent en premier.`), stage);
    const next = () => {
      if (i >= qs.length) {
        const out = store.award(theory ? 'theorie' : 'culture', correct * 2 + (correct === qs.length ? 3 : 0), { activity: theory ? 'theorie' : 'culture', label: theory ? `Quiz éclair · ${THEMES[sujet].label}` : 'Quiz éclair', score: correct * 20, correct, total: qs.length });
        app.celebrate(out);
        stage.replaceChildren(h('div', { class: 'score' }, `${correct} / ${qs.length}`), h('div', { class: 'xp-gain' }, `+${out.gained} XP`),
          h('button', { class: 'btn', type: 'button', onclick: () => { draw(); } }, 'Nouveau quiz'));
        return;
      }
      const q = qs[i++];
      let done = false;
      const box = h('div', { class: 'opts col' }, q.opts.map((o) => h('button', { class: 'opt', type: 'button', onclick: (e) => {
        if (done) return;
        done = true;
        const ok = o === q.a;
        if (ok) correct++;
        store.recordItem(q.id, ok);
        store.save();
        box.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (b.textContent === q.a) b.classList.add('right'); });
        if (!ok) e.currentTarget.classList.add('wrong');
        const f = ALL_FICHES.find((x) => x.id === q.ref);
        stage.append(h('p', { class: ok ? 'good' : 'bad' }, ok ? 'Juste !' : `Réponse : ${q.a}`),
          q.why ? h('p', { class: 'muted' }, q.why) : null,
          f ? h('p', { class: 'muted small' }, `Fiche : ${f.name}`) : null,
          q.src ? h('a', { class: 'small', href: q.src.url, target: '_blank', rel: 'noopener' }, `Source : ${q.src.label}`) : null,
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
