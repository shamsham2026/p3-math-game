/**
 * 三角形的辨認 (3S2 三角形)
 * 符合香港教育局小三數學課程規範：
 * - 辨認五類三角形：等邊三角形、等腰三角形、直角三角形、等腰直角三角形、不等邊三角形
 * - 認識不同種類三角形之間的包含關係（如：等邊三角形也是等腰三角形；等腰直角三角形既是等腰也是直角）
 * - 認識三角形任意兩邊之和大於第三邊
 * - 不使用「銳角三角形」及「鈍角三角形」詞彙
 */
(function (global) {
  'use strict';

  var TRI_TYPES = [
    { id: 'equilateral', name: '等邊三角形', eqSides: '3', hasRight: 'no' },
    { id: 'isosceles', name: '等腰三角形', eqSides: '2', hasRight: 'no' },
    { id: 'right', name: '直角三角形', eqSides: '0', hasRight: 'yes' },
    { id: 'iso_right', name: '等腰直角三角形', eqSides: '2', hasRight: 'yes' },
    { id: 'scalene', name: '不等邊三角形', eqSides: '0', hasRight: 'no' }
  ];

  function makeTriGuide(spec) {
    var sideDesc = spec.eqSides === '3'
      ? '3 條邊都相等'
      : (spec.eqSides === '2' ? '只有 2 條邊相等' : '3 條邊都不相等');
    var rightDesc = spec.hasRight === 'yes' ? '有 1 個直角' : '沒有直角';
    return {
      stepPromptHtml: '先觀察這個三角形的邊長：有幾條邊長度相等？',
      stepType: 'mc',
      stepChoices: [
        { value: '3', label: '3 條邊都相等' },
        { value: '2', label: '只有 2 條邊相等' },
        { value: '0', label: '3 條邊都不相等' }
      ],
      stepAnswer: spec.eqSides,
      afterHintHtml: '對了，它<strong>' + sideDesc + '</strong>！再看看圖中有沒有直角符號（這個三角形<strong>' + rightDesc + '</strong>），所以它最準確叫作什麼三角形？',
      explainHtml: '因為它<strong>' + sideDesc + '</strong>，而且<strong>' + rightDesc + '</strong>，所以是<strong>' + spec.name + '</strong>。'
    };
  }

  function makeIdentifyQuestion(rotate) {
    var U = global.U;
    var GH = global.GH;
    var D = global.Diagrams;
    var spec = U.pick(TRI_TYPES);
    var angle = rotate ? U.pick([0, 35, 90, 135, 180, 225, 270, 315]) : 0;
    var svg = D.triangleSvg(spec.id, { rotate: angle, showMarks: true });
    var choices = U.shuffle(TRI_TYPES).slice(0, 4);
    if (!choices.some(function (c) { return c.id === spec.id; })) {
      choices[0] = spec;
    }
    choices = U.shuffle(choices).map(function (c) {
      return { value: c.name, label: c.name };
    });

    return GH.choiceQ(
      'triangle',
      GH.lead('觀察下圖，這是一個什麼三角形？') + svg,
      spec.name,
      choices,
      { guide: makeTriGuide(spec) }
    );
  }

  function genEasy() {
    return makeIdentifyQuestion(false);
  }

  function genNormal() {
    var U = global.U;
    var GH = global.GH;
    if (U.randInt(1, 3) <= 2) {
      return makeIdentifyQuestion(true);
    }
    // 文字條件辨認
    var spec = U.pick(TRI_TYPES);
    var descMap = {
      equilateral: '三條邊長度都相等的三角形',
      isosceles: '只有兩條邊相等，而且沒有直角的三角形',
      right: '三條邊都不相等，但有一個直角的三角形',
      iso_right: '有兩條邊相等，而且有一個直角的三角形',
      scalene: '三條邊都不相等，而且沒有直角的三角形'
    };
    var choices = TRI_TYPES.map(function (c) {
      return { value: c.name, label: c.name };
    });
    return GH.choiceQ(
      'triangle',
      GH.lead('以下描述的是哪一種三角形？') + GH.word(descMap[spec.id]),
      spec.name,
      choices.slice(0, 4).some(function (x) { return x.value === spec.name; })
        ? choices.slice(0, 4)
        : [choices[0], choices[1], choices[2], { value: spec.name, label: spec.name }],
      { guide: makeTriGuide(spec) }
    );
  }

  function genHard() {
    var U = global.U;
    var GH = global.GH;
    var kind = U.randInt(1, 3);

    if (kind === 1) {
      return makeIdentifyQuestion(true);
    }

    if (kind === 2) {
      // 包含關係判斷（課程重點：認識不同種類三角形之間的關係）
      var relPool = [
        {
          q: '所有「等邊三角形」都屬於「等腰三角形」的一種。',
          ans: true,
          explain: '等邊三角形有 3 條邊相等，因此一定滿足「至少有兩條邊相等」，所以它也是等腰三角形。'
        },
        {
          q: '「等腰直角三角形」既是等腰三角形，也是直角三角形。',
          ans: true,
          explain: '等腰直角三角形同時擁有「兩條邊相等」及「一個直角」兩個特徵，所以同時屬於兩者。'
        },
        {
          q: '所有「等腰三角形」都是「等邊三角形」。',
          ans: false,
          explain: '等腰三角形只需要有兩條邊相等，第三條邊可以不同長度，所以不一定全部都是等邊三角形。'
        },
        {
          q: '把一個直角三角形旋轉倒轉擺放後，它就不再是直角三角形。',
          ans: false,
          explain: '三角形的種類不會因為擺放方向改變而改變，直角依然是直角。'
        }
      ];
      var item = U.pick(relPool);
      return GH.tfQ(
        'triangle',
        GH.lead('判斷以下關於三角形的說法是否正確：') + GH.word(item.q),
        item.ans,
        {
          guide: {
            stepPromptHtml: '想一想定義：等腰三角形需要「有兩條邊相等」，直角三角形需要「有一個直角」。你覺得這個說法合理嗎？',
            stepType: 'mc',
            stepChoices: [
              { value: 'true', label: '對，符合定義' },
              { value: 'false', label: '錯，不符合定義' }
            ],
            stepAnswer: item.ans ? 'true' : 'false',
            afterHintHtml: '答對了！現在再按一次「' + (item.ans ? '✓ 對' : '✗ 錯') + '」完成這題！',
            explainHtml: item.explain
          }
        }
      );
    }

    // 三角形任意兩邊之和大於第三邊
    var goodSets = [
      '4 cm、5 cm、6 cm',
      '5 cm、5 cm、8 cm',
      '6 cm、7 cm、10 cm'
    ];
    var badSets = [
      { label: '3 cm、4 cm、8 cm', a: 3, b: 4, c: 8 },
      { label: '2 cm、5 cm、7 cm', a: 2, b: 5, c: 7 },
      { label: '3 cm、3 cm、9 cm', a: 3, b: 3, c: 9 }
    ];
    var bad = U.pick(badSets);
    var opts = [
      { value: bad.label, label: bad.label },
      { value: goodSets[0], label: goodSets[0] },
      { value: goodSets[1], label: goodSets[1] },
      { value: goodSets[2], label: goodSets[2] }
    ];

    return GH.choiceQ(
      'triangle',
      GH.lead('以下哪一組木棒的長度<strong>不能</strong>拼成一個三角形？'),
      bad.label,
      opts,
      {
        guide: {
          stepPromptHtml: '三角形有一個重要規則：任意兩條邊的長度之和必須<strong>大於</strong>第三邊！<br>算一算 <strong>' + bad.a + ' + ' + bad.b + '</strong> 是多少？',
          stepType: 'fill',
          stepAnswer: bad.a + bad.b,
          afterHintHtml: '答對了！<strong>' + (bad.a + bad.b) + ' cm</strong> 沒有大於最長的邊 <strong>' + bad.c + ' cm</strong>，所以 <strong>' + bad.label + '</strong> 不能拼成三角形！',
          explainHtml: bad.a + ' + ' + bad.b + ' = ' + (bad.a + bad.b) + '，不大於 ' + bad.c + '，不符合「任意兩邊之和大於第三邊」。'
        }
      }
    );
  }

  function generate(diff) {
    if (diff === 'easy') return genEasy();
    if (diff === 'hard') return genHard();
    return genNormal();
  }

  global.GenTriangle = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
