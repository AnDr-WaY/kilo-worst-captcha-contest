# Plan: Add Visual Modifiers/Effects to Tilt Captcha

## Overview
Add 5 visual modifiers (Drunken, Rainbow, Epileptic, 50-50, Duplication) that randomly activate on rounds with 30% chance. Also add a restart screen with taunting content, a manual restart button, and an epilepsy warning on the start page.

---

## File Changes Summary

| File | Changes |
|------|---------|
| `index.html` | Add modifier banner, restart button, taunt emojis + "SKILL ISSUE?", epilepsy warning |
| `css/style.css` | Add modifier animations, banner styles, taunt/emoji animations, epilepsy warning style |
| `js/modifiers.js` | **NEW** — modifier selection, activation, banner display |
| `js/ui.js` | Add fake target zone (50-50) + fake bubble (duplicate) rendering in canvas |
| `js/app.js` | Wire modifiers into game flow, change restart from auto to manual button |

---

## Step-by-Step Implementation

### 1. `index.html` — UI Additions

#### Epilepsy Warning (on start screen)
Add after the Start button inside `#screen-start`:
```html
<p class="epilepsy-warning">⚠️ WARNING: Contains flashing lights.<br>Not suitable for photosensitive epilepsy.</p>
```

#### Modifier Banner (on challenge screen)
Add inside `#screen-challenge`, above the canvas:
```html
<div id="modifier-banner" class="modifier-banner hidden"></div>
```

#### Restart Screen Overhaul
Replace entire `#screen-restart` content:
```html
<div id="screen-restart" class="screen">
  <div id="taunt-emojis"></div>
  <div class="restart-content">
    <div class="restart-icon">&#8635;</div>
    <h1>Time's Up</h1>
    <p class="skill-issue">SKILL ISSUE?</p>
    <button id="btn-restart" class="btn-primary">Try Again</button>
  </div>
</div>
```

### 2. `css/style.css` — Styles

#### Epilepsy Warning
```css
.epilepsy-warning {
  margin-top: 20px;
  color: #facc15;
  font-weight: 700;
  font-size: 0.9rem;
  line-height: 1.4;
  border: 2px solid #facc15;
  border-radius: 8px;
  padding: 10px 14px;
  background: rgba(250, 204, 21, 0.08);
}
```

#### Modifier Banner (base)
```css
.modifier-banner {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  z-index: 10;
  pointer-events: none;
  white-space: nowrap;
}
.modifier-banner.hidden { display: none; }
```

#### Modifier-specific animations

**DRUNK** — wobbly rotation:
```css
.modifier-banner.mod-drunken {
  color: #f59e0b;
  font-family: 'Comic Sans MS', 'Chalkboard SE', cursive;
  animation: wobbleText 0.5s ease-in-out infinite alternate;
}
@keyframes wobbleText {
  0% { transform: translateX(-50%) rotate(-5deg) skewX(-3deg); }
  100% { transform: translateX(-50%) rotate(5deg) skewX(3deg); }
}
/* Applied to canvas wrapper: */
.mod-drunken-active { animation: wobbleCanvas 0.8s ease-in-out infinite alternate; }
@keyframes wobbleCanvas {
  0% { transform: rotate(-2deg) skewX(-1deg) scale(1.01); }
  100% { transform: rotate(2deg) skewX(1deg) scale(0.99); }
}
```

**RAINBOW** — rainbow gradient text + hue-rotate on canvas:
```css
.modifier-banner.mod-rainbow {
  background: linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8800ff, #ff0000);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: rainbowShimmer 0.5s linear infinite;
}
@keyframes rainbowShimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
/* Canvas: */
.mod-rainbow-active { animation: rainbowHue 0.5s linear infinite; }
@keyframes rainbowHue {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
```

**EPILEPTIC** — rapid color flash:
```css
.modifier-banner.mod-epileptic {
  animation: epilepticFlash 0.1s steps(2) infinite;
}
@keyframes epilepticFlash {
  0% { color: #fff; text-shadow: 0 0 10px #fff; }
  50% { color: #ff0000; text-shadow: 0 0 10px #ff0000; }
}
/* Canvas: */
.mod-epileptic-active { animation: epilepticCanvas 0.08s steps(3) infinite; }
@keyframes epilepticCanvas {
  0% { filter: invert(0) hue-rotate(0deg); }
  33% { filter: invert(1) hue-rotate(90deg); }
  66% { filter: invert(0) hue-rotate(180deg) brightness(2); }
}
```

