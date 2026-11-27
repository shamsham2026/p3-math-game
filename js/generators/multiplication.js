/**
 * 3N2 乘法(一)
 * 兩位數×一位數、三位數×一位數（含進位）、三個數相乘、簡單應用題。
 * 不設兩位數×兩位數（那是小四）。
 */
(function (global) {
  'use strict';
  var U = global.U;
  var GH = global.GH;
  var D = global.Diagrams;

  var SMALL_PAIRS = [[2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [4, 2]];

  function noCarry2(m) {
    var maxD = Math.max(1, Math.floor(9 / m));
    var tens = U.randInt(1, maxD);
    var ones = U.randInt(0, maxD);
    var n = tens * 10 + ones;
    if (n < 10) n = 10;
    return n;
  }

  function withCarry2(m) {
    var n = 19;
    var guard = 0;
    do {
      n = U.randInt(12, 99);
      guard++;
    } while (!GH.carries(n, m) && guard < 40);
    if (!GH.carries(n, m)) n = 10 + U.randInt(5, 9);
    return n;
  }

  function threeDigit(m, mustCarry) {
    var n = 148;
    var guard = 0;
    do {
      n = U.randInt(100, 899);
      guard++;
    } while (mustCarry && !GH.carries(n, m) && guard < 40);
    if (mustCarry && !GH.carries(n, m)) n = 100 + U.randInt(5, 9);
    return n;
  }

  function threeFactors(diff) {
    // 小三程度：三數相乘只用一位數（例如 2 × 3 × 4），唔出三位數
    // （之前有 1/3 機會出 2 × 2 × 411 呢類，超出小三程度）。
    return [U.randInt(2, 9), U.randInt(2, 9), U.randInt(2, 9)];
  }

  function mulFinish(factors, prompt, extra) {
    GH.assertMulFactors(factors);
    var ans = factors.reduce(function (a, b) { return a * b; }, 1);
    extra = extra || {};
    extra.meta = Object.assign({ factors: factors.slice(), unit: '3N2' }, extra.meta || {});
    return GH.fillQ('mul', prompt, ans, extra);
  }

  function order2(big, small) {
    return U.randInt(0, 1) ? [big, small] : [small, big];
  }

  function genBasic(diff) {
    var m = diff === 'easy' ? U.randInt(2, 5) : U.randInt(2, 9);
    var carry = diff !== 'easy' || U.randInt(0, 1) === 1;
    var n = carry ? withCarry2(m) : noCarry2(m);
    if (diff === 'easy' && GH.carries(n, m) && U.randInt(0, 2) === 0) n = noCarry2(m);
    var pair = order2(n, m);
    GH.assertMulFactors(pair);
    var prompt = GH.lead('計算：') + GH.expr(pair[0] + ' × ' + pair[1] + ' ＝ ？');
    return mulFinish(pair, prompt, { placeholder: '輸入積' });
  }

  function genVertical(diff) {
    var m = diff === 'hard' ? U.randInt(3, 9) : U.randInt(2, 6);
    var n = diff === 'hard' ? threeDigit(m, true) : (diff === 'easy' ? noCarry2(m) : withCarry2(m));
    var pair = [n, m];
    GH.assertMulFactors(pair);
    var prompt = GH.lead('用直式計算：') +
      '<div class="q-center">' + D.verticalMul(n, m) + '</div>';
    return mulFinish(pair, prompt, { placeholder: '輸入積' });
  }

  function genThreeDigit(diff) {
    var m = U.randInt(diff === 'easy' ? 2 : 3, diff === 'hard' ? 9 : 7);
    var n = threeDigit(m, diff !== 'easy');
    var pair = order2(n, m);
    var prompt = GH.lead('計算：') + GH.expr(pair[0] + ' × ' + pair[1] + ' ＝ ？');
    return mulFinish(pair, prompt, { placeholder: '輸入積' });
  }

  function genThree(diff) {
    var f = threeFactors(diff);
    GH.assertMulFactors(f);
    var prompt = GH.lead('計算三個數相乘（由左至右，也可以先算方便的兩個）：') +
      GH.expr(f[0] + ' × ' + f[1] + ' × ' + f[2] + ' ＝ ？');
    return mulFinish(f, prompt, { placeholder: '輸入積' });
  }

  function genMissing(diff) {
    var m = U.randInt(2, diff === 'easy' ? 5 : 9);
    var n = diff === 'hard' ? threeDigit(m, true) : (diff === 'easy' ? noCarry2(m) : withCarry2(m));
    var product = n * m;
    var hideBig = U.randInt(0, 1) === 1 && diff !== 'easy';
    var prompt, factors, answer;
    if (hideBig) {
      prompt = GH.lead('求未知數：') + GH.expr('？ × ' + m + ' ＝ ' + product);
      answer = n;
      factors = [n, m];
    } else {
      prompt = GH.lead('求未知數：') + GH.expr(n + ' × ？ ＝ ' + product);
      answer = m;
      factors = [n, m];
    }
    GH.assertMulFactors(factors);
    return GH.fillQ('mul', prompt, answer, {
      placeholder: '輸入未知數',
      meta: { factors: factors, unit: '3N2', kind: 'missing' }
    });
  }

  function genCompare(diff) {
    var m1 = U.randInt(2, 9);
    var m2 = U.randInt(2, 9);
    var a = diff === 'hard' ? U.randInt(20, 80) : U.randInt(12, 40);
    var b = diff === 'hard' ? U.randInt(20, 80) : U.randInt(12, 40);
    // 兩邊唔可以完全相同，否則唔使計都知係「＝」。
    while (b === a && m2 === m1) {
      m2 = U.randInt(2, 9);
    }
    GH.assertMulFactors([a, m1]);
    GH.assertMulFactors([b, m2]);
    var p1 = a * m1;
    var p2 = b * m2;
    var sign = p1 === p2 ? '=' : (p1 > p2 ? '>' : '<');
    var words = { '>': '大於', '<': '小於', '=': '等於' };
    var prompt = GH.lead('比較積的大小：') +
      GH.expr(a + ' × ' + m1 + '　□　' + b + ' × ' + m2);
    return GH.choiceQ('mul', prompt, sign, [
      { value: '>', label: '大於 >' },
      { value: '<', label: '小於 <' },
      { value: '=', label: '等於 =' }
    ], {
      type: 'compare',
      answerHtml: GH.esc(words[sign]),
      meta: { factors: [a, m1, b, m2], mulPairs: [[a, m1], [b, m2]], unit: '3N2' }
    });
  }

  function genWord(diff) {
    var m = diff === 'easy' ? U.randInt(2, 5) : U.randInt(2, 9);
    var n = diff === 'hard' ? threeDigit(m, true) : (diff === 'easy' ? U.randInt(12, 30) : withCarry2(m));
    if (diff === 'normal' && U.randInt(0, 2) === 0) n = threeDigit(m, true);
    var who = GH.name();
    var stories = [
      { t: who + '有 ' + m + ' 盒蠟筆，每盒有 ' + n + ' 枝。共有多少枝蠟筆？', u: '枝' },
      { t: '禮堂有 ' + m + ' 排椅子，每排有 ' + n + ' 張。共有多少張椅子？', u: '張' },
      { t: '一本練習簿售 ' + n + ' 元，買 ' + m + ' 本共要付多少元？', u: '元' },
      { t: '每包有 ' + n + ' 塊餅乾，' + who + '買了 ' + m + ' 包。共有多少塊餅乾？', u: '塊' }
    ];
    if (n <= 36 && m <= 4) {
      stories.push({ t: '三甲班分 ' + m + ' 組，每組 ' + n + ' 人。全班有多少人？', u: '人' });
    }
    if (n >= 100) {
      stories = [
        { t: '倉庫有 ' + m + ' 箱汽水，每箱 ' + n + ' 罐。共有多少罐？', u: '罐' },
        { t: '印刷廠印了 ' + m + ' 疊練習紙，每疊 ' + n + ' 張。共有多少張？', u: '張' },
        { t: who + '的學校訂了 ' + m + ' 盒顏色筆，每盒 ' + n + ' 枝。共有多少枝？', u: '枝' }
      ];
    }
    var s = U.pick(stories);
    var factors = [n, m];
    GH.assertMulFactors(factors);
    return mulFinish(factors, GH.word(s.t), { unitText: s.u, placeholder: '輸入答案' });
  }

  function genWordThree(diff) {
    var f = threeFactors(diff === 'easy' ? 'easy' : 'normal');
    var big = null;
    var smalls = [];
    f.forEach(function (n) {
      if (n >= 10 && big == null) big = n;
      else smalls.push(n);
    });
    var per, packs, boxes;
    if (big == null) {
      per = f[0];
      packs = f[1];
      boxes = f[2];
    } else {
      per = big;
      packs = smalls[0];
      boxes = smalls[1];
    }
    var factors = [per, packs, boxes];
    GH.assertMulFactors(factors);
    var who = GH.name();
    var prompt = GH.word(who + '買顏色筆：每盒有 ' + per + ' 枝，每袋有 ' + packs +
      ' 盒，共買 ' + boxes + ' 袋。一共有多少枝顏色筆？');
    return mulFinish(factors, prompt, { unitText: '枝', placeholder: '輸入答案' });
  }

  function genEstimate(diff) {
    var m = U.randInt(2, 9);
    var n = U.randInt(diff === 'hard' ? 180 : 22, diff === 'hard' ? 480 : 96);
    if (n >= 100 && m >= 10) m = U.randInt(2, 9);
    GH.assertMulFactors([n, m]);
    var exact = n * m;
    var step = exact >= 500 ? 100 : 50;
    var est = GH.estimateChoices(exact, step);
    var best = est.answer;
    var choices = U.mcChoices(best, est.options.filter(function (x) { return x !== best; }));
    var prompt = GH.lead('下面哪個數最接近 ' + n + ' × ' + m + ' 的結果？') +
      GH.hint('可以先估算，也可以算出實數再選擇最接近的答案。');
    return GH.choiceQ('mul', prompt, best, choices.map(function (c) {
      return { value: c.value, label: String(c.label) };
    }), {
      meta: { factors: [n, m], unit: '3N2', kind: 'estimate', exact: exact }
    });
  }

  function genTable() {
    var a = U.randInt(1, 9);
    var b = U.randInt(1, 9);
    var prompt = GH.lead('乘法表：') + GH.expr(a + ' × ' + b + ' ＝ ？');
    return mulFinish([a, b], prompt, {
      placeholder: '輸入積',
      meta: { kind: 'table', table: [a, b] }
    });
  }

  function generate(diff) {
    diff = diff || 'normal';
    var pool;
    if (diff === 'easy') {
      pool = [genTable, genTable, genBasic, genBasic, genVertical, genThree, genWord, genMissing, genWordThree];
    } else if (diff === 'hard') {
      pool = [genTable, genBasic, genThreeDigit, genThreeDigit, genThree, genWord, genWordThree, genMissing, genCompare, genVertical, genEstimate];
    } else {
      pool = [genTable, genBasic, genBasic, genThreeDigit, genThree, genWord, genWordThree, genMissing, genCompare, genVertical, genEstimate];
    }
    return U.pick(pool)(diff);
  }

  global.GenMul = { generate: generate, assertMulFactors: GH.assertMulFactors };
})(typeof window !== 'undefined' ? window : globalThis);
