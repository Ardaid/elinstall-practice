// =====================
// ÁLLAPOT
// =====================
var mode      = 'list';
var listQ     = 0;
var dictI     = 0;        // aktuális szótár bejegyzés indexe
var dictFlipped = false;  // kártya felfordítva?
var quizI         = 0;
var quizScore     = 0;
var quizAns       = 0;
var quizAnswers   = [];
var quizQuestions    = [];   // a kvízbe kerülő kérdések indexei
var quizShuffle      = false; // keverés be/ki
var quizMaxCount     = 0;    // 0 = összes, egyéb = limit
var sidebarCollapsed = {};    // { groupIndex: true/false }
var activeTopic = 0;          // currently selected topic index
var activePart  = 0;          // currently selected part index within topic

// =====================
// NYELVEK
// =====================
var LANGUAGES = [
  { code: 'sv', label: 'Svenska', flag: '🇸🇪', img: 'se' },
  { code: 'hu', label: 'Magyar',  flag: '🇭🇺', img: 'hu' },
  { code: 'en', label: 'English', flag: '🇬🇧', img: 'gb' },
  { code: 'es', label: 'Español', flag: '🇪🇸', img: 'es' }
];
var langPrimary   = 'sv';
var langSecondary = 'hu';

function qLang(q, code) {
  if (code === 'sv') return { q: q.qSv, a: q.aSv, opts: q.opts   };
  if (code === 'hu') return { q: q.qHu, a: q.aHu, opts: q.optsHu };
  if (code === 'en') return { q: q.qEn, a: q.aEn, opts: q.optsEn };
  if (code === 'es') return { q: q.qEs, a: q.aEs, opts: q.optsEs };
  return { q: q.qSv, a: q.aSv, opts: q.opts };
}

// Returns true if QA[0] has content in this language
function langHasData(code) {
  if (!QA || QA.length === 0) return false;
  return !!(qLang(QA[0], code).q);
}

// Renders a "Coming soon" screen in the content area for languages with no data
function renderComingSoon(langCode) {
  var l = LANGUAGES.find(function(x) { return x.code === langCode; });
  document.getElementById('content').innerHTML =
    '<div class="coming-soon-wrap">' +
      '<div class="coming-soon-card">' +
        '<p class="coming-soon-flag">' + (l ? l.flag : '🌐') + '</p>' +
        '<p class="coming-soon-lang">' + (l ? l.label : langCode.toUpperCase()) + '</p>' +
        '<p class="coming-soon-msg">Coming soon</p>' +
        '<p class="coming-soon-sub">Translations not yet available.</p>' +
      '</div>' +
    '</div>';
}
function wLang(w, code) {
  if (code === 'sv') return w.sv;
  if (code === 'hu') return w.hu;
  return w.sv;
}
function langLabel(code) {
  var l = LANGUAGES.find(function(x) { return x.code === code; });
  return l ? l.label : code.toUpperCase();
}
// =====================
// ZOOM
// =====================
var ZOOM_SIZES = { 1: '12px', 2: '14px', 3: '16px', 4: '18px', 5: '20px', 6: '23px' };
var currentZoom = 3;

function setZoom(level) {
  currentZoom = level;
  document.documentElement.style.fontSize = ZOOM_SIZES[level];
  localStorage.setItem('app-zoom', level);
  buildDropdown();
  if (mode === 'quiz') requestAnimationFrame(applyQuizHeight);
}

function loadZoom() {
  var saved = parseInt(localStorage.getItem('app-zoom') || '3');
  if (saved >= 1 && saved <= 6) {
    currentZoom = saved;
    document.documentElement.style.fontSize = ZOOM_SIZES[saved];
  }
}

function saveLangs() {
  localStorage.setItem('app-langs', JSON.stringify({ p: langPrimary, s: langSecondary }));
}
function loadLangs() {
  try {
    var l = JSON.parse(localStorage.getItem('app-langs') || '{}');
    if (l.p) langPrimary   = l.p;
    if (l.s) langSecondary = l.s;
  } catch(e) {}
}
function toggleLangPicker() {
  document.getElementById('lang-dropdown').classList.toggle('open');
}
function langFlagHtml(l) {
  if (l && l.img) {
    return '<img class="lang-flag-img" src="assets/flags/' + l.img + '.png" alt="">';
  }
  return l ? l.flag : '';
}

function buildLangPicker() {
  var dd  = document.getElementById('lang-dropdown');
  var html = '';

  var LANG_SOON = { es: true };

  html += '<span class="picker-section-label">Primary language</span>';
  LANGUAGES.forEach(function(l) {
    var soon = !!LANG_SOON[l.code];
    html += '<button class="lang-option' +
      (l.code === langPrimary ? ' lang-option-active' : '') +
      (soon ? ' lang-option-soon' : '') + '"' +
      (soon ? ' disabled' : ' onclick="setLangPrimary(\'' + l.code + '\')"') + '>' +
      langFlagHtml(l) + ' ' + l.label +
      (soon ? ' <span class="lang-soon-badge">(soon)</span>' : '') +
    '</button>';
  });

  html += '<hr class="picker-divider">';
  html += '<span class="picker-section-label">Secondary language</span>';
  LANGUAGES.forEach(function(l) {
    var soon = !!LANG_SOON[l.code];
    html += '<button class="lang-option' +
      (l.code === langSecondary ? ' lang-option-active' : '') +
      (soon ? ' lang-option-soon' : '') + '"' +
      (soon ? ' disabled' : ' onclick="setLangSecondary(\'' + l.code + '\')"') + '>' +
      langFlagHtml(l) + ' ' + l.label +
      (soon ? ' <span class="lang-soon-badge">(soon)</span>' : '') +
    '</button>';
  });

  html += '<hr class="picker-divider">';
  html += '<button class="lang-swap-btn" onclick="swapLangs()">⇄ Swap</button>';

  dd.innerHTML = html;

  var lbl = document.getElementById('lang-btn-label');
  if (lbl) lbl.textContent = langPrimary.toUpperCase() + ' › ' + langSecondary.toUpperCase();
}
function updateHeaderSubtitle() {
  var el = document.getElementById('header-subtitle');
  if (el) el.style.display = (langPrimary === 'hu') ? 'block' : 'none';
}

function setLangPrimary(code) {
  langPrimary = code; saveLangs(); buildLangPicker(); updateHeaderSubtitle(); refreshCurrentView();
}
function setLangSecondary(code) {
  langSecondary = code; saveLangs(); buildLangPicker(); refreshCurrentView();
}
function swapLangs() {
  var tmp = langPrimary; langPrimary = langSecondary; langSecondary = tmp;
  saveLangs(); buildLangPicker(); updateHeaderSubtitle(); refreshCurrentView();
}
function refreshCurrentView() {
  if (mode === 'list')            { buildSidebar();     renderList(); }
  else if (mode === 'dict')       { buildDictSidebar(); renderDict(); }
  else if (mode === 'quiz')       { renderQuiz(); }
  else if (mode === 'explanation') { renderExplanation(); }
}

// =====================
// CSOPORTOK
// =====================
var GROUPS = [
  {
    sv: 'Allmänna frågor om ellagstiftningen, behörighet och ansvar',
    hu: 'Általános kérdések a villamosenergia-jogszabályokkal, a hatáskörrel és a felelősséggel kapcsolatban',
    from: 1, to: 15
  },
  {
    sv: 'Allmänna frågor om svensk standard',
    hu: 'Általános kérdések a svéd szabványokról',
    from: 16, to: 24
  },
  {
    sv: 'Frågor om elinstallationsreglerna del 1–3, tillämpningsområde, definitioner och systemuppbyggnad',
    hu: 'Kérdések a villamos szerelési szabályok 1–3. részéről, a hatályáról, a definíciókról és a rendszer felépítéséről',
    from: 25, to: 33
  },
  {
    sv: 'Frågor om elinstallationsreglernas del 4 – skydd av personer, husdjur och egendom',
    hu: 'Kérdések a villamos szerelési előírások 4. részéről – személyek, háziállatok és vagyontárgyak védelme',
    from: 34, to: 55
  },
  {
    sv: 'Frågor om elinstallationsreglernas del 5 – val och montering av materiel',
    hu: 'Kérdések a villamos szerelési szabályok 5. részéről – berendezések kiválasztása és telepítése',
    from: 56, to: 85
  },
  {
    sv: 'Frågor om elinstallationsreglerna del 6 – kontroll',
    hu: 'Kérdések a villamos szerelési előírások 6. részéről – ellenőrzés',
    from: 86, to: 91
  },
  {
    sv: 'Frågor om elinstallationsreglerna del 7 – särskilda slag av elinstallationer',
    hu: 'Kérdések a villamos szerelési előírások 7. részéről – speciális villamos szerelések',
    from: 92, to: 112
  }
];

