/**
 * 3M4 時間(四)：24 小時報時制。
 * 12 小時 ↔ 24 小時（上午／下午／正午／午夜）、補零。
 * 一天開始 00:00，一天結束 24:00。
 * 不做時間間隔應用題（那是 6M4）。
 */
(function (global) {
  'use strict';
  var U = global.U;
  var GH = global.GH;
  var D = global.Diagrams;

  var MINUTES = [0, 5, 8, 10, 15, 20, 26, 30, 35, 40, 45, 50, 58];

  function to24(period, h, m) {
    m = m || 0;
    if (period === '結束') return { h: 24, m: 0 };
    if (period === '午夜') return { h: 0, m: 0 };
    if (period === '正午') return { h: 12, m: 0 };
    if (period === '上午') {
      if (h === 12) return { h: 0, m: m };
      return { h: h, m: m };
    }
    if (period === '下午') {
      if (h === 12) return { h: 12, m: m };
      return { h: h + 12, m: m };
    }
    throw new Error('unknown period ' + period);
  }

  function labelOf(period, h12, m) {
    if (period === '午夜') return '午夜';
    if (period === '正午') return '正午';
    if (period === '結束') return '一天結束（午夜）';
    var body = h12 + ' 時' + (m === 0 ? '正' : ' ' + m + ' 分');
    return period + ' ' + body;
  }

  function from24(h, m) {
    if (h === 24 && m === 0) return { period: '結束', h12: 12, m: 0, label: labelOf('結束', 12, 0) };
    if (h === 0 && m === 0) return { period: '午夜', h12: 12, m: 0, label: labelOf('午夜', 12, 0) };
    if (h === 0) return { period: '上午', h12: 12, m: m, label: labelOf('上午', 12, m) };
    if (h < 12) return { period: '上午', h12: h, m: m, label: labelOf('上午', h, m) };
    if (h === 12 && m === 0) return { period: '正午', h12: 12, m: 0, label: labelOf('正午', 12, 0) };
    if (h === 12) return { period: '下午', h12: 12, m: m, label: labelOf('下午', 12, m) };
    return { period: '下午', h12: h - 12, m: m, label: labelOf('下午', h - 12, m) };
  }

  function randMinute(diff) {
    if (diff === 'easy' && U.randInt(0, 1) === 0) return U.pick([0, 15, 30]);
    return U.pick(MINUTES);
  }

  function randClock(diff) {
    if (U.randInt(0, 6) === 0) return { h: 0, m: 0, special: 'start' };
    if (U.randInt(0, 6) === 0) return { h: 24, m: 0, special: 'end' };
    if (U.randInt(0, 5) === 0) return { h: 12, m: 0, special: 'noon' };
    var h = U.randInt(0, 23);
    var m = randMinute(diff);
    if (diff === 'hard' && U.randInt(0, 2) === 0) {
      h = U.pick([0, 12]);
      m = U.pick([5, 26, 30, 40]);
    }
    return { h: h, m: m };
  }

  function gen12to24(diff) {
    var c = randClock(diff);
    if (c.special === 'end') {
      return GH.timeQ('time24',
        GH.lead('一天結束的時間，用 24 小時報時制怎樣寫？') +
        GH.hint('一天的開始是 00:00，結束用另一個寫法。'),
        24, 0, { meta: { unit: '3M4', h: 24, m: 0 } });
    }
    var info = from24(c.h, c.m);
    var spoken = info.label;
    var clock = '';
    if (c.h !== 24 && U.randInt(0, 1) === 0) {
      clock = '<div class="clock-block"><span class="clock-badge">' + GH.esc(info.period === '結束' ? '午夜' : info.period) + '</span>' +
        D.analogClock(c.h === 24 ? 0 : c.h, c.m) + '</div>';
    }
    var prompt = GH.lead('把下面的時間寫成 24 小時報時制。') +
      GH.expr(GH.esc(spoken)) + clock +
      GH.hint('時和分分開輸入。不足兩位會以補零顯示，例如 09:05。');
    return GH.timeQ('time24', prompt, c.h, c.m, { meta: { unit: '3M4', h: c.h, m: c.m } });
  }

  function genPadMc(diff) {
    var samples = [
      { say: '上午 9 時 5 分', ok: '09:05', bad: ['9:5', '9:05', '21:05'] },
      { say: '下午 6 時 30 分', ok: '18:30', bad: ['6:30', '06:30', '18:3'] },
      { say: '午夜', ok: '00:00', bad: ['12:00', '24:00', '12:30'] },
      { say: '一天結束', ok: '24:00', bad: ['00:00', '12:00', '24:30'] },
      { say: '正午', ok: '12:00', bad: ['00:00', '24:00', '12:12'] },
      { say: '上午 12 時 26 分', ok: '00:26', bad: ['12:26', '12:00', '00:00'] },
      { say: '下午 12 時 30 分', ok: '12:30', bad: ['00:30', '24:30', '13:30'] }
    ];
    if (diff === 'easy') samples = samples.slice(0, 5);
    var s = U.pick(samples);
    var choices = [{ value: s.ok, label: s.ok }].concat(s.bad.map(function (b) {
      return { value: b, label: b };
    }));
    var prompt = GH.lead('「' + s.say + '」用 24 小時報時制、並補零，應寫成哪一個？') +
      GH.hint('寫足四個數字，中間加冒號，例如格式 07:40。');
    return GH.choiceQ('time24', prompt, s.ok, choices, {
      answerHtml: D.timeDigital(s.ok === '24:00' ? 24 : Number(s.ok.slice(0, 2)), Number(s.ok.slice(3))),
      meta: { unit: '3M4', kind: 'pad' }
    });
  }

  function gen24to12(diff) {
    var c = randClock(diff);
    if (c.h === 24) c = { h: 0, m: 0 };
    var info = from24(c.h, c.m);
    var correct = info.label;
    var pool = [correct];
    function add(lab) { if (lab && pool.indexOf(lab) < 0) pool.push(lab); }
    if (info.period === '上午' && info.h12 !== 12) add(labelOf('下午', info.h12, info.m));
    if (info.period === '下午' && info.h12 !== 12) add(labelOf('上午', info.h12, info.m));
    if (info.period === '上午' && info.h12 === 12) {
      add(labelOf('下午', 12, info.m));
      add('午夜');
      add('正午');
    }
    if (info.period === '下午' && info.h12 === 12) {
      add(labelOf('上午', 12, info.m));
      add('正午');
    }
    if (info.period === '午夜') { add('正午'); add('一天結束（午夜）'); add(labelOf('上午', 12, 30)); }
    if (info.period === '正午') { add('午夜'); add(labelOf('下午', 12, 30)); add(labelOf('上午', 12, 0)); }
    var h2 = info.h12 === 1 ? 2 : info.h12 - 1;
    if (h2 >= 1 && h2 <= 11 && info.period !== '午夜' && info.period !== '正午') {
      add(labelOf(info.period, h2, info.m));
    }
    add(labelOf('下午', (info.h12 % 11) + 1, info.m === 0 ? 15 : 0));
    var opts = pool.filter(function (x) { return x !== correct; }).slice(0, 3);
    while (opts.length < 3) {
      var extra = labelOf(U.pick(['上午', '下午']), U.randInt(1, 11), U.pick(MINUTES));
      if (extra !== correct && opts.indexOf(extra) < 0) opts.push(extra);
    }
    var choices = [{ value: correct, label: correct }].concat(opts.map(function (o) {
      return { value: o, label: o };
    }));
    var prompt = GH.lead('電子鐘顯示下面的 24 小時時間。用 12 小時報時制，應該怎樣讀？') +
      D.digitalFace(c.h, c.m) +
      '<p class="q-expr">' + D.timeStack(c.h, c.m) + '</p>';
    return GH.choiceQ('time24', prompt, correct, choices, {
      meta: { unit: '3M4', h: c.h, m: c.m }
    });
  }

  function genReadClock(diff) {
    var c = randClock(diff);
    if (c.h === 24) c = { h: 18, m: 30 };
    if (c.h === 0 && c.m === 0 && diff === 'easy') c = { h: 9, m: 15 };
    var info = from24(c.h, c.m);
    var badge = info.period === '結束' ? '午夜' : info.period;
    var prompt = GH.lead('時鐘表示「' + info.label + '」。寫成 24 小時報時制。') +
      '<div class="clock-block"><span class="clock-badge">' + GH.esc(badge) + '</span>' +
      D.analogClock(c.h, c.m) + '</div>';
    return GH.timeQ('time24', prompt, c.h, c.m, { meta: { unit: '3M4', h: c.h, m: c.m, kind: 'clock' } });
  }

  function genDigits(diff) {
    var askHour = U.randInt(0, 1) === 0;
    var c = randClock(diff === 'easy' ? 'normal' : diff);
    if (c.h === 24) c = { h: 15, m: 40 };
    var info = from24(c.h, c.m);
    if (askHour) {
      var correct = c.h + ' 時';
      var bad1 = c.m + ' 分';
      var bad2 = info.label;
      var bad3 = ((c.h + 1) % 24) + ' 時';
      var choices = [
        { value: 'h', label: '時（' + c.h + ' 時）' },
        { value: 'm', label: '分（' + c.m + ' 分）' },
        { value: 'both', label: '同時表示時和分' }
      ];
      var prompt = GH.lead('24 小時報時制 ' + U.timeText(c.h, c.m) + '，左邊的「' + U.pad2(c.h) + '」表示甚麼？') +
        D.timeStack(c.h, c.m);
      return GH.choiceQ('time24', prompt, 'h', choices, {
        answerHtml: GH.esc('時（' + c.h + ' 時）'),
        meta: { unit: '3M4', h: c.h, m: c.m, kind: 'digits' }
      });
    }
    var promptM = GH.lead('24 小時報時制 ' + U.timeText(c.h, c.m) + '，右邊的「' + U.pad2(c.m) + '」表示甚麼？') +
      D.digitalFace(c.h, c.m);
    return GH.choiceQ('time24', promptM, 'm', [
      { value: 'm', label: '分（' + c.m + ' 分）' },
      { value: 'h', label: '時（' + c.h + ' 時）' },
      { value: 's', label: '秒' }
    ], {
      answerHtml: GH.esc('分（' + c.m + ' 分）'),
      meta: { unit: '3M4', h: c.h, m: c.m, kind: 'digits' }
    });
  }

  function minutesOf(h, m) { return h * 60 + m; }

  function genEarlier(diff) {
    var a = randClock(diff);
    var b = randClock(diff);
    if (a.h === 24) a = { h: 23, m: 15 };
    if (b.h === 24) b = { h: 0, m: 20 };
    if (U.randInt(0, 2) === 0) {
      b = { h: a.h, m: a.m };
    }
    var ia = from24(a.h, a.m);
    var ib = from24(b.h, b.m);
    var ma = minutesOf(a.h, a.m);
    var mb = minutesOf(b.h, b.m);
    var ans = ma === mb ? 'same' : (ma < mb ? 'a' : 'b');
    var labA = U.timeText(a.h, a.m);
    var labB = ib.label;
    var words = {
      a: labA + ' 較早',
      b: labB + ' 較早',
      same: '兩個時間相同'
    };
    var prompt = GH.lead('邊個時間較早？') +
      GH.expr('甲：' + D.timeDigital(a.h, a.m)) +
      GH.expr('乙：' + GH.esc(labB)) +
      GH.hint('只比較先後，不用計算相隔多久。');
    return GH.choiceQ('time24', prompt, ans, [
      { value: 'a', label: words.a },
      { value: 'b', label: words.b },
      { value: 'same', label: words.same }
    ], {
      answerHtml: GH.esc(words[ans]),
      meta: { unit: '3M4', kind: 'earlier' }
    });
  }

  function genFacts() {
    var items = [
      { p: '一天開始的時間，24 小時報時制寫成 00:00。', ok: true },
      { p: '一天結束的時間，24 小時報時制寫成 24:00。', ok: true },
      { p: '正午是 12:00。', ok: true },
      { p: '午夜只可以寫成 12:00。', ok: false },
      { p: '下午 3 時是 15:00。', ok: true },
      { p: '上午 7 時 15 分是 19:15。', ok: false },
      { p: '24 小時報時制左邊兩個數字表示「時」，右邊兩個數字表示「分」。', ok: true }
    ];
    var it = U.pick(items);
    var prompt = GH.lead('判斷：' + it.p);
    return GH.tfQ('time24', prompt, it.ok, { meta: { unit: '3M4', kind: 'fact' } });
  }

  function generate(diff) {
    diff = diff || 'normal';
    var pool;
    if (diff === 'easy') {
      pool = [gen12to24, gen12to24, genPadMc, gen24to12, genReadClock, genFacts, genDigits];
    } else if (diff === 'hard') {
      pool = [gen12to24, gen12to24, genPadMc, gen24to12, genReadClock, genDigits, genEarlier, genFacts];
    } else {
      pool = [gen12to24, gen12to24, genPadMc, gen24to12, genReadClock, genDigits, genEarlier, genFacts];
    }
    return U.pick(pool)(diff);
  }

  global.GenTime = { generate: generate, to24: to24, from24: from24, labelOf: labelOf };
})(typeof window !== 'undefined' ? window : globalThis);
