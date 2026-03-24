# Tilt Captcha — Implementation Plan

## Overview
A captcha that uses the phone's accelerometer to verify the user is human. The user must tilt their phone to match 5 sequential target angles within ±2° tolerance, with 5 seconds per angle. Desktop users get a QR code redirect.

## Tech Stack
- **Vanilla HTML/CSS/JS** — no build step, no frameworks
- **QRCode.js** (CDN) — for desktop fallback QR generation
- Standalone page, embeddable via iframe

## Files
```
Kilo-captcha/
├── index.html          # Main page (entry point)
├── css/
│   └── style.css       # All styles
├── js/
│   ├── app.js          # Main controller / state machine
│   ├── tilt.js         # DeviceOrientation wrapper + permission handling
│   ├── challenge.js    # Angle generation, validation, timer
│   └── ui.js           # Bubble level renderer, progress bar, messages
└── plan.md             # This file
```

## State Machine
```
DETECT → (no sensor) → QR_FALLBACK
       → (has sensor) → REQUEST_PERMISSION → CHALLENGE → (pass) → SUCCESS
                                                                    (fail) → RESTART → CHALLENGE
```

## Detailed Flow

### 1. Detection (`tilt.js`)
- Check `typeof DeviceOrientationEvent !== 'undefined'`
- On iOS 13+, `DeviceOrientationEvent.requestPermission()` is required — show a "Start" button that triggers the permission prompt
- On Android/older iOS, permissions are implicit
- If no sensor detected → go to `QR_FALLBACK`

### 2. Desktop / No-Sensor Fallback (`ui.js`)
- Show message: "If you are a human, you must have a phone"
- Generate a QR code pointing to `window.location.href` (same page)
- Use qrcode.js from CDN: `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js`

### 3. Challenge Phase (`challenge.js` + `ui.js`)
- Generate 5 random target angles (each in range 0°–360° or -180°–180°)
- Display one at a time:
  - Show target angle as a **colored zone** on the bubble level
  - Show current tilt as a **bubble** that moves
  - Progress indicator: "Angle 2 of 5"
  - 5-second countdown timer per angle
- Validation:
  - Read `event.gamma` (left-right tilt, -90 to 90) mapped to degrees
  - Success when `|currentTilt - targetAngle| ≤ 2°` AND user holds for ~0.5s (debounce to prevent accidental passes)
  - If timer expires before reaching target → **restart from angle 1**
- After all 5 angles passed → SUCCESS state

### 4. Bubble Level UI (`ui.js`)
- Circular level drawn on a `<canvas>` (or pure CSS with transforms)
- The **target zone** is a highlighted arc/segment at the target angle
- The **bubble** is a small circle that moves left/right based on `gamma` value
- Smooth animation via `requestAnimationFrame`
- Visual feedback: green glow when in tolerance, red when outside

### 5. Success / Failure
- **Success**: Show "✓ Verified" message + fire a callback/event for integration
- **Failure (timeout)**: Show brief "Try again" message, reset to angle 1, restart timer
- Provide a postMessage event so parent frames can listen for success: `window.parent.postMessage({ type: 'captcha-success' }, '*')`

## Key Technical Details

### DeviceOrientation API
- `event.gamma` = left-right tilt (-90° to 90°)
- `event.beta` = front-back tilt (not used, only left-right)
- Map `gamma` to a -45° to +45° display range for the bubble level

### Angle Generation
- 5 angles chosen randomly, each between -40° and +40° (within phone's practical tilt range)
- Ensure minimum 10° separation between consecutive angles to avoid trivial passes

### Timer
- `setInterval` at 100ms for smooth countdown display
- Visual countdown ring around the bubble level

### Debounce / Hold Requirement
- User must maintain the tilt in range for **500ms continuous** before it counts as "reached"
- Prevents accidental success from fast sweeping motions

## Callback / Integration API
```js
// The captcha fires this on success:
window.addEventListener('message', (e) => {
  if (e.data.type === 'captcha-success') { /* verified */ }
});

// Or the page can listen for a custom event:
document.addEventListener('captcha:success', () => { /* verified */ });
```

## Visual Layout (mobile-first)
```
┌──────────────────────────┐
│     Tilt Captcha         │
│                          │
│    ┌──────────────────┐  │
│    │                  │  │
│    │   [Bubble Level] │  │
│    │     ○            │  │
│    │                  │  │
│    └──────────────────┘  │
│                          │
│    Angle 3 of 5          │
│    Target: 25°           │
│    ████████░░ 4.2s       │
│                          │
│    [current: 23.1°]      │
│                          │
└──────────────────────────┘
```

## Implementation Order
1. `index.html` — skeleton with all script/link tags
2. `css/style.css` — layout, bubble level styling, animations
3. `js/tilt.js` — device orientation detection + permission
4. `js/challenge.js` — angle generation, timer, pass/fail logic
5. `js/ui.js` — bubble level canvas rendering, progress display
6. `js/app.js` — wire everything together as state machine
7. Desktop QR fallback
8. Test on mobile device

## No External Build Tools
- No npm packages needed (except optional dev server)
- QR code loaded from CDN
- All vanilla JS, no transpilation