// =====================
// TÉMÁK (sidebar struktúra)
// =====================
var TOPICS = [
  {
    sv: 'Tema 1 — Regler och standarder för lågspänningsinstallationer',
    hu: 'Téma 1 — Regler och standarder för lågspänningsinstallationer',
    en: 'Topic 1 — Regler och standarder för lågspänningsinstallationer',
    es: 'Tema 1 — Regler och standarder för lågspänningsinstallationer',
    parts: [
      { sv: 'Del 1: Lagar & Regler',      hu: '1. rész: Lagar & Regler',      en: 'Part 1: Lagar & Regler',      es: 'Parte 1: Lagar & Regler',      hasData: true  },
      { sv: 'Del 2: Standard SS/SS-EN',   hu: '2. rész: Standard SS/SS-EN',   en: 'Part 2: Standard SS/SS-EN',   es: 'Parte 2: Standard SS/SS-EN',   hasData: false }
    ]
  },
  {
    sv: 'Tema 2 — Elinstallation i byggnader',
    hu: 'Téma 2 — Elinstallation i byggnader',
    en: 'Topic 2 — Elinstallation i byggnader',
    es: 'Tema 2 — Elinstallation i byggnader',
    parts: [
      { sv: 'Dimensionering',             hu: 'Dimensionering',              en: 'Dimensionering',              es: 'Dimensionering',              hasData: false },
      { sv: 'Mekanik',                    hu: 'Mekanik',                     en: 'Mekanik',                     es: 'Mekanik',                     hasData: false },
      { sv: 'Materialval',                hu: 'Materialval',                 en: 'Materialval',                 es: 'Materialval',                 hasData: false },
      { sv: 'Scheman',                    hu: 'Scheman',                     en: 'Scheman',                     es: 'Scheman',                     hasData: false },
      { sv: 'Kontroll före ibruktagning', hu: 'Kontroll före ibruktagning',  en: 'Kontroll före ibruktagning',  es: 'Kontroll före ibruktagning',  hasData: false }
    ]
  },
  {
    sv: 'Tema 3 — Elmaskiner',
    hu: 'Téma 3 — Elmaskiner',
    en: 'Topic 3 — Elmaskiner',
    es: 'Tema 3 — Elmaskiner',
    parts: [
      { sv: 'Trefas växelströmsmotorer',  hu: 'Trefas växelströmsmotorer',   en: 'Trefas växelströmsmotorer',   es: 'Trefas växelströmsmotorer',   hasData: false },
      { sv: 'Likströmsmotorer',           hu: 'Likströmsmotorer',            en: 'Likströmsmotorer',            es: 'Likströmsmotorer',            hasData: false },
      { sv: 'Servomotorer',               hu: 'Servomotorer',                en: 'Servomotorer',                es: 'Servomotorer',                hasData: false },
      { sv: 'Skydd och övervakning',      hu: 'Skydd och övervakning',       en: 'Skydd och övervakning',       es: 'Skydd och övervakning',       hasData: false },
      { sv: 'Drivsystem',                 hu: 'Drivsystem',                  en: 'Drivsystem',                  es: 'Drivsystem',                  hasData: false },
      { sv: 'Transformatorer',            hu: 'Transformatorer',             en: 'Transformatorer',             es: 'Transformatorer',             hasData: false }
    ]
  },
  {
    sv: 'Tema 4 — Produktion & Överföring',
    hu: 'Téma 4 — Produktion & Överföring',
    en: 'Topic 4 — Produktion & Överföring',
    es: 'Tema 4 — Produktion & Överföring',
    parts: [
      { sv: 'Avsnitt 1', hu: '1. fejezet', en: 'Section 1', es: 'Sección 1', hasData: false },
      { sv: 'Avsnitt 2', hu: '2. fejezet', en: 'Section 2', es: 'Sección 2', hasData: false },
      { sv: 'Avsnitt 3', hu: '3. fejezet', en: 'Section 3', es: 'Sección 3', hasData: false },
      { sv: 'Avsnitt 4', hu: '4. fejezet', en: 'Section 4', es: 'Sección 4', hasData: false },
      { sv: 'Avsnitt 5', hu: '5. fejezet', en: 'Section 5', es: 'Sección 5', hasData: false },
      { sv: 'Avsnitt 6', hu: '6. fejezet', en: 'Section 6', es: 'Sección 6', hasData: false }
    ]
  }
];

// Returns the label for a topic or part object in the current primary language
function sbLabel(obj) {
  return obj[langPrimary] || obj.sv;
}

// "Group" word translated
function groupWord() {
  if (langPrimary === 'hu') return 'Csoport';
  if (langPrimary === 'en') return 'Group';
  if (langPrimary === 'es') return 'Grupo';
  return 'Grupp';
}

// Group name in primary language (falls back to sv)
function gName(g) {
  return (langPrimary === 'hu' && g.hu) ? g.hu : g.sv;
}

function groupForQ(n) {
  for (var i = 0; i < GROUPS.length; i++) {
    if (n >= GROUPS[i].from && n <= GROUPS[i].to) return i;
  }
  return -1;
}

// =====================
// SESSIONS
// =====================
var sessions          = [];
var currentSessionId  = null;

// =====================
// ÁLLAPOT MENTÉS / VISSZAÁLLÍTÁS
// =====================
function saveState() {
  localStorage.setItem('app-state', JSON.stringify({
    mode:  mode === 'quiz' ? 'list' : mode,
    listQ: listQ,
    dictI: dictI
  }));
}

function loadState() {
  try {
    var s = JSON.parse(localStorage.getItem('app-state') || '{}');
    if (typeof s.listQ === 'number') listQ = s.listQ;
    if (typeof s.dictI === 'number') dictI = s.dictI;
    return s.mode || 'list';
  } catch(e) { return 'list'; }
}

function saveSidebarCollapsed() {
  localStorage.setItem('sidebar-collapsed-v2', JSON.stringify(sidebarCollapsed));
}

function loadSidebarCollapsed() {
  try {
    var s = JSON.parse(localStorage.getItem('sidebar-collapsed-v2') || '{}');
    sidebarCollapsed = s;
  } catch(e) { sidebarCollapsed = {}; }
}

function loadSessions() {
  try { sessions = JSON.parse(localStorage.getItem('quiz-sessions') || '[]'); }
  catch(e) { sessions = []; }
}

function saveSessions() {
  localStorage.setItem('quiz-sessions', JSON.stringify(sessions));
}

function saveSessionProgress() {
  if (currentSessionId === null) return;
  var s = sessions.find(function(x) { return x.id === currentSessionId; });
  if (s && !s.completed) {
    s.progress = {
      quizQuestions: quizQuestions.slice(),
      quizI: quizI + 1,           // a következő kérdés indexe
      quizScore: quizScore,
      quizAns: quizAns,
      quizAnswers: quizAnswers.slice()
    };
    saveSessions();
  }
}

function continueSession(id) {
  var s = sessions.find(function(x) { return x.id === id; });
  if (!s || !s.progress) return;
  hideSessionModal();
  currentSessionId = id;
  quizQuestions = s.progress.quizQuestions;
  quizI         = s.progress.quizI;
  quizScore     = s.progress.quizScore;
  quizAns       = s.progress.quizAns;
  quizAnswers   = s.progress.quizAnswers;
  renderSessions();
  renderQuiz();
}

function startNewSession() {
  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  var dateStr = now.getFullYear() + '. ' + pad(now.getMonth() + 1) + '. ' +
                pad(now.getDate()) + '. ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  currentSessionId = now.getTime();
  sessions.unshift({ id: currentSessionId, date: dateStr, score: null, total: quizQuestions.length, completed: false });
  saveSessions();
  renderSessions();
}

function finishSession() {
  if (currentSessionId === null) return;
  var s = sessions.find(function(x) { return x.id === currentSessionId; });
  if (s) { s.score = quizScore; s.completed = true; s.answers = quizAnswers.slice(); saveSessions(); renderSessions(); }
}

