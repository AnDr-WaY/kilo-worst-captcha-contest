/**
 * modifiers.js — Round modifiers system.
 * Exports: window.TiltCaptcha.modifiers
 */
(function () {
  'use strict';

  var MODIFIERS = ['DRUNKEN', 'RAINBOW', 'EPILEPTIC', 'FIFTY_FIFTY', 'DUPLICATE'];

  var active = null;
  var fakeTargetGamma = null;
  var roundIndex = 0;

  /**
   * Roll a new modifier. First round (index 0) is always clean.
   * 30% chance for a modifier on subsequent rounds.
   * @returns {string|null} modifier name or null
   */
  function roll() {
    if (roundIndex === 0) {
      roundIndex++;
      return null;
    }
    roundIndex++;

    if (Math.random() < 0.3) {
      var idx = Math.floor(Math.random() * MODIFIERS.length);
      return MODIFIERS[idx];
    }
    return null;
  }

  /**
   * Generate a fake target angle distinct from the real one.
   * @param {number} realTarget
   * @returns {number}
   */
  function generateFakeTarget(realTarget) {
    var offset = 15 + Math.random() * 10;
    if (Math.random() < 0.5) offset = -offset;
    var fake = realTarget + offset;
    return Math.max(-40, Math.min(40, Math.round(fake * 10) / 10));
  }

  var modifiers = {
    /**
     * Reset state for a new challenge run.
     */
    reset: function () {
      active = null;
      fakeTargetGamma = null;
      roundIndex = 0;
    },

    /**
     * Roll and activate a modifier for the next round.
     * @param {number} realTarget — the real target angle for this round
     * @returns {string|null} activated modifier name or null
     */
    activate: function (realTarget) {
      var name = roll();
      active = name;

      if (name === 'FIFTY_FIFTY') {
        fakeTargetGamma = generateFakeTarget(realTarget);
      } else {
        fakeTargetGamma = null;
      }

      return name;
    },

    /**
     * Deactivate the current modifier.
     */
    deactivate: function () {
      active = null;
      fakeTargetGamma = null;
    },

    /**
     * Get the currently active modifier name.
     * @returns {string|null}
     */
    getActive: function () {
      return active;
    },

    /**
     * Get the fake target gamma for 50-50 modifier.
     * @returns {number|null}
     */
    getFakeTarget: function () {
      return fakeTargetGamma;
    },

    /**
     * Compute a ghost bubble angle for DUPLICATE modifier.
     * @param {number} timestamp — Date.now()
     * @param {number} realGamma — the real bubble angle
     * @returns {number}
     */
    getGhostAngle: function (timestamp, realGamma) {
      return Math.sin(timestamp * 0.003) * 20 + realGamma + 10;
    },
  };

  if (!window.TiltCaptcha) window.TiltCaptcha = {};
  window.TiltCaptcha.modifiers = modifiers;
})();
