/**
 * Topic icons and question diagrams (weight, time, parallel lines, quadrilaterals, triangles).
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function iconSvg(inner) {
    return (
      '<span class="topic-icon" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="topic-icon-svg">' +
      inner +
      '</svg></span>'
    );
  }

  var ICONS = {
    mul:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<path d="M16 16 L32 32 M32 16 L16 32" class="ti-cross"/>',
    div:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<circle cx="24" cy="14" r="2.2" class="ti-dot"/>' +
      '<line x1="12" y1="24" x2="36" y2="24" class="ti-cross"/>' +
      '<circle cx="24" cy="34" r="2.2" class="ti-dot"/>',
    brackets:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<text x="24" y="30" text-anchor="middle" class="ti-tiny" style="font-size:18px;font-weight:800">( )</text>',
    muladd:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<path d="M12 18 L20 26 M20 18 L12 26" class="ti-cross"/>' +
      '<path d="M31 17 L31 27 M26 22 L36 22" class="ti-cross"/>',
    weight:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<polygon points="24,12 20,20 28,20" class="ti-shape"/>' +
      '<line x1="10" y1="22" x2="38" y2="22" class="ti-cross"/>' +
      '<path d="M10 22 L6 32 L16 32 Z" class="ti-shape"/>' +
      '<path d="M38 22 L32 32 L42 32 Z" class="ti-shape"/>',
    time24:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<circle cx="24" cy="24" r="12" class="ti-shape" fill="none"/>' +
      '<line x1="24" y1="24" x2="24" y2="16" class="ti-cross"/>' +
      '<line x1="24" y1="24" x2="30" y2="26" class="ti-cross"/>' +
      '<text x="24" y="42" text-anchor="middle" class="ti-tiny">24</text>',
    parallel:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<line x1="12" y1="18" x2="36" y2="18" class="ti-cross"/>' +
      '<line x1="12" y1="30" x2="36" y2="30" class="ti-cross"/>' +
      '<path d="M20 18 l3 -3 l0 6 z" class="ti-bar"/>' +
      '<path d="M20 30 l3 -3 l0 6 z" class="ti-bar"/>',
    para:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<polygon points="14,32 30,32 36,16 20,16" class="ti-shape"/>',
    triangle:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<polygon points="24,12 12,34 36,34" class="ti-shape"/>'
  };

  function topicIcon(id) {
    return iconSvg(ICONS[id] || ICONS.mul);
  }

  function feedbackIcon(ok) {
    if (ok) {
      return (
        '<span class="fb-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 32 32" class="fb-svg">' +
        '<circle cx="16" cy="16" r="15" class="fb-circle ok"/>' +
        '<path d="M9 16.5 L14 21.5 L23 11" class="fb-check" fill="none"/>' +
        '</svg></span>'
      );
    }
    return (
      '<span class="fb-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 32 32" class="fb-svg">' +
      '<circle cx="16" cy="16" r="15" class="fb-circle no"/>' +
      '<path d="M11 11 L21 21 M21 11 L11 21" class="fb-cross" fill="none"/>' +
      '</svg></span>'
    );
  }

  function pad2(n) {
    return global.U ? global.U.pad2(n) : (n < 10 ? '0' : '') + n;
  }

  function timeDigital(h, m) {
    var t = pad2(h) + ':' + pad2(m);
    return '<span class="time-digital" role="math" aria-label="' + esc(t) + '">' + esc(t) + '</span>';
  }

  function timeStack(h, m) {
    var hh = pad2(h);
    var mm = pad2(m);
    return (
      '<span class="time-stack" role="math" aria-label="' + esc(hh + ' 時 ' + mm + ' 分') + '">' +
      '<span class="time-stack__pair"><span class="time-stack__num">' + esc(hh) + '</span>' +
      '<span class="time-stack__lab">時</span></span>' +
      '<span class="time-stack__pair"><span class="time-stack__num">' + esc(mm) + '</span>' +
      '<span class="time-stack__lab">分</span></span>' +
      '</span>'
    );
  }

  function wrap(svg, aria, cls) {
    return '<div class="q-diagram' + (cls ? ' ' + cls : '') + '">' +
      '<svg viewBox="0 0 320 168" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(aria || '圖') + '">' +
      svg + '</svg></div>';
  }

  function verticalMul(a, b) {
    var width = Math.max(String(a).length, String(b).length + 1);
    function row(s, op) {
      var t = String(s);
      while (t.length < width) t = ' ' + t;
      return '<div class="vcalc__row">' + (op ? '<span class="vcalc__op">' + op + '</span>' : '') + esc(t) + '</div>';
    }
    return '<div class="vcalc" aria-label="' + esc(a + ' 乘 ' + b) + '">' +
      row(a) + row(b, '×') + '<div class="vcalc__bar"></div></div>';
  }

  function divBracket(divisor, dividend) {
    return '<div class="dcalc" aria-label="' + esc(dividend + ' 除以 ' + divisor) + '">' +
      '<span class="dcalc__div">' + esc(divisor) + '</span>' +
      '<span class="dcalc__box">' + esc(dividend) + '</span></div>';
  }

  function analogClock(h24, m) {
    var cx = 160, cy = 86, r = 62;
    var h = ((h24 % 24) % 12);
    var ha = (h * 30 + m * 0.5);
    var ma = m * 6;
    function tip(len, ang) {
      var a = (ang - 90) * Math.PI / 180;
      return Math.round(cx + len * Math.cos(a)) + ' ' + Math.round(cy + len * Math.sin(a));
    }
    var ticks = '';
    for (var i = 0; i < 12; i++) {
      var inner = i % 3 === 0 ? r - 12 : r - 7;
      ticks += '<line x1="' + tip(inner, i * 30).split(' ')[0] + '" y1="' + tip(inner, i * 30).split(' ')[1] +
        '" x2="' + tip(r - 2, i * 30).split(' ')[0] + '" y2="' + tip(r - 2, i * 30).split(' ')[1] +
        '" stroke="#0369a1" stroke-width="' + (i % 3 === 0 ? 3 : 2) + '"/>';
    }
    function numAt(n, ang) {
      var p = tip(r - 24, ang).split(' ');
      return '<text x="' + p[0] + '" y="' + (Number(p[1]) + 4) + '" text-anchor="middle" class="clock-num">' + n + '</text>';
    }
    var face =
      '<circle cx="160" cy="86" r="70" class="clock-face"/>' +
      '<circle cx="160" cy="86" r="66" fill="none" stroke="#0284c7" stroke-width="3"/>' +
      ticks +
      numAt(12, 0) + numAt(3, 90) + numAt(6, 180) + numAt(9, 270) +
      '<line x1="160" y1="86" x2="' + tip(28, ha).split(' ')[0] + '" y2="' + tip(28, ha).split(' ')[1] + '" class="clock-hour"/>' +
      '<line x1="160" y1="86" x2="' + tip(46, ma).split(' ')[0] + '" y2="' + tip(46, ma).split(' ')[1] + '" class="clock-min"/>' +
      '<circle cx="160" cy="86" r="4" fill="#0f2942"/>';
    return wrap(face, '時鐘', 'q-diagram--clock');
  }

  function digitalFace(h, m) {
    var t = pad2(h) + ':' + pad2(m);
    var svg =
      '<rect x="70" y="36" width="180" height="96" rx="16" class="lcd-body"/>' +
      '<text x="160" y="100" text-anchor="middle" class="lcd-text">' + esc(t) + '</text>';
    return wrap(svg, '電子鐘 ' + t, 'q-diagram--lcd');
  }

  function balance(leftText, rightText, tilt) {
    var angle = tilt === 'left' ? -8 : tilt === 'right' ? 8 : 0;
    var qMark = tilt === 'ask' ? '<text x="160" y="28" text-anchor="middle" class="bal-q">?</text>' : '';
    var svg =
      qMark +
      '<polygon points="160,108 146,132 174,132" class="bal-base"/>' +
      '<rect x="154" y="78" width="12" height="36" class="bal-stand"/>' +
      '<g transform="rotate(' + angle + ' 160 78)">' +
      '<rect x="48" y="72" width="224" height="8" rx="4" class="bal-beam"/>' +
      '<line x1="70" y1="80" x2="70" y2="108" class="bal-string"/>' +
      '<line x1="250" y1="80" x2="250" y2="108" class="bal-string"/>' +
      '<path d="M40 108 h60 l-8 22 h-44 z" class="bal-pan"/>' +
      '<path d="M220 108 h60 l-8 22 h-44 z" class="bal-pan"/>' +
      '</g>' +
      '<text x="70" y="158" text-anchor="middle" class="bal-label">' + esc(leftText) + '</text>' +
      '<text x="250" y="158" text-anchor="middle" class="bal-label">' + esc(rightText) + '</text>';
    var aria = '天平，左邊 ' + leftText + '，右邊 ' + rightText;
    return wrap(svg, aria, 'q-diagram--balance');
  }

  function scale(value, max, step, unitLabel) {
    var x0 = 36, x1 = 284, y = 78;
    var ticks = '';
    var n = Math.round(max / step);
    for (var i = 0; i <= n; i++) {
      var x = Math.round(x0 + (x1 - x0) * (i / n));
      var major = i % 2 === 0 || step >= max;
      ticks += '<line x1="' + x + '" y1="' + (y - (major ? 16 : 10)) + '" x2="' + x + '" y2="' + (y + 8) + '" class="scale-tick"/>';
      if (major || n <= 10) {
        ticks += '<text x="' + x + '" y="' + (y + 28) + '" text-anchor="middle" class="scale-num">' + (i * step) + '</text>';
      }
    }
    var px = Math.round(x0 + (x1 - x0) * (value / max));
    var svg =
      '<text x="160" y="28" text-anchor="middle" class="scale-title">' + esc(unitLabel) + '</text>' +
      '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" class="scale-bar"/>' +
      ticks +
      '<polygon points="' + px + ',' + (y - 34) + ' ' + (px - 8) + ',' + (y - 48) + ' ' + (px + 8) + ',' + (y - 48) + '" class="scale-ptr"/>' +
      '<line x1="' + px + '" y1="' + (y - 34) + '" x2="' + px + '" y2="' + (y - 6) + '" class="scale-ptr-line"/>';
    return wrap(svg, '磅的刻度，單位 ' + unitLabel, 'q-diagram--scale');
  }

  function blocks(count) {
    var s = '';
    for (var i = 0; i < count; i++) {
      s += '<rect x="' + (i * 14) + '" y="0" width="12" height="12" rx="2" class="bal-block"/>';
    }
    return s;
  }

  function balanceBlocks(leftCount, rightCount, tilt) {
    var angle = tilt === 'left' ? -8 : tilt === 'right' ? 8 : 0;
    var svg =
      '<polygon points="160,108 146,132 174,132" class="bal-base"/>' +
      '<rect x="154" y="78" width="12" height="36" class="bal-stand"/>' +
      '<g transform="rotate(' + angle + ' 160 78)">' +
      '<rect x="48" y="72" width="224" height="8" rx="4" class="bal-beam"/>' +
      '<line x1="70" y1="80" x2="70" y2="100" class="bal-string"/>' +
      '<line x1="250" y1="80" x2="250" y2="100" class="bal-string"/>' +
      '<path d="M40 100 h60 l-8 18 h-44 z" class="bal-pan"/>' +
      '<path d="M220 100 h60 l-8 18 h-44 z" class="bal-pan"/>' +
      '<g transform="translate(' + (70 - leftCount * 7) + ',102)">' + blocks(leftCount) + '</g>' +
      '<g transform="translate(' + (250 - rightCount * 7) + ',102)">' + blocks(rightCount) + '</g>' +
      '</g>';
    return wrap(svg, '天平左邊 ' + leftCount + ' 個砝碼，右邊 ' + rightCount + ' 個砝碼', 'q-diagram--balance');
  }

  function arrowOn(x1, y1, x2, y2, doubleMark) {
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var d = 'M -5 -4 L 1 0 L -5 4';
    var extra = doubleMark ? '<path d="M 2 -4 L 8 0 L 2 4" fill="none" stroke="#b45309" stroke-width="2.4" stroke-linejoin="round"/>' : '';
    return '<g transform="translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')">' +
      '<path d="' + d + '" fill="none" stroke="#b45309" stroke-width="2.4" stroke-linejoin="round"/>' + extra + '</g>';
  }

  function linePair(mode) {
    var body = '';
    var aria = '兩條直線';
    if (mode === 'parallel-h') {
      body =
        '<line x1="36" y1="58" x2="284" y2="58" class="geo-line"/>' +
        '<line x1="36" y1="112" x2="284" y2="112" class="geo-line"/>' +
        arrowOn(36, 58, 284, 58, false) + arrowOn(36, 112, 284, 112, false);
      aria = '兩條水平的平行線';
    } else if (mode === 'parallel-s') {
      body =
        '<line x1="48" y1="130" x2="200" y2="40" class="geo-line"/>' +
        '<line x1="110" y1="140" x2="262" y2="50" class="geo-line"/>' +
        arrowOn(48, 130, 200, 40, false) + arrowOn(110, 140, 262, 50, false);
      aria = '兩條斜向的平行線';
    } else if (mode === 'parallel-v') {
      body =
        '<line x1="110" y1="24" x2="110" y2="148" class="geo-line"/>' +
        '<line x1="200" y1="24" x2="200" y2="148" class="geo-line"/>' +
        arrowOn(110, 148, 110, 24, false) + arrowOn(200, 148, 200, 24, false);
      aria = '兩條直向的平行線';
    } else if (mode === 'cross') {
      body =
        '<line x1="40" y1="132" x2="280" y2="36" class="geo-line geo-line--hot"/>' +
        '<line x1="40" y1="36" x2="280" y2="132" class="geo-line geo-line--hot"/>' +
        '<circle cx="160" cy="84" r="5" class="geo-dot"/>';
      aria = '兩條相交的直線';
    } else {
      body =
        '<line x1="36" y1="110" x2="284" y2="110" class="geo-line geo-line--hot"/>' +
        '<line x1="70" y1="140" x2="250" y2="28" class="geo-line geo-line--hot"/>';
      aria = '一條水平線和一條斜線，方向不同';
    }
    return wrap(body, aria);
  }

  function parallelDistance(equal) {
    var y2 = equal ? 118 : 132;
    var gapLabel = equal ? '3 cm' : '5 cm';
    var svg =
      '<line x1="40" y1="48" x2="280" y2="48" class="geo-line"/>' +
      '<line x1="40" y1="' + y2 + '" x2="280" y2="' + y2 + '" class="geo-line"/>' +
      '<line x1="90" y1="48" x2="90" y2="' + y2 + '" class="geo-dim"/>' +
      '<line x1="210" y1="48" x2="210" y2="' + (equal ? y2 : 100) + '" class="geo-dim"/>' +
      '<text x="78" y="' + Math.round((48 + y2) / 2) + '" class="geo-dim-text">3 cm</text>' +
      '<text x="218" y="' + (equal ? Math.round((48 + y2) / 2) : 78) + '" class="geo-dim-text">' + gapLabel + '</text>';
    return wrap(svg, equal ? '兩條平行線，兩處距離都是 3 厘米' : '兩條不平行的線，距離不相同');
  }

  var SHAPES = {
    para: [[58, 36], [132, 36], [112, 92], [38, 92]],
    rect: [[36, 36], [148, 36], [148, 96], [36, 96]],
    square: [[52, 28], [124, 28], [124, 100], [52, 100]],
    trap: [[62, 36], [118, 36], [150, 100], [30, 100]],
    tri: [[90, 24], [28, 108], [152, 108]],
    irreg: [[34, 30], [132, 22], [156, 78], [40, 112]]
  };

  var SHAPE_NAMES = {
    para: '平行四邊形',
    rect: '長方形',
    square: '正方形',
    trap: '梯形',
    tri: '三角形',
    irreg: '一般四邊形'
  };

  function shapeName(kind) { return SHAPE_NAMES[kind] || kind; }

  function isParallelogramKind(kind) {
    return kind === 'para' || kind === 'rect' || kind === 'square';
  }

  function sidesParallel(kind, i, j) {
    if (i === j) return false;
    var a = Math.min(i, j), b = Math.max(i, j);
    if (kind === 'tri' || kind === 'irreg') return false;
    if (kind === 'trap') return a === 0 && b === 2;
    return b - a === 2;
  }

  function parallelPairCount(kind) {
    if (kind === 'para' || kind === 'rect' || kind === 'square') return 2;
    if (kind === 'trap') return 1;
    return 0;
  }

  function shapeSvg(kind, opts) {
    opts = opts || {};
    var pts = SHAPES[kind];
    if (!pts) return '';
    var hi = {};
    (opts.highlight || []).forEach(function (i) { hi[i] = true; });
    var cxy = [0, 0];
    pts.forEach(function (p) { cxy[0] += p[0]; cxy[1] += p[1]; });
    cxy[0] /= pts.length;
    cxy[1] /= pts.length;
    var poly = pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var svg = '<polygon points="' + poly + '" class="shape-fill"/>';
    var n = pts.length;
    for (var i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n];
      svg += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '" class="geo-line' +
        (hi[i] ? ' geo-line--hot' : '') + '"/>';
      if (opts.arrows && sidesParallel(kind, i, (i + 2) % n)) {
        var doubleMark = kind !== 'trap' && (i % 2 === 1);
        svg += arrowOn(p[0], p[1], q[0], q[1], doubleMark);
      }
      if (opts.lengths && opts.lengths[i]) {
        var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        var dx = mx - cxy[0], dy = my - cxy[1];
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var lx = Math.round(mx + dx / len * 18);
        var ly = Math.round(my + dy / len * 16);
        svg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" class="geo-dim-text">' + esc(opts.lengths[i]) + '</text>';
      }
    }
    if (opts.letters) {
      for (var v = 0; v < n && v < opts.letters.length; v++) {
        var dxv = pts[v][0] - cxy[0], dyv = pts[v][1] - cxy[1];
        var lv = Math.sqrt(dxv * dxv + dyv * dyv) || 1;
        var tx = Math.round(pts[v][0] + dxv / lv * 16);
        var ty = Math.round(pts[v][1] + dyv / lv * 16 + 4);
        svg += '<text x="' + tx + '" y="' + ty + '" text-anchor="middle" class="vert-label">' + esc(opts.letters[v]) + '</text>';
      }
    }
    var aria = shapeName(kind);
    if (opts.mini) {
      return '<svg class="shape-svg" viewBox="0 0 180 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(aria) + '">' + svg + '</svg>';
    }
    return '<div class="q-diagram"><svg class="shape-svg shape-svg--lg" viewBox="0 0 180 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(aria) + '">' + svg + '</svg></div>';
  }

  function shapeCard(kind, caption) {
    return '<span class="shape-card">' + shapeSvg(kind, { mini: true }) +
      (caption ? '<span class="shape-card__name">' + esc(caption) + '</span>' : '') + '</span>';
  }

  /**
   * 3S2 三角形 SVG 繪圖：支援等邊、等腰、直角、等腰直角、不等邊，
   * 附帶旋轉角度、邊長標註及直角符號 ┐，避免純靠目測猜測。
   */
  function triangleSvg(kind, opts) {
    opts = opts || {};
    var rot = opts.rotate || 0;
    var rad = rot * Math.PI / 180;
    var cx = 160, cy = 84;

    function rotPt(x, y) {
      var dx = x - cx, dy = y - cy;
      return [
        Math.round((cx + dx * Math.cos(rad) - dy * Math.sin(rad)) * 10) / 10,
        Math.round((cy + dx * Math.sin(rad) + dy * Math.cos(rad)) * 10) / 10
      ];
    }

    var specs = {
      equilateral: {
        pts: [[160, 34], [116, 110], [204, 110]],
        labels: ['6 cm', '6 cm', '6 cm'],
        rightIdx: -1,
        aria: '等邊三角形，三條邊都是 6 cm'
      },
      isosceles: {
        pts: [[160, 28], [126, 116], [194, 116]],
        labels: ['7 cm', '4 cm', '7 cm'],
        rightIdx: -1,
        aria: '等腰三角形，兩條邊是 7 cm，底邊是 4 cm'
      },
      right: {
        pts: [[112, 42], [112, 114], [208, 114]],
        labels: ['5 cm', '7 cm', '9 cm'],
        rightIdx: 1,
        aria: '直角三角形，三邊分別為 5 cm、7 cm、9 cm，有一個直角'
      },
      iso_right: {
        pts: [[124, 42], [124, 114], [196, 114]],
        labels: ['6 cm', '6 cm', '8 cm'],
        rightIdx: 1,
        aria: '等腰直角三角形，兩條直角邊都是 6 cm，斜邊 8 cm'
      },
      scalene: {
        pts: [[108, 46], [198, 38], [182, 116]],
        labels: ['7 cm', '6 cm', '9 cm'],
        rightIdx: -1,
        aria: '不等邊三角形，三邊分別為 7 cm、6 cm、9 cm'
      }
    };

    var sp = specs[kind] || specs.equilateral;
    var pts = sp.pts.map(function (p) { return rotPt(p[0], p[1]); });
    var poly = pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var body = '<polygon points="' + poly + '" class="shape-fill"/>';

    for (var i = 0; i < 3; i++) {
      var p = pts[i], q = pts[(i + 1) % 3];
      body += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '" class="geo-line"/>';
      if (opts.showMarks !== false) {
        var mx = (p[0] + q[0]) / 2;
        var my = (p[1] + q[1]) / 2;
        var dx = mx - cx, dy = my - cy;
        var dlen = Math.sqrt(dx * dx + dy * dy) || 1;
        var lx = Math.round(mx + (dx / dlen) * 20);
        var ly = Math.round(my + (dy / dlen) * 18 + 4);
        body += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" class="geo-dim-text">' + esc(sp.labels[i]) + '</text>';
      }
    }

    if (sp.rightIdx >= 0 && opts.showMarks !== false) {
      var v = pts[sp.rightIdx];
      var pPrev = pts[(sp.rightIdx + 2) % 3];
      var pNext = pts[(sp.rightIdx + 1) % 3];
      function unit(a, b) {
        var vx = b[0] - a[0], vy = b[1] - a[1];
        var l = Math.sqrt(vx * vx + vy * vy) || 1;
        return [vx / l, vy / l];
      }
      var u1 = unit(v, pPrev);
      var u2 = unit(v, pNext);
      var sz = 12;
      var r1 = [v[0] + u1[0] * sz, v[1] + u1[1] * sz];
      var r2 = [v[0] + u1[0] * sz + u2[0] * sz, v[1] + u1[1] * sz + u2[1] * sz];
      var r3 = [v[0] + u2[0] * sz, v[1] + u2[1] * sz];
      body += '<polyline points="' + r1[0].toFixed(1) + ',' + r1[1].toFixed(1) + ' ' +
        r2[0].toFixed(1) + ',' + r2[1].toFixed(1) + ' ' +
        r3[0].toFixed(1) + ',' + r3[1].toFixed(1) + '" fill="none" stroke="#b45309" stroke-width="2.4"/>';
    }

    return wrap(body, sp.aria, 'q-diagram--triangle');
  }

  global.Diagrams = {
    topicIcon: topicIcon,
    feedbackIcon: feedbackIcon,
    ICONS: ICONS,
    timeDigital: timeDigital,
    timeStack: timeStack,
    verticalMul: verticalMul,
    divBracket: divBracket,
    analogClock: analogClock,
    digitalFace: digitalFace,
    balance: balance,
    balanceBlocks: balanceBlocks,
    scale: scale,
    linePair: linePair,
    parallelDistance: parallelDistance,
    shapeSvg: shapeSvg,
    shapeCard: shapeCard,
    shapeName: shapeName,
    isParallelogramKind: isParallelogramKind,
    sidesParallel: sidesParallel,
    parallelPairCount: parallelPairCount,
    SHAPE_NAMES: SHAPE_NAMES,
    triangleSvg: triangleSvg
  };
})(typeof window !== 'undefined' ? window : globalThis);
