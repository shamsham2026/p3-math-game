(function (global) {
  'use strict';

  var TOPICS = {
    mul: { id: 'mul', name: '乘法', icon: '×', gen: function (d) { return global.GenMul.generate(d); } },
    div: { id: 'div', name: '除法', icon: '÷', gen: function (d) { return global.GenDiv.generate(d); } },
    brackets: { id: 'brackets', name: '圓括號', icon: '()', gen: function (d) { return global.GenBrackets.generate(d); } },
    muladd: { id: 'muladd', name: '乘加／乘減', icon: '×+', gen: function (d) { return global.GenMulAdd.generate(d); } },
    weight: { id: 'weight', name: '重量', icon: '⚖️', gen: function (d) { return global.GenWeight.generate(d); } },
    time24: { id: 'time24', name: '24小時報時制', icon: '24', gen: function (d) { return global.GenTime.generate(d); } },
    parallel: { id: 'parallel', name: '平行線', icon: '∥', gen: function (d) { return global.GenParallel.generate(d); } },
    para: { id: 'para', name: '平行四邊形', icon: '▱', gen: function (d) { return global.GenPara.generate(d); } },
    triangle: { id: 'triangle', name: '三角形', icon: '△', gen: function (d) { return global.GenTriangle.generate(d); } }
  };

  var TOPIC_ORDER = [
    'mul', 'div', 'brackets',
    'muladd', 'weight', 'time24',
    'parallel', 'para', 'triangle'
  ];

  function generateOne(topicId, diff) {
    var t = TOPICS[topicId];
    if (!t || !t.gen) throw new Error('Unknown topic: ' + topicId);
    return t.gen(diff);
  }

  function generateRound(topicId, count, diff) {
    var list = [];
    var guard = 0;
    while (list.length < count && guard < count * 8) {
      guard++;
      try {
        list.push(generateOne(topicId, diff));
      } catch (e) {
        console.warn(e);
      }
    }
    return list;
  }

  global.Topics = {
    TOPICS: TOPICS,
    TOPIC_ORDER: TOPIC_ORDER,
    generateOne: generateOne,
    generateRound: generateRound
  };
})(typeof window !== 'undefined' ? window : globalThis);
