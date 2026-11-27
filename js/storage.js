/**
 * localStorage progress persistence.
 */
(function (global) {
  'use strict';

  var KEY = 'p3-math-arena-v1';

  function defaults() {
    return {
      bestScores: {},
      bestAccuracy: {},
      totalPlayed: 0,
      totalCorrect: 0,
      unlockedTopics: ['mul', 'div', 'weight', 'time24', 'parallel', 'para'],
      lastSession: null,
      settings: { muted: false, difficulty: 'normal', questionsPerRound: 10, secondsPerRound: 180 },
      history: [],
      mastery: {},
      mulHeat: {}
    };
  }

  function emptyStat() {
    return { attempts: 0, correct: 0, fastCorrect: 0, sumTimeMs: 0 };
  }

  function addStat(bucket, ev) {
    bucket.attempts += 1;
    if (ev.ok) bucket.correct += 1;
    if (ev.fast) bucket.fastCorrect += 1;
    bucket.sumTimeMs += ev.ms || 0;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      var data = JSON.parse(raw);
      var d = defaults();
      var merged = Object.assign(d, data, {
        settings: Object.assign(d.settings, data.settings || {}),
        bestScores: Object.assign({}, d.bestScores, data.bestScores || {}),
        bestAccuracy: Object.assign({}, d.bestAccuracy, data.bestAccuracy || {}),
        mastery: Object.assign({}, d.mastery, data.mastery || {}),
        mulHeat: Object.assign({}, d.mulHeat, data.mulHeat || {})
      });
      // 舊版預設 120 秒係寫死嘅出廠值，冇得畀用家自己揀，舊機一律跟新預設 180 秒。
      if (merged.settings.secondsPerRound === 120) merged.settings.secondsPerRound = 180;
      return merged;
    } catch (e) {
      return defaults();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* quota */ }
  }

  function update(fn) {
    var data = load();
    fn(data);
    save(data);
    return data;
  }

  function recordSession(session) {
    return update(function (data) {
      data.totalPlayed += 1;
      data.totalCorrect += session.correct || 0;
      data.lastSession = session;
      var topic = session.topic;
      var score = session.score || 0;
      if (!data.bestScores[topic] || score > data.bestScores[topic]) {
        data.bestScores[topic] = score;
      }
      var acc = session.total ? session.correct / session.total : 0;
      if (!data.bestAccuracy[topic] || acc > data.bestAccuracy[topic]) {
        data.bestAccuracy[topic] = acc;
      }
      data.history.unshift({
        at: Date.now(),
        topic: topic,
        mode: session.mode,
        score: score,
        correct: session.correct,
        total: session.total,
        difficulty: session.difficulty
      });
      if (data.history.length > 30) data.history.length = 30;
    });
  }

  function topicStat(topic) {
    var data = load();
    var stat = data.mastery[topic];
    return stat ? {
      attempts: stat.attempts || 0,
      correct: stat.correct || 0,
      fastCorrect: stat.fastCorrect || 0,
      sumTimeMs: stat.sumTimeMs || 0
    } : emptyStat();
  }

  function heatStat(key) {
    var data = load();
    var stat = data.mulHeat[key];
    return stat ? {
      attempts: stat.attempts || 0,
      correct: stat.correct || 0,
      fastCorrect: stat.fastCorrect || 0,
      sumTimeMs: stat.sumTimeMs || 0
    } : emptyStat();
  }

  /** events: [{ ok, fast, ms, pairs:[[a,b]] }] for one topic */
  function recordAnswers(topic, events) {
    return update(function (data) {
      if (!data.mastery[topic]) data.mastery[topic] = emptyStat();
      (events || []).forEach(function (ev) {
        addStat(data.mastery[topic], ev);
        (ev.pairs || []).forEach(function (pair) {
          if (!pair || pair.length < 2) return;
          var key = pair[0] + 'x' + pair[1];
          if (!data.mulHeat[key]) data.mulHeat[key] = emptyStat();
          addStat(data.mulHeat[key], ev);
        });
      });
    });
  }

  global.Store = {
    load: load,
    save: save,
    update: update,
    recordSession: recordSession,
    recordAnswers: recordAnswers,
    topicStat: topicStat,
    heatStat: heatStat,
    emptyStat: emptyStat,
    KEY: KEY
  };
})(typeof window !== 'undefined' ? window : globalThis);
