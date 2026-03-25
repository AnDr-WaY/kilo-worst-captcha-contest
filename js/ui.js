/**
 * ui.js — Bubble level canvas renderer, progress, messages.
 * Exports: window.TiltCaptcha.ui
 */
(function () {
  'use strict';

  var canvas, ctx;
  var size, cx, cy, radius;
  var animFrame = null;
  var currentGamma = 0;
  var targetGamma = 0;
  var isInTolerance = false;
  var bubbleRad = null;

  var COLORS = {
    bg: '#1a1d27',
    ring: '#2a2d3a',
    ringDone: '#34d399',
    targetZone: 'rgba(79, 140, 255, 0.3)',
    bubble: '#e4e6ed',
    bubbleGlow: 'rgba(52, 211, 153, 0.6)',
    tick: '#3a3d4a',
    tickMajor: '#5a5d6a',
    centerDot: '#3a3d4a',
    danger: 'rgba(248, 113, 113, 0.6)',
  };

  var ui = {
    /**
     * Initialize the canvas.
     */
    init: function () {
      canvas = document.getElementById('level-canvas');
      ctx = canvas.getContext('2d');
      size = canvas.width;
      cx = size / 2;
      cy = size / 2;
      radius = size / 2 - 16;
    },

    /**
     * Set the target angle for the current challenge step.
     * @param {number} gamma — target angle in degrees
     */
    setTarget: function (gamma) {
      targetGamma = gamma;
    },

    /**
     * Update the current sensor reading.
     * @param {number} gamma
     * @param {boolean} inTolerance
     */
    setGamma: function (gamma, inTolerance) {
      currentGamma = gamma;
      isInTolerance = inTolerance;
    },

    /**
     * Start the render loop.
     */
    start: function () {
      var self = this;
      function loop() {
        self.render();
        animFrame = requestAnimationFrame(loop);
      }
      loop();
    },

    /**
     * Stop the render loop.
     */
    stop: function () {
      if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
    },

    /**
     * Render a single frame.
     */
    render: function () {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      var activeMod = null;
      var timestamp = Date.now();
      if (window.TiltCaptcha && window.TiltCaptcha.modifiers) {
        activeMod = window.TiltCaptcha.modifiers.getActive();
      }

      // Determine colors based on active modifier
      var bgColor = COLORS.bg;
      var bubbleColor = COLORS.bubble;
      var tickColor = COLORS.tick;
      var tickMajorColor = COLORS.tickMajor;
      var ringColor = COLORS.ring;
      var centerDotColor = COLORS.centerDot;
      var lineColor = 'rgba(228, 230, 237, 0.15)';

      if (activeMod === 'RAINBOW') {
        var hue = (timestamp * 0.15) % 360;
        bgColor = 'hsl(' + hue + ', 40%, 12%)';
        bubbleColor = 'hsl(' + ((hue + 120) % 360) + ', 80%, 80%)';
        tickColor = 'hsl(' + ((hue + 60) % 360) + ', 30%, 25%)';
        tickMajorColor = 'hsl(' + ((hue + 60) % 360) + ', 40%, 35%)';
        ringColor = 'hsl(' + ((hue + 180) % 360) + ', 30%, 20%)';
        centerDotColor = 'hsl(' + ((hue + 90) % 360) + ', 40%, 25%)';
        lineColor = 'hsla(' + hue + ', 60%, 70%, 0.3)';
      } else if (activeMod === 'EPILEPTIC') {
        var flashPhase = Math.floor(timestamp / 300) % 2;
        if (flashPhase === 0) {
          bgColor = '#ffffff';
          bubbleColor = '#000000';
          ringColor = '#cccccc';
        } else {
          bgColor = '#000000';
          bubbleColor = '#ffffff';
          ringColor = '#333333';
        }
      }

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = bgColor;
      ctx.fill();

      // Green screen glow for drunken
      if (activeMod === 'DRUNKEN') {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(timestamp * 0.005) * 0.15;
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
        grad.addColorStop(0.7, 'rgba(0, 200, 0, 0.1)');
        grad.addColorStop(1, 'rgba(0, 255, 0, 0.2)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Tick marks every 10 degrees (full 180° arc from left to right)
      for (var deg = -90; deg <= 90; deg += 10) {
        var rad = ((deg - 90) * Math.PI) / 180;
        var isMajor = deg % 30 === 0;
        var innerR = radius - (isMajor ? 18 : 12);
        var outerR = radius - 4;
        ctx.beginPath();
        ctx.moveTo(cx + innerR * Math.cos(rad), cy + innerR * Math.sin(rad));
        ctx.lineTo(cx + outerR * Math.cos(rad), cy + outerR * Math.sin(rad));
        ctx.strokeStyle = isMajor ? tickMajorColor : tickColor;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }

      // Target zone arc (highlighted sector at target angle on the circle)
      var targetRad = ((targetGamma - 90) * Math.PI) / 180;
      var halfArc = (2 * Math.PI) / 180; // 2 degrees tolerance
      var zoneColor = COLORS.targetZone;

      if (activeMod === 'RAINBOW') {
        var hue2 = (timestamp * 0.15) % 360;
        zoneColor = 'hsla(' + hue2 + ', 70%, 60%, 0.3)';
      }

      // 50-50: show TWO identical zones (real + fake), neither highlighted differently
      if (activeMod === 'FIFTY_FIFTY') {
        var fakeTarget = window.TiltCaptcha.modifiers.getFakeTarget();
        if (fakeTarget != null) {
          var fakeRad = ((fakeTarget - 90) * Math.PI) / 180;
          ctx.beginPath();
          ctx.arc(cx, cy, radius - 4, fakeRad - halfArc, fakeRad + halfArc);
          ctx.lineTo(cx, cy);
          ctx.closePath();
          ctx.fillStyle = zoneColor;
          ctx.fill();
        }
      }

      // Real target zone - drawn the same as fake (identical color in 50-50)
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, targetRad - halfArc, targetRad + halfArc);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = zoneColor;
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = centerDotColor;
      ctx.fill();

      // Bubble — moves along the arc at bubble radius from center
      var clampedGamma = Math.max(-45, Math.min(45, currentGamma));
      var bubbleOrbitR = radius - 24; // distance from center to bubble
      var targetBubbleRad = ((clampedGamma - 90) * Math.PI) / 180;

      // Smooth interpolation of angle
      if (typeof bubbleRad !== 'number') bubbleRad = targetBubbleRad;
      bubbleRad += (targetBubbleRad - bubbleRad) * 0.3;

      var bubbleX = cx + bubbleOrbitR * Math.cos(bubbleRad);
      var bubbleY = cy + bubbleOrbitR * Math.sin(bubbleRad);
      var bubbleR = 14;

      // Glow
      var glowColor = COLORS.bubbleGlow;
      if (activeMod === 'RAINBOW') {
        glowColor = 'hsla(' + ((timestamp * 0.15) % 360) + ', 80%, 60%, 0.6)';
      }
      if (isInTolerance) {
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleR + 6, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
      }

      // Bubble circle
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor;
      ctx.fill();

      // Direction indicator (line from center to bubble)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bubbleX, bubbleY);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ghost bubbles (Three Spheres modifier) - draw 2 identical ghosts
      if (activeMod === 'THREE_SPHERES') {
        for (var gi = 0; gi < 2; gi++) {
          var ghostAngle = window.TiltCaptcha.modifiers.getGhostAngle(timestamp, clampedGamma, gi);
          var clampedGhost = Math.max(-45, Math.min(45, ghostAngle));
          var ghostRad = ((clampedGhost - 90) * Math.PI) / 180;
          var ghostX = cx + bubbleOrbitR * Math.cos(ghostRad);
          var ghostY = cy + bubbleOrbitR * Math.sin(ghostRad);

          // Ghost glow (same as real)
          if (isInTolerance) {
            ctx.beginPath();
            ctx.arc(ghostX, ghostY, bubbleR + 6, 0, Math.PI * 2);
            ctx.fillStyle = glowColor;
            ctx.fill();
          }

          // Ghost bubble - identical to real bubble
          ctx.beginPath();
          ctx.arc(ghostX, ghostY, bubbleR, 0, Math.PI * 2);
          ctx.fillStyle = bubbleColor;
          ctx.fill();

          // Ghost direction indicator
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ghostX, ghostY);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    },

    /**
     * Update the timer display elements.
     * @param {number} remainingMs
     * @param {number} totalMs
     */
    updateTimer: function (remainingMs, totalMs) {
      var fill = document.getElementById('timer-fill');
      var text = document.getElementById('timer-text');
      var pct = (remainingMs / totalMs) * 100;
      fill.style.width = pct + '%';
      fill.className = 'timer-fill' + (remainingMs < 1500 ? ' warning' : '');
      text.textContent = (remainingMs / 1000).toFixed(1) + 's';
    },

    /**
     * Update progress text.
     * @param {number} current — 1-indexed
     * @param {number} total
     */
    updateProgress: function (current, total) {
      document.getElementById('progress-text').textContent =
        'Angle ' + current + ' of ' + total;
    },

    /**
     * Update target angle text.
     * @param {number} angle
     */
    updateTargetText: function (angle) {
      document.getElementById('target-text').textContent =
        'Target: ' + angle.toFixed(1) + '\u00B0';
    },

    /**
     * Update current tilt reading text.
     * @param {number} gamma
     */
    updateCurrentText: function (gamma) {
      document.getElementById('current-text').textContent =
        'Current: ' + gamma.toFixed(1) + '\u00B0';
    },

    /**
     * Show the modifier banner with appropriate styling.
     * @param {string|null} modifier — modifier name or null to hide
     */
    showModifierBanner: function (modifier) {
      var banner = document.getElementById('modifier-banner');
      var canvas = document.getElementById('level-canvas');
      if (!banner) return;

      // Clear previous classes
      banner.className = 'modifier-banner';
      canvas.className = '';

      if (!modifier) {
        banner.classList.add('hidden');
        return;
      }

      var labels = {
        DRUNKEN: 'DRUNKEN MODE',
        RAINBOW: 'RAINBOW MODE',
        EPILEPTIC: 'EPILEPTIC MODE',
        FIFTY_FIFTY: '50-50 MODE',
        THREE_SPHERES: 'THREE SPHERES MODE',
      };

      var cssClass = 'mod-' + modifier.toLowerCase().replace('_', '-');
      banner.textContent = labels[modifier] || modifier;
      banner.classList.add(cssClass);
      canvas.classList.add(cssClass + '-active');
    },

    /**
     * Hide the modifier banner and remove canvas effects.
     */
    hideModifierBanner: function () {
      var banner = document.getElementById('modifier-banner');
      var canvas = document.getElementById('level-canvas');
      if (banner) {
        banner.className = 'modifier-banner hidden';
      }
      if (canvas) {
        canvas.className = '';
      }
    },

    /**
     * Show a specific screen by id, hide all others.
     * @param {string} id — screen element id (without 'screen-' prefix)
     */
    showScreen: function (id) {
      var screens = document.querySelectorAll('.screen');
      for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
      }
      var el = document.getElementById('screen-' + id);
      if (el) el.classList.add('active');
    },

    /**
     * Show desktop QR fallback — loads QRCode.js from CDN and generates QR.
     */
    showQRFallback: function () {
      this.showScreen('qr');

      var script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.onload = function () {
        new QRCode(document.getElementById('qrcode'), {
          text: window.location.href,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M,
        });
      };
      document.head.appendChild(script);
    },

    /**
     * Spawn taunt emojis on the restart screen.
     */
    spawnTauntEmojis: function () {
      var container = document.getElementById('taunt-emojis');
      if (!container) return;
      container.innerHTML = '';

      var emojis = [
        '\uD83D\uDC4E', '\uD83E\uDD21', '\uD83D\uDE02', '\uD83D\uDC80', '\uD83D\uDD95',
        '\uD83C\uDFAD', '\uD83D\uDCA9', '\uD83D\uDE44', '\uD83E\uDD26', '\uD83D\uDE2D',
        '\uD83D\uDE08', '\uD83D\uDC7F', '\uD83D\uDCA2', '\uD83D\uDEAB', '\uD83C\uDF46',
        '\uD83D\uDD25', '\uD83D\uDCA3', '\uD83D\uDC79', '\uD83E\uDDEC', '\uD83D\uDE21',
        '\uD83D\uDE36', '\uD83E\uDD2C', '\uD83D\uDCA5', '\uD83D\uDC7B', '\uD83D\uDC80',
        '\uD83E\uDD15', '\uD83D\uDE05', '\uD83C\uDFB5', '\uD83D\uDD95', '\uD83E\uDD37',
        '\uD83D\uDE44', '\uD83E\uDD21', '\uD83D\uDCAF', '\uD83D\uDE02', '\uD83C\uDFAD',
      ];

      for (var i = 0; i < 35; i++) {
        var span = document.createElement('span');
        span.className = 'taunt-emoji';
        span.textContent = emojis[i % emojis.length];
        span.style.left = (Math.random() * 100) + '%';
        span.style.fontSize = (1.2 + Math.random() * 1.5) + 'rem';
        span.style.animationDuration = (2 + Math.random() * 4) + 's';
        span.style.animationDelay = (Math.random() * 3) + 's';
        container.appendChild(span);
      }
    },

    /**
     * Clear taunt emojis from the restart screen.
     */
    clearTauntEmojis: function () {
      var container = document.getElementById('taunt-emojis');
      if (container) container.innerHTML = '';
    },
  };

  if (!window.TiltCaptcha) window.TiltCaptcha = {};
  window.TiltCaptcha.ui = ui;
})();
