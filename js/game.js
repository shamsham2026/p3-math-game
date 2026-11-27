/**
 * Game session state machine.
 * - Versus = simultaneous race (same question, independent answers).
 * - Solo = supports 3-wrong-answer scaffolding ("答錯三次觸發引導性問題").
 */
(function (global) {
  'use strict';

  var TARGET_SEC = {
    mul: 8,
    div: 10,
    brackets: 12,
    muladd: 12,
    weight: 12,
    time24: 10,
    parallel: 8,
    para: 10,
    triangle: 10
  };

  var HINTS = {
    mul: '用直式對齊數位，記得進位。',
    div: '除數是一位數；餘數一定細過除數。',
    brackets: '見到圓括號 ( )，一定要先算括號入面的部分！',
    muladd: '乘加、乘減混合計算要「先乘後加減」，唔好由左至右亂算！',
    weight: '1 公斤 = 1000 克，先換成同一單位再比較。',
    time24: '下午加 12；午夜是 00:00，正午是 12:00。',
    parallel: '平行線不相交，而且距離處處相等。',
    para: '兩組對邊分別平行。正方形同長方形都係平行四邊形。',
    triangle: '先睇邊長有幾多條相等，再睇有冇直角符號。'
  };

  function targetSeconds(topic, difficulty) {
    var base = TARGET_SEC[topic] || 10;
    var scale = difficulty === 'easy' ? 1.3 : (difficulty === 'hard' ? 0.75 : 1);
    return Math.max(3, Math.round(base * scale * 10) / 10);
  }

  function targetMs(topic, difficulty) {
    return Math.round(targetSeconds(topic, difficulty) * 1000);
  }

  function blankPlayer(name) {
    return {
      name: name,
      score: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      maxStreak: 0,
      fastCount: 0,
      timesMs: []
    };
  }

  function createSession(opts) {
    opts = opts || {};
    var topic = opts.topic || 'mixed';
    var mode = opts.mode || 'solo'; // solo | versus
    var diff = opts.difficulty || 'normal';
    var count = opts.questionsPerRound || 10;
    var seconds = opts.secondsPerRound || 180;
    if (diff === 'easy') seconds = Math.round(seconds * 1.25);
    if (diff === 'hard') seconds = Math.round(seconds * 0.85);

    var questions = Array.isArray(opts.customQuestions) && opts.customQuestions.length
      ? opts.customQuestions.slice()
      : global.Topics.generateRound(topic, count, diff);

    return {
      topic: topic,
      mode: mode,
      difficulty: diff,
      isReviewMode: !!(opts.customQuestions && opts.customQuestions.length),
      questions: questions,
      index: 0,
      secondsTotal: seconds,
      secondsLeft: seconds,
      players: mode === 'versus'
        ? [blankPlayer('玩家 A'), blankPlayer('玩家 B')]
        : [blankPlayer('你')],
      currentPlayer: 0,
      answered: false,
      wrongAttempts: 0,
      pacePaused: false,
      guideTriggered: false,
      sideAnswered: [false, false],
      sideCorrect: [null, null],
      questionWon: false,
      finished: false,
      lastCorrect: null,
      questionStartedAt: Date.now(),
      reviews: []
    };
  }

  function stampQuestion(session) {
    session.questionStartedAt = Date.now();
    session.lockedElapsedMs = null;
    session.wrongAttempts = 0;
    session.pacePaused = false;
    session.guideTriggered = false;
    return session;
  }

  function elapsedMs(session) {
    if (!session.questionStartedAt) return 0;
    return Math.max(0, Date.now() - session.questionStartedAt);
  }

  function currentQuestion(session) {
    return session.questions[session.index] || null;
  }

  function currentPlayer(session) {
    return session.players[session.currentPlayer];
  }

  function scoreFor(correct, streak, secondsLeft, secondsTotal, speedBonus) {
    if (!correct) return 0;
    var base = 100;
    var streakBonus = Math.min(streak, 5) * 20;
    var timeBonus = Math.round(50 * (secondsLeft / secondsTotal));
    return base + streakBonus + timeBonus + (speedBonus || 0);
  }

  function evaluateRaw(q, raw) {
    if (q.type === 'tf') {
      return q.accept(raw === true || raw === 'true' || raw === '對' || raw === 1);
    }
    if (q.type === 'mc' || q.type === 'compare' || q.type === 'multi') return q.accept(raw);
    if (q.inputMode === 'fraction' || q.inputMode === 'text' ||
        q.inputMode === 'remainder' || q.inputMode === 'time') {
      return q.accept(raw);
    }
    return q.accept(global.U.parseAnswer(raw));
  }

  function tablePairs(q) {
    if (!q || !q.meta) return [];
    if (q.meta.kind === 'missing' || q.meta.kind === 'estimate') return [];
    if (q.meta.kind === 'table' && q.meta.table && q.meta.table.length === 2) {
      return [q.meta.table.slice()];
    }
    var factors = q.meta.factors;
    if (factors && factors.length === 2 && q.answer === factors[0] * factors[1] &&
        factors[0] >= 1 && factors[0] <= 9 && factors[1] >= 1 && factors[1] <= 9) {
      return [factors.slice()];
    }
    return [];
  }

  function formatSeconds(ms) {
    return (Math.max(0, ms) / 1000).toFixed(1);
  }

  function recordReview(session, player, q, raw) {
    // 避免同一題重試多次重複寫入錯題列表
    var exists = session.reviews.some(function (r) {
      return r.index === session.index && r.playerIndex === session.players.indexOf(player);
    });
    if (exists) return;
    session.reviews.push({
      index: session.index,
      topic: q.topic,
      playerIndex: session.players.indexOf(player),
      question: q,
      promptHtml: q.promptHtml,
      given: raw,
      answer: q.answer,
      answerHtml: q.answerHtml || '',
      hint: (q.guide && q.guide.explainHtml)
        ? q.guide.explainHtml.replace(/<[^>]+>/g, '')
        : (HINTS[q.topic] || '再睇一次題目。'),
      pairs: tablePairs(q)
    });
  }

  function grade(session, player, q, raw, ok, speedBonus) {
    var ms = elapsedMs(session);
    var limit = targetMs(session.topic, session.difficulty);
    // 若曾答錯重試或觸發引導題，不計入快速連擊
    var hadRetry = session.wrongAttempts > 0 || session.guideTriggered;
    var pace = ok ? ((ms <= limit && !hadRetry) ? 'fast' : 'slow') : 'wrong';
    var fastBonus = 0;
    var comboExtra = 0;
    var raceBonus = 0;
    player.timesMs.push(ms);
    if (!session.events) session.events = [];
    session.events.push({
      ok: !!ok,
      fast: pace === 'fast',
      ms: ms,
      pairs: tablePairs(q),
      playerIndex: session.players.indexOf(player)
    });
    if (ok) {
      player.correct += 1;
      if (pace === 'fast') {
        player.streak += 1;
        player.fastCount += 1;
        if (player.streak > player.maxStreak) player.maxStreak = player.streak;
        fastBonus = 2;
        comboExtra = player.streak >= 3 ? 1 : 0;
        raceBonus = speedBonus || 0;
      } else if (player.streak > player.maxStreak) {
        player.maxStreak = player.streak;
      }
      var streakForScore = pace === 'fast' ? player.streak : 0;
      player.score += scoreFor(true, streakForScore, session.secondsLeft, session.secondsTotal, raceBonus) + fastBonus + comboExtra;
    } else {
      player.wrong += 1;
      player.streak = 0;
      recordReview(session, player, q, raw);
    }
    return {
      pace: pace,
      elapsedMs: ms,
      targetMs: limit,
      fastBonus: fastBonus,
      comboExtra: comboExtra,
      speedBonus: raceBonus,
      pairs: tablePairs(q)
    };
  }

  /**
   * Solo: 答錯第 1、2 次允許重試；第 3 次答錯觸發「引導性問題」並暫停目標計時條。
   */
  function submitAnswer(session, raw) {
    if (session.mode === 'versus') {
      return submitVersus(session, session.currentPlayer, raw);
    }
    if (session.finished || session.answered) return null;
    var q = currentQuestion(session);
    if (!q) return null;
    var ok = evaluateRaw(q, raw);
    var p = currentPlayer(session);

    if (ok) {
      session.answered = true;
      session.lastCorrect = true;
      var gradedOk = grade(session, p, q, raw, true, 0);
      return {
        correct: true,
        answer: q.answer,
        player: p,
        playerIndex: session.currentPlayer,
        attempts: session.wrongAttempts,
        triggerGuide: false,
        pace: gradedOk.pace,
        elapsedMs: gradedOk.elapsedMs,
        targetMs: gradedOk.targetMs,
        fastBonus: gradedOk.fastBonus,
        comboExtra: gradedOk.comboExtra,
        pairs: gradedOk.pairs
      };
    }

    // 答錯處理
    session.wrongAttempts += 1;
    session.lastCorrect = false;
    p.streak = 0;

    if (session.wrongAttempts < 3) {
      // 第 1、2 次答錯：記錄錯題預覽但不鎖題，讓學生再試
      recordReview(session, p, q, raw);
      return {
        correct: false,
        answer: q.answer,
        player: p,
        playerIndex: session.currentPlayer,
        attempts: session.wrongAttempts,
        remainingAttempts: 3 - session.wrongAttempts,
        triggerGuide: false,
        finalFail: false,
        pace: 'wrong',
        elapsedMs: elapsedMs(session),
        targetMs: targetMs(session.topic, session.difficulty),
        fastBonus: 0,
        comboExtra: 0,
        pairs: tablePairs(q)
      };
    }

    if (session.wrongAttempts === 3 && !session.guideTriggered) {
      // 第 3 次答錯：觸發引導性問題，暫停目標計時條
      session.guideTriggered = true;
      session.pacePaused = true;
      recordReview(session, p, q, raw);
      return {
        correct: false,
        answer: q.answer,
        player: p,
        playerIndex: session.currentPlayer,
        attempts: session.wrongAttempts,
        remainingAttempts: 0,
        triggerGuide: true,
        finalFail: false,
        pace: 'wrong',
        elapsedMs: elapsedMs(session),
        targetMs: targetMs(session.topic, session.difficulty),
        fastBonus: 0,
        comboExtra: 0,
        pairs: tablePairs(q)
      };
    }

    // 引導後再次答錯：結束此題並顯示正解
    session.answered = true;
    var gradedFail = grade(session, p, q, raw, false, 0);
    return {
      correct: false,
      answer: q.answer,
      player: p,
      playerIndex: session.currentPlayer,
      attempts: session.wrongAttempts,
      remainingAttempts: 0,
      triggerGuide: false,
      finalFail: true,
      pace: gradedFail.pace,
      elapsedMs: gradedFail.elapsedMs,
      targetMs: gradedFail.targetMs,
      fastBonus: 0,
      comboExtra: 0,
      pairs: gradedFail.pairs
    };
  }

  function revealAndFinishQuestion(session) {
    if (!session || session.answered) return;
    var q = currentQuestion(session);
    var p = currentPlayer(session);
    session.answered = true;
    session.lastCorrect = false;
    p.wrong += 1;
    p.streak = 0;
    if (q) recordReview(session, p, q, '');
  }

  function submitVersus(session, playerIndex, raw) {
    if (session.finished) return null;
    if (session.questionWon) return null;
    if (session.sideAnswered[playerIndex]) return null;
    var q = currentQuestion(session);
    if (!q) return null;

    var ok = evaluateRaw(q, raw);
    var p = session.players[playerIndex];
    var raceWon = false;
    var graded = null;

    if (ok) {
      session.sideAnswered[playerIndex] = true;
      session.sideCorrect[playerIndex] = true;
      session.questionWon = true;
      session.answered = true;
      raceWon = true;
      graded = grade(session, p, q, raw, true, 30);
    } else {
      session.sideAnswered[playerIndex] = true;
      session.sideCorrect[playerIndex] = false;
      graded = grade(session, p, q, raw, false, 0);
    }

    session.lastCorrect = ok;
    var bothWrong = session.sideAnswered[0] && session.sideAnswered[1] &&
      session.sideCorrect[0] === false && session.sideCorrect[1] === false;

    return {
      correct: ok,
      answer: q.answer,
      player: p,
      playerIndex: playerIndex,
      speedBonus: graded.speedBonus,
      raceWon: raceWon,
      bothWrong: bothWrong,
      pace: graded.pace,
      elapsedMs: graded.elapsedMs,
      targetMs: graded.targetMs,
      fastBonus: graded.fastBonus,
      comboExtra: graded.comboExtra,
      pairs: graded.pairs
    };
  }

  function bothSidesDone(session) {
    return !!session.questionWon ||
      (session.sideAnswered[0] && session.sideAnswered[1]);
  }

  function next(session) {
    if (session.finished) return session;
    session.answered = false;
    session.lastCorrect = null;
    session.wrongAttempts = 0;
    session.pacePaused = false;
    session.guideTriggered = false;
    session.sideAnswered = [false, false];
    session.sideCorrect = [null, null];
    session.questionWon = false;
    session.index += 1;
    session.currentPlayer = 0;
    session.questionStartedAt = Date.now();

    if (session.index >= session.questions.length) {
      session.finished = true;
    }
    return session;
  }

  function timeStats(times) {
    if (!times || !times.length) return { avgMs: null, bestMs: null };
    var sum = 0;
    var best = times[0];
    for (var i = 0; i < times.length; i++) {
      sum += times[i];
      if (times[i] < best) best = times[i];
    }
    return { avgMs: sum / times.length, bestMs: best };
  }

  function masteryPct(stat, targetSec) {
    if (!stat || !stat.attempts) return null;
    var acc = stat.correct / stat.attempts;
    var fast = stat.fastCorrect / Math.max(stat.correct, 1);
    var avgSec = (stat.sumTimeMs / stat.attempts) / 1000;
    var yard = targetSec || 10;
    var timePart = 1 - Math.min(1, avgSec / yard);
    var pct = Math.round(40 * acc + 40 * fast + 20 * timePart);
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    return pct;
  }

  function heatTone(stat, targetSec) {
    if (!stat || !stat.attempts) return 'none';
    var wrong = stat.attempts - stat.correct;
    if (wrong > stat.correct) return 'bad';
    var avgSec = (stat.sumTimeMs / stat.attempts) / 1000;
    var yard = targetSec || 8;
    var fastRatio = stat.fastCorrect / Math.max(stat.correct, 1);
    if (stat.correct > 0 && stat.fastCorrect === stat.correct && stat.attempts >= 2 && avgSec <= yard * 0.6) {
      return 'blazing';
    }
    if (fastRatio >= 0.5 && avgSec <= yard) return 'good';
    return 'slow';
  }

  function masteryBand(pct) {
    if (pct == null) return { id: 'none', label: '未做' };
    if (pct < 40) return { id: 'new', label: '未熟' };
    if (pct < 60) return { id: 'slow', label: '慢' };
    if (pct < 85) return { id: 'good', label: '熟' };
    return { id: 'hot', label: '極熟' };
  }

  function tick(session) {
    if (session.finished || session.secondsLeft <= 0) {
      session.secondsLeft = 0;
      session.finished = true;
      return session;
    }
    session.secondsLeft -= 1;
    if (session.secondsLeft <= 0) {
      session.secondsLeft = 0;
      session.finished = true;
    }
    return session;
  }

  function summary(session) {
    var attempted = session.players.reduce(function (s, p) { return s + p.correct + p.wrong; }, 0);
    return {
      topic: session.topic,
      mode: session.mode,
      difficulty: session.difficulty,
      players: session.players.map(function (p) {
        var ts = timeStats(p.timesMs);
        return {
          name: p.name,
          score: p.score,
          correct: p.correct,
          wrong: p.wrong,
          total: p.correct + p.wrong,
          accuracy: (p.correct + p.wrong) ? p.correct / (p.correct + p.wrong) : 0,
          maxStreak: p.maxStreak || 0,
          fastCount: p.fastCount || 0,
          avgMs: ts.avgMs,
          bestMs: ts.bestMs
        };
      }),
      reviews: session.reviews || [],
      attempted: attempted,
      timeUsed: session.secondsTotal - session.secondsLeft,
      winner: session.mode === 'versus'
        ? (session.players[0].score === session.players[1].score
          ? null
          : (session.players[0].score > session.players[1].score ? 0 : 1))
        : 0
    };
  }

  global.Game = {
    createSession: createSession,
    currentQuestion: currentQuestion,
    currentPlayer: currentPlayer,
    submitAnswer: submitAnswer,
    revealAndFinishQuestion: revealAndFinishQuestion,
    submitVersus: submitVersus,
    bothSidesDone: bothSidesDone,
    next: next,
    tick: tick,
    summary: summary,
    scoreFor: scoreFor,
    stampQuestion: stampQuestion,
    targetSeconds: targetSeconds,
    targetMs: targetMs,
    masteryPct: masteryPct,
    heatTone: heatTone,
    masteryBand: masteryBand,
    tablePairs: tablePairs,
    formatSeconds: formatSeconds,
    TARGET_SEC: TARGET_SEC,
    HINTS: HINTS
  };
})(typeof window !== 'undefined' ? window : globalThis);
