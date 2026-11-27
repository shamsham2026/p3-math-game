/**
 * UI controller – 小三數學競技場
 * - Versus: opposite seating (top A rotated 180°, bottom B), simultaneous answers.
 * - Solo: 3-wrong-answer scaffolding ("答錯三次觸發引導性問題") + review-mistakes round.
 */
(function () {
  'use strict';

  var state = {
    topic: 'mul',
    mode: 'solo',
    difficulty: 'normal',
    session: null,
    timerId: null,
    data: null,
    advPose: 'idle',
    advPoseTimer: null,
    paceId: null,
    briefQ: null,
    lastMissedQuestions: []
  };

  var BLURB = {
    mul: '兩位數或三位數乘一位數，同三個數相乘。',
    div: '兩位數或三位數除一位數，有餘數就填商和餘。',
    brackets: '認識圓括號 ( )，先算括號內的部分（小三三數加減混合）。',
    muladd: '乘加、乘減兩步混合計算，記得「先乘後加減」。',
    weight: '克同公斤換算，1 公斤 = 1000 克。',
    time24: '12 小時同 24 小時互換，記得補零。',
    parallel: '平行線不相交，距離處處相等。',
    para: '兩組對邊分別平行。正方形同長方形都係平行四邊形。',
    triangle: '辨認等邊、等腰、直角、等腰直角及不等邊三角形，以及它們的關係。'
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function showScreen(id) {
    $$('.screen').forEach(function (el) {
      el.classList.toggle('active', el.id === id);
    });
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function topicName(id) {
    var t = Topics.TOPICS[id];
    return t ? t.name : id;
  }

  function typeLabel(t) {
    return ({ fill: '填充', mc: '選擇', tf: '判斷', compare: '比較', multi: '多選' })[t] || t;
  }

  function formatAnswerDisplay(ans, q) {
    if (q && q.answerHtml) return q.answerHtml;
    if (typeof ans === 'boolean') return ans ? '對' : '錯';
    if (ans && typeof ans === 'object' && ans.h != null && ans.m != null && ans.q == null) {
      return Diagrams.timeDigital(Number(ans.h), Number(ans.m));
    }
    if (ans && typeof ans === 'object' && ans.q != null && ans.r != null) {
      return '商 ' + Frac.escape(String(ans.q)) + ' 餘 ' + Frac.escape(String(ans.r));
    }
    if (Array.isArray(ans)) return Frac.escape(ans.join('、'));
    if (ans && typeof ans === 'object' && ans.__frac) return Frac.pretty(ans);
    if (ans && typeof ans === 'object' && ans.n != null && ans.d != null) {
      return Frac.html(ans.n, ans.d);
    }
    return Frac.escape(String(ans));
  }

  var versusOrientQuery = window.matchMedia('(orientation: landscape)');

  function applyVersusOrientation() {
    var vs = $('#versus-play');
    if (!vs) return;
    var landscape = !!(versusOrientQuery && versusOrientQuery.matches);
    var changed = vs.classList.contains('vs-landscape') !== landscape
      || vs.classList.contains('vs-portrait') === landscape;
    if (!changed) return;
    vs.classList.toggle('vs-landscape', landscape);
    vs.classList.toggle('vs-portrait', !landscape);
    window.requestAnimationFrame(function () {
      document.querySelectorAll('.scratch-canvas').forEach(function (canvas) {
        if (canvas._scratch && canvas._scratch.resize) canvas._scratch.resize();
      });
    });
  }

  function bindVersusOrientation() {
    applyVersusOrientation();
    if (versusOrientQuery.addEventListener) {
      versusOrientQuery.addEventListener('change', applyVersusOrientation);
    } else if (versusOrientQuery.addListener) {
      versusOrientQuery.addListener(applyVersusOrientation);
    }
    window.addEventListener('resize', applyVersusOrientation);
    window.addEventListener('orientationchange', applyVersusOrientation);
  }

  function setPlayModeLayout(mode) {
    var solo = $('#solo-play');
    var vs = $('#versus-play');
    var play = $('#screen-play');
    applyVersusOrientation();
    if (mode === 'versus') {
      if (solo) solo.hidden = true;
      if (vs) vs.hidden = false;
      if (play) play.classList.add('is-versus');
    } else {
      if (solo) solo.hidden = false;
      if (vs) vs.hidden = true;
      if (play) play.classList.remove('is-versus');
    }
  }

  function initHome() {
    state.data = Store.load();
    SFX.setMuted(!!state.data.settings.muted);
    $('#btn-mute').setAttribute('aria-pressed', SFX.isMuted() ? 'true' : 'false');
    $('#btn-mute').textContent = SFX.isMuted() ? '🔇 靜音' : '🔊 音效';

    state.difficulty = state.data.settings.difficulty || 'normal';
    $$('[data-diff]').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-diff') === state.difficulty);
    });
    $$('[data-mode]').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-mode') === state.mode);
    });
    $$('[data-topic]').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-topic') === state.topic);
    });

    var best = state.data.bestScores || {};
    var ul = $('#best-scores');
    ul.innerHTML = '';
    Topics.TOPIC_ORDER.forEach(function (id) {
      var li = document.createElement('li');
      var score = best[id];
      li.innerHTML = '<span>' + Frac.escape(topicName(id)) + '</span><span>' +
        (score != null ? score + ' 分' : '-') + '</span>';
      ul.appendChild(li);
    });

    var last = state.data.lastSession;
    var lastEl = $('#last-session');
    if (last) {
      var when = new Date(last.at || Date.now());
      lastEl.textContent = '上次：' + topicName(last.topic) + ' · ' +
        (last.score != null ? last.score + ' 分' : '') +
        ' · ' + when.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_HK' });
    } else {
      lastEl.textContent = '尚未有對局紀錄';
    }

    var art = $('#home-art');
    if (art && typeof Adventure !== 'undefined') art.innerHTML = Adventure.homeBannerHtml();
    $$('[data-icon]').forEach(function (slot) {
      if (typeof Diagrams !== 'undefined') {
        slot.innerHTML = Diagrams.topicIcon(slot.getAttribute('data-icon'));
      }
    });
    paintMasteryDots();

    showScreen('screen-home');
  }

  function paintMasteryDots() {
    $$('[data-topic]').forEach(function (btn) {
      var id = btn.getAttribute('data-topic');
      var pct = Game.masteryPct(Store.topicStat(id), Game.targetSeconds(id, 'normal'));
      var band = Game.masteryBand(pct);
      var dot = btn.querySelector('.mastery-dot');
      if (!dot) {
        dot = document.createElement('span');
        btn.appendChild(dot);
      }
      dot.className = 'mastery-dot band-' + band.id;
      dot.textContent = pct == null ? '未做' : (pct + '%');
      dot.title = band.label + (pct == null ? '' : ' ' + pct + '%');
    });
  }

  function openBrief() {
    SFX.resume();
    var settings = Store.load().settings;
    var count = settings.questionsPerRound || 10;
    var target = Game.targetSeconds(state.topic, state.difficulty);
    state.briefQ = Topics.generateOne(state.topic, state.difficulty);
    $('#brief-title').textContent = topicName(state.topic);
    $('#brief-blurb').textContent = BLURB[state.topic] || '';
    var targetText = (Math.round(target * 10) / 10).toString();
    $('#brief-target').textContent = targetText + ' 秒';
    $('#brief-count').textContent = String(count);
    $('#brief-diff').textContent = ({ easy: '簡易', normal: '普通', hard: '挑戰' })[state.difficulty];
    $('#brief-example').innerHTML = state.briefQ.promptHtml;
    var ans = $('#brief-answer');
    ans.hidden = true;
    ans.innerHTML = '';
    if ($('#brief-hero') && typeof Adventure !== 'undefined') {
      $('#brief-hero').innerHTML = Adventure.beanImg('boy', 'cheer', 'bean-brief') +
        (state.mode === 'versus' ? Adventure.beanImg('girl', 'cheer', 'bean-brief') : '');
    }
    showScreen('screen-brief');
  }

  function revealBriefAnswer() {
    if (!state.briefQ) return;
    var ans = $('#brief-answer');
    ans.hidden = false;
    ans.innerHTML = '答案：' + formatAnswerDisplay(state.briefQ.answer, state.briefQ);
  }

  function stopPace() {
    if (state.paceId) cancelAnimationFrame(state.paceId);
    state.paceId = null;
  }

  function paintPace() {
    var s = state.session;
    if (!s || !s.questionStartedAt) return;
    var cap = document.getElementById('pace-caption');
    if (s.pacePaused) {
      if (cap) cap.textContent = '🌱 小芽引導中（計時條已暫停）';
      return;
    }
    var target = Game.targetSeconds(s.topic, s.difficulty);
    var used = s.lockedElapsedMs != null
      ? s.lockedElapsedMs / 1000
      : (Date.now() - s.questionStartedAt) / 1000;
    var pct = Math.min(100, (used / target) * 100);
    ['pace-fill', 'pace-fill-a', 'pace-fill-b'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.width = pct + '%';
      el.parentElement.classList.toggle('over', used > target);
    });
    if (cap) cap.textContent = '黃條 · 目標 ' + used.toFixed(1) + ' / ' + target.toFixed(1) + ' 秒';
  }

  function paceLoop() {
    paintPace();
    state.paceId = requestAnimationFrame(paceLoop);
  }

  function startGame(customQuestions) {
    SFX.resume();
    SFX.start();
    Store.update(function (d) { d.settings.difficulty = state.difficulty; });

    var settings = Store.load().settings;
    state.session = Game.createSession({
      topic: state.topic,
      mode: Array.isArray(customQuestions) ? 'solo' : state.mode,
      difficulty: state.difficulty,
      questionsPerRound: settings.questionsPerRound || 10,
      secondsPerRound: settings.secondsPerRound || 180,
      customQuestions: customQuestions
    });

    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(onTick, 1000);
    state.advPose = 'idle';
    if (state.advPoseTimer) clearTimeout(state.advPoseTimer);

    setPlayModeLayout(state.session.mode);
    showScreen('screen-play');
    renderPlay();
  }

  function quitToHome() {
    if (state.timerId) clearInterval(state.timerId);
    stopPace();
    state.session = null;
    setPlayModeLayout('solo');
    initHome();
  }

  function onTick() {
    if (!state.session || state.session.finished) return;
    Game.tick(state.session);
    updateHud();
    if (state.session.secondsLeft <= 10 && state.session.secondsLeft > 0) SFX.tick();
    if (state.session.finished) endGame();
  }

  function updateHud() {
    var s = state.session;
    if (!s) return;
    var t = formatTime(s.secondsLeft);
    var qn = Math.min(s.index + 1, s.questions.length) + ' / ' + s.questions.length;

    if (s.mode === 'versus') {
      if ($('#vs-score-a')) $('#vs-score-a').textContent = String(s.players[0].score);
      if ($('#vs-score-b')) $('#vs-score-b').textContent = String(s.players[1].score);
      if ($('#vs-time-a')) $('#vs-time-a').textContent = t;
      if ($('#vs-time-b')) $('#vs-time-b').textContent = t;
      if ($('#vs-qnum')) $('#vs-qnum').textContent = qn;
      renderVersusCenter();
      return;
    }

    var hudTime = $('#hud-time');
    if (hudTime) {
      hudTime.textContent = t;
      hudTime.parentElement.classList.toggle('warn', s.secondsLeft <= 15);
    }
    var p = Game.currentPlayer(s);
    if ($('#hud-score')) $('#hud-score').textContent = String(p.score);
    if ($('#hud-qnum')) $('#hud-qnum').textContent = qn;
    if ($('#progress-fill')) {
      $('#progress-fill').style.width = ((s.index) / s.questions.length) * 100 + '%';
    }
  }

  function renderVersusCenter(forcePose) {
    var root = $('#vs-center-root');
    if (!root || typeof Adventure === 'undefined') return;
    var s = state.session;
    if (!s) { root.innerHTML = ''; return; }
    var pose = forcePose || state.advPose || 'idle';
    if (!forcePose && pose === 'idle') {
      var combined = Math.max(s.players[0].correct, s.players[1].correct);
      pose = Adventure.STAGES[Adventure.stageFromCorrect(combined)].action;
    }
    root.innerHTML = Adventure.renderVersusCenter({
      aCorrect: s.players[0].correct,
      bCorrect: s.players[1].correct,
      totalQ: s.questions.length,
      pose: pose
    });
  }

  function renderAdventure(forcePose) {
    var s = state.session;
    if (!s) return;
    if (s.mode === 'versus') {
      renderVersusCenter(forcePose);
      return;
    }
    var root = $('#adventure-root');
    if (!root || typeof Adventure === 'undefined') return;
    var pose = forcePose || state.advPose || 'idle';
    var p = s.players[0];
    if (!forcePose && pose === 'idle') {
      pose = Adventure.STAGES[Adventure.stageFromCorrect(p.correct)].action;
    }
    root.innerHTML = Adventure.renderStrip({
      correct: p.correct,
      totalQ: s.questions.length,
      pose: pose
    });
  }

  function readFractionFrom(prefix) {
    var wholeEl = document.getElementById(prefix + 'frac-whole');
    var numEl = document.getElementById(prefix + 'frac-num');
    var denEl = document.getElementById(prefix + 'frac-den');
    if (!numEl || !denEl) return null;
    return {
      whole: wholeEl && wholeEl.value !== '' ? wholeEl.value : 0,
      n: numEl.value,
      d: denEl.value
    };
  }

  function mountFractionInput(area, opts) {
    opts = opts || {};
    var prefix = opts.idPrefix || '';
    var onSubmit = opts.onSubmit || function () {};
    var wrap = document.createElement('div');
    wrap.className = 'frac-answer-wrap';
    wrap.innerHTML =
      '<p class="frac-answer-hint">輸入約簡分數（可選整數）</p>' +
      '<div class="frac-answer" role="group" aria-label="分數答案">' +
      '<input type="text" inputmode="numeric" class="frac-whole-input" id="' + prefix + 'frac-whole" placeholder="整" aria-label="整數" autocomplete="off"/>' +
      '<span class="frac-answer-stack">' +
      '<input type="text" inputmode="numeric" class="frac-part-input" id="' + prefix + 'frac-num" placeholder="分子" aria-label="分子" autocomplete="off"/>' +
      '<span class="frac-answer-bar" aria-hidden="true"></span>' +
      '<input type="text" inputmode="numeric" class="frac-part-input" id="' + prefix + 'frac-den" placeholder="分母" aria-label="分母" autocomplete="off"/>' +
      '</span></div>';
    var btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-submit-lg';
    btn.type = 'button';
    btn.textContent = '提交';
    btn.addEventListener('click', function () { onSubmit(readFractionFrom(prefix)); });
    wrap.appendChild(btn);
    area.appendChild(wrap);

    var pad = document.createElement('div');
    pad.className = 'numpad show';
    var active = null;
    [prefix + 'frac-whole', prefix + 'frac-num', prefix + 'frac-den'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('focus', function () { active = el; });
    });
    active = document.getElementById(prefix + 'frac-num');
    ['7','8','9','4','5','6','1','2','3','0','⌫'].forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = k;
      if (k === '0') b.className = 'wide';
      b.addEventListener('click', function () {
        SFX.click();
        if (!active) active = document.getElementById(prefix + 'frac-num');
        if (k === '⌫') active.value = active.value.slice(0, -1);
        else active.value += k;
        active.focus();
      });
      pad.appendChild(b);
    });
    area.appendChild(pad);
  }

  function mountNumericInput(area, opts) {
    opts = opts || {};
    var id = opts.inputId || 'answer-input';
    var onSubmit = opts.onSubmit || function () {};
    var textMode = opts.textMode;
    var integer = opts.integer !== false;
    var row = document.createElement('div');
    row.className = 'answer-input-row';
    var input = document.createElement('input');
    input.className = 'answer-input';
    input.id = id;
    input.type = 'text';
    input.inputMode = textMode ? 'text' : 'numeric';
    input.autocomplete = 'off';
    input.placeholder = opts.placeholder || '輸入答案';
    input.setAttribute('aria-label', '答案');
    var btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-submit-lg';
    btn.type = 'button';
    btn.textContent = '提交';
    btn.addEventListener('click', function () { onSubmit(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onSubmit(input.value);
    });
    row.appendChild(input);
    row.appendChild(btn);
    area.appendChild(row);
    if (!textMode) {
      var pad = document.createElement('div');
      pad.className = 'numpad show';
      var keys = integer ? ['7','8','9','4','5','6','1','2','3','0','⌫'] : ['7','8','9','4','5','6','1','2','3','.','0','⌫'];
      keys.forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = k;
        if (k === '0' && integer) b.className = 'wide';
        b.addEventListener('click', function () {
          SFX.click();
          if (k === '⌫') input.value = input.value.slice(0, -1);
          else input.value += k;
          input.focus();
        });
        pad.appendChild(b);
      });
      area.appendChild(pad);
    }
  }

  function mountPairInput(area, opts) {
    opts = opts || {};
    var prefix = opts.idPrefix || '';
    var onSubmit = opts.onSubmit || function () {};
    var fields = opts.fields;
    var wrap = document.createElement('div');
    wrap.className = 'pair-answer-wrap';
    var hint = document.createElement('p');
    hint.className = 'frac-answer-hint';
    hint.textContent = opts.legend || '輸入答案';
    wrap.appendChild(hint);
    var row = document.createElement('div');
    row.className = 'pair-answer';
    fields.forEach(function (f) {
      var box = document.createElement('label');
      box.className = 'pair-field';
      box.innerHTML = '<span>' + f.label + '</span>';
      var input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.id = prefix + f.key;
      input.placeholder = f.placeholder || f.label;
      input.setAttribute('aria-label', f.label);
      box.appendChild(input);
      row.appendChild(box);
    });
    wrap.appendChild(row);
    var btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-submit-lg';
    btn.type = 'button';
    btn.textContent = '提交';
    function read() {
      var raw = {};
      for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById(prefix + fields[i].key);
        if (!el || String(el.value).trim() === '') return null;
        raw[fields[i].key] = String(el.value).trim();
      }
      return raw;
    }
    btn.addEventListener('click', function () { onSubmit(read()); });
    wrap.appendChild(btn);
    area.appendChild(wrap);
    fields.forEach(function (f) {
      var el = document.getElementById(prefix + f.key);
      if (!el) return;
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') onSubmit(read());
      });
    });
    var pad = document.createElement('div');
    pad.className = 'numpad show';
    var active = document.getElementById(prefix + fields[0].key);
    fields.forEach(function (f) {
      var el = document.getElementById(prefix + f.key);
      if (el) el.addEventListener('focus', function () { active = el; });
    });
    ['7','8','9','4','5','6','1','2','3','0','⌫'].forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = k;
      if (k === '0') b.className = 'wide';
      b.addEventListener('click', function () {
        SFX.click();
        if (!active) active = document.getElementById(prefix + fields[0].key);
        if (k === '⌫') active.value = active.value.slice(0, -1);
        else active.value += k;
        active.focus();
      });
      pad.appendChild(b);
    });
    area.appendChild(pad);
  }

  function mountMultiInput(area, q, opts) {
    opts = opts || {};
    var selected = {};
    var grid = document.createElement('div');
    grid.className = 'multi-grid';
    (q.choices || []).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'multi-choice';
      b.setAttribute('aria-pressed', 'false');
      if (c.labelHtml) b.innerHTML = c.labelHtml;
      else b.textContent = c.label;
      b.addEventListener('click', function () {
        if (b.disabled) return;
        SFX.click();
        var on = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', on ? 'false' : 'true');
        b.classList.toggle('selected', !on);
        if (on) delete selected[String(c.value)];
        else selected[String(c.value)] = c.value;
      });
      grid.appendChild(b);
    });
    area.appendChild(grid);
    var btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-submit-lg';
    btn.type = 'button';
    btn.textContent = '提交';
    btn.addEventListener('click', function () {
      var vals = Object.keys(selected).map(function (k) { return selected[k]; });
      opts.onSubmit(vals, btn);
    });
    area.appendChild(btn);
  }

  function mountChoiceInput(area, q, onSubmit) {
    if (q.type === 'tf') {
      var tf = document.createElement('div');
      tf.className = 'tf-row';
      var yes = document.createElement('button');
      yes.type = 'button';
      yes.className = 'btn btn-good';
      yes.textContent = '✓ 對';
      yes.addEventListener('click', function () { onSubmit(true, yes); });
      var no = document.createElement('button');
      no.type = 'button';
      no.className = 'btn btn-bad';
      no.textContent = '✗ 錯';
      no.addEventListener('click', function () { onSubmit(false, no); });
      tf.appendChild(yes);
      tf.appendChild(no);
      area.appendChild(tf);
      return;
    }
    var grid = document.createElement('div');
    grid.className = 'choices';
    if (q.choiceLayout === 'shapes') grid.classList.add('choices--shapes');
    (q.choices || []).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice-btn';
      if (c.labelHtml) b.innerHTML = c.labelHtml;
      else b.textContent = c.label;
      b.addEventListener('click', function () { onSubmit(c.value, b); });
      grid.appendChild(b);
    });
    area.appendChild(grid);
  }

  function mountAnswerControls(area, q, opts) {
    opts = opts || {};
    var onSubmit = opts.onSubmit;
    var idPrefix = opts.idPrefix || '';
    area.innerHTML = '';
    if (q.type === 'multi') {
      mountMultiInput(area, q, { onSubmit: onSubmit });
    } else if (q.type === 'fill' && q.inputMode === 'fraction') {
      mountFractionInput(area, { idPrefix: idPrefix, onSubmit: onSubmit });
    } else if (q.type === 'fill' && q.inputMode === 'remainder') {
      mountPairInput(area, {
        idPrefix: idPrefix,
        legend: '先寫商，再寫餘數',
        fields: [
          { key: 'q', label: '商', placeholder: '商' },
          { key: 'r', label: '餘', placeholder: '餘' }
        ],
        onSubmit: onSubmit
      });
    } else if (q.type === 'fill' && q.inputMode === 'time') {
      mountPairInput(area, {
        idPrefix: idPrefix,
        legend: '24 小時報時制：輸入時和分',
        fields: [
          { key: 'h', label: '時', placeholder: '時' },
          { key: 'm', label: '分', placeholder: '分' }
        ],
        onSubmit: onSubmit
      });
    } else if (q.type === 'fill') {
      mountNumericInput(area, {
        inputId: idPrefix + 'answer-input',
        textMode: q.inputMode === 'text',
        integer: q.inputMode !== 'decimal',
        placeholder: q.placeholder || '輸入答案',
        onSubmit: onSubmit
      });
    } else {
      mountChoiceInput(area, q, onSubmit);
    }
  }

  function mountScratch(parent, opts) {
    if (typeof ScratchPad === 'undefined' || !parent) return null;
    return ScratchPad.mount(parent, opts || {});
  }

  function renderPlay() {
    var s = state.session;
    var q = Game.currentQuestion(s);
    updateHud();
    if (!q || s.finished) {
      endGame();
      return;
    }
    Game.stampQuestion(s);
    stopPace();
    paceLoop();
    if (s.mode === 'versus') {
      renderVersusPlay(q);
      return;
    }
    renderSoloPlay(q);
  }

  function setAnswerAreaEnabled(enabled) {
    $$('#answer-area button, #answer-area input').forEach(function (el) {
      if (el.id !== 'btn-next') el.disabled = !enabled;
    });
  }

  function renderGuideCard(q) {
    var s = state.session;
    var card = $('#question-card');
    var oldGuide = $('#guide-box');
    if (oldGuide) oldGuide.remove();

    var box = document.createElement('div');
    box.id = 'guide-box';
    box.className = 'guide-card';

    var g = q.guide;
    var head = '<div class="guide-card__head">🌱 小芽引導小問題</div>';

    if (!g) {
      // 舊課題未設分步引導題時，提供針對課題的具體提示與直接看解說選項
      var tip = (Game.HINTS && Game.HINTS[q.topic]) || '再細心檢查一次步驟或用算草區寫出來！';
      box.innerHTML = head +
        '<p class="guide-card__prompt">' + Frac.escape(tip) + '</p>' +
        '<div class="guide-card__actions">' +
        '<button type="button" class="btn btn-primary" id="btn-guide-retry">我明白了，再試一次</button>' +
        '<button type="button" class="btn btn-ghost" id="btn-guide-skip">睇正確答案</button>' +
        '</div>';
      card.insertBefore(box, $('#next-wrap').parentNode === card ? $('#next-wrap') : null);
      if ($('#next-wrap') && $('#next-wrap').parentNode === $('#answer-area')) {
        $('#answer-area').insertBefore(box, $('#next-wrap'));
      } else {
        card.appendChild(box);
      }

      setAnswerAreaEnabled(false);
      $('#btn-guide-retry').addEventListener('click', function () {
        SFX.click();
        box.classList.add('guide-card--done');
        setAnswerAreaEnabled(true);
        var inp = $('#answer-input');
        if (inp) { inp.value = ''; inp.focus(); }
      });
      $('#btn-guide-skip').addEventListener('click', function () {
        SFX.click();
        Game.revealAndFinishQuestion(s);
        box.innerHTML = head + '<p class="guide-card__explain">正確答案：' + formatAnswerDisplay(q.answer, q) + '</p>';
        setAnswerAreaEnabled(false);
        var nw = $('#next-wrap');
        if (nw) nw.style.display = 'block';
        updateHud();
      });
      return;
    }

    // 有結構化引導題（如新課題：圓括號、乘加乘減、三角形）
    var bodyHtml = head + '<p class="guide-card__prompt">' + g.stepPromptHtml + '</p>';
    if (g.stepType === 'mc') {
      bodyHtml += '<div class="guide-card__choices" id="guide-choices"></div>';
    } else {
      bodyHtml +=
        '<div class="guide-card__input-row">' +
        '<input type="text" inputmode="numeric" class="answer-input guide-input" id="guide-step-input" placeholder="先輸入這一步" autocomplete="off"/>' +
        '<button type="button" class="btn btn-primary" id="btn-guide-check">檢查這一步</button>' +
        '</div>';
    }
    bodyHtml += '<div class="guide-card__result" id="guide-step-result"></div>' +
      '<div class="guide-card__actions" style="margin-top:0.5rem">' +
      '<button type="button" class="btn btn-ghost" id="btn-guide-explain" style="font-size:0.85rem">直接睇解說</button>' +
      '</div>';

    box.innerHTML = bodyHtml;

    var nw = $('#next-wrap');
    if (nw && nw.parentNode) nw.parentNode.insertBefore(box, nw);
    else card.appendChild(box);

    setAnswerAreaEnabled(false);

    function showFullExplain() {
      Game.revealAndFinishQuestion(s);
      var resEl = $('#guide-step-result');
      if (resEl) {
        resEl.className = 'guide-card__result show explain';
        resEl.innerHTML = '💡 ' + g.explainHtml + '<br>正確答案：<strong>' + formatAnswerDisplay(q.answer, q) + '</strong>';
      }
      setAnswerAreaEnabled(false);
      if (nw) nw.style.display = 'block';
      updateHud();
    }

    function onStepPass() {
      SFX.correct();
      var resEl = $('#guide-step-result');
      if (resEl) {
        resEl.className = 'guide-card__result show ok';
        resEl.innerHTML = '✅ ' + g.afterHintHtml;
      }
      setAnswerAreaEnabled(true);
      var inp = $('#answer-input');
      if (inp) { inp.value = ''; inp.focus(); }
    }

    if (g.stepType === 'mc') {
      var chWrap = $('#guide-choices');
      (g.stepChoices || []).forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'choice-btn guide-choice-btn';
        b.textContent = c.label;
        b.addEventListener('click', function () {
          if (String(c.value) === String(g.stepAnswer)) {
            b.classList.add('correct');
            $$('#guide-choices button').forEach(function (x) { x.disabled = true; });
            onStepPass();
          } else {
            SFX.wrong();
            b.classList.add('wrong');
            $$('#guide-choices button').forEach(function (x) { x.disabled = true; });
            showFullExplain();
          }
        });
        chWrap.appendChild(b);
      });
    } else {
      var stepInp = $('#guide-step-input');
      var stepBtn = $('#btn-guide-check');
      function checkStep() {
        var val = global.U.parseAnswer(stepInp.value);
        if (global.U.almostEqual(val, g.stepAnswer, 0.001)) {
          stepInp.disabled = true;
          stepBtn.disabled = true;
          onStepPass();
        } else {
          SFX.wrong();
          stepInp.disabled = true;
          stepBtn.disabled = true;
          showFullExplain();
        }
      }
      stepBtn.addEventListener('click', checkStep);
      stepInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') checkStep();
      });
      setTimeout(function () { stepInp.focus(); }, 60);
    }

    $('#btn-guide-explain').addEventListener('click', function () {
      SFX.click();
      showFullExplain();
    });
  }

  function renderSoloPlay(q) {
    if (state.advPose !== 'stumble') {
      state.advPose = 'idle';
      renderAdventure();
    }
    var card = $('#question-card');
    card.classList.remove('flash-ok', 'flash-no');
    var oldGuide = $('#guide-box');
    if (oldGuide) oldGuide.remove();

    $('#feedback').className = 'feedback';
    $('#feedback').textContent = '';
    $('#q-topic').textContent = topicName(q.topic);
    $('#q-type').textContent = typeLabel(q.type);
    $('#q-body').innerHTML = q.promptHtml;

    var area = $('#answer-area');
    mountAnswerControls(area, q, {
      onSubmit: function (raw, btn) { submitSolo(raw, btn); }
    });

    var nextWrap = document.createElement('div');
    nextWrap.style.marginTop = '0.75rem';
    nextWrap.style.display = 'none';
    nextWrap.id = 'next-wrap';
    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-primary';
    nextBtn.id = 'btn-next';
    nextBtn.textContent = '下一題 →';
    nextBtn.addEventListener('click', goNext);
    nextWrap.appendChild(nextBtn);
    area.appendChild(nextWrap);

    var scratchHost = document.createElement('div');
    scratchHost.className = 'scratch-host scratch-host--solo';
    var oldScratch = card.querySelector('.scratch-host--solo');
    if (oldScratch) oldScratch.remove();
    card.appendChild(scratchHost);
    mountScratch(scratchHost, { collapsed: true, height: 180 });
  }

  function renderVersusPlay(q) {
    state.advPose = 'idle';
    renderVersusCenter();

    var tname = topicName(q.topic) + ' · ' + typeLabel(q.type);
    $('#vs-topic-a').textContent = tname;
    $('#vs-topic-b').textContent = tname;
    $('#vs-qbody-a').innerHTML = q.promptHtml;
    $('#vs-qbody-b').innerHTML = q.promptHtml;
    $('#vs-qbody-a').setAttribute('data-qid', q.id || '');
    $('#vs-qbody-b').setAttribute('data-qid', q.id || '');

    ['a', 'b'].forEach(function (side) {
      var fb = $('#vs-feedback-' + side);
      fb.className = 'vs-feedback';
      fb.textContent = '';
      var panel = $('#vs-panel-' + side);
      panel.classList.remove('locked', 'got-ok', 'got-no');
    });

    var nextBtn = $('#btn-vs-next');
    nextBtn.hidden = true;

    mountAnswerControls($('#vs-answer-a'), q, {
      idPrefix: 'a-',
      onSubmit: function (raw, btn) { submitVersusSide(0, raw, btn); }
    });
    mountAnswerControls($('#vs-answer-b'), q, {
      idPrefix: 'b-',
      onSubmit: function (raw, btn) { submitVersusSide(1, raw, btn); }
    });

    var oldSa = document.querySelector('#vs-panel-a .scratch-host--vs');
    if (oldSa) oldSa.remove();
    var oldSb = document.querySelector('#vs-panel-b .scratch-host--vs');
    if (oldSb) oldSb.remove();
    var sa = document.createElement('div');
    sa.className = 'scratch-host scratch-host--vs';
    $('#vs-panel-a .vs-panel-inner').appendChild(sa);
    mountScratch(sa, { collapsed: true, height: 180 });

    var sb = document.createElement('div');
    sb.className = 'scratch-host scratch-host--vs';
    $('#vs-panel-b .vs-panel-inner').appendChild(sb);
    mountScratch(sb, { collapsed: true, height: 180 });

    updateHud();
  }

  function submitSolo(raw, btnEl) {
    var s = state.session;
    if (!s || s.answered || s.finished) return;
    SFX.resume();
    var result = Game.submitAnswer(s, raw);
    if (!result) return;

    var card = $('#question-card');
    var fb = $('#feedback');
    fb.className = 'feedback show';
    var iconOk = Diagrams ? Diagrams.feedbackIcon(true) : '';
    var iconNo = Diagrams ? Diagrams.feedbackIcon(false) : '';
    if (state.advPoseTimer) clearTimeout(state.advPoseTimer);

    if (result.correct) {
      s.lockedElapsedMs = result.elapsedMs;
      var secs = Game.formatSeconds(result.elapsedMs);
      SFX.correct();
      card.classList.remove('flash-no');
      card.classList.add('flash-ok');
      fb.classList.add('ok');
      var stIdx = Adventure.stageFromCorrect(result.player.correct);
      var actionPose = Adventure.STAGES[stIdx].action;
      state.advPose = actionPose;
      renderAdventure(actionPose);
      if (result.pace === 'slow') {
        fb.innerHTML = iconOk + ' <span>答對了！· ' + secs + ' 秒</span>';
      } else {
        var combo = result.player.streak >= 2 ? ' · 連擊 ' + result.player.streak : '';
        fb.innerHTML = iconOk + ' <span>好快！' + secs + ' 秒' + combo + ' · ' +
          Adventure.HERO_NAME + '進入「' + Adventure.STAGES[stIdx].name + '」</span>';
      }
      if (btnEl) btnEl.classList.add('correct');
      setAnswerAreaEnabled(false);
      var nw = $('#next-wrap');
      if (nw) nw.style.display = 'block';
      updateHud();
      return;
    }

    // 答錯邏輯
    SFX.wrong();
    card.classList.remove('flash-no');
    void card.offsetWidth;
    card.classList.add('flash-no');
    fb.classList.add('no');
    state.advPose = 'stumble';
    renderAdventure('stumble');
    state.advPoseTimer = setTimeout(function () {
      state.advPose = 'idle';
      renderAdventure();
    }, 800);

    if (!result.triggerGuide && !result.finalFail) {
      // 第 1 或 第 2 次答錯：重試機會
      fb.innerHTML = iconNo + ' <span>唔啱，再試一次！（第 ' + result.attempts + '/3 次，錯 3 次會有小芽引導）</span>';
      if (btnEl) {
        btnEl.classList.add('wrong');
        setTimeout(function () { btnEl.classList.remove('wrong'); }, 550);
      }
      var inp = $('#answer-input');
      if (inp) { inp.select(); inp.focus(); }
      updateHud();
      return;
    }

    if (result.triggerGuide) {
      // 第 3 次答錯：展開小芽引導小問題
      fb.innerHTML = iconNo + ' <span>答錯 3 次了！先跟著下面的「小芽引導小問題」拆解一次吧！</span>';
      renderGuideCard(Game.currentQuestion(s));
      updateHud();
      return;
    }

    // 引導後仍答錯：結束此題並顯示正解
    s.lockedElapsedMs = result.elapsedMs;
    var q = Game.currentQuestion(s);
    var explain = (q && q.guide && q.guide.explainHtml) ? ('<br><small>' + q.guide.explainHtml + '</small>') : '';
    fb.innerHTML = iconNo + ' <span>唔啱。正確答案：' + formatAnswerDisplay(result.answer, q) + explain + '</span>';
    if (btnEl) btnEl.classList.add('wrong');
    setAnswerAreaEnabled(false);
    var nw2 = $('#next-wrap');
    if (nw2) nw2.style.display = 'block';
    updateHud();
  }

  function submitVersusSide(playerIndex, raw, btnEl) {
    var s = state.session;
    if (!s || s.finished || s.questionWon) return;
    SFX.resume();
    var result = Game.submitVersus(s, playerIndex, raw);
    if (!result) return;

    var side = playerIndex === 0 ? 'a' : 'b';
    var other = playerIndex === 0 ? 'b' : 'a';
    var fb = $('#vs-feedback-' + side);
    var panel = $('#vs-panel-' + side);
    var iconOk = Diagrams ? Diagrams.feedbackIcon(true) : '';
    var iconNo = Diagrams ? Diagrams.feedbackIcon(false) : '';

    panel.classList.add('locked');
    $$('#vs-answer-' + side + ' button, #vs-answer-' + side + ' input').forEach(function (el) {
      el.disabled = true;
    });

    if (result.correct && result.raceWon) {
      s.lockedElapsedMs = result.elapsedMs;
      SFX.correct();
      panel.classList.add('got-ok');
      fb.classList.add('ok', 'show');
      var secsWon = Game.formatSeconds(result.elapsedMs);
      if (result.pace === 'slow') {
        fb.innerHTML = iconOk + ' <span>答啱但太慢 · ' + secsWon + ' 秒</span>';
      } else {
        var comboWon = result.player.streak >= 2 ? ' · 連擊 ' + result.player.streak : '';
        fb.innerHTML = iconOk + ' <span>好快！' + secsWon + ' 秒' + comboWon +
          ' · 搶答成功 · ' + result.player.score + ' 分</span>';
      }
      if (btnEl) btnEl.classList.add('correct');

      var op = $('#vs-panel-' + other);
      op.classList.add('locked');
      $$('#vs-answer-' + other + ' button, #vs-answer-' + other + ' input').forEach(function (el) {
        el.disabled = true;
      });
      var ofb = $('#vs-feedback-' + other);
      if (!s.sideAnswered[playerIndex === 0 ? 1 : 0]) {
        ofb.classList.add('show');
        ofb.innerHTML = '<span>對手搶答成功</span>';
      }

      state.advPose = Adventure.STAGES[Adventure.stageFromCorrect(result.player.correct)].action;
      renderVersusCenter(state.advPose);
      updateHud();
      $('#btn-vs-next').hidden = true;

      if (state.advPoseTimer) clearTimeout(state.advPoseTimer);
      state.advPoseTimer = setTimeout(function () {
        goNext();
      }, result.pace === 'slow' ? 900 : 480);
      return;
    }

    SFX.wrong();
    panel.classList.add('got-no');
    fb.classList.add('no', 'show');
    fb.innerHTML = iconNo + ' <span>唔啱 · 對手仲可以搶答</span>';
    if (btnEl) btnEl.classList.add('wrong');
    state.advPose = 'stumble';
    renderVersusCenter('stumble');
    if (state.advPoseTimer) clearTimeout(state.advPoseTimer);
    state.advPoseTimer = setTimeout(function () {
      state.advPose = 'idle';
      renderVersusCenter();
    }, 600);
    updateHud();

    if (result.bothWrong) {
      s.lockedElapsedMs = result.elapsedMs;
      var reveal = formatAnswerDisplay(result.answer, Game.currentQuestion(s));
      fb.innerHTML = iconNo + ' <span>兩邊都唔啱 · 答案：' + reveal + '</span>';
      var ofb2 = $('#vs-feedback-' + other);
      ofb2.classList.add('no', 'show');
      ofb2.innerHTML = iconNo + ' <span>兩邊都唔啱 · 答案：' + reveal + '</span>';
      $('#btn-vs-next').hidden = false;
      $('#btn-vs-next').textContent = '下一題 →';
    } else {
      $('#btn-vs-next').hidden = true;
    }
  }

  function goNext() {
    SFX.click();
    var s = state.session;
    Game.next(s);
    if (s.finished) {
      endGame();
      return;
    }
    renderPlay();
  }

  function endGame() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    stopPace();
    var s = state.session;
    if (!s) return;
    s.finished = true;
    var sum = Game.summary(s);
    SFX.win();
    state.advPose = 'cheer';
    if (s.mode === 'versus') renderVersusCenter('cheer');
    else renderAdventure('cheer');

    state.lastMissedQuestions = (sum.reviews || [])
      .map(function (r) { return r.question; })
      .filter(Boolean);

    var primary = sum.players[0];
    if (s.mode === 'versus' && sum.winner != null) primary = sum.players[sum.winner];
    else if (s.mode === 'versus') {
      primary = sum.players[0].score >= sum.players[1].score ? sum.players[0] : sum.players[1];
    }
    var yard = Game.targetSeconds(s.topic, s.difficulty);
    var beforePct = Game.masteryPct(Store.topicStat(s.topic), yard);
    if (!s.isReviewMode) {
      Store.recordAnswers(s.topic, s.events || []);
    }
    var afterPct = Game.masteryPct(Store.topicStat(s.topic), yard);
    Store.recordSession({
      at: Date.now(),
      topic: s.topic,
      mode: s.mode,
      difficulty: s.difficulty,
      score: primary.score,
      correct: primary.correct,
      total: primary.total,
      players: sum.players
    });

    showScreen('screen-end');
    setPlayModeLayout('solo');
    $('#end-topic').textContent = topicName(s.topic) + ' · ' +
      (s.isReviewMode ? '錯題重練' : (s.mode === 'versus' ? '雙人對賽' : '單人')) + ' · ' +
      ({ easy: '簡易', normal: '普通', hard: '挑戰' })[s.difficulty];

    var hero = $('#end-body');
    hero.innerHTML = renderSummary(s, sum, beforePct, afterPct);

    var retryBtn = $('#btn-retry-mistakes');
    if (retryBtn) {
      if (state.lastMissedQuestions.length > 0) {
        retryBtn.hidden = false;
        retryBtn.textContent = '只練錯題 (' + state.lastMissedQuestions.length + ' 題)';
      } else {
        retryBtn.hidden = true;
      }
    }
  }

  function pctText(pct) {
    return pct == null ? '-' : (pct + '%');
  }

  function secText(ms) {
    if (ms == null) return '-';
    return Game.formatSeconds(ms) + ' 秒';
  }

  function givenText(raw) {
    if (raw == null || raw === '') return '（未填）';
    return formatAnswerDisplay(raw);
  }

  function statCards(p) {
    var acc = p.total ? Math.round(p.accuracy * 100) : 0;
    return (
      '<div class="end-grid">' +
      '<div class="end-card end-card--acc"><div class="label">準確率</div><div class="value">' + acc + '%</div></div>' +
      '<div class="end-card end-card--combo"><div class="label">最高連擊</div><div class="value">' + (p.maxStreak || 0) + '</div></div>' +
      '<div class="end-card end-card--avg"><div class="label">平均時間</div><div class="value">' + secText(p.avgMs) + '</div></div>' +
      '<div class="end-card end-card--best"><div class="label">最快</div><div class="value">' + secText(p.bestMs) + '</div></div>' +
      '</div>'
    );
  }

  function reviewList(reviews, versus) {
    if (!reviews || !reviews.length) return '<p class="review-empty">今次冇錯題，好犀利！</p>';
    return '<ul class="review-list">' + reviews.map(function (r) {
      var who = versus ? ((r.playerIndex === 0 ? '玩家 A' : '玩家 B') + ' · ') : '';
      return '<li>' +
        '<div class="review-q">' + r.promptHtml + '</div>' +
        '<div class="review-line">' + who + '你的答案：' + givenText(r.given) + '</div>' +
        '<div class="review-line">正確答案：' + (r.answerHtml || formatAnswerDisplay(r.answer)) + '</div>' +
        '<div class="review-hint">' + Frac.escape(r.hint || '') + '</div>' +
        '</li>';
    }).join('') + '</ul>';
  }

  function renderSummary(s, sum, beforePct, afterPct) {
    var beans = '';
    if (typeof Adventure !== 'undefined') {
      beans = '<div class="end-beans">' + Adventure.beanImg('boy', 'cheer', 'bean-end') +
        (s.mode === 'versus' ? Adventure.beanImg('girl', 'cheer', 'bean-end') : '') + '</div>';
    }
    var html = beans;
    html += '<p class="mastery-change">掌握度 ' + pctText(beforePct) + ' → ' + pctText(afterPct) + '</p>';
    if (s.mode === 'versus') {
      var w = sum.winner;
      html += '<div class="vs-result">';
      html += '<div class="side"><div class="pname">玩家 A</div><div class="sc" style="color:var(--player-a)">' +
        sum.players[0].score + '</div>';
      if (w === 0) html += '<div class="winner-tag">勝出</div>';
      html += statCards(sum.players[0]) + '</div>';
      html += '<div class="side"><div class="pname">玩家 B</div><div class="sc" style="color:var(--player-b)">' +
        sum.players[1].score + '</div>';
      if (w === 1) html += '<div class="winner-tag">勝出</div>';
      html += statCards(sum.players[1]) + '</div></div>';
      if (w == null) html += '<p style="text-align:center;font-weight:700">平手！</p>';
    } else {
      html += '<div class="end-hero"><div class="big-score">' + sum.players[0].score + '</div><p>得分</p></div>';
      html += statCards(sum.players[0]);
    }
    html += '<h2 class="section-title">再睇一眼</h2>' + reviewList(sum.reviews, s.mode === 'versus');
    return html;
  }

  function renderHeat() {
    var yard = Game.targetSeconds('mul', 'normal');
    var html = '<div class="heat-corner">×</div>';
    var b;
    for (b = 1; b <= 9; b++) html += '<div class="heat-head">' + b + '</div>';
    for (var a = 1; a <= 9; a++) {
      html += '<div class="heat-head">' + a + '</div>';
      for (b = 1; b <= 9; b++) {
        var stat = Store.heatStat(a + 'x' + b);
        var tone = Game.heatTone(stat, yard);
        var name = a + '×' + b;
        html += '<div class="heat-cell tone-' + tone + '" role="gridcell" title="' + name + ' ' + tone + '">' + name + '</div>';
      }
    }
    $('#heat-grid').innerHTML = html;
  }

  function bind() {
    $$('[data-topic]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        SFX.click();
        state.topic = btn.getAttribute('data-topic');
        $$('[data-topic]').forEach(function (b) { b.classList.toggle('selected', b === btn); });
      });
    });
    $$('[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        SFX.click();
        state.mode = btn.getAttribute('data-mode');
        $$('[data-mode]').forEach(function (b) { b.classList.toggle('selected', b === btn); });
      });
    });
    $$('[data-diff]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        SFX.click();
        state.difficulty = btn.getAttribute('data-diff');
        $$('[data-diff]').forEach(function (b) { b.classList.toggle('selected', b === btn); });
      });
    });

    $('#btn-start').addEventListener('click', function () {
      SFX.click();
      openBrief();
    });
    $('#btn-brief-go').addEventListener('click', function () { startGame(); });
    $('#btn-brief-back').addEventListener('click', function () {
      SFX.click();
      initHome();
    });
    $('#btn-brief-reveal').addEventListener('click', function () {
      SFX.click();
      revealBriefAnswer();
    });
    $('#btn-heat').addEventListener('click', function () {
      SFX.click();
      renderHeat();
      showScreen('screen-heat');
    });
    $('#btn-heat-back').addEventListener('click', function () {
      SFX.click();
      initHome();
    });
    $('#btn-mute').addEventListener('click', function () {
      var m = !SFX.isMuted();
      SFX.setMuted(m);
      Store.update(function (d) { d.settings.muted = m; });
      $('#btn-mute').setAttribute('aria-pressed', m ? 'true' : 'false');
      $('#btn-mute').textContent = m ? '🔇 靜音' : '🔊 音效';
    });
    $('#btn-quit').addEventListener('click', quitToHome);
    var qvs = $('#btn-quit-vs');
    if (qvs) qvs.addEventListener('click', quitToHome);
    var nvs = $('#btn-vs-next');
    if (nvs) nvs.addEventListener('click', goNext);
    $('#btn-home').addEventListener('click', initHome);
    $('#btn-rematch').addEventListener('click', function () {
      SFX.click();
      openBrief();
    });
    var retryBtn = $('#btn-retry-mistakes');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        if (state.lastMissedQuestions && state.lastMissedQuestions.length) {
          startGame(state.lastMissedQuestions);
        }
      });
    }
    $('#btn-reset-progress').addEventListener('click', function () {
      if (confirm('確定清除所有本機進度？')) {
        localStorage.removeItem(Store.KEY);
        initHome();
      }
    });
    document.addEventListener('pointerdown', function once() {
      SFX.resume();
      document.removeEventListener('pointerdown', once);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    bindVersusOrientation();
    initHome();
  });
})();
