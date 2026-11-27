/**
 * 算草區 — touch/stylus canvas scratch pad (no backend).
 */
(function (global) {
  'use strict';

  function attach(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var drawing = false;
    var last = null;
    var ratio = 1;
    var stroke = opts.strokeStyle || '#0f2942';
    var width = opts.lineWidth || 6;
    var lastCssW = 0;
    var lastCssH = 0;

    function applyPen() {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.round(rect.width);
      var h = Math.round(rect.height);
      if (w < 40 || h < 40) return;
      if (w === lastCssW && h === lastCssH && canvas.width > 0) return;
      var nextRatio = Math.min(window.devicePixelRatio || 1, 3);
      var prev = null;
      if (canvas.width > 0 && canvas.height > 0 && lastCssW > 0) {
        prev = document.createElement('canvas');
        prev.width = canvas.width;
        prev.height = canvas.height;
        prev.getContext('2d').drawImage(canvas, 0, 0);
      }
      var oldRatio = ratio || 1;
      ratio = nextRatio;
      lastCssW = w;
      lastCssH = h;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      applyPen();
      if (prev) {
        ctx.save();
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.drawImage(prev, 0, 0, prev.width / oldRatio, prev.height / oldRatio);
        ctx.restore();
        applyPen();
      }
    }

    function pos(e) {
      var rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function start(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      resize();
      drawing = true;
      last = pos(e);
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }
    function end(e) {
      if (e) e.preventDefault();
      drawing = false;
      last = null;
    }

    function clear() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      applyPen();
    }

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    if (typeof ResizeObserver !== 'undefined') {
      var observer = new ResizeObserver(function () { resize(); });
      observer.observe(canvas);
    }
    resize();
    return { clear: clear, resize: resize, lineWidth: width };
  }

  function ancestorRotated(el) {
    var node = el;
    while (node && node !== document.body) {
      var t = window.getComputedStyle(node).transform;
      if (t && t !== 'none') {
        var m = t.match(/matrix\(([^)]+)\)/);
        if (m) {
          var a = parseFloat(m[1].split(',')[0]);
          if (a < 0) return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  /** Build a scratch UI into parent. collapsed starts folded. height is the open canvas height in px. */
  function mount(parent, opts) {
    opts = opts || {};
    var openHeight = opts.height || 180;
    var wrap = document.createElement('div');
    wrap.className = 'scratch-pad' + (opts.compact ? ' scratch-pad--compact' : '');
    wrap.innerHTML =
      '<div class="scratch-toolbar">' +
      '<span class="scratch-label">算草區</span>' +
      '<button type="button" class="scratch-resize">拖高</button>' +
      '<button type="button" class="scratch-clear">清除</button>' +
      '</div>' +
      '<canvas class="scratch-canvas" aria-label="算草區畫布"></canvas>';
    if (opts.collapsed) wrap.classList.add('is-collapsed');
    parent.appendChild(wrap);
    var canvas = wrap.querySelector('.scratch-canvas');
    canvas.style.height = openHeight + 'px';
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'scratch-toggle';
    toggle.textContent = opts.collapsed ? '展開算草' : '收起';
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      wrap.classList.toggle('is-collapsed');
      var folded = wrap.classList.contains('is-collapsed');
      toggle.textContent = folded ? '展開算草' : '收起';
      if (typeof SFX !== 'undefined') SFX.click();
      if (!folded) {
        canvas.style.height = Math.max(openHeight, canvas.getBoundingClientRect().height || 0) + 'px';
        requestAnimationFrame(function () { api.resize(); });
      }
    });
    wrap.querySelector('.scratch-toolbar').insertBefore(toggle, wrap.querySelector('.scratch-resize'));
    var grip = wrap.querySelector('.scratch-resize');
    var dragging = false;
    var startY = 0;
    var startH = 0;
    var flipped = false;
    grip.addEventListener('pointerdown', function (e) {
      if (wrap.classList.contains('is-collapsed')) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      flipped = ancestorRotated(canvas);
      startY = e.clientY;
      startH = canvas.getBoundingClientRect().height;
      if (grip.setPointerCapture) grip.setPointerCapture(e.pointerId);
    });
    grip.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var delta = e.clientY - startY;
      if (flipped) delta = -delta;
      var next = Math.round(Math.max(150, Math.min(420, startH + delta)));
      canvas.style.height = next + 'px';
    });
    function stopDrag() { dragging = false; }
    grip.addEventListener('pointerup', stopDrag);
    grip.addEventListener('pointercancel', stopDrag);
    var api = attach(canvas, opts);
    wrap.querySelector('.scratch-clear').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      api.clear();
      if (typeof SFX !== 'undefined') SFX.click();
    });
    // defer resize after layout
    canvas._scratch = api;
    setTimeout(function () { api.resize(); }, 30);
    setTimeout(function () { api.resize(); }, 200);
    return api;
  }

  global.ScratchPad = { attach: attach, mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