**50-50** — purple + question mark flicker:
```css
.modifier-banner.mod-fifty {
  color: #a855f7;
  animation: fiftyFlicker 1.2s ease-in-out infinite;
}
@keyframes fiftyFlicker {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0.3; }
}
```

**SPLIT** — ghost double-text:
```css
.modifier-banner.mod-duplicate {
  color: #22d3ee;
  text-shadow: -4px 0 rgba(34, 211, 238, 0.4), 4px 0 rgba(34, 211, 238, 0.4);
  animation: splitPulse 1s ease-in-out infinite alternate;
}
@keyframes splitPulse {
  0% { text-shadow: -4px 0 rgba(34,211,238,0.4), 4px 0 rgba(34,211,238,0.4); letter-spacing: 2px; }
  100% { text-shadow: -8px 0 rgba(34,211,238,0.6), 8px 0 rgba(34,211,238,0.6); letter-spacing: 6px; }
}
```

#### Restart Taunt Styles
```css
#taunt-emojis {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.flying-emoji {
  position: absolute;
  font-size: 2rem;
  animation: flyEmoji linear infinite;
}
@keyframes flyEmoji {
  0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
}
.skill-issue {
  font-size: 2rem;
  font-weight: 900;
  color: #f87171;
  animation: skillIssueWiggle 0.3s ease-in-out infinite alternate;
}
@keyframes skillIssueWiggle {
  0% { transform: rotate(-3deg) scale(1); }
  100% { transform: rotate(3deg) scale(1.05); }
}
.restart-content {
  position: relative;
  z-index: 1;
}
#screen-restart { position: relative; }
```

### 3. `js/modifiers.js` — New Module

Core responsibilities:
- `MODIFIERS` list: `['DRUNKEN', 'RAINBOW', 'EPILEPTIC', 'FIFTY_FIFTY', 'DUPLICATE']`
- `roll()` — 30% chance returns a random modifier name, else null
- `apply(name)` — sets `activeModifier`, updates banner text/class, adds CSS class to level-wrapper if needed
- `deactivate()` — removes all modifier CSS classes, hides banner, resets state
- `getActive()` — returns current active modifier or null
- For 50-50: generates `fakeTargetGamma = realTarget ± (15..25)°` (random offset)
- For Duplicate: sets a starting `fakeBubbleAngle` that will be animated in ui.js

Exposed as `window.TiltCaptcha.modifiers`.

### 4. `js/ui.js` — Canvas Changes

In `render()`:
- Check `modifiers.getActive()`:
  - If `'FIFTY_FIFTY'`: draw a second target zone arc at `modifiers.fakeTargetGamma` (same style as real)
  - If `'DUPLICATE'`: draw a second bubble at a position animated with `Math.sin(timestamp * 0.002) * 30` offset from a base angle

### 5. `js/app.js` — Game Flow Changes

#### Modifier wiring:
- On `challenge.onAngleComplete`: call `modifiers.roll()` — if returns a name, call `modifiers.apply(name)` for the next round
- On `challenge.onTimeout` / `challenge.onAllComplete`: call `modifiers.deactivate()`
- On `startChallenge()`: call `modifiers.init()`

#### Manual restart:
- Remove the `setTimeout` in `handleRestart()`
- Add event listener for `#btn-restart` button click → `transition(STATES.CHALLENGE)`

---

## Modifier Activation Timing
- 30% chance on each round completion
- Modifier applies to the **next** round only
- Only one modifier at a time
- Modifier deactivates when round completes or player times out
- First round never has a modifier

## Emoji List for Taunt Screen
`😂`, `🤣`, `😭`, `💀`, `🫵`, `🤡`, `😹`, `👎`, `🥱`, `😏`
Each emoji floats from bottom to top with random horizontal position, duration (3-6s), and delay.
