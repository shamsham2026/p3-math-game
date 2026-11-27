/**
 * 3N3 除法(一)
 * 兩位數÷一位數、三位數÷一位數、退位、有餘數、三個數由左至右除、簡單應用題。
 * 除數只限一位數。
 */
(function (global) {
  'use strict';
  var U = global.U;
  var GH = global.GH;
  var D = global.Diagrams;

  function exact2(diff) {
    var d = U.randInt(2, diff === 'easy' ? 6 : 9);
    var qMax = Math.floor(99 / d);
    var qMin = Math.max(2, Math.ceil(10 / d));
    if (diff === 'easy') qMax = Math.min(qMax, 12);
    var q = U.randInt(qMin, qMax);
    var n = d * q;
    GH.assertDiv(n, d, q, 0);
    return { n: n, d: d, q: q, r: 0 };
  }

  function exact3(diff) {
    var d = U.randInt(2, 9);
    var qMax = Math.floor(999 / d);
    var qMin = Math.ceil(100 / d);
    if (diff !== 'hard') qMax = Math.min(qMax, 80);
    var q = U.randInt(qMin, Math.max(qMin, qMax));
    var n = d * q;
    if (n > 999) n = d * Math.floor(999 / d);
    q = n / d;
    GH.assertDiv(n, d, q, 0);
    return { n: n, d: d, q: q, r: 0 };
  }

  function rem2() {
    var d = U.randInt(2, 9);
    var qMax = Math.floor((99 - (d - 1)) / d);
    var q = U.randInt(1, Math.max(1, qMax));
    var r = U.randInt(1, d - 1);
    var n = d * q + r;
    while (n < 10) {
      q += 1;
      n = d * q + r;
    }
    GH.assertDiv(n, d, q, r);
    return { n: n, d: d, q: q, r: r };
  }

  function rem3() {
    var d = U.randInt(2, 9);
    var qMin = Math.ceil(100 / d);
    var qMax = Math.floor((999 - (d - 1)) / d);
    var q = U.randInt(qMin, qMax);
    var r = U.randInt(1, d - 1);
    var n = d * q + r;
    GH.assertDiv(n, d, q, r);
    return { n: n, d: d, q: q, r: r };
  }

  function threeDiv(diff) {
    var b = U.randInt(2, diff === 'easy' ? 5 : 9);
    var c = U.randInt(2, diff === 'easy' ? 5 : 9);
    var q = U.randInt(2, diff === 'hard' ? 12 : 8);
    var n = q * b * c;
    var guard = 0;
    while ((n < 10 || n > 999) && guard < 20) {
      q = U.randInt(2, 9);
      b = U.randInt(2, 6);
      c = U.randInt(2, 5);
      n = q * b * c;
      guard++;
    }
    if (n < 10 || n > 999 || n % b !== 0 || (n / b) % c !== 0) {
      n = 48; b = 6; c = 2; q = 4;
    }
    if (b > 9 || c > 9) throw new Error('divisor');
    return { n: n, b: b, c: c, q: (n / b) / c };
  }

  function genExact(diff) {
    var x = diff === 'hard' || (diff === 'normal' && U.randInt(0, 1) === 1) ? exact3(diff) : exact2(diff);
    var prompt = GH.lead('計算：') + GH.expr(x.n + ' ÷ ' + x.d + ' ＝ ？');
    return GH.fillQ('div', prompt, x.q, {
      placeholder: '輸入商',
      meta: { dividend: x.n, divisor: x.d, quotient: x.q, remainder: 0, unit: '3N3' }
    });
  }

  function genBracket(diff) {
    var x = diff === 'easy' ? exact2('easy') : (U.randInt(0, 1) ? exact2(diff) : exact3(diff));
    var prompt = GH.lead('計算：') + '<div class="q-center">' + D.divBracket(x.d, x.n) + '</div>';
    return GH.fillQ('div', prompt, x.q, {
      placeholder: '輸入商',
      meta: { dividend: x.n, divisor: x.d, quotient: x.q, remainder: 0, unit: '3N3' }
    });
  }

  function genRem(diff) {
    var x = diff === 'hard' || (diff === 'normal' && U.randInt(0, 1) === 0) ? rem3() : rem2();
    if (diff === 'easy') x = rem2();
    var prompt = GH.lead('計算（有餘數）：') +
      GH.expr(x.n + ' ÷ ' + x.d + ' ＝ ？') +
      GH.hint('餘數要細過除數。');
    return GH.remQ('div', prompt, x.q, x.r, {
      meta: { dividend: x.n, divisor: x.d, quotient: x.q, remainder: x.r, unit: '3N3' }
    });
  }

  function genThree(diff) {
    var x = threeDiv(diff);
    var prompt = GH.lead('由左至右計算：') +
      GH.expr(x.n + ' ÷ ' + x.b + ' ÷ ' + x.c + ' ＝ ？') +
      GH.hint('先算左邊的除法，再除以後面的數。');
    return GH.fillQ('div', prompt, x.q, {
      placeholder: '輸入商',
      meta: {
        dividend: x.n, divisor: x.b, quotient: x.q, remainder: 0,
        divisors: [x.b, x.c], unit: '3N3', kind: 'three'
      }
    });
  }

  function genThreeMc(diff) {
    var x = threeDiv(diff);
    var correct = x.q;
    var wrongGroup = (x.b % x.c === 0) ? x.n / (x.b / x.c) : x.n / x.b;
    var distract = [x.n / x.b, x.n / x.c, wrongGroup, correct + x.c, Math.max(1, correct - 1)];
    distract = distract.filter(function (v) {
      return isFinite(v) && Math.round(v) === v && v !== correct && v > 0;
    });
    var choices = U.mcChoices(correct, distract);
    var prompt = GH.lead('由左至右計算，結果是多少？') +
      GH.expr(x.n + ' ÷ ' + x.b + ' ÷ ' + x.c);
    return GH.choiceQ('div', prompt, correct, choices.map(function (c) {
      return { value: c.value, label: String(c.label) };
    }), {
      meta: { dividend: x.n, divisor: x.b, quotient: correct, remainder: 0, divisors: [x.b, x.c], unit: '3N3', kind: 'three' }
    });
  }

  function genWordExact(diff) {
    var x = diff === 'hard' ? exact3(diff) : exact2(diff);
    var who = GH.name();
    var stories = [
      { t: '有 ' + x.n + ' 粒糖果，平均分給 ' + x.d + ' 位同學。每人得多少粒？', u: '粒' },
      { t: who + '有 ' + x.n + ' 元，買了 ' + x.d + ' 本同樣的練習簿，剛好用完。每本售多少元？', u: '元' },
      { t: '花店有 ' + x.n + ' 朵花，每 ' + x.d + ' 朵紮成一束。可以紮成多少束？', u: '束' },
      { t: '書架有 ' + x.n + ' 本書，平均放在 ' + x.d + ' 層。每層有多少本？', u: '本' }
    ];
    var s = U.pick(stories);
    return GH.fillQ('div', GH.word(s.t), x.q, {
      unitText: s.u,
      placeholder: '輸入答案',
      meta: { dividend: x.n, divisor: x.d, quotient: x.q, remainder: 0, unit: '3N3' }
    });
  }

  function genWordRem(diff) {
    var x = diff === 'hard' ? rem3() : rem2();
    var stories = [
      '有 ' + x.n + ' 個橙，每 ' + x.d + ' 個裝一袋。可以裝滿多少袋？還餘幾個？',
      '三甲班有 ' + x.n + ' 位學生，每 ' + x.d + ' 人一組。可以分成多少組？還餘幾人？',
      GH.name() + '有 ' + x.n + ' 元，每本故事書售 ' + x.d + ' 元。最多可以買多少本？還餘多少元？'
    ];
    var prompt = GH.word(U.pick(stories)) + GH.hint('先填商，再填餘數。');
    return GH.remQ('div', prompt, x.q, x.r, {
      meta: { dividend: x.n, divisor: x.d, quotient: x.q, remainder: x.r, unit: '3N3' }
    });
  }

  function genWordThree() {
    var x = threeDiv('normal');
    var prompt = GH.word('手工室有 ' + x.n + ' 粒珠，每 ' + x.b + ' 粒串成一串。這些串再平均分給 ' +
      x.c + ' 位同學。每人有多少串？');
    return GH.fillQ('div', prompt, x.q, {
      unitText: '串',
      placeholder: '輸入答案',
      meta: { dividend: x.n, divisor: x.b, quotient: x.q, remainder: 0, divisors: [x.b, x.c], unit: '3N3', kind: 'three' }
    });
  }

  function genEstimate(diff) {
    var d = U.randInt(2, 9);
    var n = diff === 'hard' ? U.randInt(140, 860) : U.randInt(24, 96);
    var exact = n / d;
    var step = exact >= 80 ? 20 : 10;
    var est = GH.estimateChoices(exact, step);
    var best = est.answer;
    var choices = U.mcChoices(best, est.options.filter(function (x) { return x !== best; }));
    var prompt = GH.lead(n + ' ÷ ' + d + ' 的結果最接近哪一個數？');
    return GH.choiceQ('div', prompt, best, choices.map(function (c) {
      return { value: c.value, label: String(c.label) };
    }), {
      meta: { dividend: n, divisor: d, quotient: best, kind: 'estimate', exact: exact, unit: '3N3' }
    });
  }

  function genCheck(diff) {
    var x = exact2(diff);
    var shown = U.pick([x.q, x.q + 1, x.n - x.d, x.d]);
    var ok = shown === x.q;
    var prompt = GH.lead('判斷：' + x.n + ' ÷ ' + x.d + ' ＝ ' + shown + '。');
    return GH.tfQ('div', prompt, ok, {
      meta: { dividend: x.n, divisor: x.d, quotient: x.q, remainder: 0, unit: '3N3' }
    });
  }

  function generate(diff) {
    diff = diff || 'normal';
    var pool;
    if (diff === 'easy') {
      pool = [genExact, genExact, genBracket, genRem, genWordExact, genWordRem, genCheck, genThree];
    } else if (diff === 'hard') {
      pool = [genExact, genBracket, genRem, genRem, genThree, genThreeMc, genWordExact, genWordRem, genWordThree, genEstimate, genCheck];
    } else {
      pool = [genExact, genExact, genBracket, genRem, genThree, genThreeMc, genWordExact, genWordRem, genWordThree, genEstimate, genCheck];
    }
    return U.pick(pool)(diff);
  }

  global.GenDiv = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
