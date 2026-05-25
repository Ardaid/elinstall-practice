// ============================================================
//  Merges all language question files into QA[].
//  Do NOT edit here — edit the language files directly.
// ============================================================

// Group boundary indices (0-based) — mirrors GROUPS in app.js
var groupRanges = [
  [0,  14], [15, 23], [24, 32], [33, 54],
  [55, 84], [85, 90], [91, 111]
];

function getGroupIdx(idx) {
  for (var g = 0; g < groupRanges.length; g++) {
    if (idx >= groupRanges[g][0] && idx <= groupRanges[g][1]) return g;
  }
  return groupRanges.length - 1;
}

function shuffleIdxArr(arr) {
  var a = arr.slice();
  for (var k = a.length - 1; k > 0; k--) {
    var r = Math.floor(Math.random() * (k + 1));
    var tmp = a[k]; a[k] = a[r]; a[r] = tmp;
  }
  return a;
}

function parseLang(text, qPrefix, aPrefix) {
  var lines = text.split('\n');
  var result = [];
  var cur = null;
  var qRe = new RegExp('^' + qPrefix + ':\\s*');
  var aRe = new RegExp('^' + aPrefix + ':\\s*');
  lines.forEach(function(line) {
    line = line.trim();
    if (/^\d+\.\s*$/.test(line)) {
      if (cur) result.push(cur);
      cur = { q: '', a: '' };
    } else if (cur) {
      if (qRe.test(line)) cur.q = line.replace(qRe, '');
      if (aRe.test(line)) cur.a = line.replace(aRe, '');
    }
  });
  if (cur && (cur.q || cur.a)) result.push(cur);
  return result;
}

var svArr = parseLang(QUESTIONS_SV_TEXT, 'SV',  'Svenska');
var huArr = parseLang(QUESTIONS_HU_TEXT, 'HU',  'Magyar');
var enArr = parseLang(QUESTIONS_EN_TEXT, 'GB',  'English');
var esArr = parseLang(QUESTIONS_ES_TEXT, 'ES',  'Español');

var QA = svArr.map(function(sv, i) {
  var hu = huArr[i] || { q: '', a: '' };
  var en = enArr[i] || { q: '', a: '' };
  var es = esArr[i] || { q: '', a: '' };

  // Pick 2 wrong answers: prefer same group first, fall back to others.
  var gi = getGroupIdx(i);
  var sameGrp = [], otherGrp = [];
  svArr.forEach(function(_, j) {
    if (j === i) return;
    (getGroupIdx(j) === gi ? sameGrp : otherGrp).push(j);
  });
  var pool  = shuffleIdxArr(sameGrp).concat(shuffleIdxArr(otherGrp));
  var wrong = [
    {
      sv: svArr[pool[0]].a,
      hu: (huArr[pool[0]] || { a: '' }).a,
      en: (enArr[pool[0]] || { a: '' }).a,
      es: (esArr[pool[0]] || { a: '' }).a
    },
    {
      sv: svArr[pool[1]].a,
      hu: (huArr[pool[1]] || { a: '' }).a,
      en: (enArr[pool[1]] || { a: '' }).a,
      es: (esArr[pool[1]] || { a: '' }).a
    }
  ];

  var answerPool = [
    { sv: sv.a, hu: hu.a, en: en.a, es: es.a, c: true  },
    { sv: wrong[0].sv, hu: wrong[0].hu, en: wrong[0].en, es: wrong[0].es, c: false },
    { sv: wrong[1].sv, hu: wrong[1].hu, en: wrong[1].en, es: wrong[1].es, c: false }
  ];

  answerPool.sort(function() { return Math.random() - 0.5; });

  var correctIdx = 0;
  for (var k = 0; k < answerPool.length; k++) {
    if (answerPool[k].c) { correctIdx = k; break; }
  }

  return {
    n:      i + 1,
    qSv:    sv.q,  qHu: hu.q,  qEn: en.q,  qEs: es.q,
    aSv:    sv.a,  aHu: hu.a,  aEn: en.a,  aEs: es.a,
    opts:   answerPool.map(function(o) { return o.sv; }),
    optsHu: answerPool.map(function(o) { return o.hu; }),
    optsEn: answerPool.map(function(o) { return o.en; }),
    optsEs: answerPool.map(function(o) { return o.es; }),
    c:      correctIdx
  };
});