function stopQuiz() {
  if (currentSessionId !== null) {
    var s = sessions.find(function(x) { return x.id === currentSessionId; });
    if (s) {
      s.score   = quizScore;
      s.total   = quizAns;
      s.stopped = true;
      s.completed = true;
      s.answers = quizAnswers.slice();
      saveSessions();
      renderSessions();
    }
  }
  var c   = document.getElementById('content');
  var pct = quizAns > 0 ? Math.round(quizScore / quizAns * 100) : 0;
  c.innerHTML =
    '<div class="quiz-view">' +
      '<div class="results">' +
        '<div class="big-score">' + quizScore + '/' + quizAns + '</div>' +
        '<p class="res-lbl">Stopped &mdash; ' + pct + '% &mdash; ' + quizI + ' questions completed</p>' +
        '<div class="results-btns">' +
          '<button class="btn-restart" onclick="resetQuiz()">New Session</button>' +
          (quizAnswers.length > 0 ? '<button class="btn-review" onclick="renderReview(' + currentSessionId + ')">Review</button>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderReview(sessionId) {
  var s = sessions.find(function(x) { return x.id === sessionId; });
  var overlay   = document.getElementById('review-overlay');
  var container = document.getElementById('review-inner');

  if (!s || !s.answers || s.answers.length === 0) {
    container.innerHTML =
      '<div class="review-topbar">' +
        '<button class="review-back-btn" onclick="closeReview()">← Close</button>' +
        '<span class="review-title">Review</span>' +
        '<span class="review-meta"></span>' +
      '</div>' +
      '<p style="color:var(--muted);text-align:center;padding:60px 0">No answers to review.</p>';
    overlay.classList.add('open');
    overlay.scrollTop = 0;
    return;
  }

  var html =
    '<div class="review-topbar">' +
      '<button class="review-back-btn" onclick="closeReview()">← Close</button>' +
      '<span class="review-title">Review</span>' +
      '<span class="review-meta">' + s.date + ' &nbsp;·&nbsp; ' + s.score + ' / ' + s.answers.length + ' correct</span>' +
    '</div>';

  s.answers.forEach(function(a, idx) {
    var q         = QA[a.qi];
    var pri       = qLang(q, langPrimary);
    var sec       = qLang(q, langSecondary);
    var isCorrect = a.picked === a.correct;
    html += '<div class="review-item">' +
              '<div class="review-q-header">' +
                '<span class="review-num ' + (isCorrect ? 'rnum-ok' : 'rnum-bad') + '">' + (idx + 1) + '</span>' +
                '<div>' +
                  '<p class="review-q-sv">' + pri.q + '</p>' +
                  (langPrimary !== langSecondary ? '<p class="review-q-hu">' + sec.q + '</p>' : '') +
                '</div>' +
              '</div>';
    pri.opts.forEach(function(opt, i) {
      var cls  = (i === a.correct) ? 'review-opt-correct' :
                 (i === a.picked)  ? 'review-opt-wrong'   : 'review-opt-neutral';
      var icon = (i === a.picked && isCorrect)  ? '✓' :
                 (i === a.picked && !isCorrect) ? '✗' :
                 (i === a.correct)              ? '✓' : '';
      html += '<div class="review-opt ' + cls + '">' +
                '<span class="review-icon">' + icon + '</span>' +
                '<div>' +
                  '<span class="review-opt-sv">' + opt + '</span>' +
                  (langPrimary !== langSecondary ? '<span class="review-opt-hu">' + sec.opts[i] + '</span>' : '') +
                '</div>' +
              '</div>';
    });
    html += '</div>';
  });

  container.innerHTML = html;
  overlay.classList.add('open');
  overlay.scrollTop = 0;
}

function closeReview() {
  document.getElementById('review-overlay').classList.remove('open');
}

function renderSessions() {
  var list = document.getElementById('sessions-list');
  if (!list) return;
  if (sessions.length === 0) {
    list.innerHTML = '<p class="sessions-empty">No sessions yet.</p>';
    return;
  }
  var html = '';
  sessions.forEach(function(s) {
    var pct        = s.completed ? Math.round(s.score / s.total * 100) : null;
    var scoreClass = !s.completed ? 'session-ongoing' : (pct >= 70 ? 'session-good' : 'session-bad');
    var scoreText  = s.completed
      ? s.score + ' / ' + s.total + (s.stopped ? ' ⏹' : '') + ' — ' + pct + '%'
      : 'in progress…';
    var canContinue = !s.completed && s.progress;
    var hasReview   = s.answers && s.answers.length > 0;
    html += '<div class="session-item' + (s.id === currentSessionId ? ' session-active' : '') + '">' +
              '<div class="session-item-info">' +
                '<span class="session-date">' + s.date + '</span>' +
                '<span class="session-score ' + scoreClass + '">' + scoreText + '</span>' +
                (canContinue ? '<button class="session-review-btn" onclick="continueSession(' + s.id + ')">▶ Continue</button>' : '') +
                (hasReview   ? '<button class="session-review-btn" onclick="renderReview(' + s.id + ')">Review</button>' : '') +
              '</div>' +
              '<button class="session-delete-btn" onclick="deleteSession(' + s.id + ')" title="Delete">✕</button>' +
            '</div>';
  });
  list.innerHTML = html;
}

function deleteSession(sessionId) {
  sessions = sessions.filter(function(x) { return x.id !== sessionId; });
  if (currentSessionId === sessionId) currentSessionId = null;
  saveSessions();
  renderSessions();
}

function showSessionModal() {
  buildModalStep1();
  document.getElementById('session-modal').classList.add('open');
}

function shuffleRowHtml() {
  return '<div class="shuffle-row">' +
    '<span class="shuffle-label">Order:</span>' +
    '<div class="shuffle-btn-group">' +
      '<button class="shuffle-opt' + (!quizShuffle ? ' shuffle-opt-active' : '') + '" onclick="setShuffle(false)">↕ In order</button>' +
      '<button class="shuffle-opt' + ( quizShuffle ? ' shuffle-opt-active' : '') + '" onclick="setShuffle(true)">🔀 Shuffled</button>' +
    '</div>' +
  '</div>';
}

function maxCountRowHtml() {
  var counts = [0, 5, 10, 15, 20];
  var html = '<div class="max-count-row">' +
    '<span class="shuffle-label">Max questions:</span>' +
    '<div class="shuffle-btn-group">';
  counts.forEach(function(n) {
    var label  = n === 0 ? 'All' : n;
    var active = quizMaxCount === n;
    html += '<button class="shuffle-opt' + (active ? ' shuffle-opt-active' : '') + '" onclick="setMaxCount(' + n + ')">' + label + '</button>';
  });
  html += '</div></div>';
  return html;
}

function buildModalStep1() {
  var box = document.getElementById('modal-box');
  var ongoingSession = sessions.find(function(s) { return !s.completed && s.progress; });
  var continueHtml = '';
  if (ongoingSession) {
    var done  = ongoingSession.progress.quizI;
    var total = ongoingSession.progress.quizQuestions.length;
    continueHtml =
      '<button class="modal-btn-continue" onclick="continueSession(' + ongoingSession.id + ')">' +
        '▶ Continue — ' + done + ' / ' + total + ' answered' +
      '</button>';
  }
  box.innerHTML =
    '<button class="modal-close" onclick="cancelSessionModal()">✕</button>' +
    '<p class="modal-title">New Session</p>' +
    continueHtml +
    '<p class="modal-sub">Select which questions to include:</p>' +
    '<div class="modal-btns">' +
      '<button class="modal-btn-yes" onclick="startAllQuestions()">All questions (' + QA.length + ')</button>' +
    '</div>' +
    '<button class="modal-btn-custom" onclick="buildModalStep2()">✎ Custom selection...</button>' +
    shuffleRowHtml() +
    maxCountRowHtml() +
    '<hr class="picker-divider" style="margin:14px 0">' +
    '<button class="modal-btn-prev" onclick="showPreviousSessions()">📋 Previous sessions</button>';
}

function buildModalStep2() {
  var box       = document.getElementById('modal-box');
  var items     = '';
  var lastGroup = -1;

  QA.forEach(function(q, i) {
    var g = groupForQ(q.n);
    if (g !== lastGroup) {
      if (g >= 0) {
        items +=
          '<div class="q-group-header">' +
            '<span class="q-group-name">' + (g + 1) + '. ' + (GROUPS[g][langPrimary] || GROUPS[g].sv) + '</span>' +
            '<div class="q-group-btns">' +
              '<button class="q-group-btn" onclick="toggleGroup(' + g + ', true)">All</button>' +
              '<button class="q-group-btn" onclick="toggleGroup(' + g + ', false)">None</button>' +
            '</div>' +
          '</div>';
      }
      lastGroup = g;
    }
    items +=
      '<label class="q-picker-item">' +
        '<input type="checkbox" class="q-picker-cb" value="' + i + '" checked onchange="updatePickerBtn()">' +
        '<span class="q-picker-num">' + q.n + '</span>' +
        '<span class="q-picker-text">' + qLang(q, langPrimary).q + '</span>' +
      '</label>';
  });

  box.innerHTML =
    '<button class="modal-close" onclick="cancelSessionModal()">✕</button>' +
    '<p class="modal-title">Select Questions</p>' +
    '<div class="q-picker-actions">' +
      '<button class="q-picker-toggle" onclick="toggleAllQuestions(true)">All</button>' +
      '<button class="q-picker-toggle" onclick="toggleAllQuestions(false)">None</button>' +
      '<button class="q-picker-back" onclick="buildModalStep1()">← Back</button>' +
    '</div>' +
    '<div class="q-picker-list">' + items + '</div>' +
    shuffleRowHtml() +
    maxCountRowHtml() +
    '<button class="modal-btn-yes" id="picker-start-btn" onclick="startCustomQuestions()" ' +
      'style="width:100%;margin-top:10px">Start (' + QA.length + ' questions)</button>';
}

function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function setShuffle(val) {
  quizShuffle = val;
  document.querySelectorAll('.shuffle-row').forEach(function(row) {
    row.outerHTML = shuffleRowHtml();
  });
  updatePickerBtn();
}

function setMaxCount(n) {
  quizMaxCount = n;
  document.querySelectorAll('.max-count-row').forEach(function(row) {
    row.outerHTML = maxCountRowHtml();
  });
  updatePickerBtn();
}

function toggleAllQuestions(checked) {
  document.querySelectorAll('.q-picker-cb').forEach(function(cb) { cb.checked = checked; });
  updatePickerBtn();
}

function toggleGroup(groupIdx, checked) {
  var g = GROUPS[groupIdx];
  QA.forEach(function(q, i) {
    if (q.n >= g.from && q.n <= g.to) {
      var cb = document.querySelector('.q-picker-cb[value="' + i + '"]');
      if (cb) cb.checked = checked;
    }
  });
  updatePickerBtn();
}

function updatePickerBtn() {
  var count     = document.querySelectorAll('.q-picker-cb:checked').length;
  var effective = (quizMaxCount > 0 && count > quizMaxCount) ? quizMaxCount : count;
  var btn = document.getElementById('picker-start-btn');
  if (btn) btn.textContent = 'Start (' + effective + ' questions)';
}

function startAllQuestions() {
  hideSessionModal();
  var indices = QA.map(function(_, i) { return i; });
  if (quizMaxCount > 0 && indices.length > quizMaxCount) {
    indices = shuffleArray(indices).slice(0, quizMaxCount);
  }
  quizQuestions = quizShuffle ? shuffleArray(indices) : indices;
  quizI = 0; quizScore = 0; quizAns = 0; quizAnswers = [];
  startNewSession();
  renderQuiz();
}

function startCustomQuestions() {
  var selected = [];
  document.querySelectorAll('.q-picker-cb:checked').forEach(function(cb) {
    selected.push(parseInt(cb.value));
  });
  if (selected.length === 0) {
    var btn = document.getElementById('picker-start-btn');
    if (btn) { btn.textContent = 'Select at least 1 question!'; }
    return;
  }
  hideSessionModal();
  if (quizMaxCount > 0 && selected.length > quizMaxCount) {
    selected = shuffleArray(selected).slice(0, quizMaxCount);
  }
  quizQuestions = quizShuffle ? shuffleArray(selected) : selected;
  quizI = 0; quizScore = 0; quizAns = 0; quizAnswers = [];
  startNewSession();
  renderQuiz();
}

function showPreviousSessions() {
  hideSessionModal();
  renderSessions();
  var sessionsHtml = '';
  if (sessions.length === 0) {
    sessionsHtml = '<p class="res-lbl">No saved sessions yet.</p>';
  } else {
    sessions.forEach(function(s) {
      var pct        = s.completed ? Math.round(s.score / s.total * 100) : null;
      var scoreClass = !s.completed ? 'session-ongoing' : (pct >= 70 ? 'session-good' : 'session-bad');
      var scoreText  = s.completed
        ? s.score + ' / ' + s.total + (s.stopped ? ' ⏹' : '') + ' — ' + pct + '%'
        : 'in progress…';
      var canContinue = !s.completed && s.progress;
      var hasReview   = s.answers && s.answers.length > 0;
      sessionsHtml +=
        '<div class="session-item" style="margin-bottom:8px;text-align:left">' +
          '<div class="session-item-info">' +
            '<span class="session-date">' + s.date + '</span>' +
            '<span class="session-score ' + scoreClass + '">' + scoreText + '</span>' +
            (canContinue ? '<button class="session-review-btn" onclick="continueSession(' + s.id + ')">▶ Continue</button>' : '') +
            (hasReview   ? '<button class="session-review-btn" onclick="renderReview(' + s.id + ')">Review</button>' : '') +
          '</div>' +
          '<button class="session-delete-btn" onclick="deleteSession(' + s.id + ');showPreviousSessions()" title="Delete">✕</button>' +
        '</div>';
    });
  }
  document.getElementById('content').innerHTML =
    '<div class="quiz-view">' +
      '<div class="results">' +
        '<p style="font-size:2rem;margin-bottom:12px">📋</p>' +
        '<p class="res-lbl" style="margin-bottom:20px">Previous Sessions</p>' +
        sessionsHtml +
        '<button class="btn-review" style="margin-top:24px" onclick="showSessionModal()">← Back</button>' +
      '</div>' +
    '</div>';
}

function hideSessionModal() {
  document.getElementById('session-modal').classList.remove('open');
}

function confirmNewSession() {
  hideSessionModal();
  startNewSession();
  quizI = 0; quizScore = 0; quizAns = 0; quizAnswers = [];
  renderQuiz();
}

function cancelSessionModal() {
  hideSessionModal();
  setMode('list');
}

// =====================
// TÉMÁK
// =====================
var themes = [
  {
    id: 'midnight',
    label: 'Midnight',
    bg1: '#1e1e2e',
    bg2: '#161622',
    className: ''          // alapértelmezett, nincs extra class
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    bg1: '#0f0a1e',
    bg2: '#0a0714',
    className: 'theme-galaxy'
  },
  {
    id: 'terminal',
    label: 'Terminal',
    bg1: '#0a0f0a',
    bg2: '#060c06',
    className: 'theme-terminal'
  },
  {
    id: 'graphite',
    label: 'Graphite',
    bg1: '#1c1c1c',
    bg2: '#141414',
    className: 'theme-graphite'
  },
  {
    id: 'book',
    label: 'Book',
    bg1: '#f5f0e8',
    bg2: '#ece6d8',
    className: 'theme-book'
  }
];

var activeTheme = 'graphite';

// Alapértelmezett kiemelő színek témánként
var themeAccents = {
  midnight: '#00BCD4',
  galaxy:   '#CE93D8',
  terminal: '#4CAF50',
  graphite: '#90CAF9',
  book:     '#8B4513'
};

function setTheme(id) {
  var t = themes.find(function(x){ return x.id === id; });
  if (!t) return;

  // Összes téma class eltávolítása
  themes.forEach(function(x){
    if (x.className) document.documentElement.classList.remove(x.className);
  });

  // Új téma class hozzáadása
  if (t.className) document.documentElement.classList.add(t.className);

  activeTheme = id;

  // Témához illő alapértelmezett accent szín beállítása
  setColor(themeAccents[id]);

  // Aktív jelölés frissítése
  document.querySelectorAll('.theme-option').forEach(function(el){
    el.classList.toggle('active-theme', el.dataset.theme === id);
  });

  document.getElementById('color-dropdown').classList.remove('open');
  localStorage.setItem('app-theme', id);
}

// =====================
// SZÍNVÁLASZTÓ
// =====================
function togglePicker() {
  document.getElementById('color-dropdown').classList.toggle('open');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.color-picker-wrap')) {
    document.getElementById('color-dropdown').classList.remove('open');
  }
  if (!e.target.closest('.lang-picker-wrap')) {
    var ld = document.getElementById('lang-dropdown');
    if (ld) ld.classList.remove('open');
  }
});

