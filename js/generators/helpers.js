/**
 * Shared builders for Primary 3 generators.
 */
(function (global) {
  'use strict';

  function num(v) {
    if (v == null) return NaN;
    var s = String(v).trim();
    if (!s) return NaN;
    return Number(s);
  }

  function esc(s) {
    return global.Frac.escape(String(s));
  }

  function lead(html) { return '<p class="q-lead">' + html + '</p>'; }
  function expr(html) { return '<p class="q-expr">' + html + '</p>'; }
  function hint(html) { return '<p class="q-hint">' + html + '</p>'; }
  function word(html) { return '<p class="q-word">' + html + '</p>'; }

  function carries(n, m) {
    n = Math.abs(n);
    while (n > 0) {
      if ((n % 10) * m >= 10) return true;
      n = Math.floor(n / 10);
    }
    return false;
  }

  /**
   * Reject 2-digit×2-digit and any three-factor regrouping that needs it.
   * Also reject a later step whose factor is already 4 digits.
   */
  function assertMulFactors(factors) {
    var i;
    for (i = 0; i < factors.length; i++) {
      if (!isFinite(factors[i]) || factors[i] < 0 || Math.round(factors[i]) !== factors[i]) {
        throw new Error('bad factor');
      }
      if (factors[i] >= 1000) throw new Error('4-digit factor');
    }
    if (factors.length === 2) {
      if (factors[0] >= 10 && factors[1] >= 10) throw new Error('2-digit × 2-digit');
      return;
    }
    if (factors.length !== 3) throw new Error('factor count');
    var big = factors.filter(function (n) { return n >= 10; });
    if (big.length > 1) throw new Error('two multi-digit factors');
    var a = factors[0], b = factors[1], c = factors[2];
    if (a * b >= 1000 || b * c >= 1000 || a * c >= 1000) throw new Error('4-digit intermediate');
    if (big.length === 1) {
      var sm = factors.filter(function (n) { return n < 10; });
      if (sm[0] * sm[1] >= 10) throw new Error('regroups into 2-digit × 2-digit');
    }
  }

  function assertDiv(n, d, q, r) {
    r = r || 0;
    if (d < 2 || d > 9) throw new Error('divisor must be 1-digit');
    if (n < 10 || n > 999) throw new Error('dividend out of P3 range');
    if (q < 0 || r < 0 || r >= d) throw new Error('bad remainder');
    if (n !== d * q + r) throw new Error('division mismatch');
  }

  function fillQ(topic, prompt, answer, extra) {
    extra = extra || {};
    var unit = extra.unitText ? ' ' + extra.unitText : '';
    return global.U.q(Object.assign({
      topic: topic,
      type: 'fill',
      promptHtml: prompt,
      answer: answer,
      answerHtml: esc(String(answer) + unit),
      accept: function (v) { return global.U.almostEqual(v, answer, 0.001); }
    }, extra));
  }

  function tfQ(topic, prompt, isTrue, extra) {
    return global.U.q(Object.assign({
      topic: topic,
      type: 'tf',
      promptHtml: prompt,
      answer: !!isTrue,
      answerHtml: isTrue ? '對' : '錯',
      accept: function (v) { return !!v === !!isTrue; }
    }, extra || {}));
  }

  function choiceQ(topic, prompt, correct, choices, extra) {
    extra = extra || {};
    var ch = global.U.shuffle(choices.slice());
    var label = correct;
    for (var i = 0; i < choices.length; i++) {
      if (String(choices[i].value) === String(correct)) label = choices[i].label;
    }
    return global.U.q(Object.assign({
      topic: topic,
      type: extra.type || 'mc',
      promptHtml: prompt,
      answer: correct,
      choices: ch,
      answerHtml: extra.answerHtml || esc(label),
      accept: function (v) { return String(v) === String(correct); }
    }, extra));
  }

  function sameSet(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    var as = a.map(function (x) { return String(x); }).sort();
    var bs = b.map(function (x) { return String(x); }).sort();
    for (var i = 0; i < as.length; i++) if (as[i] !== bs[i]) return false;
    return true;
  }

  function multiQ(topic, prompt, answerIds, choices, answerHtml, extra) {
    return global.U.q(Object.assign({
      topic: topic,
      type: 'multi',
      promptHtml: prompt,
      answer: answerIds.slice(),
      choices: global.U.shuffle(choices.slice()),
      answerHtml: answerHtml,
      accept: function (v) { return sameSet(v, answerIds); }
    }, extra || {}));
  }

  function remQ(topic, prompt, qv, rv, extra) {
    extra = extra || {};
    return global.U.q(Object.assign({
      topic: topic,
      type: 'fill',
      inputMode: 'remainder',
      promptHtml: prompt,
      answer: { q: qv, r: rv },
      answerHtml: esc('商 ' + qv + '　餘 ' + rv),
      accept: function (raw) {
        if (!raw || typeof raw !== 'object') return false;
        return num(raw.q) === qv && num(raw.r) === rv;
      }
    }, extra));
  }

  function timeQ(topic, prompt, h, m, extra) {
    extra = extra || {};
    return global.U.q(Object.assign({
      topic: topic,
      type: 'fill',
      inputMode: 'time',
      promptHtml: prompt,
      answer: { h: h, m: m },
      answerHtml: global.Diagrams.timeDigital(h, m),
      accept: function (raw) {
        if (!raw || typeof raw !== 'object') return false;
        return num(raw.h) === h && num(raw.m) === m;
      }
    }, extra));
  }

  /**
 * Build an MC whose correct option is the unique closest number to exact.
 */
function estimateChoices(exact, step) {
  var base = Math.max(step, Math.round(exact / step) * step);
  var pool = [base, base + step, base - step, base + 2 * step, base - 2 * step, base + 3 * step];
  pool = pool.filter(function (x, i) { return x > 0 && pool.indexOf(x) === i; });
  function closest(list) {
    var bestD = Infinity;
    list.forEach(function (x) { bestD = Math.min(bestD, Math.abs(x - exact)); });
    return list.filter(function (x) { return Math.abs(Math.abs(x - exact) - bestD) < 1e-9; });
  }
  var guard = 0;
  while (closest(pool).length !== 1 && guard < 8) {
    guard++;
    var tied = closest(pool);
    var keep = tied.indexOf(base) >= 0 ? base : tied[0];
    tied.forEach(function (x) {
      if (x !== keep) pool = pool.filter(function (p) { return p !== x; });
    });
    pool.push(base + (4 + guard) * step);
    pool = pool.filter(function (x, i) { return x > 0 && pool.indexOf(x) === i; });
  }
  var winner = closest(pool)[0];
  var rest = pool.filter(function (x) { return x !== winner; });
  return { answer: winner, options: [winner].concat(rest.slice(0, 3)) };
}

var NAMES = ['小明', '小美', '志傑', '嘉欣', '阿樂', '詠詩', '子晴', '家豪'];

  global.GH = {
    num: num,
    esc: esc,
    lead: lead,
    expr: expr,
    hint: hint,
    word: word,
    carries: carries,
    assertMulFactors: assertMulFactors,
    assertDiv: assertDiv,
    fillQ: fillQ,
    tfQ: tfQ,
    choiceQ: choiceQ,
    multiQ: multiQ,
    remQ: remQ,
    timeQ: timeQ,
    sameSet: sameSet,
    name: function () { return global.U.pick(NAMES); },
    estimateChoices: estimateChoices
  };
})(typeof window !== 'undefined' ? window : globalThis);
