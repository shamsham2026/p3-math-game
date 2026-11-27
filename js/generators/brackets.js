/**
 * 圓括號 (3N4 四則運算一)
 * 符合香港教育局小三數學課程規範：
 * - 不超過三個數的加減混合計算
 * - 只限一對圓括號（無多重括號）
 * - 數值不多於四位數，運算過程及結果不出現負數
 */
(function (global) {
  'use strict';

  function makeGuideCalc(exprText, innerText, innerVal, outerTemplate, finalAns, explainText) {
    return {
      stepPromptHtml: '題目有圓括號 <strong>( )</strong>，要先算括號裡面的部分！<br>請先算出 <strong>' + global.GH.esc(innerText) + '</strong> 是多少？',
      stepType: 'fill',
      stepAnswer: innerVal,
      afterHintHtml: '答對了！括號內是 <strong>' + innerVal + '</strong>，現在算式變成 <strong>' + global.GH.esc(outerTemplate.replace('{x}', innerVal)) + '</strong>，再算一次最後答案吧！',
      explainHtml: global.GH.esc(explainText) + '，所以答案是 <strong>' + finalAns + '</strong>。'
    };
  }

  function genEasy() {
    var U = global.U;
    var GH = global.GH;
    var pattern = U.randInt(1, 3);
    var a, b, c, ans, exprText, innerText, innerVal, outerTpl, explain;

    if (pattern === 1) {
      // a - (b + c)
      b = U.randInt(12, 35);
      c = U.randInt(11, 35);
      innerVal = b + c;
      a = innerVal + U.randInt(10, 40);
      ans = a - innerVal;
      exprText = a + ' − (' + b + ' + ' + c + ')';
      innerText = b + ' + ' + c;
      outerTpl = a + ' − {x}';
      explain = '先算圓括號內 ' + b + ' + ' + c + ' = ' + innerVal + '，再算 ' + a + ' − ' + innerVal + ' = ' + ans;
    } else if (pattern === 2) {
      // (a + b) - c
      a = U.randInt(18, 55);
      b = U.randInt(15, 45);
      innerVal = a + b;
      c = U.randInt(10, innerVal - 8);
      ans = innerVal - c;
      exprText = '(' + a + ' + ' + b + ') − ' + c;
      innerText = a + ' + ' + b;
      outerTpl = '{x} − ' + c;
      explain = '先算圓括號內 ' + a + ' + ' + b + ' = ' + innerVal + '，再算 ' + innerVal + ' − ' + c + ' = ' + ans;
    } else {
      // a - (b - c)
      c = U.randInt(10, 28);
      b = c + U.randInt(12, 35);
      innerVal = b - c;
      a = innerVal + U.randInt(12, 45);
      ans = a - innerVal;
      exprText = a + ' − (' + b + ' − ' + c + ')';
      innerText = b + ' − ' + c;
      outerTpl = a + ' − {x}';
      explain = '先算圓括號內 ' + b + ' − ' + c + ' = ' + innerVal + '，再算 ' + a + ' − ' + innerVal + ' = ' + ans;
    }

    return GH.fillQ(
      'brackets',
      GH.lead('計算下列算式：') + GH.expr(exprText + ' = ?'),
      ans,
      {
        guide: makeGuideCalc(exprText, innerText, innerVal, outerTpl, ans, explain)
      }
    );
  }

  function genNormal() {
    var U = global.U;
    var GH = global.GH;
    var kind = U.randInt(1, 3);

    if (kind === 1) {
      // 三位數 a - (b + c)
      var b = U.randInt(45, 180);
      var c = U.randInt(35, 160);
      var innerVal = b + c;
      var a = innerVal + U.randInt(40, 250);
      var ans = a - innerVal;
      var exprText = a + ' − (' + b + ' + ' + c + ')';
      return GH.fillQ(
        'brackets',
        GH.lead('計算下列算式：') + GH.expr(exprText + ' = ?'),
        ans,
        {
          guide: makeGuideCalc(
            exprText,
            b + ' + ' + c,
            innerVal,
            a + ' − {x}',
            ans,
            '先算圓括號內 ' + b + ' + ' + c + ' = ' + innerVal + '，再算 ' + a + ' − ' + innerVal + ' = ' + ans
          )
        }
      );
    }

    if (kind === 2) {
      // 三位數 a + (b - c)
      var c2 = U.randInt(45, 160);
      var b2 = c2 + U.randInt(35, 220);
      var innerVal2 = b2 - c2;
      var a2 = U.randInt(110, 380);
      var ans2 = a2 + innerVal2;
      var exprText2 = a2 + ' + (' + b2 + ' − ' + c2 + ')';
      return GH.fillQ(
        'brackets',
        GH.lead('計算下列算式：') + GH.expr(exprText2 + ' = ?'),
        ans2,
        {
          guide: makeGuideCalc(
            exprText2,
            b2 + ' − ' + c2,
            innerVal2,
            a2 + ' + {x}',
            ans2,
            '先算圓括號內 ' + b2 + ' − ' + c2 + ' = ' + innerVal2 + '，再算 ' + a2 + ' + ' + innerVal2 + ' = ' + ans2
          )
        }
      );
    }

    // 運算次序判斷（比較題）
    var x = U.randInt(60, 120);
    var y = U.randInt(15, 35);
    var z = U.randInt(10, 25);
    var leftVal = x - (y + z);
    var rightVal = (x - y) + z;
    var askSame = U.randInt(0, 1) === 1;
    if (askSame) {
      return GH.tfQ(
        'brackets',
        GH.lead('判斷下列兩條算式的結果是否相等：') +
        GH.expr(x + ' − (' + y + ' + ' + z + ')  和  ' + x + ' − ' + y + ' + ' + z),
        false,
        {
          guide: {
            stepPromptHtml: '左邊有圓括號，要先算 <strong>' + y + ' + ' + z + '</strong>。請問左邊 <strong>' + x + ' − (' + y + ' + ' + z + ')</strong> 的結果是多少？',
            stepType: 'fill',
            stepAnswer: leftVal,
            afterHintHtml: '左邊是 <strong>' + leftVal + '</strong>，而右邊沒有括號要由左至右算：' + x + ' − ' + y + ' + ' + z + ' = ' + rightVal + '，兩邊相等嗎？',
            explainHtml: '左邊 = ' + leftVal + '，右邊 = ' + rightVal + '，所以兩者不相等（選「錯」）。'
          }
        }
      );
    }

    return GH.choiceQ(
      'brackets',
      GH.lead('計算 <strong>' + x + ' − (' + y + ' + ' + z + ')</strong> 時，應該先算哪一個部分？'),
      'inner',
      [
        { value: 'inner', label: y + ' + ' + z },
        { value: 'left', label: x + ' − ' + y },
        { value: 'outer', label: x + ' + ' + z },
        { value: 'any', label: '由左至右隨便先算' }
      ],
      {
        guide: {
          stepPromptHtml: '看到算式中有圓括號 <strong>( )</strong> 時，規則是「先算括號內」還是「由左至右」？',
          stepType: 'mc',
          stepChoices: [
            { value: 'in', label: '先算圓括號內的部分' },
            { value: 'lr', label: '一律由左至右計算' }
          ],
          stepAnswer: 'in',
          afterHintHtml: '對了！要先算圓括號裡面，現在再選一次括號裡面的算式吧！',
          explainHtml: '有圓括號時必須先算括號內的 ' + y + ' + ' + z + '。'
        }
      }
    );
  }

  function genHard() {
    var U = global.U;
    var GH = global.GH;
    var kind = U.randInt(1, 2);

    if (kind === 1) {
      // 四位數以內三數括號運算
      var b = U.randInt(125, 420);
      var c = U.randInt(115, 380);
      var innerVal = b + c;
      var a = innerVal + U.randInt(150, 650);
      if (a > 2500) a = innerVal + 320;
      var ans = a - innerVal;
      var exprText = a + ' − (' + b + ' + ' + c + ')';
      return GH.fillQ(
        'brackets',
        GH.lead('計算下列算式：') + GH.expr(exprText + ' = ?'),
        ans,
        {
          guide: makeGuideCalc(
            exprText,
            b + ' + ' + c,
            innerVal,
            a + ' − {x}',
            ans,
            '先算圓括號內 ' + b + ' + ' + c + ' = ' + innerVal + '，再算 ' + a + ' − ' + innerVal + ' = ' + ans
          )
        }
      );
    }

    // 兩步應用題：購物找贖（總額減去兩件貨品之和）
    var name = GH.name();
    var item1 = U.randInt(45, 135);
    var item2 = U.randInt(38, 115);
    var totalCost = item1 + item2;
    var paid = (Math.floor(totalCost / 100) + 1) * 100;
    if (paid < totalCost + 20) paid += 100;
    var change = paid - totalCost;

    return GH.fillQ(
      'brackets',
      GH.word(name + '買了一本售價 ' + item1 + ' 元的故事書和一個售價 ' + item2 + ' 元的筆袋，付了 ' + paid + ' 元，應找回多少元？'),
      change,
      {
        unitText: '元',
        guide: makeGuideCalc(
          paid + ' − (' + item1 + ' + ' + item2 + ')',
          item1 + ' + ' + item2,
          totalCost,
          paid + ' − {x}',
          change,
          '可列式為 ' + paid + ' − (' + item1 + ' + ' + item2 + ')，先算共需 ' + totalCost + ' 元，再算找回 ' + paid + ' − ' + totalCost + ' = ' + change + ' 元'
        )
      }
    );
  }

  function generate(diff) {
    if (diff === 'easy') return genEasy();
    if (diff === 'hard') return genHard();
    return genNormal();
  }

  global.GenBrackets = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
