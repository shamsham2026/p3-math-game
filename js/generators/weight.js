/**
 * 3M5 重量
 * 克(g)、公斤(kg)；1 kg = 1000 g。
 * 可記錄 1030 克 或比較 1 公斤 30 克。
 * 不以小數記重量（小數在 4N7）。不把「單名數改寫成複名數」當作必答填充。
 */
(function (global) {
  'use strict';
  var U = global.U;
  var GH = global.GH;
  var D = global.Diagrams;

  function grams(kg, g) { return kg * 1000 + (g || 0); }

  function fmt(kg, g) {
    g = g || 0;
    if (kg && g) return kg + ' 公斤 ' + g + ' 克';
    if (kg) return kg + ' 公斤';
    return g + ' 克';
  }

  var OBJECTS = [
    { name: '一枝鉛筆', unit: 'g', sensible: '8 克', silly: ['8 公斤', '80 公斤', '800 公斤'] },
    { name: '一個蘋果', unit: 'g', sensible: '200 克', silly: ['200 公斤', '2 公斤', '20 公斤'] },
    { name: '一本數學課本', unit: 'g', sensible: '300 克', silly: ['300 公斤', '3 公斤', '30 公斤'] },
    { name: '一枚迴紋針', unit: 'g', sensible: '1 克', silly: ['1 公斤', '10 公斤', '100 公斤'] },
    { name: '一名小三學生', unit: 'kg', sensible: '30 公斤', silly: ['30 克', '300 克', '3 克'] },
    { name: '一包米', unit: 'kg', sensible: '5 公斤', silly: ['5 克', '50 克', '500 克'] },
    { name: '一個西瓜', unit: 'kg', sensible: '4 公斤', silly: ['4 克', '40 克', '400 克'] },
    { name: '一隻家貓', unit: 'kg', sensible: '4 公斤', silly: ['4 克', '40 克', '400 公斤'] },
    { name: '一個連書的書包', unit: 'kg', sensible: '3 公斤', silly: ['3 克', '30 克', '300 克'] },
    { name: '一架小童單車', unit: 'kg', sensible: '15 公斤', silly: ['15 克', '150 克', '1 克'] }
  ];

  function genKgToG(diff) {
    var kg = U.randInt(1, diff === 'easy' ? 5 : 9);
    var g = 0;
    if (diff !== 'easy' && U.randInt(0, 1) === 1) {
      var extras = [20, 30, 50, 80, 100, 200, 250, 400, 500, 750];
      g = U.pick(extras);
    }
    var ans = grams(kg, g);
    var prompt = GH.lead('換算成克：') +
      GH.expr(fmt(kg, g) + ' ＝ ？ 克') +
      D.balance(fmt(kg, g), '？ 克', 'ask') +
      GH.hint('1 公斤＝1000 克。');
    return GH.fillQ('weight', prompt, ans, {
      unitText: '克',
      placeholder: '輸入克數',
      meta: { unit: '3M5', grams: ans, kind: 'convert' }
    });
  }

  function genCompare(diff) {
    var aKg = U.randInt(1, diff === 'hard' ? 6 : 4);
    var aG = diff === 'easy' ? 0 : U.pick([0, 0, 50, 200, 300, 500]);
    var bG = U.randInt(diff === 'easy' ? 500 : 200, diff === 'hard' ? 8000 : 5000);
    if (U.randInt(0, 3) === 0) bG = grams(aKg, aG);
    var a = grams(aKg, aG);
    var sign = a === bG ? '=' : (a > bG ? '>' : '<');
    var words = { '>': '大於', '<': '小於', '=': '等於' };
    var prompt = GH.lead('比較重量：') +
      GH.expr(fmt(aKg, aG) + '　□　' + bG + ' 克') +
      D.balance(fmt(aKg, aG), bG + ' 克', 'ask');
    return GH.choiceQ('weight', prompt, sign, [
      { value: '>', label: '大於 >' },
      { value: '<', label: '小於 <' },
      { value: '=', label: '等於 =' }
    ], {
      type: 'compare',
      answerHtml: GH.esc(words[sign]),
      meta: { unit: '3M5', grams: a, other: bG, kind: 'compare' }
    });
  }

  function genUnit() {
    var o = U.pick(OBJECTS);
    var prompt = GH.lead('記錄「' + o.name + '」的重量，用哪個單位較適合？');
    return GH.choiceQ('weight', prompt, o.unit, [
      { value: 'g', label: '克（g）' },
      { value: 'kg', label: '公斤（kg）' }
    ], {
      answerHtml: o.unit === 'g' ? '克（g）' : '公斤（kg）',
      meta: { unit: '3M5', kind: 'unit' }
    });
  }

  function genSensible() {
    var o = U.pick(OBJECTS);
    var choices = [{ value: o.sensible, label: o.sensible }].concat(o.silly.map(function (s) {
      return { value: s, label: s };
    }));
    var prompt = GH.lead(o.name + '的重量，哪個較合理？') +
      GH.hint('克用來記較輕的物件，公斤用來記較重的物件。');
    return GH.choiceQ('weight', prompt, o.sensible, choices, {
      meta: { unit: '3M5', kind: 'sensible' }
    });
  }

  function genEquivalent() {
    var kg = U.randInt(1, 5);
    var g = U.pick([0, 30, 50, 200, 500, 750]);
    if (g === 0) g = U.pick([30, 200, 500]);
    var total = grams(kg, g);
    var correct = fmt(kg, g);
    var wrongs = [
      fmt(kg, g + 100 > 999 ? 50 : g + 100),
      (total) + ' 公斤',
      fmt(g, kg),
      fmt(kg + 1, g)
    ];
    wrongs = wrongs.filter(function (w, i) { return w !== correct && wrongs.indexOf(w) === i; });
    var prompt = GH.lead(total + ' 克和下面哪一個一樣重？') +
      D.balance(total + ' 克', '？', 'ask') +
      GH.hint('1 公斤 30 克可以寫成 1030 克。');
    var choices = [{ value: correct, label: correct }].concat(wrongs.slice(0, 3).map(function (w) {
      return { value: w, label: w };
    }));
    return GH.choiceQ('weight', prompt, correct, choices, {
      meta: { unit: '3M5', grams: total, kind: 'equivalent' }
    });
  }

  function genBalanceRead() {
    var tilt = U.pick(['left', 'right', 'equal']);
    var left = U.pick(['蘋果', '課本', '水樽']);
    var right = U.pick(['橡皮擦', '鉛筆盒', '石頭']);
    var ans = tilt === 'equal' ? 'same' : tilt;
    var words = { left: '左邊較重', right: '右邊較重', same: '一樣重' };
    var prompt = GH.lead('看看天平，哪一邊較重？') +
      D.balance(left, right, tilt);
    return GH.choiceQ('weight', prompt, ans, [
      { value: 'left', label: '左邊較重' },
      { value: 'right', label: '右邊較重' },
      { value: 'same', label: '一樣重' }
    ], {
      answerHtml: GH.esc(words[ans]),
      meta: { unit: '3M5', kind: 'balance-read' }
    });
  }

  function genBalanceMath(diff) {
    var left = grams(U.randInt(1, diff === 'easy' ? 2 : 4), diff === 'easy' ? 0 : U.pick([0, 200, 500]));
    var right = U.randInt(300, Math.min(4500, left + 1500));
    if (U.randInt(0, 2) === 0) right = left;
    var ans = left === right ? 'same' : (left > right ? 'left' : 'right');
    var words = { left: '左邊會下沉', right: '右邊會下沉', same: '會平衡' };
    var lTxt = left % 1000 === 0 ? (left / 1000) + ' 公斤' : left + ' 克';
    if (left >= 1000 && left % 1000 !== 0) {
      lTxt = Math.floor(left / 1000) + ' 公斤 ' + (left % 1000) + ' 克';
    }
    var prompt = GH.lead('天平還未放下。左邊是 ' + lTxt + '，右邊是 ' + right + ' 克。放下後會怎樣？') +
      D.balance(lTxt, right + ' 克', 'ask');
    return GH.choiceQ('weight', prompt, ans, [
      { value: 'left', label: '左邊會下沉' },
      { value: 'right', label: '右邊會下沉' },
      { value: 'same', label: '會平衡' }
    ], {
      answerHtml: GH.esc(words[ans]),
      meta: { unit: '3M5', grams: left, other: right, kind: 'balance-math' }
    });
  }

  function genAdd(diff) {
    var kg = U.randInt(1, diff === 'hard' ? 4 : 3);
    var g1 = U.pick([0, 100, 200, 400, 500]);
    var g2 = U.pick([100, 200, 300, 500, 800]);
    var total = grams(kg, g1) + g2;
    var prompt = GH.lead('計算總重量，答案用克表示：') +
      GH.expr(fmt(kg, g1) + ' ＋ ' + g2 + ' 克 ＝ ？ 克') +
      D.balance(fmt(kg, g1), g2 + ' 克', 'ask');
    return GH.fillQ('weight', prompt, total, {
      unitText: '克',
      placeholder: '輸入克數',
      meta: { unit: '3M5', grams: total, kind: 'add' }
    });
  }

  function genNeed(diff) {
    var target = grams(U.randInt(1, 3), 0);
    var have = U.pick([200, 300, 400, 500, 600, 750]);
    if (diff === 'easy') have = U.pick([200, 500]);
    var need = target - have;
    var prompt = GH.lead('左邊是 ' + (target / 1000) + ' 公斤，右邊現在有 ' + have +
      ' 克。要令天平平衡，右邊還要加多少克？') +
      D.balance((target / 1000) + ' 公斤', have + ' 克', 'left');
    return GH.fillQ('weight', prompt, need, {
      unitText: '克',
      placeholder: '輸入克數',
      meta: { unit: '3M5', grams: need, kind: 'need' }
    });
  }

  function genScale(diff) {
    var useKg = U.randInt(0, 1) === 1;
    if (useKg) {
      var max = 10;
      var value = U.randInt(1, diff === 'easy' ? 5 : 9);
      var prompt = GH.lead('讀一讀磅上的指針，重量是多少公斤？') +
        D.scale(value, max, 1, '公斤（kg）');
      return GH.fillQ('weight', prompt, value, {
        unitText: '公斤',
        placeholder: '輸入公斤',
        meta: { unit: '3M5', grams: value * 1000, kind: 'scale' }
      });
    }
    var maxG = 1000;
    var valueG = U.randInt(1, 10) * 100;
    var promptG = GH.lead('讀一讀磅上的指針，重量是多少克？') +
      D.scale(valueG, maxG, 100, '克（g）');
    return GH.fillQ('weight', promptG, valueG, {
      unitText: '克',
      placeholder: '輸入克數',
      meta: { unit: '3M5', grams: valueG, kind: 'scale' }
    });
  }

  function genBlocks() {
    var a = U.randInt(2, 5);
    var b = U.randInt(2, 6);
    if (U.randInt(0, 3) === 0) b = a;
    var tilt = a === b ? 'equal' : (a > b ? 'left' : 'right');
    var ans = a === b ? 'same' : (a > b ? 'left' : 'right');
    var words = { left: '左邊較重', right: '右邊較重', same: '一樣重' };
    var prompt = GH.lead('兩邊的砝碼每個一樣重。哪一邊較重？') +
      D.balanceBlocks(a, b, tilt);
    return GH.choiceQ('weight', prompt, ans, [
      { value: 'left', label: '左邊較重' },
      { value: 'right', label: '右邊較重' },
      { value: 'same', label: '一樣重' }
    ], {
      answerHtml: GH.esc(words[ans]),
      meta: { unit: '3M5', kind: 'blocks' }
    });
  }

  function genFact() {
    var items = [
      { p: '1 公斤等於 1000 克。', ok: true },
      { p: '1 公斤等於 100 克。', ok: false },
      { p: '克（g）和公斤（kg）都是重量單位。', ok: true },
      { p: '一個蘋果大約重 200 公斤。', ok: false },
      { p: '2 公斤等於 2000 克。', ok: true }
    ];
    var it = U.pick(items);
    return GH.tfQ('weight', GH.lead('判斷：' + it.p) + D.balance('1 公斤', '1000 克', 'equal'), it.ok, {
      meta: { unit: '3M5', kind: 'fact' }
    });
  }

  function generate(diff) {
    diff = diff || 'normal';
    var pool;
    if (diff === 'easy') {
      pool = [genKgToG, genKgToG, genUnit, genSensible, genCompare, genBalanceRead, genScale, genBlocks, genFact];
    } else if (diff === 'hard') {
      pool = [genKgToG, genCompare, genEquivalent, genBalanceMath, genAdd, genNeed, genScale, genUnit, genSensible, genFact];
    } else {
      pool = [genKgToG, genCompare, genEquivalent, genUnit, genSensible, genBalanceRead, genBalanceMath, genAdd, genNeed, genScale, genBlocks, genFact];
    }
    return U.pick(pool)(diff);
  }

  global.GenWeight = { generate: generate, grams: grams };
})(typeof window !== 'undefined' ? window : globalThis);
