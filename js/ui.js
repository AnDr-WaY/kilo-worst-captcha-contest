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

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.bg;
      ctx.fill();

      // Tick marks every 10 degrees (full 180° arc from left to right)
      for (var deg = -90; deg <= 90; deg += 10) {
        var rad = ((deg - 90) * Math.PI) / 180;
        var isMajor = deg % 30 === 0;
        var innerR = radius - (isMajor ? 18 : 12);
        var outerR = radius - 4;
        ctx.beginPath();
        ctx.moveTo(cx + innerR * Math.cos(rad), cy + innerR * Math.sin(rad));
        ctx.lineTo(cx + outerR * Math.cos(rad), cy + outerR * Math.sin(rad));
        ctx.strokeStyle = isMajor ? COLORS.tickMajor : COLORS.tick;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }

      // Target zone arc (highlighted sector at target angle on the circle)
      var targetRad = ((targetGamma - 90) * Math.PI) / 180;
      var halfArc = (2 * Math.PI) / 180; // 2 degrees tolerance
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, targetRad - halfArc, targetRad + halfArc);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = COLORS.targetZone;
      ctx.fill();

      // Fake target zone (50-50 modifier)
      if (window.TiltCaptcha && window.TiltCaptcha.modifiers) {
        var mods = window.TiltCaptcha.modifiers;
        if (mods.getActive() === 'FIFTY_FIFTY') {
          var fakeTarget = mods.getFakeTarget();
          if (fakeTarget != null) {
            var fakeRad = ((fakeTarget - 90) * Math.PI) / 180;
            ctx.beginPath();
            ctx.arc(cx, cy, radius - 4, fakeRad - halfArc, fakeRad + halfArc);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
            ctx.fill();
          }
        }
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.ring;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.centerDot;
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
      if (isInTolerance) {
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleR + 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.bubbleGlow;
        ctx.fill();
      }

      // Bubble circle
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.bubble;
      ctx.fill();

      // Direction indicator (line from center to bubble)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bubbleX, bubbleY);
      ctx.strokeStyle = 'rgba(228, 230, 237, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ghost bubble (Duplicate modifier)
      if (window.TiltCaptcha && window.TiltCaptcha.modifiers) {
        var mods = window.TiltCaptcha.modifiers;
        if (mods.getActive() === 'DUPLICATE') {
          var ghostAngle = mods.getGhostAngle(Date.now(), clampedGamma);
          var clampedGhost = Math.max(-45, Math.min(45, ghostAngle));
          var ghostRad = ((clampedGhost - 90) * Math.PI) / 180;
          var ghostX = cx + bubbleOrbitR * Math.cos(ghostRad);
          var ghostY = cy + bubbleOrbitR * Math.sin(ghostRad);
          var ghostR = 12;

          ctx.beginPath();
          ctx.arc(ghostX, ghostY, ghostR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
          ctx.fill();

          // Ghost direction indicator
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ghostX, ghostY);
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
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
        DUPLICATE: 'DUPLICATE MODE',
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

      var emojis = ['\uD83D\uDC4E', '\uD83E\uDD21', '\uD83D\uDE02', '\uD83D\uDC80', '\uD83D\uDD95', '\uD83C\uDFAD', '\uD83D\uDCA9', '\uD83D\uDE44', '\uD83E\uDD26', '\uD83D\uDE2D'];
      for (var i = 0; i < 10; i++) {
        var span = document.createElement('span');
        span.className = 'taunt-emoji';
        span.textContent = emojis[i % emojis.length];
        span.style.left = (5 + Math.random() * 90) + '%';
        span.style.animationDuration = (3 + Math.random() * 3) + 's';
        span.style.animationDelay = (Math.random() * 2) + 's';
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