function setColor(hex) {
  document.documentElement.style.setProperty('--accent', hex);
  document.getElementById('preview-dot').style.background = hex;
  document.querySelector('.logo-dot').style.background = hex;
}

// =====================
// DROPDOWN FELÉPÍTÉS
// =====================
function buildDropdown() {
  var dd = document.getElementById('color-dropdown');
  var html = '';

  // --- HÁTTÉR TÉMÁK szekció ---
  html += '<span class="picker-section-label">Theme</span>';

  themes.forEach(function(t) {
    html +=
      '<button class="theme-option' + (t.id === activeTheme ? ' active-theme' : '') + '" ' +
             'data-theme="' + t.id + '" ' +
             'onclick="setTheme(\'' + t.id + '\')">' +
        '<span class="theme-preview">' +
          '<span style="background:' + t.bg2 + '"></span>' +
          '<span style="background:' + t.bg1 + '"></span>' +
        '</span>' +
        t.label +
      '</button>';
  });

  html += '<hr class="picker-divider">';

  // --- KIEMELŐ SZÍNEK szekció ---
  html += '<span class="picker-section-label">Accent color</span>';

  var accents = [
    { hex: '#00BCD4', label: 'Cyan'       },
    { hex: '#4CAF50', label: 'Green'      },
    { hex: '#29B6F6', label: 'Sky blue'   },
    { hex: '#CE93D8', label: 'Purple'     },
    { hex: '#8B4513', label: 'Brown'      },
    { hex: '#D32F2F', label: 'Red'        },
    { hex: '#F57C00', label: 'Orange'     },
    { hex: '#5C6BC0', label: 'Indigo'     }
  ];

  accents.forEach(function(a) {
    html +=
      '<button class="color-option" onclick="setColor(\'' + a.hex + '\')">' +
        '<span class="color-swatch" style="background:' + a.hex + '"></span>' +
        a.label +
      '</button>';
  });

  html += '<hr class="picker-divider">';

  // --- TEXT SIZE szekció ---
  html += '<span class="picker-section-label">Text size</span>';
  html += '<div class="zoom-btn-group">';
  var zoomLabels = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  for (var z = 1; z <= 6; z++) {
    html +=
      '<button class="zoom-step-btn' + (z === currentZoom ? ' zoom-step-active' : '') + '" ' +
             'onclick="setZoom(' + z + ')">' +
        zoomLabels[z - 1] +
      '</button>';
  }
  html += '</div>';

  dd.innerHTML = html;
}

