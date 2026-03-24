/**
 * challenge.js — Angle generation, validation, timer, debounce.
 * Exports: window.TiltCaptcha.challenge
 */
(function () {
  'use strict';

  var TOTAL_ANGLES = 10;
  var TOLERANCE = 2;
  var HOLD_MS = 500;
  var TIME_PER_ANGLE_MS = 5000;
  var MIN_ANGLE = -40;
  var MAX_ANGLE = 40;
  var MIN_SEPARATION = 10;

  function randomAngle() {
    return MIN_ANGLE + Math.random() * (MAX_ANGLE - MIN_ANGLE);
  }

  function generateAngles(count) {
    var angles = [];
    for (var i = 0; i < count; i++) {
      var attempt;
      var tries = 0;
      do {
        attempt = randomAngle();
        tries++;
      } while (
        i > 0 &&
        Math.abs(attempt - angles[i - 1]) < MIN_SEPARATION &&
        tries < 50
      );
      angles.push(Math.round(attempt * 10) / 10);
    }
    return angles;
  }

  var challenge = {
    TOTAL_ANGLES: TOTAL_ANGLES,
    TOLERANCE: TOLERANCE,

    /** @type {number[]} */
    angles: [],
    currentIndex: 0,
    /** @type {number|null} */
    inRangeSince: null,
    /** @type {number|null} */
    timerEnd: null,
    /** @type {number|null} */
    timerInterval: null,
    active: false,

    /** Callbacks — set by app.js */
    onAngleComplete: null,
    onAllComplete: null,
    onTimeout: null,
    onTick: null,

    /**
     * Generate a fresh set of angles and reset state.
     */
    init: function () {
      this.angles = generateAngles(TOTAL_ANGLES);
      this.currentIndex = 0;
      this.inRangeSince = null;
      this.active = true;
    },

    /**
     * Start the countdown timer for the current angle.
     */
    startTimer: function () {
      var self = this;
      self.timerEnd = Date.now() + TIME_PER_ANGLE_MS;
      self.inRangeSince = null;

      if (self.timerInterval) clearInterval(self.timerInterval);

      self.timerInterval = setInterval(function () {
        var remaining = Math.max(0, self.timerEnd - Date.now());
        if (self.onTick) self.onTick(remaining, TIME_PER_ANGLE_MS);

        if (remaining <= 0) {
          self.stopTimer();
          self.active = false;
          if (self.onTimeout) self.onTimeout();
        }
      }, 100);
    },

    /**
     * Stop the countdown timer.
     */
    stopTimer: function () {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    /**
     * Feed a gamma reading into the challenge validator.
     * @param {number} gamma — current device gamma (-90 to 90)
     */
    feed: function (gamma) {
      if (!this.active) return;

      var target = this.angles[this.currentIndex];
      var diff = Math.abs(gamma - target);

      if (diff <= TOLERANCE) {
        if (!this.inRangeSince) {
          this.inRangeSince = Date.now();
        } else if (Date.now() - this.inRangeSince >= HOLD_MS) {
          this.stopTimer();
          this.currentIndex++;
          if (this.currentIndex >= TOTAL_ANGLES) {
            this.active = false;
            if (this.onAllComplete) this.onAllComplete();
          } else {
            if (this.onAngleComplete) this.onAngleComplete(this.currentIndex);
            this.startTimer();
          }
        }
      } else {
        this.inRangeSince = null;
      }
    },

    /**
     * Get the current target angle.
     */
    getCurrentTarget: function () {
      return this.angles[this.currentIndex];
    },
  };

  if (!window.TiltCaptcha) window.TiltCaptcha = {};
  window.TiltCaptcha.challenge = challenge;
})();
