/**
 * 3S1 四邊形(二)／平行線
 * 平行線不相交，而且距離處處相等。
 * 在同一平面上，不相交的直線就是平行線。
 */
(function (global) {
  'use strict';
  var U = global.U;
  var GH = global.GH;
  var D = global.Diagrams;

  var LINE_YES = ['parallel-h', 'parallel-s', 'parallel-v'];
  var LINE_NO = ['cross', 'meet'];

  function genAreParallel() {
    var yes = U.randInt(0, 1) === 1;
    var mode = yes ? U.pick(LINE_YES) : U.pick(LINE_NO);
    var prompt = GH.lead('下面兩條直線是否互相平行？') + D.linePair(mode);
    return GH.choiceQ('parallel', prompt, yes ? 'yes' : 'no', [
      { value: 'yes', label: '是，互相平行' },
      { value: 'no', label: '不是平行' }
    ], {
      answerHtml: yes ? '是，互相平行' : '不是平行',
      meta: { unit: '3S1', kind: 'lines', parallel: yes }
    });
  }

  function genDistance() {
    var equal = U.randInt(0, 1) === 1;
    var prompt = GH.lead('圖中兩處量得的距離' + (equal ? '都是 3 cm' : '分別是 3 cm 和 5 cm') + '。這兩條直線是否平行？') +
      D.parallelDistance(equal) +
      GH.hint('平行線之間的距離處處相等。');
    return GH.choiceQ('parallel', prompt, equal ? 'yes' : 'no', [
      { value: 'yes', label: '是，互相平行' },
      { value: 'no', label: '不是平行' }
    ], {
      answerHtml: equal ? '是，互相平行' : '不是平行',
      meta: { unit: '3S1', kind: 'distance', parallel: equal }
    });
  }

  function sideName(letters, i) {
    return letters[i] + letters[(i + 1) % letters.length];
  }

  function genInShape() {
    var kind = U.pick(['rect', 'square', 'para', 'trap', 'tri']);
    var letters = kind === 'tri' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
    var n = letters.length;
    var i = U.randInt(0, n - 1);
    var j = (i + U.randInt(1, n - 1)) % n;
    if (j < i) { var tmp = i; i = j; j = tmp; }
    var parallel = D.sidesParallel(kind, i, j);
    var hi = [i, j];
    var prompt = GH.lead(D.shapeName(kind) + '中，邊 ' + sideName(letters, i) + ' 與邊 ' + sideName(letters, j) + ' 是否互相平行？') +
      D.shapeSvg(kind, { letters: letters, highlight: hi });
    return GH.choiceQ('parallel', prompt, parallel ? 'yes' : 'no', [
      { value: 'yes', label: '是，互相平行' },
      { value: 'no', label: '不是平行' }
    ], {
      answerHtml: parallel ? '是，互相平行' : '不是平行',
      meta: { unit: '3S1', kind: 'in-shape', shape: kind, parallel: parallel }
    });
  }

  function genCount() {
    var kind = U.pick(['rect', 'square', 'para', 'trap', 'tri', 'irreg']);
    var count = D.parallelPairCount(kind);
    var letters = kind === 'tri' ? ['甲', '乙', '丙'] : null;
    var prompt = GH.lead('這個圖形有多少組互相平行的對邊？') +
      D.shapeSvg(kind, { arrows: true, letters: letters ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'] }) +
      GH.hint('一組是兩條互相平行的邊。');
    return GH.fillQ('parallel', prompt, count, {
      placeholder: '輸入組數',
      meta: { unit: '3S1', kind: 'count', shape: kind }
    });
  }

  function genFacts() {
    var items = [
      { p: '平行線不會相交。', ok: true, pic: 'parallel-h' },
      { p: '平行線之間的距離處處相等。', ok: true, pic: 'parallel-s' },
      { p: '兩條相交的直線是平行線。', ok: false, pic: 'cross' },
      { p: '在同一平面上，兩條不相交的直線一定是平行線。', ok: true, pic: 'parallel-v' },
      { p: '方向不同、會相交的兩條直線互相平行。', ok: false, pic: 'meet' }
    ];
    var it = U.pick(items);
    var prompt = GH.lead('判斷：' + it.p) + D.linePair(it.pic);
    return GH.tfQ('parallel', prompt, it.ok, { meta: { unit: '3S1', kind: 'fact' } });
  }

  function genWhichPicture() {
    var correct = U.pick(LINE_YES);
    var wrong = U.pick(LINE_NO);
    var prompt = GH.lead('哪一幅畫的是平行線？') +
      '<div class="pic-choices-note">看下面兩幅圖，再選擇。</div>' +
      '<div class="pic-pair"><div><p class="q-hint">圖甲</p>' + D.linePair(correct) + '</div>' +
      '<div><p class="q-hint">圖乙</p>' + D.linePair(wrong) + '</div></div>';
    if (U.randInt(0, 1) === 0) {
      prompt = GH.lead('哪一幅畫的是平行線？') +
        '<div class="pic-pair"><div><p class="q-hint">圖甲</p>' + D.linePair(wrong) + '</div>' +
        '<div><p class="q-hint">圖乙</p>' + D.linePair(correct) + '</div></div>';
      return GH.choiceQ('parallel', prompt, 'b', [
        { value: 'a', label: '圖甲' },
        { value: 'b', label: '圖乙' }
      ], { answerHtml: '圖乙', meta: { unit: '3S1', kind: 'which' } });
    }
    return GH.choiceQ('parallel', prompt, 'a', [
      { value: 'a', label: '圖甲' },
      { value: 'b', label: '圖乙' }
    ], { answerHtml: '圖甲', meta: { unit: '3S1', kind: 'which' } });
  }

  function genArrowMeaning() {
    var prompt = GH.lead('兩條直線上的箭咀標記相同，表示這兩條線怎樣？') +
      D.linePair('parallel-h');
    return GH.choiceQ('parallel', prompt, 'par', [
      { value: 'par', label: '互相平行' },
      { value: 'cross', label: '一定相交' },
      { value: 'len', label: '長度一定相等' }
    ], {
      answerHtml: '互相平行',
      meta: { unit: '3S1', kind: 'arrow' }
    });
  }

  function generate(diff) {
    diff = diff || 'normal';
    var pool = [genAreParallel, genAreParallel, genInShape, genInShape, genCount, genFacts, genDistance, genWhichPicture, genArrowMeaning];
    if (diff === 'easy') pool = [genAreParallel, genAreParallel, genFacts, genInShape, genArrowMeaning, genCount];
    return U.pick(pool)(diff);
  }

  global.GenParallel = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
