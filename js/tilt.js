/**
 * tilt.js — DeviceOrientation detection + iOS permission handling.
 * Exports: window.TiltCaptcha.tilt
 */
(function () {
  'use strict';

  var tilt = {
    /** Current gamma value in degrees (-90 to 90) */
    gamma: 0,
    _listener: null,
    _hasPermission: false,
    _hasSensor: false,
    _pendingCallback: null,

    /**
     * Detect whether DeviceOrientation is available and whether
     * iOS 13+ permission is needed.
     * @returns {{ available: boolean, needsPermission: boolean }}
     */
    detect: function () {
      var available = typeof DeviceOrientationEvent !== 'undefined';
      var needsPermission =
        available &&
        typeof DeviceOrientationEvent.requestPermission === 'function';

      return {
        available: available,
        needsPermission: needsPermission,
      };
    },

    /**
     * Request permission on iOS 13+. Must be called from a user gesture.
     * @returns {Promise<boolean>} resolves true if granted
     */
    requestPermission: function () {
      var self = this;
      if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
        self._hasPermission = true;
        return Promise.resolve(true);
      }
      return DeviceOrientationEvent.requestPermission().then(function (state) {
        self._hasPermission = state === 'granted';
        return self._hasPermission;
      });
    },

    /**
     * Start listening for orientation events.
     * @param {function} callback — called with (gamma: number) on each reading
     */
    start: function (callback) {
      var self = this;
      self._pendingCallback = callback;

      self._listener = function (e) {
        if (e.gamma != null) {
          self._hasSensor = true;
          self.gamma = e.gamma;
          if (self._pendingCallback) {
            self._pendingCallback(e.gamma);
          }
        }
      };

      window.addEventListener('deviceorientation', self._listener);
    },

    /**
     * Stop listening.
     */
    stop: function () {
      if (this._listener) {
        window.removeEventListener('deviceorientation', this._listener);
        this._listener = null;
      }
    },

    /**
     * Wait briefly to see if any orientation event fires (sensor exists).
     * @returns {Promise<boolean>}
     */
    waitForSensor: function () {
      var self = this;
      return new Promise(function (resolve) {
        var timeout = setTimeout(function () {
          resolve(self._hasSensor);
        }, 1000);

        function probe(e) {
          if (e.gamma != null) {
            self._hasSensor = true;
            clearTimeout(timeout);
            window.removeEventListener('deviceorientation', probe);
            resolve(true);
          }
        }
        window.addEventListener('deviceorientation', probe);
      });
    },
  };

  if (!window.TiltCaptcha) window.TiltCaptcha = {};
  window.TiltCaptcha.tilt = tilt;
})();
