/**
 * 乘加／乘減 (3N4 四則運算一)
 * 符合香港教育局小三數學課程規範：
 * - 只限乘加與乘減混合算式，每題不超過兩步運算
 * - 不涉及除加／除減（屬小四課程）
 * - 先乘後加減，減法不出現負數
 */
(function (global) {
  'use strict';

  function makeGuideMul(a, b, prod, outerTemplate, finalAns, explainText) {
    return {
      stepPromptHtml: '算式同時有 <strong>×</strong> 和 <strong>＋／－</strong>，要<strong>先乘後加減</strong>！<br>請先算出乘法部分 <strong>' + a + ' × ' + b + '</strong> 是多少？',
      stepType: 'fill',
      stepAnswer: prod,
      afterHintHtml: '答對了！把 <strong>' + a + ' × ' + b + '</strong> 換成 <strong>' + prod + '</strong>，現在算式變成 <strong>' + global.GH.esc(outerTemplate.replace('{x}', prod)) + '</strong>，最後答案是多少？',
      explainHtml: global.GH.esc(explainText) + '，所以答案是 <strong>' + finalAns + '</strong>。'
    };
  }

  function genEasy() {
    var U = global.U;
    var GH = global.GH;
    var a = U.randInt(2, 9);
    var b = U.randInt(2, 9);
    var prod = a * b;
    var isAdd = U.randInt(0, 1) === 1;
    var c, ans, exprText, outerTpl, explain;

    if (isAdd) {
      c = U.randInt(5, 30);
      ans = prod + c;
      exprText = a + ' × ' + b + ' + ' + c;
      outerTpl = '{x} + ' + c;
      explain = '先算乘法 ' + a + ' × ' + b + ' = ' + prod + '，再算 ' + prod + ' + ' + c + ' = ' + ans;
    } else {
      c = U.randInt(2, Math.max(3, prod - 2));
      ans = prod - c;
      exprText = a + ' × ' + b + ' − ' + c;
      outerTpl = '{x} − ' + c;
      explain = '先算乘法 ' + a + ' × ' + b + ' = ' + prod + '，再算 ' + prod + ' − ' + c + ' = ' + ans;
    }

    return GH.fillQ(
      'muladd',
      GH.lead('計算下列算式：') + GH.expr(exprText + ' = ?'),
      ans,
      { guide: makeGuideMul(a, b, prod, outerTpl, ans, explain) }
    );
  }

  function genNormal() {
    var U = global.U;
    var GH = global.GH;
    var a = U.randInt(3, 9);
    var b = U.randInt(3, 9);
    var prod = a * b;
    var isSub = U.randInt(0, 1) === 1;
    var c, ans, exprText, outerTpl, explain;

    if (isSub) {
      // 乘法在後方：c - a × b（最容易錯由左至右）
      c = prod + U.randInt(8, 45);
      ans = c - prod;
      exprText = c + ' − ' + a + ' × ' + b;
      outerTpl = c + ' − {x}';
      explain = '先乘後減：先算 ' + a + ' × ' + b + ' = ' + prod + '，再算 ' + c + ' − ' + prod + ' = ' + ans;
    } else {
      // 乘法在後方：c + a × b
      c = U.randInt(12, 65);
      ans = c + prod;
      exprText = c + ' + ' + a + ' × ' + b;
      outerTpl = c + ' + {x}';
      explain = '先乘後加：先算 ' + a + ' × ' + b + ' = ' + prod + '，再算 ' + c + ' + ' + prod + ' = ' + ans;
    }

    return GH.fillQ(
      'muladd',
      GH.lead('計算下列算式：') + GH.expr(exprText + ' = ?'),
      ans,
      { guide: makeGuideMul(a, b, prod, outerTpl, ans, explain) }
    );
  }

  function genHard() {
    var U = global.U;
    var GH = global.GH;
    var kind = U.randInt(1, 2);

    // 小三範圍：兩位數 × 一位數
    var a = U.randInt(12, 36);
    var b = U.randInt(2, 6);
    var prod = a * b;

    if (kind === 1) {
      var c = prod + U.randInt(15, 80);
      var ans = c - prod;
      var exprText = c + ' − ' + a + ' × ' + b;
      return GH.fillQ(
        'muladd',
        GH.lead('計算下列算式：') + GH.expr(exprText + ' = ?'),
        ans,
        {
          guide: makeGuideMul(
            a, b, prod, c + ' − {x}', ans,
            '先乘後減：先算 ' + a + ' × ' + b + ' = ' + prod + '，再算 ' + c + ' − ' + prod + ' = ' + ans
          )
        }
      );
    }

    // 兩步應用題
    var name = GH.name();
    var unitPrice = U.randInt(12, 28);
    var qty = U.randInt(3, 6);
    var subTotal = unitPrice * qty;
    var extraItem = U.randInt(15, 45);
    var total = subTotal + extraItem;

    return GH.fillQ(
      'muladd',
      GH.word(name + '買了 ' + qty + ' 盒每盒 ' + unitPrice + ' 元的顏色筆，再買了一本 ' + extraItem + ' 元的畫簿，共需付多少元？'),
      total,
      {
        unitText: '元',
        guide: makeGuideMul(
          unitPrice, qty, subTotal, '{x} + ' + extraItem, total,
          '可列式為 ' + unitPrice + ' × ' + qty + ' + ' + extraItem + '，先算 ' + qty + ' 盒顏色筆共 ' + subTotal + ' 元，再加畫簿 ' + extraItem + ' 元，共 ' + total + ' 元'
        )
      }
    );
  }

  function generate(diff) {
    if (diff === 'easy') return genEasy();
    if (diff === 'hard') return genHard();
    return genNormal();
  }

  global.GenMulAdd = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