// =====================
// SIDEBAR
// =====================
function buildSidebar() {
  var sb   = document.getElementById('sidebar');
  var html = '';

  TOPICS.forEach(function(topic, ti) {
    var tcKey = 'topic-' + ti;
    var topicCollapsed = (sidebarCollapsed[tcKey] === undefined) ? (ti !== 0) : !!sidebarCollapsed[tcKey];

    html +=
      '<div class="sb-topic' + (topicCollapsed ? ' sb-topic-collapsed' : '') + '" id="sbt-' + ti + '">' +
        '<button class="sb-topic-header" onclick="toggleTopicCollapse(' + ti + ')">' +
          '<span class="sg-arrow">' + (topicCollapsed ? '▸' : '▾') + '</span>' +
          '<span class="sb-topic-name">' + sbLabel(topic) + '</span>' +
        '</button>' +
        '<div class="sb-topic-body">';

    topic.parts.forEach(function(part, pi) {
      var pKey = 'part-' + ti + '-' + pi;
      var isFirst = (ti === 0 && pi === 0);
      var partCollapsed = (sidebarCollapsed[pKey] === undefined) ? !isFirst : !!sidebarCollapsed[pKey];
      var isActive = (activeTopic === ti && activePart === pi);

      html +=
        '<div class="sb-part' + (partCollapsed ? ' sb-part-collapsed' : '') + '" id="sbp-' + ti + '-' + pi + '">' +
          '<div class="sb-part-header' + (isActive ? ' active' : '') + '">' +
            '<button class="sb-part-toggle" onclick="togglePartCollapse(' + ti + ',' + pi + ')">' +
              '<span class="sg-arrow">' + (partCollapsed ? '▸' : '▾') + '</span>' +
            '</button>' +
            '<button class="sb-part-name-btn" onclick="selectPart(' + ti + ',' + pi + ')">' +
              sbLabel(part) +
              (!part.hasData ? '<span class="sb-soon">soon</span>' : '') +
            '</button>' +
          '</div>' +
          '<div class="sb-part-body">';

      // Show question groups only when part is expanded + active + has data
      if (!partCollapsed && isActive && part.hasData) {
        html += '<div class="sb-groups">';
        GROUPS.forEach(function(g, gi) {
          var groupQs = [];
          QA.forEach(function(q, i) {
            if (q.n >= g.from && q.n <= g.to) groupQs.push({ q: q, i: i });
          });
          var gcollapsed = sidebarCollapsed[gi] !== false;
          html +=
            '<div class="sg' + (gcollapsed ? ' sg-collapsed' : '') + '" id="sg-' + gi + '">' +
              '<button class="sg-header" onclick="toggleGroupCollapse(' + gi + ')">' +
                '<span class="sg-arrow">' + (gcollapsed ? '▸' : '▾') + '</span>' +
                '<div class="sg-titles">' +
                  '<span class="sg-label">' + groupWord() + ' ' + (gi + 1) + '</span>' +
                  '<span class="sg-name">' + gName(g) + '</span>' +
                '</div>' +
                '<span class="sg-count">' + groupQs.length + '</span>' +
              '</button>' +
              '<div class="sg-items">';
          groupQs.forEach(function(item) {
            var priText = qLang(item.q, langPrimary).q;
            var secText = qLang(item.q, langSecondary).q;
            html +=
              '<button class="sidebar-item" id="si-' + item.i + '" onclick="jumpTo(' + item.i + ')">' +
                '<span class="sidebar-num">' + item.q.n + '</span>' +
                '<span class="sidebar-texts">' +
                  '<span class="sidebar-q">'   + (priText || '—')   + '</span>' +
                  (langPrimary !== langSecondary && secText ? '<span class="sidebar-qhu">' + secText + '</span>' : '') +
                '</span>' +
              '</button>';
          });
          html += '</div></div>';
        });
        html += '</div>'; // .sb-groups
      }

      html += '</div></div>'; // .sb-part-body + .sb-part
    });

    html += '</div></div>'; // .sb-topic-body + .sb-topic
  });

  sb.innerHTML = html;
}

function toggleTopicCollapse(ti) {
  var key = 'topic-' + ti;
  var current = (sidebarCollapsed[key] === undefined) ? (ti !== 0) : !!sidebarCollapsed[key];
  sidebarCollapsed[key] = !current;
  var el = document.getElementById('sbt-' + ti);
  if (!el) return;
  var collapsed = !current;
  el.classList.toggle('sb-topic-collapsed', collapsed);
  var arrow = el.querySelector(':scope > .sb-topic-header > .sg-arrow');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
  saveSidebarCollapsed();
}

function togglePartCollapse(ti, pi) {
  var key = 'part-' + ti + '-' + pi;
  var isFirst = (ti === 0 && pi === 0);
  var current = (sidebarCollapsed[key] === undefined) ? !isFirst : !!sidebarCollapsed[key];
  sidebarCollapsed[key] = !current;
  var el = document.getElementById('sbp-' + ti + '-' + pi);
  if (!el) return;
  var collapsed = !current;
  el.classList.toggle('sb-part-collapsed', collapsed);
  var arrow = el.querySelector(':scope > .sb-part-header > .sb-part-toggle > .sg-arrow');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
  // If collapsing the active+data part, groups disappear — rebuild for correctness
  if (activeTopic === ti && activePart === pi) buildSidebar();
  saveSidebarCollapsed();
}

function selectPart(ti, pi) {
  var part = TOPICS[ti].parts[pi];
  var pKey = 'part-' + ti + '-' + pi;
  var isFirst = (ti === 0 && pi === 0);
  if (activeTopic === ti && activePart === pi) {
    // Same part clicked: toggle collapse (same as clicking the arrow)
    var cur = (sidebarCollapsed[pKey] === undefined) ? !isFirst : !!sidebarCollapsed[pKey];
    sidebarCollapsed[pKey] = !cur;
  } else {
    // Different part: always expand
    sidebarCollapsed[pKey] = false;
  }
  activeTopic = ti;
  activePart  = pi;
  closeMobileSidebar();
  buildSidebar();

  if (part.hasData) {
    listQ = 0;
    mode = 'list';
    document.getElementById('tab-list').classList.add('active');
    document.getElementById('tab-quiz').classList.remove('active');
    document.getElementById('tab-dict').classList.remove('active');
    var ml = document.getElementById('mobile-tab-list');
    var mq = document.getElementById('mobile-tab-quiz');
    var md = document.getElementById('mobile-tab-dict');
    if (ml) ml.classList.add('active');
    if (mq) mq.classList.remove('active');
    if (md) md.classList.remove('active');
    document.getElementById('sessions-sidebar').classList.add('hidden');
    renderList();
  } else {
    clearQuizMode();
    document.getElementById('content').innerHTML =
      '<div class="coming-soon-wrap">' +
        '<div class="coming-soon-card">' +
          '<p class="coming-soon-flag">🚧</p>' +
          '<p class="coming-soon-lang">' + sbLabel(part) + '</p>' +
          '<p class="coming-soon-msg">Coming soon</p>' +
          '<p class="coming-soon-sub">Content not yet available.</p>' +
        '</div>' +
      '</div>';
  }
}

function toggleGroupCollapse(gi) {
  sidebarCollapsed[gi] = !sidebarCollapsed[gi];
  var el = document.getElementById('sg-' + gi);
  if (!el) return;
  var collapsed = !!sidebarCollapsed[gi];
  el.classList.toggle('sg-collapsed', collapsed);
  var arrow = el.querySelector('.sg-arrow');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
  saveSidebarCollapsed();
}

function initSidebarResize() {
  var sb = document.getElementById('sidebar');

  // Ha már van fogó, töröljük
  var old = document.getElementById('sidebar-resize-handle');
  if (old) old.remove();

  // A fogó a body-hoz tartozik, position:fixed-del pontosan
  // a scrollbar fölé helyezzük — így a sidebar layoutját nem érinti
  var handle = document.createElement('div');
  handle.id        = 'sidebar-resize-handle';
  handle.className = 'sidebar-resize-handle';
  document.body.appendChild(handle);

  function positionHandle() {
    var r = sb.getBoundingClientRect();
    handle.style.left   = (r.right - 6) + 'px';
    handle.style.top    = r.top + 'px';
    handle.style.height = r.height + 'px';
  }
  positionHandle();
  window.addEventListener('resize', positionHandle);

  var isResizing = false;
  var startX, startW;

  handle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    isResizing = true;
    startX     = e.clientX;
    startW     = sb.offsetWidth;
    document.body.classList.add('sb-resizing');
  });

  document.addEventListener('mousemove', function(e) {
    if (!isResizing) return;
    var w = Math.max(180, Math.min(460, startW + e.clientX - startX));
    sb.style.width = w + 'px';
    positionHandle();
  });

  document.addEventListener('mouseup', function() {
    if (!isResizing) return;
    isResizing = false;
    document.body.classList.remove('sb-resizing');
    localStorage.setItem('sidebar-width', sb.offsetWidth);
  });

  // Mentett szélesség visszaállítása
  var saved = localStorage.getItem('sidebar-width');
  if (saved) {
    sb.style.width = parseInt(saved) + 'px';
    positionHandle();
  }
}

function updateSidebar() {
  document.querySelectorAll('.sidebar-item').forEach(function(el, i) {
    el.classList.toggle('active', mode === 'list' && i === listQ);
  });
}

function jumpTo(i) {
  if (mode !== 'list') setMode('list');
  listQ = i;
  renderList();
}

function goHome() {
  listQ = 0;
  activeTopic = 0;
  activePart  = 0;
  closeMobileSidebar();
  if (mode === 'list') { buildSidebar(); renderList(); }
  else setMode('list');
}

