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
  var bubbleX = 0;

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

      // Tick marks every 10 degrees
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

      // Target zone arc (highlighted sector)
      var targetRad = ((targetGamma - 90) * Math.PI) / 180;
      var halfArc = (2 * Math.PI) / 180; // 2 degrees tolerance
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, targetRad - halfArc, targetRad + halfArc);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = COLORS.targetZone;
      ctx.fill();

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

      // Bubble — smooth interpolation toward target X
      var clampedGamma = Math.max(-45, Math.min(45, currentGamma));
      var targetBubbleX = cx + (clampedGamma / 45) * (radius - 24);
      bubbleX += (targetBubbleX - bubbleX) * 0.3;

      var bubbleY = cy;
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
  };

  if (!window.TiltCaptcha) window.TiltCaptcha = {};
  window.TiltCaptcha.ui = ui;
})();
