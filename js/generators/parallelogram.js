/**
 * 3S1 平行四邊形
 * 兩組對邊分別平行、對邊相等。
 * 正方形和長方形都是平行四邊形。
 * 梯形只有一組對邊平行（上底、下底），用來對照。
 * 不考面積公式，也不叫學生為正方形只寫一個名稱。
 */
(function (global) {
  'use strict';
  var U = global.U;
  var GH = global.GH;
  var D = global.Diagrams;

  var PARA = { para: true, rect: true, square: true };
  var NONS = ['trap', 'tri', 'irreg'];
  var LETTERS = ['甲', '乙', '丙', '丁', '戊', '己'];

  function selectAll() {
    var special = U.pick(['square', 'rect']);
    var restPara = ['para', 'square', 'rect'].filter(function (k) { return k !== special; });
    var other = U.pick(restPara);
    var n1 = U.pick(NONS);
    var n2 = U.pick(NONS.filter(function (k) { return k !== n1; }));
    var kinds;
    if (U.randInt(0, 1) === 0) kinds = [special, other, n1, n2];
    else kinds = ['square', 'rect', 'para', U.pick(NONS)];
    kinds = U.shuffle(kinds);
    return kinds;
  }

  function genSelectAll() {
    var kinds = selectAll();
    var named = U.randInt(0, 1) === 0;
    var answer = [];
    var choices = kinds.map(function (k, i) {
      var id = k + '-' + i;
      if (PARA[k]) answer.push(id);
      var caption = named ? D.shapeName(k) : LETTERS[i];
      return {
        value: id,
        label: caption,
        labelHtml: D.shapeCard(k, caption)
      };
    });
    var names = choices.filter(function (c) { return answer.indexOf(c.value) >= 0; }).map(function (c) { return c.label; });
    var prompt = GH.lead('選出所有平行四邊形。（可選多於一個）') +
      GH.hint('選完再撳提交。');
    return GH.multiQ('para', prompt, answer, choices, GH.esc(names.join('、')), {
      choiceLayout: 'shapes',
      meta: {
        unit: '3S1',
        kind: 'select-all',
        kinds: kinds.slice(),
        named: named
      }
    });
  }

  function genNotPara() {
    var no = 'trap'; // 提示講明是梯形：對照項必須是真正的梯形，不可隨機抽三角形／一般四邊形
    var kinds = U.shuffle(['para', 'rect', 'square', no]);
    var correctIndex = kinds.indexOf(no);
    var choices = kinds.map(function (k, i) {
      return {
        value: String(i),
        label: LETTERS[i],
        labelHtml: D.shapeCard(k, LETTERS[i])
      };
    });
    var prompt = GH.lead('哪一個不是平行四邊形？') +
      GH.hint('梯形只有一組對邊平行，不是平行四邊形。');
    return GH.choiceQ('para', prompt, String(correctIndex), choices, {
      choiceLayout: 'shapes',
      answerHtml: GH.esc(LETTERS[correctIndex]),
      meta: { unit: '3S1', kind: 'not-para', kinds: kinds.slice() }
    });
  }

  function genIsThis() {
    var kind = U.pick(['square', 'rect', 'para', 'trap', 'tri']);
    var ok = !!PARA[kind];
    var prompt = GH.lead('下面這個圖形是不是平行四邊形？') +
      D.shapeSvg(kind, { arrows: U.randInt(0, 1) === 1 });
    return GH.choiceQ('para', prompt, ok ? 'yes' : 'no', [
      { value: 'yes', label: '是平行四邊形' },
      { value: 'no', label: '不是平行四邊形' }
    ], {
      answerHtml: ok ? '是平行四邊形' : '不是平行四邊形',
      meta: { unit: '3S1', kind: 'is-this', shape: kind }
    });
  }

  function genProps() {
    var items = [
      { p: '平行四邊形有兩組對邊分別平行。', ok: true },
      { p: '平行四邊形的對邊長度相等。', ok: true },
      { p: '正方形是平行四邊形。', ok: true },
      { p: '長方形是平行四邊形。', ok: true },
      { p: '梯形有兩組對邊平行。', ok: false },
      { p: '所有平行四邊形都有直角。', ok: false },
      { p: '梯形只有一組對邊平行，這組對邊稱為上底和下底。', ok: true },
      { p: '三角形是平行四邊形。', ok: false }
    ];
    var it = U.pick(items);
    var picKind = 'para';
    if (it.p.indexOf('正方形') >= 0) picKind = 'square';
    else if (it.p.indexOf('長方形') >= 0) picKind = 'rect';
    else if (it.p.indexOf('梯形') >= 0) picKind = 'trap';
    else if (it.p.indexOf('三角形') >= 0) picKind = 'tri';
    else if (it.p.indexOf('直角') >= 0) picKind = 'para';
    var prompt = GH.lead('判斷：' + it.p) + D.shapeSvg(picKind, { arrows: true });
    return GH.tfQ('para', prompt, it.ok, { meta: { unit: '3S1', kind: 'prop' } });
  }

  function genOppositeSide() {
    var ab = U.randInt(4, 12);
    var ad = U.randInt(3, 9);
    if (ad === ab) ad = ab === 9 ? 4 : ab + 1;
    var askCD = U.randInt(0, 1) === 1;
    var answer = askCD ? ab : ad;
    var ask = askCD ? 'CD' : 'AD';
    var lengths = { 0: ab + ' cm', 1: ad + ' cm' };
    var prompt = GH.lead('下面是一個平行四邊形，對邊長度相等。邊 ' + ask + ' 長多少厘米？') +
      D.shapeSvg('para', { letters: ['A', 'B', 'C', 'D'], lengths: lengths });
    return GH.fillQ('para', prompt, answer, {
      unitText: '厘米',
      placeholder: '輸入長度',
      meta: { unit: '3S1', kind: 'opposite', ab: ab, ad: ad }
    });
  }

  function genHowMany() {
    var which = U.pick(['pairs', 'trap']);
    if (which === 'trap') {
      var prompt = GH.lead('梯形有多少組互相平行的對邊？') + D.shapeSvg('trap', { arrows: true, letters: ['A', 'B', 'C', 'D'] });
      return GH.fillQ('para', prompt, 1, {
        placeholder: '輸入組數',
        meta: { unit: '3S1', kind: 'how-many' }
      });
    }
    var prompt2 = GH.lead('平行四邊形有多少組對邊互相平行？') + D.shapeSvg('para', { arrows: true });
    return GH.fillQ('para', prompt2, 2, {
      placeholder: '輸入組數',
      meta: { unit: '3S1', kind: 'how-many' }
    });
  }

  function genPickTrap() {
    var kinds = U.shuffle(['trap', 'para', 'rect', 'square']);
    var idx = kinds.indexOf('trap');
    var choices = kinds.map(function (k, i) {
      return { value: String(i), label: LETTERS[i], labelHtml: D.shapeCard(k, LETTERS[i]) };
    });
    var prompt = GH.lead('哪一個是梯形？') +
      GH.hint('梯形只有一組對邊平行。');
    return GH.choiceQ('para', prompt, String(idx), choices, {
      choiceLayout: 'shapes',
      answerHtml: GH.esc(LETTERS[idx]),
      meta: { unit: '3S1', kind: 'pick-trap', kinds: kinds.slice() }
    });
  }

  function genIncludeSquare() {
    var prompt = GH.lead('老師說：「選出所有平行四邊形。」圖中有正方形和長方形。下面哪句正確？') +
      '<div class="mini-row">' + D.shapeCard('square', '正方形') + D.shapeCard('rect', '長方形') + D.shapeCard('para', '平行四邊形') + '</div>';
    return GH.choiceQ('para', prompt, 'all', [
      { value: 'all', label: '三個都要選' },
      { value: 'only', label: '只選沒有直角的那個' },
      { value: 'none', label: '正方形和長方形都不要選' }
    ], {
      answerHtml: '三個都要選',
      meta: { unit: '3S1', kind: 'include-square' }
    });
  }

  function generate(diff) {
    diff = diff || 'normal';
    var pool;
    if (diff === 'easy') {
      pool = [genIsThis, genIsThis, genProps, genHowMany, genSelectAll, genIncludeSquare];
    } else if (diff === 'hard') {
      pool = [genSelectAll, genSelectAll, genNotPara, genProps, genOppositeSide, genPickTrap, genIsThis, genIncludeSquare, genHowMany];
    } else {
      pool = [genSelectAll, genNotPara, genIsThis, genProps, genOppositeSide, genHowMany, genPickTrap, genIncludeSquare];
    }
    return U.pick(pool)(diff);
  }

  global.GenPara = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