// =====================
// SZÓTÁR SIDEBAR
// =====================
function buildDictSidebar() {
  var sb   = document.getElementById('sidebar');
  var html = '<p class="sidebar-label">Dictionary</p>';

  if (!WORDS || WORDS.length === 0) {
    sb.innerHTML = html + '<p class="sg-placeholder" style="padding:10px">No words loaded.</p>';
    return;
  }

  // Fejezet → szekció → szavak struktúra
  var chapters   = [];
  var chapterMap = {};

  WORDS.forEach(function(w, i) {
    var ch  = w.chapter || '–';
    var sec = w.section || '';
    if (!chapterMap[ch]) {
      chapterMap[ch] = { name: ch, sections: [], secMap: {} };
      chapters.push(chapterMap[ch]);
    }
    var chObj = chapterMap[ch];
    if (!chObj.secMap[sec]) {
      chObj.secMap[sec] = { name: sec, words: [] };
      chObj.sections.push(chObj.secMap[sec]);
    }
    chObj.secMap[sec].words.push({ w: w, i: i });
  });

  chapters.forEach(function(ch, ci) {
    var key       = 'dict-ch-' + ci;
    var collapsed = !!sidebarCollapsed[key];
    var count     = ch.sections.reduce(function(s, sec) { return s + sec.words.length; }, 0);

    html +=
      '<div class="sg' + (collapsed ? ' sg-collapsed' : '') + '" id="sg-dict-' + ci + '">' +
        '<button class="sg-header" onclick="toggleDictChapter(' + ci + ')">' +
          '<span class="sg-arrow">' + (collapsed ? '▸' : '▾') + '</span>' +
          '<div class="sg-titles">' +
            '<span class="sg-label">Chapter ' + (ci + 1) + '</span>' +
            '<span class="sg-name">' + ch.name + '</span>' +
          '</div>' +
          '<span class="sg-count">' + count + '</span>' +
        '</button>' +
        '<div class="sg-items">';

    ch.sections.forEach(function(sec, si) {
      var skey       = 'dict-sec-' + ci + '-' + si;
      var sCollapsed = !!sidebarCollapsed[skey]; // alapból nyitva

      if (sec.name) {
        // Extract leading number "N. " so it always stays on the primary (bright) line
        var numMatch  = sec.name.match(/^(\d+\.\s*)/);
        var secNum    = numMatch ? numMatch[1] : '';
        var secBody   = numMatch ? sec.name.slice(secNum.length) : sec.name;

        // Split remaining body at " / " → format: "HU_NAME / SV_NAME"
        var bodyParts  = secBody.split(' / ');
        var secPrimary, secSecondary;
        if (bodyParts.length >= 2) {
          var huPart = bodyParts[0];
          var svPart = bodyParts.slice(1).join(' / ');
          if (langPrimary === 'sv') {
            secPrimary   = secNum + svPart;
            secSecondary = huPart;
          } else {
            secPrimary   = secNum + huPart;
            secSecondary = svPart;
          }
        } else {
          // Only one language available — show as-is, no secondary
          secPrimary   = sec.name;
          secSecondary = '';
        }

        html +=
          '<div class="dict-sb-sec-wrap' + (sCollapsed ? ' sg-collapsed' : '') + '" id="' + skey + '">' +
            '<button class="dict-sb-sec-hdr" onclick="toggleDictSection(\'' + skey + '\')">' +
              '<span class="sg-arrow dict-sb-arrow">' + (sCollapsed ? '▸' : '▾') + '</span>' +
              '<span class="dict-sb-sec-titles">' +
                '<span class="dict-sb-sec-pri">' + secPrimary + '</span>' +
                (secSecondary && langPrimary !== langSecondary ? '<span class="dict-sb-sec-sec">' + secSecondary + '</span>' : '') +
              '</span>' +
            '</button>' +
            '<div class="sg-items">';
        sec.words.forEach(function(item) {
          html +=
            '<button class="sidebar-item" id="dsi-' + item.i + '" onclick="jumpToWord(' + item.i + ')">' +
              '<span class="sidebar-num">' + (item.i + 1) + '</span>' +
              '<span class="sidebar-texts">' +
                '<span class="sidebar-q">'   + wLang(item.w, langPrimary)   + '</span>' +
                (langPrimary !== langSecondary ? '<span class="sidebar-qhu">' + wLang(item.w, langSecondary) + '</span>' : '') +
              '</span>' +
            '</button>';
        });
        html += '</div></div>';
      } else {
        // Szekció nélküli szavak (nincs fejléc)
        sec.words.forEach(function(item) {
          html +=
            '<button class="sidebar-item" id="dsi-' + item.i + '" onclick="jumpToWord(' + item.i + ')">' +
              '<span class="sidebar-num">' + (item.i + 1) + '</span>' +
              '<span class="sidebar-texts">' +
                '<span class="sidebar-q">'   + wLang(item.w, langPrimary)   + '</span>' +
                (langPrimary !== langSecondary ? '<span class="sidebar-qhu">' + wLang(item.w, langSecondary) + '</span>' : '') +
              '</span>' +
            '</button>';
        });
      }
    });

    html += '</div></div>';
  });

  sb.innerHTML = html;
}

