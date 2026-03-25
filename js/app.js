/**
 * app.js — Main controller / state machine.
 * Wires tilt.js, challenge.js, and ui.js together.
 */
(function () {
  'use strict';

  var tilt = window.TiltCaptcha.tilt;
  var challenge = window.TiltCaptcha.challenge;
  var ui = window.TiltCaptcha.ui;
  var modifiers = window.TiltCaptcha.modifiers;

  var STATES = {
    DETECT: 'DETECT',
    REQUEST_PERMISSION: 'REQUEST_PERMISSION',
    CHALLENGE: 'CHALLENGE',
    SUCCESS: 'SUCCESS',
    RESTART: 'RESTART',
    QR_FALLBACK: 'QR_FALLBACK',
  };

  var state = STATES.DETECT;
  var btnStart = document.getElementById('btn-start');
  var btnRestart = document.getElementById('btn-restart');

  ui.init();

  // --- Wire challenge callbacks ---

  challenge.onTick = function (remaining, total) {
    ui.updateTimer(remaining, total);
  };

  challenge.onAngleComplete = function (nextIndex) {
    // Deactivate previous modifier
    modifiers.deactivate();
    ui.hideModifierBanner();

    ui.updateProgress(nextIndex + 1, challenge.TOTAL_ANGLES);
    ui.setTarget(challenge.getCurrentTarget());
    ui.updateTargetText(challenge.getCurrentTarget());

    // Roll a new modifier for this round
    var mod = modifiers.activate(challenge.getCurrentTarget());
    if (mod) {
      ui.showModifierBanner(mod);
      // For 50-50, show the fake target in the UI text
      if (mod === 'FIFTY_FIFTY') {
        var fake = modifiers.getFakeTarget();
        if (fake != null) {
          ui.updateTargetText(fake);
        }
      }
    }
  };

  challenge.onAllComplete = function () {
    modifiers.deactivate();
    ui.hideModifierBanner();
    transition(STATES.SUCCESS);
  };

  challenge.onTimeout = function () {
    modifiers.deactivate();
    ui.hideModifierBanner();
    transition(STATES.RESTART);
  };

  // --- State machine ---

  function transition(newState) {
    state = newState;

    switch (state) {
      case STATES.DETECT:
        handleDetect();
        break;

      case STATES.REQUEST_PERMISSION:
        ui.showScreen('start');
        btnStart.textContent = 'Tap to Enable Motion';
        break;

      case STATES.CHALLENGE:
        startChallenge();
        break;

      case STATES.SUCCESS:
        handleSuccess();
        break;

      case STATES.RESTART:
        handleRestart();
        break;

      case STATES.QR_FALLBACK:
        ui.showQRFallback();
        break;
    }
  }

  function handleDetect() {
    var info = tilt.detect();

    if (!info.available) {
      transition(STATES.QR_FALLBACK);
      return;
    }

    if (info.needsPermission) {
      transition(STATES.REQUEST_PERMISSION);
      return;
    }

    // Check if sensor actually fires
    tilt.start(function () {});
    tilt.waitForSensor().then(function (hasSensor) {
      tilt.stop();
      if (hasSensor) {
        transition(STATES.CHALLENGE);
      } else {
        transition(STATES.QR_FALLBACK);
      }
    });
  }

  function startChallenge() {
    ui.showScreen('challenge');
    ui.hideModifierBanner();
    challenge.init();
    modifiers.reset();

    var idx = challenge.currentIndex;
    ui.updateProgress(idx + 1, challenge.TOTAL_ANGLES);
    ui.setTarget(challenge.getCurrentTarget());
    ui.updateTargetText(challenge.getCurrentTarget());

    tilt.start(function (gamma) {
      challenge.feed(gamma);
      var target = challenge.getCurrentTarget();
      var inRange = Math.abs(gamma - target) <= challenge.TOLERANCE;
      ui.setGamma(gamma, inRange);
      ui.updateCurrentText(gamma);
    });

    challenge.startTimer();
    ui.start();
  }

  function handleSuccess() {
    tilt.stop();
    ui.stop();
    ui.showScreen('success');

    // Notify parent frame
    window.parent.postMessage({ type: 'captcha-success' }, '*');

    // Fire custom event for same-page listeners
    document.dispatchEvent(new CustomEvent('captcha:success'));
  }

  function handleRestart() {
    tilt.stop();
    ui.stop();
    ui.showScreen('restart');
    ui.spawnTauntEmojis();
  }

  // --- Button handler ---

  btnStart.addEventListener('click', function () {
    if (state === STATES.DETECT) {
      var info = tilt.detect();
      if (info.needsPermission) {
        transition(STATES.REQUEST_PERMISSION);
      } else {
        transition(STATES.DETECT);
      }
      return;
    }

    if (state === STATES.REQUEST_PERMISSION) {
      tilt.requestPermission().then(function (granted) {
        if (granted) {
          transition(STATES.CHALLENGE);
        } else {
          transition(STATES.QR_FALLBACK);
        }
      });
      return;
    }
  });

  // --- Restart button handler ---

  btnRestart.addEventListener('click', function () {
    ui.clearTauntEmojis();
    transition(STATES.CHALLENGE);
  });

  // --- Auto-start detection ---
  transition(STATES.DETECT);
})();
