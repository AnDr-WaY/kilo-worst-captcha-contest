/**
 * modifiers.js — Round modifiers system.
 * Exports: window.TiltCaptcha.modifiers
 */
(function () {
  'use strict';

  var MODIFIERS = ['DRUNKEN', 'RAINBOW', 'EPILEPTIC', 'FIFTY_FIFTY', 'THREE_SPHERES'];

  var active = null;
  var fakeTargetGamma = null;
  var roundIndex = 0;
  var modifiersSeen = {};

  /**
   * Roll a new modifier. First round (index 0) is always clean.
   * 40% chance for a modifier on subsequent rounds.
   * If in bonus rounds, force untried modifiers.
   * @param {boolean} forceUntried — if true, pick a modifier not yet tried
   * @returns {string|null} modifier name or null
   */
  function roll(forceUntried) {
    if (roundIndex === 0) {
      roundIndex++;
      return null;
    }
    roundIndex++;

    if (forceUntried) {
      var untried = [];
      for (var i = 0; i < MODIFIERS.length; i++) {
        if (!modifiersSeen[MODIFIERS[i]]) {
          untried.push(MODIFIERS[i]);
        }
      }
      if (untried.length > 0) {
        var idx = Math.floor(Math.random() * untried.length);
        return untried[idx];
      }
      // All modifiers tried — fall through to random below
    }

    if (Math.random() < 0.4) {
      var idx2 = Math.floor(Math.random() * MODIFIERS.length);
      return MODIFIERS[idx2];
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
      modifiersSeen = {};
    },

    /**
     * Check if all modifiers have been tried at least once.
     * @returns {boolean}
     */
    allTried: function () {
      for (var i = 0; i < MODIFIERS.length; i++) {
        if (!modifiersSeen[MODIFIERS[i]]) return false;
      }
      return true;
    },

    /**
     * Roll and activate a modifier for the next round.
     * @param {number} realTarget — the real target angle for this round
     * @param {boolean} forceUntried — force picking untried modifiers
     * @returns {string|null} activated modifier name or null
     */
    activate: function (realTarget, forceUntried) {
      var name = roll(forceUntried);
      active = name;

      if (name) {
        modifiersSeen[name] = true;
      }

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
     * Compute ghost bubble angles for THREE_SPHERES modifier.
     * @param {number} timestamp — Date.now()
     * @param {number} realGamma — the real bubble angle
     * @param {number} index — ghost index (0 or 1)
     * @returns {number}
     */
    getGhostAngle: function (timestamp, realGamma, index) {
      if (index === 0) {
        return Math.sin(timestamp * 0.002) * 15 + realGamma + 8;
      }
      return Math.cos(timestamp * 0.0025) * 15 + realGamma - 8;
    },
  };

  if (!window.TiltCaptcha) window.TiltCaptcha = {};
  window.TiltCaptcha.modifiers = modifiers;
})();