function updateDictSidebar() {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(function(el) {
    var idx = parseInt(el.id.replace('dsi-', ''));
    el.classList.toggle('active', idx === dictI);
  });
  // Aktív szó láthatóvá görgetése
  var active = document.getElementById('dsi-' + dictI);
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function jumpToWord(i) {
  dictI = i; dictFlipped = false;
  renderDict();
}

function toggleDictChapter(ci) {
  var key = 'dict-ch-' + ci;
  sidebarCollapsed[key] = !sidebarCollapsed[key];
  var el = document.getElementById('sg-dict-' + ci);
  if (!el) return;
  var collapsed = !!sidebarCollapsed[key];
  el.classList.toggle('sg-collapsed', collapsed);
  var arrow = el.querySelector('.sg-header > .sg-arrow');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
  saveSidebarCollapsed();
}

function toggleDictSection(skey) {
  var currentlyCollapsed = !!sidebarCollapsed[skey];
  sidebarCollapsed[skey] = !currentlyCollapsed;
  var el = document.getElementById(skey);
  if (!el) return;
  var collapsed = !currentlyCollapsed;
  el.classList.toggle('sg-collapsed', collapsed);
  var arrow = el.querySelector('.dict-sb-arrow');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
  saveSidebarCollapsed();
}

// =====================
// LISTA MÓD
// =====================
function renderList() {
  clearQuizMode();
  var c = document.getElementById('content');
  if (!langHasData(langPrimary)) { renderComingSoon(langPrimary); updateSidebar(); saveState(); return; }
  var q   = QA[listQ];
  var pri = qLang(q, langPrimary);
  var sec = qLang(q, langSecondary);
  var html =
    '<div class="question-view">' +
      '<div class="list-body">' +
        '<div class="q-badge">' + q.n + ' / ' + QA.length + '</div>' +
        '<h2 class="q-text-sv">' + pri.q + '</h2>' +
        (langPrimary !== langSecondary ? '<p class="q-text-hu">' + sec.q + '</p>' : '') +
        '<div class="answer-card">' +
          '<p class="ans-lang">' + langLabel(langPrimary) + '</p>' +
          '<p class="ans-sv">'   + formatAnswer(pri.a) + '</p>' +
          (langPrimary !== langSecondary
            ? '<hr class="ans-divider">' +
              '<p class="ans-lang">' + langLabel(langSecondary) + '</p>' +
              '<p class="ans-hu">'   + formatAnswer(sec.a) + '</p>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="list-nav">' +
        '<button class="arrow-btn" onclick="prevQ()" ' + (listQ === 0 ? 'disabled' : '') + '>&larr; Previous</button>' +
        '<span class="q-counter">' + (listQ + 1) + ' / ' + QA.length + '</span>' +
        '<button class="arrow-btn" onclick="nextQ()" ' + (listQ === QA.length - 1 ? 'disabled' : '') + '>Next &rarr;</button>' +
      '</div>' +
    '</div>';

  c.innerHTML = html;
  requestAnimationFrame(applyListHeight);
  updateSidebar();
  saveState();
}

function prevQ() { if (listQ > 0) { listQ--; renderList(); } }
function nextQ() { if (listQ < QA.length - 1) { listQ++; renderList(); } }

// =====================
// VÁLASZ FORMÁZÁS
// =====================
// Converts inline numbered lists ("... 1) foo 2) bar") into separate lines.
function formatAnswer(text) {
  // Match a space + digit(s) + ")" + space — insert a line break before each item.
  return text.replace(/ (\d+\)) /g, '<br><span class="ans-list-num">$1</span> ');
}

// =====================
// SZÓTÁR MÓD
// =====================
function renderDict() {
  clearQuizMode();
  var c = document.getElementById('content');

  if (!WORDS || WORDS.length === 0) {
    c.innerHTML =
      '<div class="question-view">' +
        '<p style="color:var(--muted);text-align:center;padding:60px 0">' +
          'The words.js file is empty. Add words in the specified format.' +
        '</p>' +
      '</div>';
    return;
  }

  var w    = WORDS[dictI];
  var tot  = WORDS.length;
  var wpri = wLang(w, langPrimary);
  var wsec = wLang(w, langSecondary);

  var metaHtml = '';
  if (w.chapter) metaHtml += '<span class="dict-meta-chapter">' + w.chapter + '</span>';
  if (w.section) metaHtml += '<span class="dict-meta-section">' + w.section + '</span>';
  var metaRow = metaHtml ? '<div class="dict-meta">' + metaHtml + '</div>' : '';

  c.innerHTML =
    '<div class="question-view">' +
      metaRow +
      '<div class="dict-card" id="dict-card" onclick="dictFlip()">' +
        '<div class="dict-card-inner" id="dict-card-inner">' +
          '<div class="dict-face dict-front">' +
            '<p class="dict-lang">' + langLabel(langPrimary) + '</p>' +
            '<h2 class="dict-word">' + wpri + '</h2>' +
            (langPrimary !== langSecondary ? '<p class="dict-hint">Click to flip →</p>' : '') +
          '</div>' +
          '<div class="dict-face dict-back">' +
            (langPrimary !== langSecondary ? '<p class="dict-lang">' + langLabel(langSecondary) + '</p>' : '') +
            '<h2 class="dict-word dict-word-hu">' + wsec + '</h2>' +
            (langPrimary !== langSecondary ? '<p class="dict-hint">' + wpri + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="nav-arrows" style="margin-top:28px">' +
        '<button class="arrow-btn" onclick="dictPrev()" ' + (dictI === 0 ? 'disabled' : '') + '>&larr; Previous</button>' +
        '<span class="q-counter">' + (dictI + 1) + ' / ' + tot + '</span>' +
        '<button class="arrow-btn" onclick="dictNext()" ' + (dictI === tot - 1 ? 'disabled' : '') + '>Next &rarr;</button>' +
      '</div>' +
    '</div>';

  if (dictFlipped) {
    var inner = document.getElementById('dict-card-inner');
    if (inner) inner.classList.add('flipped');
  }

  updateDictSidebar();
  saveState();
}

function dictFlip() {
  dictFlipped = !dictFlipped;
  var inner = document.getElementById('dict-card-inner');
  if (inner) inner.classList.toggle('flipped', dictFlipped);
}

function dictPrev() {
  if (dictI > 0) { dictI--; dictFlipped = false; renderDict(); }
}

function dictNext() {
  if (dictI < WORDS.length - 1) { dictI++; dictFlipped = false; renderDict(); }
}

// =====================
// EXPLANATION MÓD
// =====================
function renderExplanation() {
  clearQuizMode();
  var c = document.getElementById('content');
  c.innerHTML = '<div class="expl-view"><div class="expl-body"><p class="expl-loading">Betöltés…</p></div></div>';
  requestAnimationFrame(applyExplanationHeight);

  fetch('./explanation-hu.txt?nocache=' + Date.now())
    .then(function(r) { return r.text(); })
    .then(function(text) {
      text = text.trim();
      if (!text) {
        c.innerHTML =
          '<div class="expl-view"><div class="expl-body">' +
            '<p class="expl-empty">Még nincs tartalom. Másold be a szöveget az <code>explanation-hu.txt</code> fájlba.</p>' +
          '</div></div>';
        requestAnimationFrame(applyExplanationHeight);
        return;
      }
      c.innerHTML = '<div class="expl-view"><div class="expl-body">' + buildExplHtml(text) + '</div></div>';
      requestAnimationFrame(applyExplanationHeight);
    })
    .catch(function() {
      c.innerHTML = '<div class="expl-view"><div class="expl-body"><p class="expl-empty">Nem sikerült betölteni a fájlt.</p></div></div>';
      requestAnimationFrame(applyExplanationHeight);
    });
}

// Parses explanation-hu.txt (with ════/──── decorators) into styled HTML
function buildExplHtml(text) {
  // True if a line is 8+ repeated decorator characters (═ ─ = -)
  function isDecorLine(line) {
    var t = line.trim();
    return t.length >= 8 && /^([═─=\-])\1+$/.test(t);
  }
  // 'thick' for ═/=, 'thin' for ─/-, null if no decorator found
  function firstDecorType(lines) {
    for (var i = 0; i < lines.length; i++) {
      if (!isDecorLine(lines[i])) continue;
      var ch = lines[i].trim()[0];
      return (ch === '═' || ch === '=') ? 'thick' : 'thin';
    }
    return null;
  }
  // Render lines with | as an HTML table
  function renderTable(lines) {
    var rows = lines.filter(function(l) {
      return l.trim() && !isDecorLine(l) && l.includes('|');
    });
    if (rows.length < 2) return '';
    var out = '<table class="expl-table"><tbody>';
    rows.forEach(function(row, idx) {
      var cells = row.split('|').map(function(c) { return c.trim(); }).filter(Boolean);
      if (!cells.length) return;
      var tag = idx === 0 ? 'th' : 'td';
      out += '<tr>' + cells.map(function(cell) {
        return '<' + tag + ' class="expl-td">' + cell + '</' + tag + '>';
      }).join('') + '</tr>';
    });
    out += '</tbody></table>';
    return out;
  }

  // Parse all double-newline-separated blocks
  var parsed = text.split(/\n\n+/).map(function(block) {
    block = block.trim();
    if (!block) return null;
    var lines      = block.split('\n');
    var dType      = firstDecorType(lines);
    var contentLines = lines.filter(function(l) { return !isDecorLine(l) && l.trim(); });
    if (!contentLines.length) return null; // pure decorator → skip

    if (dType) {
      var texts  = contentLines.map(function(l) { return l.trim(); });
      var joined = texts.join(' ');
      if (dType === 'thin') {
        // ─── = question header → h3 with number badge
        var m = joined.match(/^(\d+)\.\s+([\s\S]*)/);
        if (m) {
          return { type: 'h3', html:
            '<h3 class="expl-h3">' +
              '<span class="expl-qnum">' + m[1] + '</span>' + m[2] +
            '</h3>'
          };
        }
        return { type: 'h3', html: '<h3 class="expl-h3">' + joined + '</h3>' };
      }
      if (dType === 'thick') {
        // ═══ = section or main title
        if (texts.some(function(t) { return /\d+\s*KÉRDÉS/i.test(t); })) {
          return { type: 'h1', html:
            '<div class="expl-title-block">' +
              '<h1 class="expl-h1">' + texts[0] + '</h1>' +
              (texts[1] ? '<p class="expl-subtitle">' + texts[1] + '</p>' : '') +
            '</div>'
          };
        }
        return { type: 'h2', html: '<h2 class="expl-h2">' + joined + '</h2>' };
      }
    }

    // Explicit markdown headings (### ## #)
    if (block.startsWith('### ')) return { type: 'h3', html: '<h3 class="expl-h3">' + block.slice(4) + '</h3>' };
    if (block.startsWith('## '))  return { type: 'h2', html: '<h2 class="expl-h2">' + block.slice(3) + '</h2>' };
    if (block.startsWith('# '))   return { type: 'h1', html: '<h1 class="expl-h1">' + block.slice(2) + '</h1>' };

    // Bullet item (block starts with • possibly after whitespace)
    if (/^\s*•\s/.test(block)) {
      var bulletText = block.replace(/^\s*•\s*/, '').replace(/\n\s*/g, ' ');
      return { type: 'li', html: '<li class="expl-li">' + bulletText + '</li>' };
    }

    // Table (2+ lines containing |)
    if (lines.filter(function(l) { return l.includes('|'); }).length >= 2) {
      return { type: 'table', html: renderTable(lines) };
    }

    // Regular paragraph
    return { type: 'p', html: '<p class="expl-p">' + contentLines.join('\n').replace(/\n/g, '<br>') + '</p>' };
  }).filter(Boolean);

  // Build final HTML — wrap consecutive <li> items in <ul>
  var out = '';
  var inList = false;
  parsed.forEach(function(item) {
    if (item.type === 'li') {
      if (!inList) { out += '<ul class="expl-list">'; inList = true; }
      out += item.html;
    } else {
      if (inList) { out += '</ul>'; inList = false; }
      out += item.html;
    }
  });
  if (inList) out += '</ul>';
  return out;
}

function applyExplanationHeight() {
  var c  = document.getElementById('content');
  var ev = document.querySelector('.expl-view');
  if (!ev) return;
  c.classList.add('expl-mode');
  var headerH    = (document.getElementById('site-header')      || {}).offsetHeight || 0;
  var bottomNavH = (document.getElementById('mobile-bottom-nav') || {}).offsetHeight || 0;
  var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  if (vh > window.screen.height) vh = window.screen.height;
  var available = Math.floor(vh - headerH - bottomNavH) - 4;
  ev.style.height = Math.max(200, available) + 'px';
}

// =====================
// KVÍZ MAGASSÁG
// visualViewport.height = ténylegesen látható magasság (Android nav sáv NÉLKÜL)
// window.innerHeight    = layout magasság (Android nav sáv beleszámítva)
// =====================
function applyQuizHeight() {
  var c  = document.getElementById('content');
  var qv = document.querySelector('.quiz-view');
  if (!qv) return;

  c.classList.add('quiz-mode');

  var headerH    = (document.getElementById('site-header')      || {}).offsetHeight || 0;
  var bottomNavH = (document.getElementById('mobile-bottom-nav') || {}).offsetHeight || 0;

  // Ismert Android bug: innerHeight fizikai pixelt ad → screen.height a helyes felső határ
  var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  if (vh > window.screen.height) vh = window.screen.height;

  var available = Math.floor(vh - headerH - bottomNavH) - 4; // 4px biztonsági rés
  qv.style.height = Math.max(200, available) + 'px';
}

function applyListHeight() {
  var c  = document.getElementById('content');
  var qv = document.querySelector('.question-view');
  if (!qv) return;

  c.classList.add('list-mode');

  var headerH    = (document.getElementById('site-header')      || {}).offsetHeight || 0;
  var bottomNavH = (document.getElementById('mobile-bottom-nav') || {}).offsetHeight || 0;

  var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  if (vh > window.screen.height) vh = window.screen.height;

  var available = Math.floor(vh - headerH - bottomNavH) - 4;
  qv.style.height = Math.max(200, available) + 'px';
}

// Újraszámol tájolásváltásnál és böngészőchrome változásnál
(function() {
  function onVpChange() {
    if (mode === 'quiz')        requestAnimationFrame(applyQuizHeight);
    if (mode === 'list')        requestAnimationFrame(applyListHeight);
    if (mode === 'explanation') requestAnimationFrame(applyExplanationHeight);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onVpChange);
  } else {
    window.addEventListener('resize', onVpChange);
  }
  window.addEventListener('orientationchange', function() {
    setTimeout(function() {
      if (mode === 'quiz')        applyQuizHeight();
      if (mode === 'list')        applyListHeight();
      if (mode === 'explanation') applyExplanationHeight();
    }, 300);
  });
})();

function clearQuizMode() {
  var c = document.getElementById('content');
  if (c) { c.classList.remove('quiz-mode'); c.classList.remove('list-mode'); c.classList.remove('expl-mode'); }
}

// =====================
// KVÍZ MÓD
// =====================
function renderQuiz() {
  var c   = document.getElementById('content');
  var tot = quizQuestions.length;

  if (!langHasData(langPrimary)) { renderComingSoon(langPrimary); return; }

  if (quizI >= tot) {
    finishSession();
    var pct = Math.round(quizScore / tot * 100);
    c.innerHTML =
      '<div class="quiz-view">' +
        '<div class="results">' +
          '<div class="big-score">' + quizScore + '/' + tot + '</div>' +
          '<p class="res-lbl">' + pct + '% &mdash; ' + (pct >= 70 ? 'Well done! 🎉' : 'Try again! 💪') + '</p>' +
          '<div class="results-btns">' +
            '<button class="btn-restart" onclick="resetQuiz()">Restart</button>' +
            '<button class="btn-review" onclick="renderReview(' + currentSessionId + ')">Review</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    return;
  }

  var q    = QA[quizQuestions[quizI]];
  var pri  = qLang(q, langPrimary);
  var sec  = qLang(q, langSecondary);
  var prog = Math.round(quizI / tot * 100);
  var optsHtml = '';

  pri.opts.forEach(function(o, i) {
    var secRaw = sec.opts[i] || '';
    optsHtml +=
      '<button class="opt" id="qo-' + i + '" onclick="pick(' + i + ')">' +
        o +
        (langPrimary !== langSecondary ? '<span class="opt-hu">' + secRaw + '</span>' : '') +
      '</button>';
  });

  c.innerHTML =
    '<div class="quiz-view">' +
      '<div class="quiz-top">' +
        '<div class="progress-wrap">' +
          '<div class="progress-fill" style="width:' + prog + '%"></div>' +
        '</div>' +
        '<p class="quiz-q-num">Question ' + (quizI + 1) + ' / ' + tot + '</p>' +
        '<h2 class="quiz-q-sv">' + pri.q + '</h2>' +
        (langPrimary !== langSecondary ? '<p class="quiz-q-hu">' + sec.q + '</p>' : '') +
      '</div>' +
      '<div class="quiz-opts-scroll">' +
        optsHtml +
      '</div>' +
      '<div class="quiz-nav">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<span class="score-txt" id="score-txt">Score: ' + quizScore + ' / ' + quizAns + '</span>' +
          '<button class="btn-stop" onclick="stopQuiz()">⏹ Stop</button>' +
        '</div>' +
        '<div style="display:flex;gap:10px">' +
          '<button class="btn-skip" id="btn-skip" onclick="advance()">Skip</button>' +
          '<button class="btn-next" id="btn-next" style="display:none" onclick="advance()">Next &rarr;</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Quiz magasság beállítása JS-sel — rAF hogy a DOM teljesen renderelve legyen
  requestAnimationFrame(applyQuizHeight);

  // Ha már válaszolt erre a kérdésre, állítsuk vissza az állapotot
  if (quizAnswers.length > quizI) {
    var ans = quizAnswers[quizI];
    pri.opts.forEach(function(_, j) {
      document.getElementById('qo-' + j).disabled = true;
    });
    if (ans.picked === ans.correct) {
      document.getElementById('qo-' + ans.picked).classList.add('correct');
    } else {
      document.getElementById('qo-' + ans.picked).classList.add('wrong');
      document.getElementById('qo-' + ans.correct).classList.add('correct');
    }
    document.getElementById('btn-skip').style.display = 'none';
    document.getElementById('btn-next').style.display = 'inline-block';
  }
}

function pick(i) {
  var q   = QA[quizQuestions[quizI]];
  var pri = qLang(q, langPrimary);
  var sec = qLang(q, langSecondary);
  quizAns++;

  pri.opts.forEach(function(_, j) {
    document.getElementById('qo-' + j).disabled = true;
  });

  quizAnswers.push({ qi: quizQuestions[quizI], picked: i, correct: q.c });

  if (i === q.c) {
    quizScore++;
    document.getElementById('qo-' + i).classList.add('correct');
  } else {
    document.getElementById('qo-' + i).classList.add('wrong');
    document.getElementById('qo-' + q.c).classList.add('correct');
  }

  document.getElementById('score-txt').textContent = 'Score: ' + quizScore + ' / ' + quizAns;
  document.getElementById('btn-skip').style.display = 'none';
  document.getElementById('btn-next').style.display = 'inline-block';
  saveSessionProgress();
}

function advance()   { quizI++; renderQuiz(); }
function resetQuiz() {
  quizQuestions = QA.map(function(_, i) { return i; });
  quizI = 0; quizScore = 0; quizAns = 0; quizAnswers = [];
  showSessionModal();
}

// =====================
// MÓD VÁLTÁS
// =====================
function toggleMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebar-backdrop');
  sidebar.classList.toggle('mobile-open');
  backdrop.classList.toggle('visible');
}

function closeMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebar-backdrop');
  sidebar.classList.remove('mobile-open');
  backdrop.classList.remove('visible');
}

function setMode(m) {
  var prev = mode;
  mode = m;
  document.getElementById('tab-expl').classList.toggle('active', m === 'explanation');
  document.getElementById('tab-list').classList.toggle('active', m === 'list');
  document.getElementById('tab-quiz').classList.toggle('active', m === 'quiz');
  document.getElementById('tab-dict').classList.toggle('active', m === 'dict');
  // Mobile bottom nav sync
  var me = document.getElementById('mobile-tab-expl');
  var ml = document.getElementById('mobile-tab-list');
  var mq = document.getElementById('mobile-tab-quiz');
  var md = document.getElementById('mobile-tab-dict');
  if (me) me.classList.toggle('active', m === 'explanation');
  if (ml) ml.classList.toggle('active', m === 'list');
  if (mq) mq.classList.toggle('active', m === 'quiz');
  if (md) md.classList.toggle('active', m === 'dict');
  closeMobileSidebar();
  document.getElementById('sessions-sidebar').classList.toggle('hidden', m !== 'quiz');

  if (m === 'explanation') {
    if (prev === 'dict') buildSidebar();
    renderExplanation();
  } else if (m === 'dict') {
    buildDictSidebar();
    if (prev !== 'dict') { dictI = 0; dictFlipped = false; }
    renderDict();
  } else {
    // Lista vagy Kvíz módban a szabály sávot mutatjuk
    if (prev === 'dict') buildSidebar();
    if (m === 'list') {
      renderList();
    } else if (prev !== 'quiz') {
      showSessionModal();
      updateSidebar();
    }
  }
}

// =====================
// INIT
// =====================
loadSessions();
loadLangs();
updateHeaderSubtitle();
loadZoom();
loadSidebarCollapsed();
buildDropdown();
buildLangPicker();
setTheme(localStorage.getItem('app-theme') || 'graphite');
quizQuestions = QA.map(function(_, i) { return i; });

// Mentett állapot visszaállítása
var savedMode = loadState();

// Tab gombok aktív állapota
document.getElementById('tab-expl').classList.toggle('active', savedMode === 'explanation');
document.getElementById('tab-list').classList.toggle('active', savedMode === 'list');
document.getElementById('tab-quiz').classList.toggle('active', savedMode === 'quiz');
document.getElementById('tab-dict').classList.toggle('active', savedMode === 'dict');
document.getElementById('sessions-sidebar').classList.toggle('hidden', savedMode !== 'quiz');

if (savedMode === 'dict') {
  mode = 'dict';
  buildDictSidebar();
  renderDict();
} else if (savedMode === 'explanation') {
  mode = 'explanation';
  buildSidebar();
  renderExplanation();
} else {
  mode = 'list';
  buildSidebar();
  renderList();
}
initSidebarResize();

// Billentyűzetes navigáció szótár módban
document.addEventListener('keydown', function(e) {
  if (mode !== 'dict') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); dictNext(); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); dictPrev(); }
  else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); dictFlip(); }
});

// =====================
// PULL TO REFRESH
// =====================
(function() {
  var startY     = 0;
  var pulling    = false;
  var refreshing = false;
  var THRESHOLD  = 70;
  var ind        = document.getElementById('ptr-indicator');
  if (!ind) return;

  function getContent() { return document.getElementById('content'); }

  function hideIndicator() {
    ind.style.transform = '';
    ind.style.opacity   = '0';
    ind.classList.remove('ptr-ready');
  }

  window.addEventListener('touchstart', function(e) {
    if (refreshing) return;
    // Görgethető belső területekről ne induljon pull-to-refresh
    var scrollAreas = document.querySelectorAll('.quiz-opts-scroll, .list-body, .expl-view, #sidebar');
    for (var i = 0; i < scrollAreas.length; i++) {
      if (scrollAreas[i].contains(e.target)) { pulling = false; return; }
    }
    var c = getContent();
    startY  = e.touches[0].clientY;
    pulling = c ? c.scrollTop < 2 : false;
  }, { passive: true });

  window.addEventListener('touchmove', function(e) {
    if (!pulling || refreshing) return;
    var dy = e.touches[0].clientY - startY;
    var c  = getContent();

    if (dy <= 0 || (c && c.scrollTop > 2)) {
      pulling = false;
      hideIndicator();
      return;
    }

    e.preventDefault();
    var pull  = Math.min(dy * 0.4, 60);
    var alpha = Math.min(dy / THRESHOLD, 1);
    ind.style.transform = 'translateY(' + pull + 'px)';
    ind.style.opacity   = alpha;
    ind.textContent     = dy >= THRESHOLD ? '↻' : '↓';
    ind.classList.toggle('ptr-ready', dy >= THRESHOLD);
  }, { passive: false });

  window.addEventListener('touchend', function(e) {
    if (!pulling || refreshing) return;
    pulling = false;
    var dy  = e.changedTouches[0].clientY - startY;
    if (dy >= THRESHOLD) {
      refreshing = true;
      ind.classList.add('ptr-spinning');
      ind.textContent = '↻';
      setTimeout(function() { location.reload(); }, 400);
    } else {
      hideIndicator();
    }
  }, { passive: true });
})();
